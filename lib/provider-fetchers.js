import {
  clamp,
  parseF,
  md8,
  findObjectWith,
  pickFirstMatch,
  parseOpenCodeWorkspaceId,
  normalizeOpenCodeAuthCookie,
  parseOpenCodeGoUsage,
  normalizeOllamaSessionCookie,
  parseOllamaUsagePercents,
  qwenCornerstoneParam,
  qwenSecToken,
  qwenQuotaWindow,
  parseQwenCodingPlan,
  deepSeekBalanceInfo,
  CNY_PER_USD,
  COMMAND_CODE_PLANS,
  parseClineLimits,
} from './provider-parsers.js'
// lib/provider-fetchers.js — Provider API adapters and quota extractors for @goodandready/dsh-key-limits

const DEFAULT_TIMEOUT_MS = 12_000

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(timeoutMs)
    : undefined
  const mergedSignal = options.signal || signal
  return fetch(url, { ...options, redirect: options.redirect || 'error', signal: mergedSignal })
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
function clearSubCache() { cache.clear() }


// ---------------------------------------------------------------------------
// Credentials store
// ---------------------------------------------------------------------------

// Fetchers — each returns Partial<NormalizedSubscription>
// (status, plan, message, checkedAt, remaining, limit, primaryWindow,
//  secondaryWindow, tertiaryWindow).
// ---------------------------------------------------------------------------

let defaultLogger = null
function setProviderLogger(logger) {
  defaultLogger = logger
}

function makeError(message, provider = null, err = null) {
  if (defaultLogger && defaultLogger.warn) {
    const p = provider ? `[${provider}] ` : ''
    const msg = err && err.message ? err.message : message
    defaultLogger.warn(`[dsh-key-limits] ${p}fetch error: ${msg}`)
  }
  return { status: 'error', message, checkedAt: Date.now() }
}

// --- opencode-go: HTML parse of opencode.ai/workspace/<id>/go with auth cookie

async function fetchOpenCodeGoQuota(secret, workspaceId) {
  const bareId = parseOpenCodeWorkspaceId(workspaceId)
  if (!bareId) return makeError('OpenCode GO requires a workspaceId')
  const auth = normalizeOpenCodeAuthCookie(secret)
  if (!auth) return makeError('OpenCode GO requires auth cookie')
  const url = `https://opencode.ai/workspace/${bareId}/go`
  try {
    const res = await fetchWithTimeout(url, { method: 'GET', headers: { cookie: auth, accept: 'text/html' } })
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
      const { fiveHour, weekly, monthly } = parseClineLimits(body.data && body.data.limits)
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


// --- commandcode: https://api.commandcode.ai/alpha/billing/credits
async function fetchCommandCodeQuota(secret) {
  const key = String(secret || '').trim()
  if (!key) return makeError('Command Code API key required')
  return cachedFetch(`commandcode:${md8(key)}`, 60_000, async () => {
    try {
      const headers = {
        Authorization: `Bearer ${key}`,
        'x-command-code-version': '0.1.0',
        'x-cli-environment': 'production',
      }
      const [res, subRes] = await Promise.all([
        fetchWithTimeout('https://api.commandcode.ai/alpha/billing/credits', { headers }, 12_000),
        fetchWithTimeout('https://api.commandcode.ai/alpha/billing/subscriptions', { headers }, 12_000).catch(() => null),
      ])
      if (!res.ok) return makeError(`Command Code API error ${res.status}`)
      const raw = await res.json().catch(() => ({}))
      const subRaw = subRes && subRes.ok ? await subRes.json().catch(() => ({})) : {}
      const wl = raw.windowLimits && typeof raw.windowLimits === 'object' ? raw.windowLimits : {}
      const five = wl.fiveHour && typeof wl.fiveHour === 'object' ? wl.fiveHour : null
      const weekly = wl.weekly && typeof wl.weekly === 'object' ? wl.weekly : null
      const credits = raw.credits && typeof raw.credits === 'object' ? raw.credits : {}
      const subData = (subRaw && subRaw.data) || {}
      const planId = String(subData.planId || '').toLowerCase()
      const planInfo = COMMAND_CODE_PLANS[planId] || { name: planId ? planId.toUpperCase() : 'GOAT', cap: 70 }

      const pct = (used, cap) => {
        const u = Number(used) || 0
        const c = Number(cap) || 0
        if (c <= 0) return 0
        return Math.max(0, Math.min(100, Math.round((u / c) * 1000) / 10))
      }
      const primaryWindow = five && five.cap ? {
        usedPercent: pct(five.used, five.cap),
        remainingPercent: clamp(100 - pct(five.used, five.cap)),
        resetAt: Number(five.resetAt) || null,
      } : null
      const secondaryWindow = weekly && weekly.cap ? {
        usedPercent: pct(weekly.used, weekly.cap),
        remainingPercent: clamp(100 - pct(weekly.used, weekly.cap)),
        resetAt: Number(weekly.resetAt) || null,
      } : null

      const remMonthly = Number(credits.monthlyCredits)
      let tertiaryWindow = null
      if (Number.isFinite(remMonthly) && planInfo.cap > 0) {
        const cap = planInfo.cap
        const used = Math.max(0, cap - remMonthly)
        const usedPct = Math.min(100, Math.round((used / cap) * 1000) / 10)
        const resetAt = subData.currentPeriodEnd ? Date.parse(subData.currentPeriodEnd) : null
        tertiaryWindow = {
          usedPercent: usedPct,
          remainingPercent: Math.max(0, Math.min(100, Math.round((100 - usedPct) * 10) / 10)),
          resetAt: Number.isFinite(resetAt) ? resetAt : null,
          label: 'Monthly'
        }
      }

      return {
        status: 'ok',
        plan: `Command Code (${planInfo.name})`,
        primaryWindow,
        secondaryWindow,
        tertiaryWindow,
        checkedAt: Date.now(),
      }
    } catch (e) {
      return makeError(String((e && e.message) || e).slice(0, 200))
    }
  })
}

// ---------------------------------------------------------------------------

export {
  setProviderLogger,
  DEFAULT_TIMEOUT_MS,
  fetchWithTimeout,
  clearSubCache,
  clamp,
  md8,
  makeError,
  parseOpenCodeWorkspaceId,
  normalizeOpenCodeAuthCookie,
  parseOpenCodeGoUsage,
  normalizeOllamaSessionCookie,
  parseOllamaUsagePercents,
  parseQwenCodingPlan,
  deepSeekBalanceInfo,
  fetchOpenCodeGoQuota,
  fetchOllamaQuota,
  fetchQwenQuota,
  fetchKimiQuota,
  fetchGlmQuota,
  fetchMinimaxQuota,
  fetchClineQuota,
  fetchDeepSeekBalance,
  fetchOpenRouterBalance,
  fetchCommandCodeQuota,
}
