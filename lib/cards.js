// lib/cards.js — subs.json card persistence + match helpers (no ledger)
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'

function cardFromRefresh(c) {
  if (!c) return null
  return {
    primaryWindow: c.primaryWindow || null,
    secondaryWindow: c.secondaryWindow || null,
    tertiaryWindow: c.tertiaryWindow || null,
    fetchedAt: c.checkedAt || Date.now(),
    error: c.status && c.status !== 'ok' ? (c.message || c.status) : null,
    stale: false,
    plan: c.plan || null,
    status: c.status || null,
    kind: c.kind || null,
    remaining: c.remaining ?? null,
    limit: c.limit ?? null,
    message: c.message || null,
    currency: c.currency || null,
    display: c.display || null,
    cnyRemaining: c.cnyRemaining ?? null,
    cnyLimit: c.cnyLimit ?? null,
  }
}

let cardsLogger = null
export function setCardsLogger(logger) {
  cardsLogger = logger
}

export function saveSubCards(dir, cards) {
  const path = join(dir, 'subs.json')
  let raw = { credentials: {}, meta: {} }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    if (parsed && typeof parsed === 'object') {
      raw.credentials = parsed.credentials && typeof parsed.credentials === 'object' ? parsed.credentials : {}
      raw.meta = parsed.meta && typeof parsed.meta === 'object' ? parsed.meta : {}
    }
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      cardsLogger?.warn?.('[dsh-key-limits] saveSubCards read error:', err.message)
    }
  }
  for (const c of cards || []) {
    if (!c || !c.id) continue
    const prev = raw.meta[c.id]
    const prevCard = prev?.card
    let card = cardFromRefresh(c)
    if (c.status === 'error' && prevCard && prevCard.status === 'ok') {
      const msg = String(c.message || '').toLowerCase()
      if (msg.includes('fetch failed') || msg.includes('econnreset') || msg.includes('timeout') || msg.includes('socket')) {
        card = { ...prevCard, stale: true }
      }
    }
    raw.meta[c.id] = {
      ...prev,
      label: c.name || prev?.label || c.id,
      provider: c.provider || prev?.provider,
      card,
    }
  }
  try {
    mkdirSync(dir, { recursive: true })
    const tmp = `${path}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`
    writeFileSync(tmp, JSON.stringify(raw, null, 2))
    renameSync(tmp, path)
  } catch (err) {
    cardsLogger?.warn?.('[dsh-key-limits] saveSubCards write error:', err.message)
  }
}

export function inferProviderFromSub(sub) {
  if (!sub) return ''
  const p = String(sub.provider || '').trim().toLowerCase()
  if (p) return p
  const id = String(sub.id || '')
  const m = id.match(/^(.+)-\d+$/)
  return m ? m[1].toLowerCase() : id.toLowerCase()
}

export function loadSubs(dir) {
  const path = join(dir, 'subs.json')
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    const creds = raw.credentials && typeof raw.credentials === 'object' ? raw.credentials : {}
    const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : {}
    const allIds = Array.from(new Set([...Object.keys(creds), ...Object.keys(meta)]))
    const subscriptions = []
    for (const id of allIds) {
      const v = creds[id]
      const m = meta[id] || {}
      if (typeof v === 'string') {
        subscriptions.push({
          id,
          provider: m.provider || inferProviderFromSub({ id }),
          label: m.label || id,
          card: m.card || null,
          fingerprint: m.fingerprint || null,
        })
        continue
      }
      const provider = (v && v.provider) || m.provider || inferProviderFromSub({ id })
      const label = (v && v.label) || m.label || id
      const kind = (v && v.kind) || (m.card && m.card.kind) || ''
      const fingerprint = m.fingerprint || (v && v.fingerprint) || null
      const credentialRef = (v && v.credentialRef) || m.credentialRef || ''
      subscriptions.push({
        id,
        provider,
        label,
        kind,
        fingerprint,
        credentialRef,
        card: m.card || null,
      })
    }
    return subscriptions
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      cardsLogger?.warn?.('[dsh-key-limits] loadSubs read error:', err.message)
    }
    return []
  }
}

export function matchSub(subs, { provider, subId, fingerprint } = {}) {
  const list = subs || []
  if (subId) {
    const bound = list.find((s) => s.id === subId)
    if (bound) return { sub: bound, rule: 'AS-M0' }
  }
  const fp = String(fingerprint || '').trim()
  if (fp) {
    const fpHits = list.filter((s) => s.fingerprint === fp)
    if (fpHits.length === 1) return { sub: fpHits[0], rule: 'AS-M4' }
    if (fpHits.length > 1) return { sub: fpHits[0], rule: 'AS-M4-multi' }
  }
  const p = String(provider || '').trim().toLowerCase()
  if (!p) return { sub: null, rule: 'no-route' }
  const hits = list.filter((s) => inferProviderFromSub(s) === p)
  if (hits.length === 1) return { sub: hits[0], rule: 'AS-M1' }
  if (hits.length > 1) return { sub: hits[0], rule: 'AS-M1-multi' }
  return { sub: null, rule: 'no-match' }
}

export function quotaWindowsFromCard(card) {
  if (!card || typeof card !== 'object') return null
  const windows = []
  const push = (id, label, w) => {
    if (!w) return
    const used = Number(w.usedPercent) || 0
    const rem = typeof w.remainingPercent === 'number'
      ? w.remainingPercent
      : (w.remainingPercent != null && !Number.isNaN(Number(w.remainingPercent))
          ? Number(w.remainingPercent)
          : Math.max(0, Math.min(100, 100 - used)))
    windows.push({
      id,
      label: w.label || label,
      usedPercent: used,
      remainingPercent: rem,
      resetsAt: w.resetAt || w.resetsAt || null,
    })
  }
  push('rolling', 'Rolling 5h', card.primaryWindow)
  push('weekly', 'Weekly', card.secondaryWindow)
  push('monthly', 'Monthly', card.tertiaryWindow)
  return windows.length ? windows : null
}

export function sortSubscriptions(subs, { order = [], activeOnTop = false, activeSubId = null } = {}) {
  const list = (subs || []).slice()
  const orderMap = {}
  if (Array.isArray(order)) {
    for (let i = 0; i < order.length; i++) {
      orderMap[order[i]] = i + 1
    }
  }
  return list.sort((a, b) => {
    if (activeOnTop && activeSubId) {
      if (a.id === activeSubId) return -1
      if (b.id === activeSubId) return 1
    }
    const pA = orderMap[a.id] || 9999
    const pB = orderMap[b.id] || 9999
    if (pA !== pB) return pA - pB
    return 0
  })
}
