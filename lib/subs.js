// lib/subs.js — host-half provider quota/balance fetchers for the
// "Подписки" screen, ported from TokenTracker's direct-subscriptions.ts.
//
// Storage (under the plugin storage dir, next to (no ledger)):
//   subs.json  { credentials: { "<subId>": { credentialRef, meta… } }, meta: {...} }
//   Secrets live in DSH credentials service; plaintext secret field is legacy-only.
//
// Credentials are host-side secrets: they never leave the host. The client
// only receives normalized subscription cards (status/percent/checkedAt), not
// the secrets. UI "завести подписку" writes a credential via the host API.

import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const DEFAULT_TIMEOUT_MS = 12_000

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(timeoutMs)
    : undefined
  const mergedSignal = options.signal || signal
  return fetch(url, { ...options, signal: mergedSignal })
}

// ---------------------------------------------------------------------------
// In-process TTL cache for stable external reads (mirrors TT cachedFetch).
// ---------------------------------------------------------------------------
const cache = new Map()
function cachedFetch(key, ttlMs, fetcher) {
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expiresAt > now) return hit.data
  return Promise.resolve().then(fetcher).then((data) => {
    cache.set(key, { expiresAt: now + ttlMs, data })
    return data
  })
}
export function clearSubCache() { cache.clear() }

function clamp(n) { return Math.max(0, Math.min(100, n)) }

// ---------------------------------------------------------------------------
// Credentials store
// ---------------------------------------------------------------------------
export class CredentialStore {
  constructor(dir) {
    this.dir = dir
    this.path = join(dir, 'subs.json')
    this.creds = new Map() // subId -> { provider, kind, secret, extra, label, updatedAt }
    this.meta = {}
    this._load()
  }
  _load() {
    try {
      const raw = JSON.parse(readFileSync(this.path, 'utf8'))
      if (raw && typeof raw === 'object' && raw.meta && typeof raw.meta === 'object') {
        this.meta = { ...raw.meta }
      }
      if (raw && typeof raw === 'object' && raw.credentials && typeof raw.credentials === 'object') {
        for (const [id, v] of Object.entries(raw.credentials)) {
          if (v && typeof v === 'object' && typeof v.secret === 'string') {
            this.creds.set(id, { ...v, id })
          }
        }
      } else if (raw && typeof raw === 'object') {
        // legacy flat map {id: secret}
        for (const [id, secret] of Object.entries(raw)) {
          if (typeof secret === 'string') this.creds.set(id, { id, provider: id, kind: 'api_key', secret, extra: '', label: '' })
        }
      }
    } catch { /* absent is normal */ }
  }
  _save() {
    try {
      mkdirSync(this.dir, { recursive: true })
    } catch { /* best-effort */ }
    const creds = {}
    for (const [id, v] of this.creds) {
      creds[id] = { provider: v.provider, kind: v.kind, secret: v.credentialRef ? '' : (v.secret || ''), extra: v.extra || '', label: v.label || '', credentialRef: v.credentialRef || '', updatedAt: v.updatedAt }
    }
    try {
      const tmp = `${this.path}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`
      writeFileSync(tmp, JSON.stringify({ credentials: creds, meta: this.meta }, null, 2))
      renameSync(tmp, this.path)
    } catch { /* best-effort */ }
  }
  list() {
    return [...this.creds.values()].map((v) => ({ id: v.id, provider: v.provider, kind: v.kind, label: v.label || '', extra: v.extra || '', updatedAt: v.updatedAt }))
  }
  get(id) { return this.creds.get(id) }
  upsert(id, { provider, kind, secret, extra, label, credentialRef }) {
    const prev = this.creds.get(id)
    const next = {
      id,
      provider: provider || (prev && prev.provider) || id,
      kind: kind || (prev && prev.kind) || 'api_key',
      secret,
      extra: extra || '',
      label: label || '',
      credentialRef: String(credentialRef || (prev && prev.credentialRef) || '').trim(),
      updatedAt: Date.now(),
    }
    this.creds.set(id, next)
    this.meta[id] = {
      ...this.meta[id],
      fingerprint: credentialFingerprint(next.secret, next.extra),
      credentialRef: next.credentialRef || undefined,
    }
    this._save()
  }
  remove(id) { this.creds.delete(id); delete this.meta[id]; this._save() }
  dirname() { return this.dir }
}

/** Stable id for POST /subs. String(undefined) is "undefined" (truthy) — never use it. */
export function allocateSubId(body, provider) {
  const raw = body && body.id
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  const p = String(provider || 'sub')
  return p + '-' + Math.random().toString(36).slice(2, 8)
}


// ---------------------------------------------------------------------------
// Fetchers — each returns Partial<NormalizedSubscription>
// (status, plan, message, checkedAt, remaining, limit, primaryWindow,
//  secondaryWindow, tertiaryWindow).
// ---------------------------------------------------------------------------

