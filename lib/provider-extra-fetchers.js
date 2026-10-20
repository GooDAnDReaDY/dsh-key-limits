// lib/provider-extra-fetchers.js — Extended provider fetchers (SiliconFlow, Anthropic, Groq, Gemini)
import { fetchWithTimeout, makeError } from './provider-fetchers.js'
import {
  parseSiliconFlowInfo,
  parseGroqRateLimits,
  parseAnthropicRateLimits,
  parseMistralRateLimits,
  parseCerebrasRateLimits,
  parseTogetherBalance,
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
        windows: [],
        fetchedAt: Date.now(),
      },
    }
  } catch (err) {
    extraLogger?.warn?.('[dsh-key-limits] Gemini fetch error:', err.message)
    return makeError(err.message || String(err))
  }
}


export async function fetchXaiQuota(secret) {
  const token = String(secret || '').trim()
  if (!token) return makeError('xAI requires an API key')
  try {
    const res = await fetchWithTimeout('https://api.x.ai/v1/api-key', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return makeError(`xAI HTTP ${res.status}: ${errText.slice(0, 100)}`)
    }
    const data = await res.json()
    const name = data.name || 'xAI'
    return {
      status: 'ok',
      plan: name,
      quota: {
        windows: [],
        fetchedAt: Date.now(),
      },
    }
  } catch (err) {
    extraLogger?.warn?.('[dsh-key-limits] xAI fetch error:', err.message)
    return makeError(err.message || String(err))
  }
}

export async function fetchMistralQuota(secret) {
  const token = String(secret || '').trim()
  if (!token) return makeError('Mistral requires an API key')
  try {
    const res = await fetchWithTimeout('https://api.mistral.ai/v1/models', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return makeError(`Mistral HTTP ${res.status}: ${errText.slice(0, 100)}`)
    }
    const windows = parseMistralRateLimits(res.headers)
    return {
      status: 'ok',
      quota: {
        windows,
        fetchedAt: Date.now(),
      },
    }
  } catch (err) {
    extraLogger?.warn?.('[dsh-key-limits] Mistral fetch error:', err.message)
    return makeError(err.message || String(err))
  }
}

export async function fetchCerebrasQuota(secret) {
  const token = String(secret || '').trim()
  if (!token) return makeError('Cerebras requires an API key')
  try {
    const res = await fetchWithTimeout('https://api.cerebras.ai/v1/models', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return makeError(`Cerebras HTTP ${res.status}: ${errText.slice(0, 100)}`)
    }
    const windows = parseCerebrasRateLimits(res.headers)
    return {
      status: 'ok',
      quota: {
        windows,
        fetchedAt: Date.now(),
      },
    }
  } catch (err) {
    extraLogger?.warn?.('[dsh-key-limits] Cerebras fetch error:', err.message)
    return makeError(err.message || String(err))
  }
}

export async function fetchTogetherBalance(secret) {
  const token = String(secret || '').trim()
  if (!token) return makeError('Together AI requires an API key')
  try {
    // Check models endpoint or user profile
    const res = await fetchWithTimeout('https://api.together.xyz/v1/models', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return makeError(`Together HTTP ${res.status}: ${errText.slice(0, 100)}`)
    }
    const data = await res.json()
    const bal = parseTogetherBalance(data)
    const count = Array.isArray(data) ? data.length : (Array.isArray(data.data) ? data.data.length : 0)
    return {
      status: 'ok',
      plan: count ? `${count} models active` : 'Active',
      balance: bal || undefined,
      quota: {
        windows: [],
        fetchedAt: Date.now(),
      },
    }
  } catch (err) {
    extraLogger?.warn?.('[dsh-key-limits] Together fetch error:', err.message)
    return makeError(err.message || String(err))
  }
}

export async function fetchCustomBaseUrlQuota(secret, extra) {
  const baseUrl = String(extra || '').trim().replace(/\/+$/, '')
  if (!baseUrl) return makeError('Custom provider requires Base URL in extra field')
  try {
    const url = `${baseUrl}/models`
    const headers = { Accept: 'application/json' }
    if (secret) {
      headers.Authorization = `Bearer ${String(secret).trim()}`
    }
    const res = await fetchWithTimeout(url, { headers })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return makeError(`Custom BaseURL HTTP ${res.status}: ${errText.slice(0, 100)}`)
    }
    const data = await res.json()
    const count = Array.isArray(data) ? data.length : (Array.isArray(data.data) ? data.data.length : 0)
    return {
      status: 'ok',
      plan: count ? `Custom (${count} models)` : 'Custom Active',
      quota: {
        windows: [],
        fetchedAt: Date.now(),
      },
    }
  } catch (err) {
    extraLogger?.warn?.('[dsh-key-limits] Custom BaseURL fetch error:', err.message)
    return makeError(err.message || String(err))
  }
}
