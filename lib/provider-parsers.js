// lib/provider-parsers.js — Parsing and normalization utilities for @goodandready/dsh-key-limits

const CNY_PER_USD = 7.25

const COMMAND_CODE_PLANS = {
  'individual-go': { name: 'Go', cap: 10 },
  'individual-goat': { name: 'GOAT', cap: 70 },
  'individual-pro': { name: 'Pro', cap: 30 },
  'individual-pro-v1': { name: 'Pro', cap: 80 },
  'individual-provider': { name: 'Provider', cap: 15 },
  'individual-max': { name: 'Max', cap: 150 },
}

function clamp(n) {
  return Math.max(0, Math.min(100, n))
}

function parseF(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function md8(s) {
  // tiny stable 8-char hash (not crypto — cache keys + credential fingerprints)
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(36)
}

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

function parseOpenCodeWorkspaceId(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  const m = s.match(/workspace\/([^/#?]+)/)
  if (m) return m[1]
  const clean = s.split(/[?#]/)[0].replace(/\/+$/, '')
  const last = clean.split('/').pop()
  if (last === 'go') {
    const parts = clean.split('/').filter(Boolean)
    if (parts.length >= 2) return parts[parts.length - 2]
  }
  return last || s
}

function normalizeOpenCodeAuthCookie(secret) {
  const s = String(secret || '').trim()
  if (!s) return ''
  if (/^auth_session=/i.test(s)) return s
  if (s.includes(';') && /^[^=]+=/.test(s)) return s
  return `auth_session=${s}`
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

function parseClineLimits(limits) {
  const list = Array.isArray(limits) ? limits : []
  const find = (type) => list.find((l) => l && l.type === type)
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
  return {
    fiveHour: toWindow(find('five_hour')),
    weekly: toWindow(find('weekly')),
    monthly: toWindow(find('monthly')),
  }
}

function parseSiliconFlowInfo(raw) {
  if (!raw || typeof raw !== 'object') return null
  const d = raw.data || raw
  const cny = parseF(d.totalBalance ?? d.balance ?? d.chargeBalance)
  if (cny == null) return null
  const usd = Math.round((cny / CNY_PER_USD) * 100) / 100
  return {
    currency: '$',
    remaining: usd,
    cnyRemaining: cny,
    message: `SiliconCloud: ¥${cny.toFixed(2)} ($${usd.toFixed(2)})`,
  }
}

function parseRateLimitResetSeconds(str) {
  if (!str) return null
  const s = String(str).trim().toLowerCase()
  let totalMs = 0
  const hMatch = s.match(/(\d+(?:\.\d+)?)\s*h/)
  const mMatch = s.match(/(\d+(?:\.\d+)?)\s*m(?!s)/)
  const sMatch = s.match(/(\d+(?:\.\d+)?)\s*s/)
  const msMatch = s.match(/(\d+(?:\.\d+)?)\s*ms/)
  if (hMatch) totalMs += parseFloat(hMatch[1]) * 3600000
  if (mMatch) totalMs += parseFloat(mMatch[1]) * 60000
  if (sMatch) totalMs += parseFloat(sMatch[1]) * 1000
  if (msMatch) totalMs += parseFloat(msMatch[1])
  if (totalMs > 0) return Date.now() + totalMs
  const num = parseFloat(s)
  if (Number.isFinite(num)) {
    if (num > 1e11) return Math.round(num)
    if (num > 1e8) return Math.round(num * 1000)
    return Date.now() + Math.round(num * 1000)
  }
  const parsedDate = Date.parse(s)
  return Number.isFinite(parsedDate) ? parsedDate : null
}

function getHeader(headers, key) {
  if (!headers) return null
  if (typeof headers.get === 'function') {
    return headers.get(key) || headers.get(key.toLowerCase()) || null
  }
  return headers[key] || headers[key.toLowerCase()] || null
}

function parseGroqRateLimits(headers) {
  if (!headers) return []
  const wins = []
  const reqRem = parseF(getHeader(headers, 'x-ratelimit-remaining-requests'))
  const reqLim = parseF(getHeader(headers, 'x-ratelimit-limit-requests'))
  const reqReset = getHeader(headers, 'x-ratelimit-reset-requests')
  if (reqRem != null && reqLim != null && reqLim > 0) {
    const pct = clamp(Math.round((reqRem / reqLim) * 100))
    wins.push({
      id: 'groq-requests',
      label: 'Requests',
      remainingPercent: pct,
      resetsAt: parseRateLimitResetSeconds(reqReset),
    })
  }
  const tokRem = parseF(getHeader(headers, 'x-ratelimit-remaining-tokens'))
  const tokLim = parseF(getHeader(headers, 'x-ratelimit-limit-tokens'))
  const tokReset = getHeader(headers, 'x-ratelimit-reset-tokens')
  if (tokRem != null && tokLim != null && tokLim > 0) {
    const pct = clamp(Math.round((tokRem / tokLim) * 100))
    wins.push({
      id: 'groq-tokens',
      label: 'Tokens/min',
      remainingPercent: pct,
      resetsAt: parseRateLimitResetSeconds(tokReset),
    })
  }
  return wins
}

function parseAnthropicRateLimits(headers) {
  if (!headers) return []
  const wins = []
  const reqRem = parseF(getHeader(headers, 'anthropic-ratelimit-requests-remaining'))
  const reqLim = parseF(getHeader(headers, 'anthropic-ratelimit-requests-limit'))
  const reqReset = getHeader(headers, 'anthropic-ratelimit-requests-reset')
  if (reqRem != null && reqLim != null && reqLim > 0) {
    const pct = clamp(Math.round((reqRem / reqLim) * 100))
    wins.push({
      id: 'anthropic-requests',
      label: 'Requests',
      remainingPercent: pct,
      resetsAt: parseRateLimitResetSeconds(reqReset),
    })
  }
  const tokRem = parseF(getHeader(headers, 'anthropic-ratelimit-tokens-remaining'))
  const tokLim = parseF(getHeader(headers, 'anthropic-ratelimit-tokens-limit'))
  const tokReset = getHeader(headers, 'anthropic-ratelimit-tokens-reset')
  if (tokRem != null && tokLim != null && tokLim > 0) {
    const pct = clamp(Math.round((tokRem / tokLim) * 100))
    wins.push({
      id: 'anthropic-tokens',
      label: 'Tokens',
      remainingPercent: pct,
      resetsAt: parseRateLimitResetSeconds(tokReset),
    })
  }
  return wins
}

export {
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
  parseSiliconFlowInfo,
  parseRateLimitResetSeconds,
  parseGroqRateLimits,
  parseAnthropicRateLimits,
}