function makeError(message) { return { status: 'error', message, checkedAt: Date.now() } }

// --- opencode-go: HTML parse of opencode.ai/workspace/<id>/go with auth cookie
export function parseOpenCodeWorkspaceId(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  const fromPath = s.match(/\/workspace\/([^/?#]+)/i)
  if (fromPath) return fromPath[1]
  const cleaned = s.replace(/\/go\/?$/, '')
  if (cleaned.startsWith('wrk_')) return cleaned
  if (s.includes('/')) {
    const last = s.slice(s.lastIndexOf('/') + 1)
    if (last && last !== 'go') return last
  }
  return cleaned || s
}

function normalizeOpenCodeAuthCookie(secret) {
  const s = String(secret || '').trim()
  if (!s) return ''
  if (s.toLowerCase().startsWith('auth=')) return s.slice(5).trim()
  return s
}

function parseOpenCodeGoUsage(html) {
  const result = {}
  const windows = []

  const hydrationRegex = /\$R\[\d+\]\s*=\s*\{([^}]*)\}/g
  let m
  while ((m = hydrationRegex.exec(html)) !== null) {
    const chunk = m[1]
    const usedMatch = chunk.match(/usagePercent[:\s]+(\d+(?:\.\d+)?)/)
    const resetMatch = chunk.match(/resetInSec[:\s]+(\d+)/)
    if (usedMatch && resetMatch) {
      windows.push({ usedPercent: Number(usedMatch[1]), resetInSec: Number(resetMatch[1]) })
    }
  }
  if (windows.length === 0) {
    const slotRegex = /data-slot=["']([^"']*)["']/g
    while ((m = slotRegex.exec(html)) !== null) {
      const usedMatch = m[1].match(/(\d+(?:\.\d+)?)%\s*used/i)
      const resetMatch = m[1].match(/reset\s*in\s*(\d+)\s*s/i)
      if (usedMatch) {
        windows.push({
          usedPercent: Number(usedMatch[1]),
          resetInSec: resetMatch ? Number(resetMatch[1]) : 0,
        })
      }
    }
  }

  if (windows.length >= 1) result.rolling5h = windows[0]
  if (windows.length >= 2) result.weekly = windows[1]
  if (windows.length >= 3) result.monthly = windows[2]
  return result
}

async function fetchOpenCodeGoQuota(secret, workspaceId) {
  const bareId = parseOpenCodeWorkspaceId(workspaceId)
  if (!bareId) return makeError('OpenCode GO requires a workspaceId')
  const auth = normalizeOpenCodeAuthCookie(secret)
  if (!auth) return makeError('OpenCode GO requires auth cookie')
  const url = `https://opencode.ai/workspace/${bareId}/go`
  try {
    const res = await fetchWithTimeout(url, { method: 'GET', headers: { cookie: `auth=${auth}`, accept: 'text/html' } })
    if (!res.ok) return makeError(`OpenCode GO page error ${res.status}`)
    const html = await res.text()
    const usage = parseOpenCodeGoUsage(html)
    const now = Date.now()
    if (!usage.rolling5h) {
      const looksLikeSubscribe = /subscribe-button|promo-description|promo-models/i.test(html) && !/usagePercent/i.test(html)
      return makeError(looksLikeSubscribe
        ? 'OpenCode GO: no active plan (subscription page, usage unavailable)'
        : bareId === 'go'
          ? 'OpenCode GO: invalid workspace (got "go" - specify wrk_... or full URL /workspace/wrk_.../go)'
          : 'OpenCode GO: failed to parse usage from HTML')
    }
    return {
      status: 'ok', checkedAt: now,
      plan: 'opencode-go',
      primaryWindow: { usedPercent: usage.rolling5h.usedPercent, remainingPercent: clamp(100 - usage.rolling5h.usedPercent), resetAt: now + usage.rolling5h.resetInSec * 1000 },
      secondaryWindow: usage.weekly ? { usedPercent: usage.weekly.usedPercent, remainingPercent: clamp(100 - usage.weekly.usedPercent), resetAt: usage.weekly.resetInSec ? now + usage.weekly.resetInSec * 1000 : null } : null,
      tertiaryWindow: usage.monthly ? { usedPercent: usage.monthly.usedPercent, remainingPercent: clamp(100 - usage.monthly.usedPercent), resetAt: usage.monthly.resetInSec ? now + usage.monthly.resetInSec * 1000 : null } : null,
    }
  } catch (e) {
    return makeError(String((e && e.message) || e).slice(0, 200))
  }
}

// --- ollama cloud: POST /api/me (Bearer api key) + GET /settings (session cookie)
function normalizeOllamaSessionCookie(sessionCookie) {
  const s = String(sessionCookie || '').trim()
  if (!s) return ''
  if (/^__Secure-session=/i.test(s)) return s
  // Full Cookie header from DevTools (multiple pairs)
  if (s.includes(';') && /^[^=]+=/.test(s)) return s
  return `__Secure-session=${s}`
}

function parseOllamaUsagePercents(html) {
  const out = { session: null, weekly: null, monthly: null }
  const re = /(session|weekly|monthly)\s+usage\s+([0-9]+(?:\.[0-9]+)?)\s*%\s*used/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const kind = m[1].toLowerCase()
    const pct = parseF(m[2])
    if (!Number.isFinite(pct)) continue
    if (kind === 'session' && out.session == null) out.session = pct
    else if (kind === 'weekly' && out.weekly == null) out.weekly = pct
    else if (kind === 'monthly' && out.monthly == null) out.monthly = pct
  }
  return out
}

async function fetchOllamaQuota(apiKey, sessionCookie) {
  const key = String(apiKey || '').trim()
  const cookie = normalizeOllamaSessionCookie(sessionCookie)
  return cachedFetch(`ollama:${md8(key)}:${md8(cookie)}`, 60_000, async () => {
    let plan
    let billingPeriodEnd = null
    let metadataError = ''
    if (!key) metadataError = 'api key not configured'
    else {
      try {
        const metaRes = await fetchWithTimeout('https://ollama.com/api/me', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${key}`,
            accept: 'application/json',
            'content-type': 'application/json',
          },
          body: JSON.stringify({}),
        })
        if (metaRes.ok) {
          const meta = await metaRes.json().catch(() => ({}))
          plan = typeof meta.Plan === 'string' ? meta.Plan : undefined
          const end = meta.SubscriptionPeriodEnd
          const endStr = typeof end === 'string' ? end : (end && end.Time)
          if (endStr) {
            const p = Date.parse(endStr)
            billingPeriodEnd = Number.isFinite(p) ? p : null
          }
        } else metadataError = `metadata ${metaRes.status}`
      } catch (err) {
        metadataError = err instanceof Error ? err.message : String(err)
      }
    }

    let sessionPercent = null
    let weeklyPercent = null
    let monthlyPercent = null
    let usageError = ''
    if (!cookie) usageError = 'session cookie not configured'
    else {
      try {
        const usageRes = await fetchWithTimeout('https://ollama.com/settings', {
          method: 'GET',
          headers: {
            cookie,
            accept: 'text/html',
            'user-agent': 'Mozilla/5.0 (compatible; dsh-key-limits/1.0)',
          },
        })
        if (usageRes.ok) {
          const html = await usageRes.text()
          const usage = parseOllamaUsagePercents(html)
          sessionPercent = usage.session
          weeklyPercent = usage.weekly
          monthlyPercent = usage.monthly
        } else usageError = `settings ${usageRes.status}`
      } catch (err) {
        usageError = err instanceof Error ? err.message : String(err)
      }
    }

    const hasMetadata = !!plan || billingPeriodEnd != null
    const hasUsage = sessionPercent != null || weeklyPercent != null || monthlyPercent != null
    if (!hasMetadata && !hasUsage) {
      return makeError([metadataError, usageError].filter(Boolean).join('; ') || 'Ollama subscription data unavailable')
    }

    return {
      status: 'ok',
      checkedAt: Date.now(),
      plan: plan || 'ollama',
      resetAt: billingPeriodEnd,
      primaryWindow: sessionPercent != null
        ? { usedPercent: sessionPercent, remainingPercent: clamp(100 - sessionPercent), resetAt: null }
        : null,
      secondaryWindow: weeklyPercent != null
        ? { usedPercent: weeklyPercent, remainingPercent: clamp(100 - weeklyPercent), resetAt: null }
        : null,
      tertiaryWindow: monthlyPercent != null
        ? { usedPercent: monthlyPercent, remainingPercent: clamp(100 - monthlyPercent), resetAt: null }
        : null,
      message: hasUsage ? undefined : (usageError || 'Usage requires session cookie'),
    }
  })
}

// --- qwen cloud: token-plan + coding-plan (home.qwencloud.com gateway)
const QWEN_CODING_PLAN_API = 'zeldaEasy.broadscope-bailian.codingPlan.queryCodingPlanInstanceInfoV2'
const QWEN_TOKEN_PLAN_USAGE_API = 'zeldaHttp.apikeyMgr./tokenplan/personal/api/v2/usage'
const QWEN_ANALYTICS_REFERER = 'https://home.qwencloud.com/analytics/token-plan/individual'

function qwenCornerstoneParam() {
  return {
    consoleSite: 'QWENCLOUD',
    domain: 'home.qwencloud.com',
    productCode: 'p_efm',
    protocol: 'V2',
    xsp_lang: 'en-US',
  }
}

function qwenSecToken(extra = '') {
  const raw = String(extra || '').trim()
  if (!raw) return ''
  const m = raw.match(/(?:^|&)sec_token=([^&]+)/i) || raw.match(/^sec_token[=:]\s*([^\s;]+)/i)
  if (m) return m[1].trim()
  if (!raw.includes('=') && !raw.includes(';') && raw.length <= 64) return raw
  return ''
}

async function qwenGatewayPost(cookie, api, data, extra, referer = QWEN_ANALYTICS_REFERER) {
  const params = JSON.stringify({ Api: api, Data: data })
  const body = new URLSearchParams({
    product: 'sfm_bailian',
    action: 'IntlBroadScopeAspnGateway',
    region: 'ap-southeast-1',
    params,
  })
  const sec = qwenSecToken(extra)
  if (sec) body.set('sec_token', sec)
  const url = 'https://cs-data.qwencloud.com/data/api.json?action=IntlBroadScopeAspnGateway&product=sfm_bailian&api=' + encodeURIComponent(api)
  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: '*/*',
        Origin: 'https://home.qwencloud.com',
        Referer: referer,
      },
      body: body.toString(),
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const raw = await res.json().catch(() => null)
    if (!raw) return { ok: false, error: 'invalid JSON' }
    return { ok: true, raw }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

function qwenQuotaWindow(used, total, resetAt) {
  const u = Number(used)
  const tot = Number(total)
  if (!Number.isFinite(u) || !Number.isFinite(tot) || tot <= 0) return null
  const usedPct = clamp((u / tot) * 100)
  const reset = Number(resetAt)
  return {
    usedPercent: usedPct,
    remainingPercent: clamp(100 - usedPct),
    resetAt: Number.isFinite(reset) ? reset : null,
  }
}

function parseQwenCodingPlan(raw) {
  const holder = findObjectWith('codingPlanInstanceInfos', raw)
  const infos = holder?.codingPlanInstanceInfos
  const list = Array.isArray(infos) ? infos : (infos && typeof infos === 'object' ? [infos] : [])
  const row = list.find((x) => x && x.codingPlanQuotaInfo) || list[0]
  if (!row) return null
  const q = row.codingPlanQuotaInfo || row
  const plan = row.planName || row.instanceName || row.packageName || 'Qwen Coding Plan'
  const primary = qwenQuotaWindow(q.per5HourUsedQuota, q.per5HourTotalQuota, q.per5HourQuotaNextRefreshTime)
  const secondary = qwenQuotaWindow(q.perWeekUsedQuota, q.perWeekTotalQuota, q.perWeekQuotaNextRefreshTime)
  const tertiary = qwenQuotaWindow(q.perBillMonthUsedQuota, q.perBillMonthTotalQuota, q.perBillMonthQuotaNextRefreshTime)
  if (!primary && !secondary && !tertiary) return null
  return { plan, primaryWindow: primary, secondaryWindow: secondary, tertiaryWindow: tertiary }
}

async function fetchQwenCodingPlan(cookie, extra = '') {
  const api = QWEN_CODING_PLAN_API
  const gw = await qwenGatewayPost(cookie, api, {
    reqDTO: { pageNo: 1, pageSize: 100 },
    cornerstoneParam: qwenCornerstoneParam(),
    queryCodingPlanInstanceInfoRequest: {
      commodityCode: 'sfm_codingplan_public_intl',
      onlyLatestOne: true,
    },
  }, extra)
  if (!gw.ok) return makeError(`Qwen Coding Plan ${gw.error}`)
  const parsed = parseQwenCodingPlan(gw.raw)
  if (!parsed) return makeError('Qwen Coding Plan: no active instance (empty codingPlanInstanceInfos)')
  return {
    status: 'ok',
    checkedAt: Date.now(),
    plan: parsed.plan,
    primaryWindow: parsed.primaryWindow,
    secondaryWindow: parsed.secondaryWindow,
    tertiaryWindow: parsed.tertiaryWindow,
  }
}

async function fetchQwenTokenPlan(cookie, extra = '') {
  const api = QWEN_TOKEN_PLAN_USAGE_API
  const gw = await qwenGatewayPost(cookie, api, {
    cornerstoneParam: qwenCornerstoneParam(),
  }, extra)
  if (!gw.ok) return makeError(`Qwen Token Plan ${gw.error}`)
  const usage = findObjectWith('per5HourPercentage', gw.raw) || findObjectWith('per1WeekPercentage', gw.raw)
  if (!usage || (usage.per5HourPercentage == null && usage.per1WeekPercentage == null)) {
    return makeError('Qwen Token Plan response missing quota windows')
  }
  const usedPct = (n) => (typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : null)
  const five = usedPct(usage.per5HourPercentage)
  const week = usedPct(usage.per1WeekPercentage)
  return {
    status: 'ok',
    checkedAt: Date.now(),
    plan: 'Qwen Token Plan',
    primaryWindow: five != null
      ? { usedPercent: Math.round(five * 100), remainingPercent: clamp(100 - Math.round(five * 100)), resetAt: typeof usage.per5HourResetTime === 'number' ? usage.per5HourResetTime : null }
      : null,
    secondaryWindow: week != null
      ? { usedPercent: Math.round(week * 100), remainingPercent: clamp(100 - Math.round(week * 100)), resetAt: typeof usage.per1WeekResetTime === 'number' ? usage.per1WeekResetTime : null }
      : null,
  }
}

async function fetchQwenQuota(cookie, extra = '') {
  const token = await fetchQwenTokenPlan(cookie, extra)
  if (token.status === 'ok') return token
  const coding = await fetchQwenCodingPlan(cookie, extra)
  if (coding.status === 'ok') return coding
  return token.status === 'error' ? token : coding
}

// --- kimicode: api.kimi.com/coding/v1/usages (key or JWT cookie)
async function fetchKimiQuota(secret) {
  return cachedFetch(`kimi:${md8(secret)}`, 60_000, async () => {
    const isJWT = secret.startsWith('eyJ')
    if (isJWT) return makeError('Kimi JWT flow not implemented in plugin (use API key)')
    try {
      const res = await fetchWithTimeout('https://api.kimi.com/coding/v1/usages', {
        method: 'GET', headers: { authorization: `Bearer ${secret}`, accept: 'application/json' },
      })
      if (!res.ok) return makeError(`Kimi API error ${res.status}`)
      const raw = await res.json().catch(() => ({}))
      const usage = raw.usage || null
      if (!usage) return makeError('Kimi usage response missing usage object')
      const num = (v) => { const n = typeof v === 'number' ? v : Number(v); return Number.isFinite(n) ? n : null }
      const weekRemaining = num(usage.remaining)
      const weekUsed = num(usage.used)
      const weekLimit = num(usage.limit)
      const weekResetAt = typeof usage.resetTime === 'string' ? Date.parse(usage.resetTime) : null
      const weeklyPct = weekLimit && weekUsed != null ? (weekUsed / weekLimit) * 100 : (weekRemaining != null && weekLimit ? (1 - weekRemaining / weekLimit) * 100 : null)
      return {
        status: 'ok', checkedAt: Date.now(), plan: 'kimicode', limit: weekLimit || null, remaining: weekRemaining != null ? weekRemaining : (weekLimit != null && weekUsed != null ? weekLimit - weekUsed : null),
        secondaryWindow: weeklyPct != null ? { usedPercent: weeklyPct, remainingPercent: clamp(100 - weeklyPct), resetAt: weekResetAt } : null,
      }
    } catch (e) {
      return makeError(String((e && e.message) || e).slice(0, 200))
    }
  })
}

// --- glm / z.ai
async function fetchGlmQuota(apiKey) {
  const key = String(apiKey || '').trim()
  if (!key) return makeError('GLM API key required')
  return cachedFetch(`glm:${md8(key)}`, 60_000, async () => {
    try {
      const res = await fetchWithTimeout('https://api.z.ai/api/monitor/usage/quota/limit', {
        method: 'GET', headers: { authorization: key, accept: 'application/json' },
      })
      if (!res.ok) return makeError(`Z.ai API error ${res.status}`)
      const raw = await res.json().catch(() => ({}))
      const data = raw.data || raw || {}
      const limits = Array.isArray(data.limits) ? data.limits : []
      if (!limits.length) return makeError('Z.ai quota response contains no limits')
      let fiveHour, weekly
      for (const limit of limits) {
        if (limit.type !== 'TOKENS_LIMIT' || typeof limit.percentage !== 'number') continue
        const w = {
          usedPercent: clamp(limit.percentage),
          remainingPercent: clamp(100 - limit.percentage),
          resetAt: typeof limit.nextResetTime === 'number' ? limit.nextResetTime : null,
        }
        if (limit.unit === 3) fiveHour = w
        else if (limit.unit === 6) weekly = w
      }
      return {
        status: 'ok',
        plan: data.level ? `Z.ai ${data.level}` : 'GLM',
        checkedAt: Date.now(),
        primaryWindow: fiveHour || null,
        secondaryWindow: weekly || null,
      }
    } catch (e) {
      return makeError(String((e && e.message) || e).slice(0, 200))
    }
  })
}

// --- minimax coding plan
async function fetchMinimaxQuota(apiKey) {
  try {
    const res = await fetchWithTimeout('https://api.minimax.io/v1/api/openplatform/coding_plan/remains', {
      method: 'GET',
      headers: { authorization: `Bearer ${apiKey}`, accept: 'application/json' },
    })
    if (!res.ok) return makeError(`MiniMax API error ${res.status}`)
    const raw = await res.json().catch(() => ({}))
    const modelRemains = Array.isArray(raw.model_remains) ? raw.model_remains : []
    if (!modelRemains.length) return makeError('MiniMax quota response contains no model_remains')
    const general = modelRemains.find((m) => m.model_name === 'general') || modelRemains[0]
    const intervalPercent = general.current_interval_remaining_percent
    const weeklyPercent = general.current_weekly_remaining_percent
    return {
      status: 'ok',
      plan: general.model_name || 'general',
      checkedAt: Date.now(),
      primaryWindow: typeof intervalPercent === 'number'
        ? { remainingPercent: clamp(intervalPercent), resetAt: general.end_time ?? null }
        : null,
      secondaryWindow: typeof weeklyPercent === 'number'
        ? { remainingPercent: clamp(weeklyPercent), resetAt: general.weekly_end_time ?? null }
        : null,
    }
  } catch (e) {
    return makeError(String((e && e.message) || e).slice(0, 200))
  }
}



// --- cline: ClinePass usage-limits (ported from TokenTracker direct-subscriptions.ts)
async function fetchClineQuota(apiKey) {
  const key = String(apiKey || '').trim()
  if (!key) return makeError('Cline API key required')
  return cachedFetch(`cline:${md8(key)}`, 90_000, async () => {
    try {
      const res = await fetchWithTimeout('https://api.cline.bot/api/v1/users/me/plan/usage-limits', {
        method: 'GET',
        headers: { authorization: `Bearer ${key}`, accept: 'application/json' },
      })
      if (!res.ok) return makeError(`Cline usage-limits ${res.status}`)
      const body = await res.json().catch(() => ({}))
      const limits = (body.data && body.data.limits) || []
      const find = (type) => limits.find((l) => l && l.type === type)
      const toWindow = (l) => {
        if (!l || typeof l.percentUsed !== 'number') return null
        const used = clamp(l.percentUsed)
        const resetAt = l.resetsAt ? Date.parse(l.resetsAt) : null
        return {
          usedPercent: used,
          remainingPercent: clamp(100 - used),
          resetAt: Number.isFinite(resetAt) ? resetAt : null,
        }
      }
      const fiveHour = toWindow(find('five_hour'))
      const weekly = toWindow(find('weekly'))
      const monthly = toWindow(find('monthly'))
      if (!fiveHour && !weekly && !monthly) return makeError('No rate-limit windows in response')
      return {
        status: 'ok',
        checkedAt: Date.now(),
        plan: 'cline-pass',
        primaryWindow: fiveHour,
        secondaryWindow: weekly,
        tertiaryWindow: monthly,
      }
    } catch (e) {
      return makeError(String((e && e.message) || e).slice(0, 200))
    }
  })
}



const CNY_PER_USD = 7.25

function deepSeekBalanceInfo(infos) {
  const list = Array.isArray(infos) ? infos : []
  const usd = list.find((x) => x && x.currency === 'USD')
  if (usd) {
    const rem = parseF(usd.total_balance) ?? parseF(usd.topped_up_balance)
    if (rem == null) return null
    const topped = parseF(usd.topped_up_balance) ?? rem
    const granted = parseF(usd.granted_balance) ?? 0
    const limit = topped + granted > 0 ? topped + granted : rem
    return { currency: '$', remaining: rem, limit }
  }
  const cny = list.find((x) => x && x.currency === 'CNY') || list[0]
  if (!cny) return null
  const remCny = parseF(cny.total_balance) ?? parseF(cny.topped_up_balance)
  if (remCny == null) return null
  const topped = parseF(cny.topped_up_balance) ?? remCny
  const granted = parseF(cny.granted_balance) ?? 0
  const limitCny = topped + granted > 0 ? topped + granted : remCny
  return {
    currency: '$',
    remaining: remCny / CNY_PER_USD,
    limit: limitCny / CNY_PER_USD,
    cnyRemaining: remCny,
    cnyLimit: limitCny,
  }
}

// --- deepseek: balance (USD display)
async function fetchDeepSeekBalance(apiKey) {
  try {
    const res = await fetchWithTimeout('https://api.deepseek.com/user/balance', {
      method: 'GET',
      headers: { authorization: `Bearer ${apiKey}`, accept: 'application/json' },
    })
    if (!res.ok) return makeError(`DeepSeek balance HTTP ${res.status}`)
    const body = await res.json().catch(() => ({}))
    const infos = Array.isArray(body.balance_infos) ? body.balance_infos : []
    const picked = deepSeekBalanceInfo(infos)
    if (!picked) return makeError('DeepSeek balance response missing balance_infos')
    const rem = picked.remaining
    return {
      status: 'ok',
      plan: `DeepSeek $${rem.toFixed(2)}`,
      kind: 'balance',
      display: 'balance_lines',
      remaining: rem,
      limit: picked.limit,
      checkedAt: Date.now(),
      currency: '$',
      spendWeek: null,
      spendMonth: null,
      cnyRemaining: picked.cnyRemaining ?? null,
      cnyLimit: picked.cnyLimit ?? null,
    }
  } catch (e) {
    return makeError(String((e && e.message) || e).slice(0, 200))
  }
}

// --- openrouter: balance $
async function fetchOpenRouterBalance(apiKey) {
  const headers = { authorization: `Bearer ${apiKey}`, accept: 'application/json' }
  try {
    const [creditsRes, keyRes] = await Promise.all([
      fetchWithTimeout('https://openrouter.ai/api/v1/credits', { headers }).catch(() => null),
      fetchWithTimeout('https://openrouter.ai/api/v1/key', { headers }).catch(() => null),
    ])
    if (!creditsRes || !creditsRes.ok) return makeError(`OpenRouter /credits HTTP ${creditsRes ? creditsRes.status : 'error'}`)
    const body = await creditsRes.json().catch(() => ({}))
    const totalCredits = body.data && body.data.total_credits
    const totalUsage = body.data && body.data.total_usage
    if (totalCredits == null || totalUsage == null) return makeError('OpenRouter /credits missing total_credits/total_usage')
    let keyData = {}
    if (keyRes && keyRes.ok) {
      const kb = await keyRes.json().catch(() => ({}))
      keyData = (kb && kb.data) || {}
    }
    const spendWeek = Number(keyData.usage_weekly) || 0
    const spendMonth = Number(keyData.usage_monthly) || 0
    const rem = Math.max(0, Number(totalCredits) - Number(totalUsage))
    return {
      status: 'ok',
      plan: `OpenRouter $${rem.toFixed(2)}`,
      kind: 'balance',
      display: 'balance_lines',
      remaining: rem,
      limit: Number(totalCredits),
      spendWeek,
      spendMonth,
      checkedAt: Date.now(),
      currency: '$',
    }
  } catch (e) {
    return makeError(String((e && e.message) || e).slice(0, 200))
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function findObjectWith(key, node, depth = 0) {
  if (node == null || depth > 12) return undefined
  if (typeof node === 'object') {
    if (key in node) return node
    for (const v of Object.values(node)) {
      const found = findObjectWith(key, v, depth + 1)
      if (found) return found
    }
  }
  return undefined
}
function pickFirstMatch(s, re) {
  const m = s.match(re)
  return m ? m[1] : null
}
function parseF(v) { const n = Number(v); return Number.isFinite(n) ? n : null }
function md8(s) {
  // tiny stable 8-char hash (not crypto — cache keys + credential fingerprints)
  let h = 0
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0 }
  return (h >>> 0).toString(36)
}

/** Stable fingerprint for matching harness credential ↔ stored sub (never expose raw secret). */
export function credentialFingerprint(secret, extra = '') {
  return md8(String(secret || '') + '|' + String(extra || ''))
}

// ---------------------------------------------------------------------------
// Provider registry + client-safe field schemas (mirrors TT LIVE_CREDENTIAL_META)
// ---------------------------------------------------------------------------
export function providerSchemas() {
  const out = {}
  for (const [id, def] of Object.entries(PROVIDERS)) {
    out[id] = {
      id,
      label: def.label,
      kind: def.kind,
      hint: def.hint || '',
      fields: (def.fields || []).map((f) => ({
        key: f.key,
        label: f.label,
        placeholder: f.placeholder || '',
        secret: f.secret !== false,
        required: f.required !== false,
      })),
    }
  }
  return out
}

export const PROVIDERS = {
  'opencode-go': {
    kind: 'oauth',
    label: 'OpenCode GO',
    hint: 'DevTools → Application → Cookies на opencode.ai: значение cookie auth. Workspace — id или полная ссылка на /go.',
    fields: [
      { key: 'secret', label: 'Session cookie (auth=...)', placeholder: 'Fe26.2**...', secret: true, required: true },
      { key: 'extra', label: 'Workspace ID или URL', placeholder: 'wrk_01... или https://opencode.ai/workspace/wrk_01.../go', secret: false, required: true },
    ],
    fetch: fetchOpenCodeGoQuota,
  },
  ollama: {
    credentialRefs: ['OLLAMA_API_KEY'],
    kind: 'api_key',
    label: 'Ollama Cloud',
    hint: 'API-ключ Ollama Cloud + session cookie с ollama.com. Ключ — POST /api/me, cookie — usage на /settings.',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'ключ из Ollama Cloud', secret: true, required: true },
      { key: 'extra', label: 'Session cookie', placeholder: 'значение __Secure-session или полный Cookie header', secret: true, required: true },
    ],
    fetch: fetchOllamaQuota,
  },
  qwen: {
    kind: 'oauth',
    label: 'Qwen Cloud',
    hint: 'Cookie из curl -b или Request Headers → cookie на home.qwencloud.com/analytics/token-plan/individual',
    fields: [
      { key: 'secret', label: 'Session cookie', placeholder: 'Строка из curl -b (все cookie через ;)', secret: true, required: true },
      { key: 'extra', label: 'sec_token (опционально)', placeholder: 'из --data-raw sec_token=... если запрос без cookie не работает', secret: false, required: false },
    ],
    fetch: fetchQwenQuota,
  },
  kimi: {
    credentialRefs: ['KIMI_FOR_CODING_API_KEY', 'KIMI_API_KEY'],
    kind: 'api_key',
    label: 'Kimi for Coding',
    hint: 'API-ключ Kimi for Coding (sk-kimi-...). JWT/cookie пока не поддерживаются.',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'sk-kimi-...', secret: true, required: true },
    ],
    fetch: fetchKimiQuota,
  },
  glm: {
    credentialRefs: ['ZAI_API_KEY', 'GLM_API_KEY'],
    kind: 'api_key',
    label: 'GLM (Z.ai)',
    hint: 'API-ключ из личного кабинета z.ai (передаётся в Authorization без Bearer).',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'zai-...', secret: true, required: true },
    ],
    fetch: fetchGlmQuota,
  },
  minimax: {
    kind: 'api_key',
    label: 'MiniMax',
    hint: 'API-ключ MiniMax Coding Plan (sk-cp-...).',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'sk-cp-...', secret: true, required: true },
    ],
    fetch: fetchMinimaxQuota,
  },
  cline: {
    credentialRefs: ['CLINE_API_KEY'],
    kind: 'api_key',
    label: 'Cline',
    hint: 'Bearer API key из cline.bot. Квоты: 5h / week / month (usage-limits).',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'Bearer token из Cline', secret: true, required: true },
    ],
    fetch: fetchClineQuota,
  },
  deepseek: {
    credentialRefs: ['DEEPSEEK_API_KEY'],
    kind: 'balance',
    label: 'DeepSeek',
    hint: 'API key — остаток $ (GET api.deepseek.com/user/balance; CNY конвертируется в USD).',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'sk-...', secret: true, required: true },
    ],
    fetch: fetchDeepSeekBalance,
  },
  openrouter: {
    kind: 'balance',
    label: 'OpenRouter',
    hint: 'API-ключ OpenRouter — показывает $ баланс (credits − usage).',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'sk-or-...', secret: true, required: true },
    ],
    fetch: fetchOpenRouterBalance,
  },
}

// ---------------------------------------------------------------------------
// Refresh all configured subscriptions
// ---------------------------------------------------------------------------
const REFRESH_CONCURRENCY = 4

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      try {
        results[i] = { status: 'fulfilled', value: await fn(items[i], i) }
      } catch (e) {
        results[i] = { status: 'rejected', reason: e }
      }
    }
  }
  const n = Math.min(concurrency, items.length)
  if (n > 0) await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}

export async function refreshSubscriptionEntry(store, entry) {
  const def = PROVIDERS[entry.provider]
  if (!def) return { id: entry.id, name: entry.provider, kind: "api_key", status: "unsupported", message: `unknown provider ${entry.provider}`, checkedAt: Date.now() }
  try {
    const cred = store.get(entry.id)
    if (!cred || !cred.secret) return { id: entry.id, name: entry.provider, kind: def.kind, status: "error", message: "no credential found", checkedAt: Date.now() }
    const partial = await def.fetch(cred.secret, cred.extra)
    return {
      id: entry.id, name: entry.label || def.label || entry.provider, provider: entry.provider,
      kind: partial.kind || def.kind, status: partial.status || "ok",
      plan: partial.plan || null, message: partial.message || null, checkedAt: partial.checkedAt || Date.now(),
      remaining: partial.remaining ?? null, limit: partial.limit ?? null,
      currency: partial.currency || null,
      display: partial.display || null,
      spendWeek: partial.spendWeek ?? null,
      spendMonth: partial.spendMonth ?? null,
      primaryWindow: partial.primaryWindow || null, secondaryWindow: partial.secondaryWindow || null, tertiaryWindow: partial.tertiaryWindow || null,
    }
  } catch (e) {
    return { id: entry.id, name: entry.provider, provider: entry.provider, kind: def.kind, status: "error", message: String((e && e.message) || e).slice(0, 200), checkedAt: Date.now() }
  }
}

export async function refreshSubscriptions(store) {
  const list = store.list()
  const results = await mapPool(list, REFRESH_CONCURRENCY, async (entry) => refreshSubscriptionEntry(store, entry))
  const cards = []
  for (const r of results) if (r && r.status === "fulfilled" && r.value) cards.push(r.value)
  return cards
}

/* removed duplicate */

