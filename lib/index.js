// @goodandready/dsh-key-limits — host: key/subscription quotas only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import z from '@deepseek-ai/schemastery'

import {
  CredentialStore,
  refreshSubscriptions,
  refreshSubscriptionEntry,
  PROVIDERS,
  isExtraSecret,
  allocateSubId,
  providerSchemas,
  clearSubCache,
  credentialFingerprint,
  setSubsLogger,
  setProviderLogger,
} from './subs.js'
import {
  loadSubs,
  saveSubCards,
  matchSub,
  quotaWindowsFromCard,
  inferProviderFromSub,
  sortSubscriptions,
  setCardsLogger,
} from './cards.js'
import { setExtraLogger } from './provider-extra-fetchers.js'
import { DEFAULT_STORE_DIR, ensureStoreDir } from './paths.js'
import { registerPluginUpdater } from './plugin-updater.js'
import {
  json,
  readQuery,
  readJsonBody,
  toCredentialRef,
  defaultCredRef,
  defaultExtraCredRef,
  isTrustedSettingsRequest,
  MAX_BACKUP_BODY_BYTES,
  MAX_BACKUP_ENTRIES,
} from './http-utils.js'
import { encryptBackup, decryptBackup } from './crypto-backup.js'

export const name = '@goodandready/dsh-key-limits'
export const inject = ['webServer', 'sessions', 'credentials', 'settings']

export const ROUTE_PREFIX = '/dsh-key-limits'
export const SETTINGS_NS = 'dsh-key-limits'
const SUBS_REFRESH_MS = 60_000

// Defensive polyfill for environments / runners with schemastery < 3.18.4
const proto = z?.Schema?.prototype || (typeof z?.number === 'function' ? Object.getPrototypeOf(z.number()) : null)
if (proto && typeof proto.volatile !== 'function') {
  proto.volatile = function volatile() {
    return typeof this.extra === 'function' ? this.extra('volatile', true) : this
  }
}

// Unwrap Volatile boxes before any caller reads a value
export function plainConfig(value) {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(plainConfig)
  if (typeof value.get === 'function') return plainConfig(value.get())
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plainConfig(v)]))
}

export const Config = z.object({
  storageDir: z.string().default(DEFAULT_STORE_DIR),
  refreshHours: z.number().volatile().default(24),
  ui: z.object({
    floatChip: z.boolean().volatile().default(true),
    composerBar: z.boolean().volatile().default(true),
    activeOnTop: z.boolean().volatile().default(true),
    order: z.array(z.string()).default([]),
  }).default({}),
})

