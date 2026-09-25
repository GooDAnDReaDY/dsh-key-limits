import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clamp,
  md8,
  makeError,
  parseOpenCodeWorkspaceId,
  fetchWithTimeout,
  fetchCommandCodeQuota,
  fetchDeepSeekBalance,
  fetchOpenRouterBalance,
  fetchKimiQuota,
  fetchGlmQuota,
  fetchMinimaxQuota,
  fetchClineQuota,
  fetchOllamaQuota,
  fetchQwenQuota,
  fetchOpenCodeGoQuota,
  clearSubCache,
  setProviderLogger,
} from '../lib/provider-fetchers.js'

test('parseOpenCodeWorkspaceId parses diverse workspace URLs and bare IDs', () => {
  assert.equal(parseOpenCodeWorkspaceId('https://opencode.ai/workspace/wrk_01ABC/go'), 'wrk_01ABC')
  assert.equal(parseOpenCodeWorkspaceId('https://opencode.ai/workspace/wrk_xyz123'), 'wrk_xyz123')
  assert.equal(parseOpenCodeWorkspaceId('wrk_direct_id'), 'wrk_direct_id')
  assert.equal(parseOpenCodeWorkspaceId('wrk_direct_id/go'), 'wrk_direct_id')
  assert.equal(parseOpenCodeWorkspaceId('https://custom.host/workspace/w_custom/go#frag'), 'w_custom')
  assert.equal(parseOpenCodeWorkspaceId(''), '')
  assert.equal(parseOpenCodeWorkspaceId(null), '')
})

test('clamp confines numbers strictly within 0 and 100', () => {
  assert.equal(clamp(-10), 0)
  assert.equal(clamp(0), 0)
  assert.equal(clamp(55.5), 55.5)
  assert.equal(clamp(100), 100)
  assert.equal(clamp(105), 100)
})

test('md8 produces deterministic stable hashes', () => {
  const h1 = md8('secret_token_123|workspace_456')
  const h2 = md8('secret_token_123|workspace_456')
  const h3 = md8('different_secret|workspace_456')
  assert.equal(h1, h2)
  assert.notEqual(h1, h3)
  assert.ok(h1.length > 0 && h1.length <= 8)
})

test('makeError formats error payload with timestamp', () => {
  const err = makeError('Connection timed out')
  assert.equal(err.status, 'error')
  assert.equal(err.message, 'Connection timed out')
  assert.ok(typeof err.checkedAt === 'number' && err.checkedAt > 0)
})

test('fetchDeepSeekBalance parses USD and CNY account balances', async () => {
  clearSubCache()
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        is_available: true,
        balance_infos: [
          { currency: 'USD', total_balance: '25.40', granted_balance: '5.00', topped_up_balance: '20.40' }
        ]
      })
    })
    const res = await fetchDeepSeekBalance('sk-mock-key')
    assert.equal(res.status, 'ok')
    assert.equal(res.currency, String.fromCharCode(36))
    assert.equal(res.remaining, 25.40)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchOpenRouterBalance parses credits and usage limits', async () => {
  clearSubCache()
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async (url) => {
      if (String(url).includes('/credits')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { total_credits: 50.0, total_usage: 12.5 }
          })
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: { usage_weekly: 5.0, usage_monthly: 10.0 }
        })
      }
    }
    const res = await fetchOpenRouterBalance('sk-or-mock')
    assert.equal(res.status, 'ok')
    assert.equal(res.remaining, 37.5)
    assert.equal(res.limit, 50.0)
    assert.equal(res.currency, String.fromCharCode(36))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchKimiQuota parses weekly limits and remaining quota', async () => {
  clearSubCache()
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        usage: {
          limit: 1000,
          used: 250,
          remaining: 750,
          resetTime: '2026-09-20T00:00:00Z'
        }
      })
    })
    const res = await fetchKimiQuota('mock-kimi-key')
    assert.equal(res.status, 'ok')
    assert.ok(res.secondaryWindow)
    assert.equal(res.secondaryWindow.usedPercent, 25)
    assert.equal(res.secondaryWindow.remainingPercent, 75)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchGlmQuota parses coding plan quota and reset date', async () => {
  clearSubCache()
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        code: 200,
        data: {
        limits: [
          { type: 'TOKENS_LIMIT', unit: 3, percentage: 40, nextResetTime: Date.now() + 3600000 }
        ]
      }
    })
  })
    const res = await fetchGlmQuota('mock-glm-key')
    assert.equal(res.status, 'ok')
    assert.ok(res.primaryWindow)
    assert.equal(res.primaryWindow.usedPercent, 40)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchMinimaxQuota handles invalid responses cleanly', async () => {
  clearSubCache()
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid API key'
    })
    const res = await fetchMinimaxQuota('invalid-key')
    assert.equal(res.status, 'error')
    assert.ok(res.message.includes('401'))
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchClineQuota parses rolling windows', async () => {
  clearSubCache()
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          limits: [
            { type: 'five_hour', percentUsed: 30, resetsAt: '2026-09-20T10:00:00Z' },
            { type: 'weekly', percentUsed: 40, resetsAt: '2026-09-25T10:00:00Z' }
          ]
        }
      })
    })
    const res = await fetchClineQuota('cline-bearer-token')
    assert.equal(res.status, 'ok')
    assert.ok(res.primaryWindow)
    assert.equal(res.primaryWindow.usedPercent, 30)
    assert.equal(res.secondaryWindow.usedPercent, 40)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchOllamaQuota requires both apiKey and sessionCookie', async () => {
  clearSubCache()
  const res1 = await fetchOllamaQuota('', 'cookie')
  assert.equal(res1.status, 'error')
  const res2 = await fetchOllamaQuota('key', '')
  assert.equal(res2.status, 'error')
})

