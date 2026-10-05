// lib/session-tracker.js — Session routing and active subscription matching
import { PROVIDERS, credentialFingerprint } from './subs.js'
import { loadSubs, matchSub, quotaWindowsFromCard, inferProviderFromSub } from './cards.js'

export const MAX_LIVE_SESSIONS = 500

export function extractRouteFromEvent(event) {
  if (!event) return null
  const type = event.type
  if (type === 'request/header') {
    const hc = event.data?.header?.config || event.header?.config
    if (hc) {
      const provider = hc.provider || hc.providerID || hc.providerId
      const model = hc.model || hc.modelId
      if (provider || model) {
        return { provider: String(provider || '').toLowerCase(), model: String(model || 'unknown') }
      }
    }
  }
  if (type === 'request/context') {
    const d = event.data || event
    const provider = d.provider || d.providerID || d.providerId
    const model = d.model || d.modelId
    if (provider || model) {
      return { provider: String(provider || '').toLowerCase(), model: String(model || 'unknown') }
    }
  }
  if (type === 'session/update' || type === 'session/create') {
    const hc = event.data?.header?.config || event.data?.config
    if (hc) {
      const provider = hc.provider || hc.providerID || hc.providerId
      const model = hc.model || hc.modelId
      if (provider || model) {
        return { provider: String(provider || '').toLowerCase(), model: String(model || 'unknown') }
      }
    }
  }
  return null
}