export function apply(ctx, rawConfig) {
  let current = plainConfig(Config(plainConfig(rawConfig || {})))
  const logger = (ctx.logger ? ctx.logger('dsh-key-limits') : ctx)
  if (logger && logger.warn) {
    setProviderLogger(logger)
    setSubsLogger(logger)
    setCardsLogger(logger)
    setExtraLogger(logger)
  }
  const storeDir = ensureStoreDir(current.storageDir || DEFAULT_STORE_DIR)
  const credStore = new CredentialStore(storeDir)
  const live = new Map() // sessionId -> { route, subId, credentialFingerprint }
  let subsCache = { at: 0, cards: [], refreshInFlight: null }

  let settingsSvc = null
  const describeRow = () => {
    if (typeof settingsSvc?.describe !== 'function') return null
    try {
      return settingsSvc.describe().find((r) => r && r.ns === SETTINGS_NS) || null
    } catch (err) {
      logger?.warn?.('[dsh-key-limits] describe failed: ' + String(err && err.message || err))
      return null
    }
  }

  const syncSettingsSnapshot = (next) => {
    try {
      const fresh = next !== undefined ? next : (describeRow()?.value ?? rawConfig)
      current = plainConfig(Config(plainConfig(fresh || {})))
    } catch { /* keep existing snapshot on error */ }
  }

  ctx.inject(['settings'], (sctx) => {
    try {
      settingsSvc = sctx.settings || (typeof sctx.get === 'function' ? sctx.get('settings') : null) || null
      if (!settingsSvc) return
      const served = describeRow()
      if (served && served.value) {
        syncSettingsSnapshot(served.value)
      }
      if (typeof sctx.effect === 'function') {
        sctx.effect(() => () => { settingsSvc = null })
      }
    } catch (err) {
      logger?.warn?.('[dsh-key-limits] settings service unavailable: ' + String(err && err.message || err))
    }
  })

  const onSettingsChanged = (ns) => {
    if (ns && ns !== SETTINGS_NS) return
    try {
      const row = describeRow()
      if (row && row.value) syncSettingsSnapshot(row.value)
      else syncSettingsSnapshot()
    } catch { /* keep existing on error */ }
  }

  ctx.on('settings/document-updated', onSettingsChanged)
  ctx.on('loader/volatile-update', onSettingsChanged)
  ctx.on('config', (cfg) => { syncSettingsSnapshot(cfg) })

  function extractRouteFromEvent(event) {
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
      const provider = hc?.provider || hc?.providerID || hc?.providerId || event.data?.provider
      const model = hc?.model || hc?.modelId || event.data?.model
      if (provider || model) {
        return { provider: String(provider || '').toLowerCase(), model: String(model || 'unknown') }
      }
    }
    if (type === 'assistant/message' || type === 'request/start') {
      const d = event.data || {}
      const provider = d.provider || d.providerID || (d.header && d.header.provider)
      const model = d.model || d.modelId
      if (provider || model) {
        return { provider: String(provider || '').toLowerCase(), model: String(model || 'unknown') }
      }
    }
    return null
  }

  // Track session route only (no ledger)
  ctx.on('session/event', (session, event) => {
    try {
      if (!session || !event || !session.id) return
      const sid = session.id
      let st = live.get(sid)
      if (!st) {
        st = { route: { provider: '', model: 'unknown' }, cwd: (session.header && session.header.cwd) || undefined }
        live.set(sid, st)
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
          } catch {}
        }
        live.set(s.id, {
          route,
          cwd: (s.header && s.header.cwd) || undefined,
        })
      }
    } catch (err) {
      logger?.warn?.('[dsh-key-limits] seedExistingSessions error:', err && err.message)
    }
  }

  ctx.inject(['sessions'], () => {
    seedExistingSessions()
  })
  if (ctx.sessions) seedExistingSessions()

  ctx.effect(() => {
    const subsTimer = setInterval(() => {
      void refreshSubCards(true).catch((err) => {
        logger?.warn?.('[dsh-key-limits] periodic refresh error:', err && err.message)
      })
    }, SUBS_REFRESH_MS)
    if (typeof subsTimer?.unref === 'function') subsTimer.unref()
    void refreshSubCards(false).catch((err) => {
      logger?.warn?.('[dsh-key-limits] initial refresh error:', err && err.message)
    })
    return () => clearInterval(subsTimer)
  }, 'dsh-key-limits: refresh timers')

  async function refreshSubCard(id) {
    const entry = credStore.list().find((e) => e.id === id)
    if (!entry) return null
    if (subsCache.refreshInFlight) return subsCache.refreshInFlight
    subsCache.refreshInFlight = (async () => {
      await hydrateSecretsFromCredentials()
      const card = await refreshSubscriptionEntry(credStore, entry)
      if (!credStore.creds.has(id)) {
        return []
      }
      saveSubCards(storeDir, [card], credStore)
      try {
        const parsed = JSON.parse(readFileSync(join(storeDir, 'subs.json'), 'utf8'))
        if (parsed.meta && typeof parsed.meta === 'object') credStore.meta = { ...parsed.meta }
      } catch (err) {
        if (err && err.code !== 'ENOENT') {
          logger?.warn?.('[dsh-key-limits] reading subs.json meta failed:', err.message)
        }
      }
      for (const k of Object.keys(credStore.meta)) {
        if (!credStore.creds.has(k)) delete credStore.meta[k]
      }
      subsCache = { at: Date.now(), cards: subsCache.cards || [] }
      return [card]
    })().finally(() => { subsCache.refreshInFlight = null })
    return subsCache.refreshInFlight
  }

  async function refreshSubCards(force = false) {
    if (!force && subsCache.at && Date.now() - subsCache.at < SUBS_REFRESH_MS) return subsCache.cards
    if (subsCache.refreshInFlight) return subsCache.refreshInFlight
    subsCache.refreshInFlight = (async () => {
      await hydrateSecretsFromCredentials()
      const cards = await refreshSubscriptions(credStore)
      saveSubCards(storeDir, cards, credStore)
      try {
        const parsed = JSON.parse(readFileSync(join(storeDir, 'subs.json'), 'utf8'))
        if (parsed.meta && typeof parsed.meta === 'object') credStore.meta = { ...parsed.meta }
      } catch (err) {
        if (err && err.code !== 'ENOENT') {
          logger?.warn?.('[dsh-key-limits] reading subs.json meta failed:', err.message)
        }
      }
      for (const k of Object.keys(credStore.meta)) {
        if (!credStore.creds.has(k)) delete credStore.meta[k]
      }
      const validCards = cards.filter((c) => c && credStore.creds.has(c.id))
      subsCache = { at: Date.now(), cards: validCards }
      return validCards
    })().finally(() => { subsCache.refreshInFlight = null })
    return subsCache.refreshInFlight
  }

  async function resolveSessionSubBinding(sessionId, provider) {
    const p = String(provider || '').trim().toLowerCase()
    if (!p || !sessionId) return { subId: null, fingerprint: null, rule: null }
    let st = live.get(sessionId)
    if (!st) {
      st = { route: { provider: p, model: 'unknown' } }
      live.set(sessionId, st)
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
          } catch { /* try next */ }
        }
        if (found) break
      }
    }

    // 2. If an ambient credential exists, match against saved subscriptions
    if (ambientFp) {
      const matches = []
      for (const c of credStore.creds.values()) {
        if (inferProviderFromSub(c) !== p) continue
        const storedFp = credentialFingerprint(c.secret, c.extra)
        const secretFp = credentialFingerprint(c.secret, '')
        if (storedFp === ambientFp || secretFp === ambientFp) {
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

  function routeForSession(sessionId) {
    const st = live.get(sessionId)
    if (st && st.route && st.route.provider) return { ...st.route, source: 'live' }
    return { provider: '', model: '', source: 'unknown' }
  }

  async function buildActiveSub(sessionId) {
    const route = routeForSession(sessionId)
    const binding = await resolveSessionSubBinding(sessionId, route.provider)
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
      }
    }
    const card = sub.card || {}
    const isBalance = card.kind === 'balance'
    return {
      sessionId,
      route,
      subId: sub.id,
      rule,
      degraded: route.source !== 'live',
      sub: { id: sub.id, label: sub.label, provider: sub.provider },
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

  async function hydrateSecretsFromCredentials() {
    const credentials = ctx.get('credentials')
    const canResolve = Boolean(credentials && typeof credentials.resolve === 'function')
    for (const c of credStore.creds.values()) {
      c.secret = ''
      if (isExtraSecret(c.provider)) {
        c.extra = ''
      }
      if (canResolve && c.credentialRef) {
        try {
          const resolved = await credentials.resolve(await toCredentialRef(c.credentialRef))
          const value = resolved && resolved.value
          if (typeof value === 'string' && value) c.secret = value
        } catch { /* try next */ }
      }
      if (canResolve && c.extraCredentialRef && isExtraSecret(c.provider)) {
        try {
          const resolved = await credentials.resolve(await toCredentialRef(c.extraCredentialRef))
          const value = resolved && resolved.value
          if (typeof value === 'string' && value) c.extra = value
        } catch { /* try next */ }
      }
    }
  }

  async function upsertSubFromBody(body) {
    const provider = body && body.provider
    const def = PROVIDERS[provider]
    if (!def) return { error: 'unknown provider' }
    let id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : null
    const secret = String(body.secret || '').trim()
    const rawLabel = body.label != null ? body.label : body.alias
    const extra = String(body.extra != null ? body.extra : '')

    if (id) {
      const existing = credStore.get(id)
      if (existing && existing.provider !== provider) {
        id = `${provider}-${id}-${Math.random().toString(36).slice(2, 6)}`
      }
    } else {
      if (secret) {
        const existingList = credStore.list()
        for (const item of existingList) {
          if (item.provider === provider) {
            const cred = credStore.get(item.id)
            if (cred && cred.secret === secret && (cred.extra || '') === extra) {
              id = item.id
              break
            }
          }
        }
      }
      if (!id) {
        id = allocateSubId(body, provider)
      }
    }

    const prev = credStore.get(id)
    const finalExtra = String(body.extra != null ? body.extra : (prev && prev.extra) || '')
    const label = String(rawLabel != null ? rawLabel : (prev && prev.label) || '')
    let credentialRef = String(body.credentialRef || (prev && prev.credentialRef) || '').trim()
    let extraCredentialRef = String(body.extraCredentialRef || (prev && prev.extraCredentialRef) || '').trim()
    const extraIsSecret = isExtraSecret(provider)

    const credentials = ctx.get('credentials')
    // #12: store secrets in DSH credentials service, not plaintext subs.json
    if (secret) {
      if (!credentials || typeof credentials.set !== 'function') {
        return { error: 'credentials service required to store secrets' }
      }
      if (!credentialRef) credentialRef = defaultCredRef(id)
      await credentials.set(await toCredentialRef(credentialRef), secret)
    } else if (!prev && !credentialRef) {
      return { error: 'secret or credentialRef required for new subscription' }
    }

    if (extraIsSecret) {
      if (finalExtra) {
        if (!credentials || typeof credentials.set !== 'function') {
          return { error: 'credentials service required to store secrets' }
        }
        if (!extraCredentialRef) extraCredentialRef = defaultExtraCredRef(id)
        await credentials.set(await toCredentialRef(extraCredentialRef), finalExtra)
      } else if (!prev && !extraCredentialRef) {
        const extraField = def.fields?.find((f) => f.key === 'extra')
        if (extraField && extraField.required) {
          return { error: `${extraField.label || 'extra'} is required for ${def.label || provider}` }
        }
      }
    }

    try {
      credStore.upsert(id, {
        provider,
        kind: def.kind,
        secret,
        extra: finalExtra,
        label,
        credentialRef: credentialRef || defaultCredRef(id),
        extraCredentialRef: extraIsSecret ? (extraCredentialRef || defaultExtraCredRef(id)) : undefined,
      })
    } catch (saveErr) {
      logger?.warn?.('[dsh-key-limits] credStore.upsert failed:', saveErr && saveErr.message)
      return { error: `failed to save subscription: ${saveErr?.message || 'disk write error'}` }
    }
    return {
      ok: true,
      id,
      credentialRef: credentialRef || defaultCredRef(id),
      extraCredentialRef: extraIsSecret ? (extraCredentialRef || defaultExtraCredRef(id)) : undefined,
    }
  }

  async function buildSubsList({ activeSubId = null, sessionId = null } = {}) {
    let resolvedActiveSubId = activeSubId
    if (!resolvedActiveSubId && sessionId) {
      const active = await buildActiveSub(sessionId)
      if (active && active.subId) {
        resolvedActiveSubId = active.subId
      }
    }
    const subs = loadSubs(storeDir)
    const list = subs.map((s) => {
      const card = s.card || {}
      const isBalance = card.kind === 'balance'
      return {
        id: s.id,
        label: s.label,
        provider: s.provider,
        kind: card.kind || null,
        plan: card.plan || null,
        status: card.status || null,
        balance: isBalance ? {
          remaining: card.remaining ?? null,
          limit: card.limit ?? null,
          currency: card.currency || '$',
          message: card.message || card.plan || null,
          cnyRemaining: card.cnyRemaining ?? null,
          cnyLimit: card.cnyLimit ?? null,
        } : null,
        quota: {
          windows: isBalance ? [] : (quotaWindowsFromCard(card) || []),
          stale: card.stale === true,
          fetchedAt: card.fetchedAt || null,
          error: card.error || null,
        },
      }
    })
    const cfg = current ?? config
    const ui = cfg.ui || {}
    return sortSubscriptions(list, {
      order: ui.order || [],
      activeOnTop: ui.activeOnTop !== false,
      activeSubId: resolvedActiveSubId,
    })
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/health`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
      return json(res, 200, { ok: true, name: 'dsh-key-limits', status: 'healthy' })
    },
  }), 'key-limits: health')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/config`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
      if (!isTrustedSettingsRequest(req)) {
        return json(res, 403, { error: 'forbidden: cross-site request rejected' })
      }
      const cfg = current ?? config
      return json(res, 200, {
        ui: cfg.ui || {},
        refreshHours: cfg.refreshHours,
        schemas: providerSchemas(),
        providers: Object.keys(PROVIDERS),
      })
    },
  }), 'key-limits: config')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/active-sub`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
      if (!isTrustedSettingsRequest(req)) {
        return json(res, 403, { error: 'forbidden: cross-site request rejected' })
      }
      const q = readQuery(req)
      const sessionId = q.sessionId || ''
      if (!sessionId) return json(res, 400, { error: 'sessionId required' })
      return json(res, 200, await buildActiveSub(sessionId))
    },
  }), 'key-limits: active-sub')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/subs`,
    handler: async (req, res) => {
      try {
        if (!isTrustedSettingsRequest(req)) {
          return json(res, 403, { error: 'forbidden: cross-site request rejected' })
        }
        if (req.method === 'GET') {
          const q = readQuery(req)
          const force = q.refresh === '1' || q.refresh === 'true'
          const subId = q.id || q.subId || ''
          const sessionId = q.sessionId || ''
          const stale = !subsCache.at || Date.now() - subsCache.at >= SUBS_REFRESH_MS
          const refreshing = subsCache.refreshInFlight != null
          if (force) {
            if (subId) void refreshSubCard(subId).catch((err) => { logger?.warn?.('[dsh-key-limits] force refreshSubCard error:', err && err.message) })
            else void refreshSubCards(true).catch((err) => { logger?.warn?.('[dsh-key-limits] force refreshSubCards error:', err && err.message) })
          } else if (stale && !refreshing) {
            void refreshSubCards(true).catch((err) => { logger?.warn?.('[dsh-key-limits] stale refreshSubCards error:', err && err.message) })
          }
          const subscriptions = await buildSubsList({ activeSubId: q.activeSubId || null, sessionId })
          return json(res, 200, {
            providers: Object.keys(PROVIDERS),
            providerSchemas: providerSchemas(),
            subscriptions,
            refreshedAt: subsCache.at || null,
            stale: stale && !refreshing,
            refreshing: subsCache.refreshInFlight != null,
          })
        }
        if (req.method === 'POST') {
          let body
          try {
            body = await readJsonBody(req, logger)
          } catch (err) {
            if (err?.status === 413 || err?.code === 'PAYLOAD_TOO_LARGE') {
              return json(res, 413, { error: 'payload too large: request body exceeds limit' })
            }
            return json(res, 400, { error: 'invalid json body' })
          }
          const r = await upsertSubFromBody(body)
          if (r.error) {
            const isSaveErr = r.error.includes('failed to save subscription')
            return json(res, isSaveErr ? 500 : 400, { error: r.error })
          }
          clearSubCache()
          subsCache.at = 0
          await refreshSubCards(true)
          return json(res, 200, r)
        }
        if (req.method === 'DELETE') {
          const u = new URL(req.url || '/', 'http://x')
          const id = u.searchParams.get('id')
          if (!id) return json(res, 400, { error: 'missing id' })
          try {
            credStore.remove(id)
          } catch (err) {
            return json(res, 500, { error: `failed to remove subscription: ${err?.message || 'disk write error'}` })
          }
          clearSubCache()
          subsCache.at = 0
          return json(res, 200, { ok: true })
        }
        return json(res, 405, { error: 'method not allowed' })
      } catch (e) {
        return json(res, 500, { error: String((e && e.message) || e) })
      }
    },
  }), 'key-limits: subs')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/refresh-all`,
    handler: async (req, res) => {
      try {
        if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
        if (!isTrustedSettingsRequest(req)) {
          return json(res, 403, { error: 'forbidden: cross-site request rejected' })
        }
        clearSubCache()
        subsCache.at = 0
        const cards = await refreshSubCards(true)
        return json(res, 200, { ok: true, count: cards.length, cards })
      } catch (err) {
        return json(res, 500, { error: String((err && err.message) || err) })
      }
    },
  }), 'key-limits: refresh-all')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/export`,
    handler: async (req, res) => {
      try {
        if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
        if (!isTrustedSettingsRequest(req)) {
          return json(res, 403, { error: 'forbidden: cross-site request rejected' })
        }
        await hydrateSecretsFromCredentials()
        let body
        try {
          body = await readJsonBody(req, logger)
        } catch (err) {
          if (err?.status === 413 || err?.code === 'PAYLOAD_TOO_LARGE') {
            return json(res, 413, { error: 'payload too large: request body exceeds limit' })
          }
          return json(res, 400, { error: 'invalid json body' })
        }
        const passphrase = body?.passphrase
        if (!passphrase || String(passphrase).trim().length < 4) {
          return json(res, 400, { error: 'passphrase must be at least 4 characters long' })
        }
        const subs = credStore.list()
        if (subs.length > MAX_BACKUP_ENTRIES) {
          return json(res, 400, { error: `cannot export ${subs.length} subscriptions: limit is ${MAX_BACKUP_ENTRIES}` })
        }
        const fullSubs = []
        for (const s of subs) {
          const cred = credStore.get(s.id)
          fullSubs.push({
            id: s.id,
            provider: s.provider,
            secret: cred?.secret || '',
            extra: cred?.extra || '',
            alias: s.label || '',
            label: s.label || '',
            active: s.active !== false,
          })
        }
        const cfg = current ?? config
        const uiConfig = cfg.ui ? {
          order: Array.isArray(cfg.ui.order) ? cfg.ui.order : [],
          activeOnTop: cfg.ui.activeOnTop !== false,
          floatChip: cfg.ui.floatChip !== false,
          composerBar: cfg.ui.composerBar !== false,
        } : null
        const backup = encryptBackup(passphrase, fullSubs, { ui: uiConfig })
        return json(res, 200, { ok: true, backup })
      } catch (err) {
        return json(res, 500, { error: String((err && err.message) || err) })
      }
    },
  }), 'key-limits: export')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/import`,
    handler: async (req, res) => {
      try {
        if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
        if (!isTrustedSettingsRequest(req)) {
          return json(res, 403, { error: 'forbidden: cross-site request rejected' })
        }
        let body
        try {
          body = await readJsonBody(req, logger, MAX_BACKUP_BODY_BYTES)
        } catch (err) {
          if (err?.status === 413 || err?.code === 'PAYLOAD_TOO_LARGE') {
            return json(res, 413, { error: 'payload too large: request body exceeds limit' })
          }
          return json(res, 400, { error: 'invalid json body' })
        }
        const { passphrase, backup } = body || {}
        if (!passphrase || !backup) {
          return json(res, 400, { error: 'both passphrase and backup payload are required' })
        }
        let restored
        try {
          restored = decryptBackup(passphrase, backup)
        } catch (decErr) {
          return json(res, 400, { error: decErr.message || 'failed to decrypt backup' })
        }
        if (!Array.isArray(restored)) {
          return json(res, 400, { error: 'restored backup payload must be a subscription array' })
        }
        if (restored.length > MAX_BACKUP_ENTRIES) {
          return json(res, 400, { error: `backup contains ${restored.length} entries, exceeding limit of ${MAX_BACKUP_ENTRIES}` })
        }

        // Restore UI configuration if present in backup
        if (restored.ui && typeof restored.ui === 'object') {
          const cfg = current ?? config
          cfg.ui = {
            ...(cfg.ui || {}),
            order: Array.isArray(restored.ui.order) ? restored.ui.order : [],
            activeOnTop: restored.ui.activeOnTop !== false,
            floatChip: restored.ui.floatChip !== false,
            composerBar: restored.ui.composerBar !== false,
          }
          if (current) current.ui = cfg.ui
          const row = describeRow()
          if (row && settingsSvc && typeof settingsSvc.update === 'function') {
            try {
              await settingsSvc.update(row.ns, { ui: cfg.ui }, row.revision)
            } catch (uiErr) {
              logger?.warn?.('[dsh-key-limits] failed to persist imported ui config:', uiErr && uiErr.message)
            }
          }
        }

        const results = []
        let importedCount = 0
        for (const item of restored) {
          const r = await upsertSubFromBody(item)
          if (r.error) {
            results.push({ id: item.id || null, provider: item.provider, ok: false, error: r.error })
          } else {
            importedCount++
            results.push({ id: r.id, provider: item.provider, ok: true })
          }
        }
        clearSubCache()
        subsCache.at = 0
        await refreshSubCards(true)
        const cfg = current ?? config
        const subscriptions = await buildSubsList()
        return json(res, 200, {
          ok: true,
          count: restored.length,
          importedCount,
          results,
          cards: subscriptions,
          subscriptions,
          ui: cfg.ui || {},
        })
      } catch (err) {
        return json(res, 400, { error: String((err && err.message) || err) })
      }
    },
  }), 'key-limits: import')

  ctx.effect(() => registerPluginUpdater(ctx, {
    packageName: '@goodandready/dsh-key-limits',
    endpoint: `${ROUTE_PREFIX}/update`,
    manifestUrl: new URL('../package.json', import.meta.url),
    registry: 'https://registry.npmjs.org',
  }), 'key-limits: updater')
}
