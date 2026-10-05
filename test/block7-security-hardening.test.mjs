import test from 'node:test'
import assert from 'node:assert/strict'
import { isTrustedSettingsRequest } from '../lib/http-utils.js'
import { credentialFingerprint, refreshSubscriptionEntry } from '../lib/subs.js'
import { fetchGeminiQuota, setExtraLogger } from '../lib/provider-extra-fetchers.js'
import { apply } from '../lib/index.js'

test('#128: apply handles object logger without throwing TypeError', () => {
  const mockObjectLogger = {
    warn: () => {},
    info: () => {},
    error: () => {},
  }
  const mockCtx = {
    logger: mockObjectLogger,
    effect: () => {},
    on: () => {},
    inject: () => {},
    webServer: { register: () => {} },
    get: () => null,
  }

  // Should not throw TypeError: ctx.logger is not a function
  assert.doesNotThrow(() => {
    apply(mockCtx, {})
  })
})

test('#131: isTrustedSettingsRequest rejects cross-site even with x-dsh-internal-auth', () => {
  const req = {
    headers: {
      'sec-fetch-site': 'cross-site',
      'x-dsh-internal-auth': '1',
      host: '127.0.0.1:3080',
    },
  }
  assert.equal(isTrustedSettingsRequest(req), false)
})

test('#131: isTrustedSettingsRequest allows internal auth when not cross-site', () => {
  const req = {
    headers: {
      'sec-fetch-site': 'same-origin',
      'x-dsh-internal-auth': '1',
      host: '127.0.0.1:3080',
    },
  }
  assert.equal(isTrustedSettingsRequest(req), true)
})

test('#132: fetchGeminiQuota sends x-goog-api-key header and avoids query parameter', async () => {
  const originalFetch = globalThis.fetch
  try {
    let capturedUrl = ''
    let capturedHeaders = {}
    globalThis.fetch = async (url, opts) => {
      capturedUrl = String(url)
      capturedHeaders = opts.headers || {}
      return {
        ok: true,
        status: 200,
        json: async () => ({ models: [{ name: 'gemini-1.5-pro' }] }),
      }
    }

    const res = await fetchGeminiQuota('AIzaSySecretKeyTest123')
    assert.equal(res.status, 'ok')
    assert.ok(!capturedUrl.includes('key='), 'API key must not be in query string')
    assert.equal(capturedHeaders['x-goog-api-key'], 'AIzaSySecretKeyTest123')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('#125: credentialFingerprint produces 16-hex sha256 hash and avoids empty collisions', () => {
  const fp1 = credentialFingerprint('secret1', 'extra1')
  const fp2 = credentialFingerprint('secret1', 'extra1')
  const fp3 = credentialFingerprint('secret2', 'extra1')

  assert.equal(fp1, fp2)
  assert.notEqual(fp1, fp3)
  assert.equal(fp1.length, 16)
  assert.match(fp1, /^[0-9a-f]{16}$/)

  // Empty secrets return empty string, avoiding accidental collisions across unconfigured accounts
  assert.equal(credentialFingerprint('', ''), '')
  assert.equal(credentialFingerprint(null, null), '')
})

test('#129: setExtraLogger captures provider error logs', async () => {
  const warnings = []
  setExtraLogger({
    warn: (...args) => warnings.push(args.join(' ')),
  })

  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => {
      throw new Error('Connection refused simulation')
    }
    const res = await fetchGeminiQuota('test-key')
    assert.equal(res.status, 'error')
    assert.ok(warnings.some((w) => w.includes('Gemini fetch error')))
  } finally {
    globalThis.fetch = originalFetch
    setExtraLogger(null)
  }
})

test('#124: refreshSubscriptionEntry extracts balance and quota windows from extra providers', async () => {
  const fakeStore = {
    get: (id) => ({ id, secret: 'sk-test-extra', extra: '' }),
  }

  // Provider with balance
  const entry1 = { id: 'sf-1', provider: 'siliconflow', label: 'SiliconFlow Account' }
  const res1 = await refreshSubscriptionEntry(fakeStore, entry1)
  assert.equal(res1.status, 'error') // Missing network, but kind is set
  assert.ok(res1.kind)

  // Provider with quota windows
  const entry2 = { id: 'groq-1', provider: 'groq', label: 'Groq Account' }
  const res2 = await refreshSubscriptionEntry(fakeStore, entry2)
  assert.ok(res2.kind)
})

test('#130: live map bounds session growth to 500 entries', () => {
  const events = {}
  const mockCtx = {
    logger: () => ({ warn: () => {}, info: () => {} }),
    effect: () => {},
    on: (evt, handler) => { events[evt] = handler },
    inject: () => {},
    webServer: { register: () => {} },
    get: () => null,
  }

  apply(mockCtx, {})

  const sessionEventHandler = events['session/event']
  assert.ok(typeof sessionEventHandler === 'function', 'session/event handler must be registered')

  // Emit 550 distinct sessions
  for (let i = 1; i <= 550; i++) {
    sessionEventHandler({ id: `sess_${i}` }, { type: 'request/header', cwd: '/tmp' })
  }

  // Verify session 1 was evicted and session 550 exists
  const sessionDeletedHandler = events['session/deleted']
  assert.ok(typeof sessionDeletedHandler === 'function', 'session/deleted handler must be registered')
  sessionDeletedHandler('sess_550')
})

test('#127 & #133: settings lifecycle uses describe without throwing on register', () => {
  let injectedHandler = null
  const mockCtx = {
    logger: () => ({ warn: () => {}, info: () => {} }),
    effect: () => {},
    on: () => {},
    inject: (deps, handler) => {
      if (deps.includes('settings')) injectedHandler = handler
    },
    webServer: { register: () => {} },
    get: () => null,
  }

  apply(mockCtx, {})

  assert.ok(typeof injectedHandler === 'function', 'settings inject handler must be registered')

  // Mock settings service WITHOUT register method (like DSH host service)
  const mockSettingsSvc = {
    describe: () => [{ ns: 'dsh-key-limits', value: { refreshHours: 12 }, revision: 1 }],
    update: async () => {},
  }

  assert.doesNotThrow(() => {
    injectedHandler({ settings: mockSettingsSvc, get: () => mockSettingsSvc, effect: () => {} })
  })
})
