// @goodandready-private/dsh-key-limits — host: key/subscription quotas only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import z from '@deepseek-ai/schemastery'

import {
  CredentialStore,
  refreshSubscriptions,
  refreshSubscriptionEntry,
  PROVIDERS,
  allocateSubId,
  providerSchemas,
  clearSubCache,
  credentialFingerprint,
} from './subs.js'
import {
  loadSubs,
  saveSubCards,
  matchSub,
  quotaWindowsFromCard,
  inferProviderFromSub,
} from './cards.js'
import { DEFAULT_STORE_DIR, ensureStoreDir } from './paths.js'

export const name = 'dsh-key-limits'
export const inject = ['webServer', 'sessions', 'credentials', 'settings']

const NS = '/dsh-key-limits'
const SETTINGS_NS = 'dsh-key-limits'
const SUBS_REFRESH_MS = 60_000

export const Config = z.object({
  storageDir: z.string().default(DEFAULT_STORE_DIR),
  refreshHours: z.number().default(24),
  ui: z.object({
    floatChip: z.boolean().default(true),
    composerBar: z.boolean().default(true),
  }).default({}),
})

export function apply(ctx, config) {
  let current = config
  const storeDir = ensureStoreDir(config.storageDir || DEFAULT_STORE_DIR)
  const credStore = new CredentialStore(storeDir)
  const live = new Map() // sessionId -> { route, subId, credentialFingerprint }
  let subsCache = { at: 0, cards: [], refreshInFlight: null }

  // #14: settings via inject, not ctx.extend
  ctx.inject(['settings'], (sctx) => {
    try {
      const scope = sctx.settings.register(SETTINGS_NS, Config, { base: config })
      current = scope.get() ?? config
      if (typeof scope.watch === 'function') {
        sctx.effect(() => scope.watch(() => { current = scope.get() ?? config }))
      }
    } catch (e) {
      console.warn('[dsh-key-limits] settings.register failed:', e && e.message)
    }
  })

  ctx.on('config', (cfg) => { current = cfg })

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
      if (event.type === 'session/update' || event.type === 'session/create') {
        const hc = event.data && event.data.header && event.data.header.config
        const model = (hc && (hc.model || hc.modelId)) || (event.data && event.data.model) || st.route.model
        const provider = (hc && (hc.provider || hc.providerID || hc.providerId)) || st.route.provider
        if (provider || model) st.route = { provider: String(provider || '').toLowerCase(), model: String(model || 'unknown') }
      }
      if (event.type === 'assistant/message' || event.type === 'request/start') {
        const d = event.data || {}
        const provider = String(d.provider || d.providerID || (d.header && d.header.provider) || st.route.provider || '').toLowerCase()
        const model = String(d.model || d.modelId || st.route.model || 'unknown')
        if (provider) st.route = { provider, model }
      }
    } catch { /* never break harness */ }
  })

  ctx.effect(() => {
    const subsTimer = setInterval(() => { void refreshSubCards(true) }, SUBS_REFRESH_MS)
    void refreshSubCards(false)
    return () => clearInterval(subsTimer)
  }, 'dsh-key-limits: refresh timers')

  async function refreshSubCard(id) {
    const entry = credStore.list().find((e) => e.id === id)
    if (!entry) return null
    if (subsCache.refreshInFlight) return subsCache.refreshInFlight
    subsCache.refreshInFlight = (async () => {
      await hydrateSecretsFromCredentials()
      const card = await refreshSubscriptionEntry(credStore, entry)
      saveSubCards(storeDir, [card])
      try {
        const parsed = JSON.parse(readFileSync(join(storeDir, 'subs.json'), 'utf8'))
        if (parsed.meta && typeof parsed.meta === 'object') credStore.meta = { ...parsed.meta }
      } catch { /* best-effort */ }
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
      saveSubCards(storeDir, cards)
      try {
        const parsed = JSON.parse(readFileSync(join(storeDir, 'subs.json'), 'utf8'))
        if (parsed.meta && typeof parsed.meta === 'object') credStore.meta = { ...parsed.meta }
      } catch { /* best-effort */ }
      subsCache = { at: Date.now(), cards }
      return cards
    })().finally(() => { subsCache.refreshInFlight = null })
    return subsCache.refreshInFlight
  }

  function json(res, status, body) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end(JSON.stringify(body))
  }

  function readQuery(req) {
    try {
      const u = new URL(req.url || '/', 'http://x')
      const out = {}
      for (const [k, v] of u.searchParams.entries()) out[k] = v
      return out
    } catch { return {} }
  }

  async function readJsonBody(req) {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const text = Buffer.concat(chunks).toString('utf8')
    if (!text.trim()) return {}
    return JSON.parse(text)
  }

  async function resolveSessionSubBinding(sessionId, provider) {
    const p = String(provider || '').trim().toLowerCase()
    if (!p || !sessionId) return { subId: null, fingerprint: null, rule: null }
    let st = live.get(sessionId)
    if (!st) {
      st = { route: { provider: '', model: 'unknown' } }
      live.set(sessionId, st)
    }
    if (st.subId) {
      const hit = credStore.get(st.subId)
      if (hit && inferProviderFromSub(hit) === p) {
        return { subId: st.subId, fingerprint: st.credentialFingerprint || null, rule: 'AS-M0' }
      }
    }
    const credentials = ctx.get('credentials')
    if (!credentials || typeof credentials.resolve !== 'function') return { subId: null, fingerprint: null, rule: null }

    const refs = new Set()
    for (const c of credStore.creds.values()) {
      if (inferProviderFromSub(c) !== p) continue
      if (c.credentialRef) refs.add(c.credentialRef)
    }
    const def = PROVIDERS[p]
    if (def && Array.isArray(def.credentialRefs)) {
      for (const r of def.credentialRefs) if (r) refs.add(r)
    }
    for (const ref of refs) {
      try {
        const resolved = await credentials.resolve(ref)
        const value = resolved && resolved.value
        if (!value) continue
        const fp = credentialFingerprint(value, '')
        for (const c of credStore.creds.values()) {
          if (inferProviderFromSub(c) !== p) continue
          const storedFp = credentialFingerprint(c.secret, c.extra)
          const secretFp = credentialFingerprint(c.secret, '')
          if (storedFp === fp || secretFp === fp) {
            st.subId = c.id
            st.credentialFingerprint = storedFp
            live.set(sessionId, st)
            return { subId: c.id, fingerprint: storedFp, rule: 'AS-M4' }
          }
        }
      } catch { /* try next */ }
    }
    return { subId: null, fingerprint: null, rule: null }
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
    if (!sub) {
      return {
        sessionId,
        route,
        subId: null,
        rule,
        degraded: route.source !== 'live',
        error: route.provider ? 'no-match' : 'no-route',
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


  async function toCredentialRef(name) {
    try {
      const mod = await import('@deepseek-ai/dsh-credentials')
      if (typeof mod.credentialRef === 'function') return mod.credentialRef(name)
    } catch { /* unit tests / bare node */ }
    return { type: 'env', name: String(name || '') }
  }

  function defaultCredRef(id) {
    return ('DSH_KEY_LIMITS_' + String(id || 'sub')).toUpperCase().replace(/[^A-Z0-9_]+/g, '_')
  }

  async function hydrateSecretsFromCredentials() {
    const credentials = ctx.get('credentials')
    if (!credentials || typeof credentials.resolve !== 'function') return
    for (const c of credStore.creds.values()) {
      if (!c.credentialRef) continue
      try {
        const resolved = await credentials.resolve(await toCredentialRef(c.credentialRef))
        const value = resolved && resolved.value
        if (typeof value === 'string' && value) c.secret = value
      } catch { /* try next */ }
    }
  }

  async function upsertSubFromBody(body) {
    const provider = body && body.provider
    const def = PROVIDERS[provider]
    if (!def) return { error: 'unknown provider' }
    const id = allocateSubId(body, provider)
    const prev = credStore.get(id)
    const secret = String(body.secret || '').trim()
    const extra = String(body.extra || (prev && prev.extra) || '')
    const label = String(body.label || (prev && prev.label) || '')
    let credentialRef = String(body.credentialRef || (prev && prev.credentialRef) || '').trim()
    // #12: store secrets in DSH credentials service, not plaintext subs.json
    if (secret) {
      const credentials = ctx.get('credentials')
      if (!credentials || typeof credentials.set !== 'function') {
        return { error: 'credentials service required to store secrets' }
      }
      if (!credentialRef) credentialRef = defaultCredRef(id)
      await credentials.set(await toCredentialRef(credentialRef), secret)
    } else if (!prev && !credentialRef) {
      return { error: 'secret or credentialRef required for new subscription' }
    }
    credStore.upsert(id, {
      provider,
      kind: def.kind,
      secret: '', // never persist plaintext when using credentials primary store
      extra,
      label,
      credentialRef,
    })
    return { ok: true, id, credentialRef }
  }

  async function buildSubsList() {
    const subs = loadSubs(storeDir)
    return subs.map((s) => {
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
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${NS}/health`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
      return json(res, 200, { ok: true, name: 'dsh-key-limits', storageDir: storeDir })
    },
  }), 'key-limits: health')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${NS}/config`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
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
    path: `${NS}/active-sub`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
      const q = readQuery(req)
      const sessionId = q.sessionId || ''
      if (!sessionId) return json(res, 400, { error: 'sessionId required' })
      return json(res, 200, await buildActiveSub(sessionId))
    },
  }), 'key-limits: active-sub')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${NS}/subs`,
    handler: async (req, res) => {
      try {
        if (req.method === 'GET') {
          const q = readQuery(req)
          const force = q.refresh === '1' || q.refresh === 'true'
          const subId = q.id || q.subId || ''
          const stale = !subsCache.at || Date.now() - subsCache.at >= SUBS_REFRESH_MS
          const refreshing = subsCache.refreshInFlight != null
          if (force) {
            if (subId) void refreshSubCard(subId).catch(() => {})
            else void refreshSubCards(true).catch(() => {})
          } else if (stale && !refreshing) void refreshSubCards(true).catch(() => {})
          const subscriptions = await buildSubsList()
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
          const body = await readJsonBody(req)
          const r = await upsertSubFromBody(body)
          if (r.error) return json(res, 400, { error: r.error })
          clearSubCache()
          subsCache.at = 0
          await refreshSubCards(true)
          return json(res, 200, r)
        }
        if (req.method === 'DELETE') {
          const u = new URL(req.url || '/', 'http://x')
          const id = u.searchParams.get('id')
          if (!id) return json(res, 400, { error: 'missing id' })
          credStore.remove(id)
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
}
