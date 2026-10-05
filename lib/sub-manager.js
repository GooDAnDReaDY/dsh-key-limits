// lib/sub-manager.js — Subscription caching, background polling and credentials persistence
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  refreshSubscriptions,
  refreshSubscriptionEntry,
  PROVIDERS,
  isExtraSecret,
  allocateSubId,
  clearSubCache,
} from './subs.js'
import { loadSubs, saveSubCards, sortSubscriptions, quotaWindowsFromCard } from './cards.js'
import { defaultCredRef, defaultExtraCredRef, toCredentialRef } from './http-utils.js'

export function createSubManager({ storeDir, credStore, ctx, logger, getConfig, sessionTracker }) {
  let subsCache = { at: 0, cards: [], refreshInFlight: null }

  function getRefreshIntervalMs() {
    const cfg = getConfig()
    const hours = Number(cfg?.refreshHours)
    if (Number.isFinite(hours) && hours > 0) {
      return Math.max(60_000, Math.round(hours * 3600_000))
    }
    return 24 * 3600_000
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
    const refreshMs = getRefreshIntervalMs()
    if (!force && subsCache.at && Date.now() - subsCache.at < refreshMs) return subsCache.cards
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
    if (!resolvedActiveSubId && sessionId && sessionTracker) {
      const active = await sessionTracker.buildActiveSub(sessionId)
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
    const cfg = getConfig()
    const ui = cfg.ui || {}
    return sortSubscriptions(list, {
      order: ui.order || [],
      activeOnTop: ui.activeOnTop !== false,
      activeSubId: resolvedActiveSubId,
    })
  }

  function startPeriodicRefresh() {
    ctx.effect(() => {
      let subsTimer = null
      let disposed = false
      function scheduleNext() {
        if (disposed) return
        const ms = getRefreshIntervalMs()
        subsTimer = setTimeout(() => {
          void refreshSubCards(true)
            .catch((err) => {
              logger?.warn?.('[dsh-key-limits] periodic refresh error:', err && err.message)
            })
            .finally(() => {
              scheduleNext()
            })
        }, ms)
        if (typeof subsTimer?.unref === 'function') subsTimer.unref()
      }
      scheduleNext()
      void refreshSubCards(false).catch((err) => {
        logger?.warn?.('[dsh-key-limits] initial refresh error:', err && err.message)
      })
      return () => {
        disposed = true
        if (subsTimer) clearTimeout(subsTimer)
      }
    }, 'dsh-key-limits: refresh timers')
  }

  return {
    getCache: () => subsCache,
    setCacheAt: (at) => { subsCache.at = at },
    clearCache: () => {
      clearSubCache()
      subsCache.at = 0
    },
    getRefreshIntervalMs,
    hydrateSecretsFromCredentials,
    refreshSubCard,
    refreshSubCards,
    upsertSubFromBody,
    buildSubsList,
    startPeriodicRefresh,
  }
}
