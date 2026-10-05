// lib/provider-extra-fetchers.js — Extended provider fetchers (SiliconFlow, Anthropic, Groq, Gemini)
import { fetchWithTimeout, makeError } from './provider-fetchers.js'
import {
  parseSiliconFlowInfo,
  parseGroqRateLimits,
  parseAnthropicRateLimits,
} from './provider-parsers.js'

let extraLogger = null
export function setExtraLogger(logger) {
  extraLogger = logger
}

export async function fetchSiliconFlowBalance(secret) {
  const token = String(secret || '').trim()
  if (!token) return makeError('SiliconFlow requires an API key')
  try {
    const res = await fetchWithTimeout('https://api.siliconflow.cn/v1/user/info', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return makeError(`SiliconFlow HTTP ${res.status}: ${errText.slice(0, 100)}`)
    }
    const data = await res.json()
    const bal = parseSiliconFlowInfo(data)
    if (!bal) return makeError('Invalid SiliconFlow response structure')
    return {
      status: 'ok',
      balance: bal,
    }
  } catch (err) {
    extraLogger?.warn?.('[dsh-key-limits] SiliconFlow fetch error:', err.message)
    return makeError(err.message || String(err))
  }
}

export async function fetchGroqQuota(secret) {
  const token = String(secret || '').trim()
  if (!token) return makeError('Groq requires an API key')
  try {
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return makeError(`Groq HTTP ${res.status}: ${errText.slice(0, 100)}`)
    }
    const windows = parseGroqRateLimits(res.headers)
    return {
      status: 'ok',
      quota: {
        windows,
        fetchedAt: Date.now(),
      },
    }
  } catch (err) {
    extraLogger?.warn?.('[dsh-key-limits] Groq fetch error:', err.message)
    return makeError(err.message || String(err))
  }
}

export async function fetchAnthropicQuota(secret) {
  const token = String(secret || '').trim()
  if (!token) return makeError('Anthropic requires an API key')
  try {
    const res = await fetchWithTimeout('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': token,
        'anthropic-version': '2023-06-01',
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return makeError(`Anthropic HTTP ${res.status}: ${errText.slice(0, 100)}`)
    }
    const windows = parseAnthropicRateLimits(res.headers)
    return {
      status: 'ok',
      quota: {
        windows,
        fetchedAt: Date.now(),
      },
    }
  } catch (err) {
    extraLogger?.warn?.('[dsh-key-limits] Anthropic fetch error:', err.message)
    return makeError(err.message || String(err))
  }
}

export async function fetchGeminiQuota(secret) {
  const token = String(secret || '').trim()
  if (!token) return makeError('Gemini requires an API key')
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models'
    const res = await fetchWithTimeout(url, {
      headers: {
        Accept: 'application/json',
        'x-goog-api-key': token,
      },
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return makeError(`Gemini HTTP ${res.status}: ${errText.slice(0, 100)}`)
    }
    const data = await res.json()
    const count = Array.isArray(data.models) ? data.models.length : 0
    return {
      status: 'ok',
      plan: count ? `${count} models active` : 'Active',
      quota: {
        windows: [{ id: 'gemini-active', label: 'API Status', remainingPercent: 100, resetsAt: null }],
        fetchedAt: Date.now(),
      },
    }
  } catch (err) {
    extraLogger?.warn?.('[dsh-key-limits] Gemini fetch error:', err.message)
    return makeError(err.message || String(err))
  }
}