test('fetchOpenCodeGoQuota parses HTML hydration metrics', async () => {
  clearSubCache()
  const originalFetch = globalThis.fetch
  try {
    const mockHtml = '<html><body><script>$R[0]={usagePercent:42.5,resetInSec:3600};$R[1]={usagePercent:68.0,resetInSec:86400};$R[2]={usagePercent:15.0,resetInSec:604800};</script></body></html>'
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      text: async () => mockHtml
    })
    const res = await fetchOpenCodeGoQuota('auth=secretcookie', 'wrk_test123')
    assert.equal(res.status, 'ok')
    assert.equal(res.primaryWindow.usedPercent, 42.5)
    assert.equal(res.secondaryWindow.usedPercent, 68.0)
    assert.equal(res.tertiaryWindow.usedPercent, 15.0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchCommandCodeQuota parses 5h, weekly, and monthly windows correctly', async () => {
  clearSubCache()
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async (url) => {
      if (String(url).includes('/credits')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            windowLimits: {
              fiveHour: { used: 18.5, cap: 100, resetAt: Date.now() + 3200000 },
              weekly: { used: 45.0, cap: 100, resetAt: Date.now() + 180000000 }
            },
            credits: { monthlyCredits: 27.51 }
          })
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { planId: 'goat' } })
      }
    }
    const res = await fetchCommandCodeQuota('user_valid_key')
    assert.equal(res.status, 'ok')
    assert.ok(res.plan.includes('GOAT'))
    assert.equal(res.primaryWindow.usedPercent, 18.5)
    assert.equal(res.secondaryWindow.usedPercent, 45.0)
    assert.equal(res.tertiaryWindow.usedPercent, 60.7)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('setProviderLogger captures provider error and prevents leaking secrets (#50)', async () => {
  const logs = []
  const mockLogger = {
    warn: (msg) => logs.push(msg),
  }
  setProviderLogger(mockLogger)
  try {
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () => {
      throw new Error('connection reset by peer')
    }
    try {
      const secret = 'sk-super-secret-key-12345'
      const res = await fetchDeepSeekBalance(secret)
      assert.equal(res.status, 'error')
      assert.ok(logs.length > 0, 'Logger should have captured warning')
      for (const log of logs) {
        assert.ok(!log.includes(secret), 'Log must NEVER contain the secret key')
        assert.ok(log.includes('[dsh-key-limits]'), 'Log should have plugin namespace prefix')
      }
    } finally {
      globalThis.fetch = originalFetch
    }
  } finally {
    setProviderLogger(null)
  }
})