export function createSessionTracker(ctx, { storeDir, credStore, getConfig, logger, maxLiveSessions = MAX_LIVE_SESSIONS }) {
  const live = new Map() // sessionId -> { route, subId, credentialFingerprint }

  function setLiveSession(sid, st) {
    if (live.size >= maxLiveSessions && !live.has(sid)) {
      const oldest = live.keys().next().value
      if (oldest !== undefined) live.delete(oldest)
    }
    live.set(sid, st)
  }

  function routeForSession(sessionId) {
    const st = live.get(sessionId)
    if (st && st.route && st.route.provider) return { ...st.route, source: 'live' }
    return { provider: '', model: '', source: 'unknown' }
  }

  function seedExistingSessions() {
    try {
      const sessions = ctx.sessions || (typeof ctx.get === 'function' ? ctx.get('sessions') : null)
      if (!sessions || typeof sessions.list !== 'function') return
      for (const s of sessions.list()) {
        if (!s || !s.id || live.has(s.id)) continue
        let route = { provider: '', model: 'unknown' }
        if (typeof s.snapshotEvents === 'function') {
          try {
            const evs = s.snapshotEvents()
            for (let i = evs.length - 1; i >= 0; i--) {
              const r = extractRouteFromEvent(evs[i])
              if (r && r.provider) { route = r; break }
            }
          } catch (err) {
            logger?.debug?.('[dsh-key-limits] seed snapshot error: ' + (err && err.message || err))
          }
        }
        setLiveSession(s.id, {
          route,
          cwd: (s.header && s.header.cwd) || undefined,
        })
      }
    } catch (err) {
      logger?.warn?.('[dsh-key-limits] seedExistingSessions error:', err && err.message)
    }
  }

  ctx.on('session/deleted', (sid) => {
    if (sid && live.has(sid)) live.delete(sid)
  })

  ctx.on('session/event', (session, event) => {
    try {
      if (!session || !event || !session.id) return
      const sid = session.id
      let st = live.get(sid)
      if (!st) {
        st = { route: { provider: '', model: 'unknown' }, cwd: (session.header && session.header.cwd) || undefined }
        setLiveSession(sid, st)
      }
      const route = extractRouteFromEvent(event)
      if (route) {
        const prevProvider = st.route?.provider
        st.route = {
          provider: route.provider || st.route?.provider || '',
          model: route.model || st.route?.model || 'unknown',
        }
        if (route.provider && route.provider !== prevProvider) {
          delete st.subId
          delete st.credentialFingerprint
        }
      }
    } catch (err) {
      logger?.warn?.('[dsh-key-limits] session/event handler error:', err && err.message)
    }
  })

  ctx.inject(['sessions'], () => {
    seedExistingSessions()
  })
  if (ctx.sessions) seedExistingSessions()

  async function resolveSessionSubBinding(sessionId, provider) {
    const p = String(provider || '').trim().toLowerCase()
    if (!p || !sessionId) return { subId: null, fingerprint: null, rule: null }
    let st = live.get(sessionId)
    if (!st) {
      st = { route: { provider: p, model: 'unknown' } }
      setLiveSession(sessionId, st)
    }

    const credentials = ctx.get('credentials')
    const canResolve = Boolean(credentials && typeof credentials.resolve === 'function')

    // 1. Resolve ambient credentials for provider p
    const def = PROVIDERS[p]
    let ambientFp = null
    if (canResolve && def && Array.isArray(def.credentialRefs)) {
      for (const rawRef of def.credentialRefs) {
        if (!rawRef) continue
        const candidateRefs = [rawRef, `env:${rawRef}`, rawRef.replace(/^env:/, '')]
        let found = false
        for (const ref of candidateRefs) {
          try {
            const resolved = await credentials.resolve(ref)
            const value = resolved && resolved.value
            if (value) {
              ambientFp = credentialFingerprint(value, '')
              found = true
              break
            }
          } catch (err) {
            /* candidate credential ref not found, try next */
            void err
          }
        }
        if (found) break
      }
    }

    // 2. If an ambient credential exists, match against saved subscriptions
    if (ambientFp) {
      const matches = []
      for (const c of credStore.creds.values()) {
        if (inferProviderFromSub(c) !== p) continue
        const metaFp = credStore.meta?.[c.id]?.fingerprint || ''
        const storedFp = (c.secret || c.extra) ? credentialFingerprint(c.secret, c.extra) : ''
        const secretFp = c.secret ? credentialFingerprint(c.secret, '') : ''
        if ((metaFp && metaFp === ambientFp) || (storedFp && storedFp === ambientFp) || (secretFp && secretFp === ambientFp)) {
          matches.push(c)
        }
      }
      if (matches.length === 1) {
        const winner = matches[0]
        st.subId = winner.id
        st.credentialFingerprint = ambientFp
        return { subId: winner.id, fingerprint: ambientFp, rule: 'AS-M4' }
      }
      if (matches.length > 1) {
        delete st.subId
        delete st.credentialFingerprint
        return { subId: null, fingerprint: ambientFp, rule: 'AS-M4-multi', degraded: true }
      }
      delete st.subId
      delete st.credentialFingerprint
      return { subId: null, fingerprint: ambientFp, rule: 'no-match' }
    }

    // 3. If NO ambient credentials found, check stored subscriptions for provider p
    const providerSubs = []
    for (const c of credStore.creds.values()) {
      if (inferProviderFromSub(c) === p) {
        providerSubs.push(c)
      }
    }
    if (providerSubs.length === 1) {
      const single = providerSubs[0]
      st.subId = single.id
      st.credentialFingerprint = credentialFingerprint(single.secret, single.extra)
      return { subId: single.id, fingerprint: st.credentialFingerprint, rule: 'AS-M1' }
    }
    if (providerSubs.length > 1) {
      delete st.subId
      delete st.credentialFingerprint
      return { subId: null, fingerprint: null, rule: 'AS-M1-multi', degraded: true }
    }

    delete st.subId
    delete st.credentialFingerprint
    return { subId: null, fingerprint: null, rule: 'no-match' }
  }

  async function buildActiveSub(sessionId) {
    const route = routeForSession(sessionId)
    const binding = await resolveSessionSubBinding(sessionId, route.provider)
    const ui = (getConfig()?.ui) || {}

    // Authoritative negative or ambiguous ambient binding result
    if (binding.rule === 'no-match') {
      return {
        sessionId,
        route,
        subId: null,
        rule: 'no-match',
        degraded: true,
        error: route.provider ? 'no-match' : 'no-route',
        ui,
      }
    }
    if (binding.rule === 'AS-M4-multi' || binding.rule === 'AS-M1-multi') {
      return {
        sessionId,
        route,
        subId: null,
        rule: binding.rule,
        degraded: true,
        error: 'ambiguous',
        ui,
      }
    }

    const subs = loadSubs(storeDir)
    const { sub, rule } = matchSub(subs, {
      provider: route.provider,
      subId: binding.subId,
      fingerprint: binding.fingerprint,
    })
    const finalRule = binding.rule || rule
    const isMulti = finalRule === 'AS-M1-multi' || finalRule === 'AS-M4-multi'
    if (!sub) {
      return {
        sessionId,
        route,
        subId: null,
        rule: finalRule,
        degraded: true,
        error: route.provider ? (isMulti ? 'ambiguous' : 'no-match') : 'no-route',
        ui,
      }
    }
    const card = sub.card || {}
    const isBalance = card.kind === 'balance'
    return {
      sessionId,
      route,
      subId: sub.id,
      rule: finalRule,
      degraded: route.source !== 'live',
      sub: { id: sub.id, label: sub.label, provider: sub.provider },
      ui,
      quota: {
        windows: isBalance ? [] : (quotaWindowsFromCard(card) || []),
        stale: card.stale === true,
        fetchedAt: card.fetchedAt || null,
        error: card.error || null,
      },
      balance: isBalance ? {
        remaining: card.remaining ?? null,
        limit: card.limit ?? null,
        currency: card.currency || '$',
        message: card.message || card.plan || null,
        cnyRemaining: card.cnyRemaining ?? null,
        cnyLimit: card.cnyLimit ?? null,
      } : null,
    }
  }

  return {
    live,
    setLiveSession,
    routeForSession,
    resolveSessionSubBinding,
    buildActiveSub,
    seedExistingSessions,
  }
}
