import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { isTrustedSettingsRequest } from '../lib/http-utils.js'
import { apply } from '../lib/index.js'

test('isTrustedSettingsRequest: rejects cross-site Sec-Fetch-Site', () => {
  assert.equal(isTrustedSettingsRequest({ headers: { 'sec-fetch-site': 'cross-site' } }), false)
  assert.equal(isTrustedSettingsRequest({ headers: { 'sec-fetch-site': 'same-origin' } }), true)
  assert.equal(isTrustedSettingsRequest({ headers: { 'sec-fetch-site': 'same-site' } }), true)
  assert.equal(isTrustedSettingsRequest({ headers: { 'sec-fetch-site': 'none' } }), true)
})

test('isTrustedSettingsRequest: validates Origin and Host matching', () => {
  assert.equal(isTrustedSettingsRequest({
    headers: { host: '127.0.0.1:3080', origin: 'http://evil.com' }
  }), false)
  assert.equal(isTrustedSettingsRequest({
    headers: { host: '127.0.0.1:3080', origin: 'http://127.0.0.1:3080' }
  }), true)
  assert.equal(isTrustedSettingsRequest({
    headers: { 'x-forwarded-host': 'dsh.local:8080', origin: 'https://dsh.local:8080' }
  }), true)
  assert.equal(isTrustedSettingsRequest({
    headers: { host: '127.0.0.1:3080', origin: 'not-a-valid-url' }
  }), false)
})

test('isTrustedSettingsRequest: validates Referer fallback when Origin is absent', () => {
  assert.equal(isTrustedSettingsRequest({
    headers: { host: '127.0.0.1:3080', referer: 'http://evil.com/phishing' }
  }), false)
  assert.equal(isTrustedSettingsRequest({
    headers: { host: '127.0.0.1:3080', referer: 'http://127.0.0.1:3080/settings' }
  }), true)
  assert.equal(isTrustedSettingsRequest({
    headers: { host: '127.0.0.1:3080', referer: 'invalid-referer' }
  }), false)
})

test('isTrustedSettingsRequest: permits requests with empty headers or missing request', () => {
  assert.equal(isTrustedSettingsRequest({ headers: {} }), true)
  assert.equal(isTrustedSettingsRequest(null), true)
  assert.equal(isTrustedSettingsRequest({}), true)
})

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    writeHead(code, h) {
      this.statusCode = code
      this.headers = h
    },
    end(data) {
      this.body = data || ''
    }
  }
}

function createMockRequest({ method, url = '/dsh-key-limits/subs', headers = {}, body = null }) {
  const stream = body ? Readable.from([Buffer.from(JSON.stringify(body))]) : Readable.from([])
  stream.method = method
  stream.url = url
  stream.headers = headers
  return stream
}

test('POST /subs: rejects cross-site request with 403 and never invokes credentials.set (#60)', async () => {
  const registeredRoutes = new Map()
  const credentialsSaved = []
  const cleanups = []

  const mockCtx = {
    webServer: {
      register: (spec) => {
        registeredRoutes.set(spec.path, spec.handler)
        return () => registeredRoutes.delete(spec.path)
      }
    },
    credentials: {
      set: async (ref, secret) => {
        credentialsSaved.push({ ref, secret })
      },
      get: async () => null,
    },
    sessions: {
      getSnapshot: () => ({ currentSessionId: 'sess-1' }),
    },
    settings: {
      register: () => ({
        get: () => ({}),
        watch: () => () => {},
      }),
    },
    get: (key) => {
      if (key === 'credentials') return mockCtx.credentials
      if (key === 'sessions') return mockCtx.sessions
      if (key === 'settings') return mockCtx.settings
      if (key === 'webServer') return mockCtx.webServer
      return null
    },
    inject: (deps, fn) => fn(mockCtx),
    on: () => () => {},
    effect: (fn) => {
      const cleanup = fn()
      if (typeof cleanup === 'function') cleanups.push(cleanup)
      return cleanup
    },
    logger: () => ({ warn: () => {}, error: () => {}, info: () => {}, debug: () => {} }),
  }

  apply(mockCtx, {
    storageDir: '/tmp/test-dsh-key-limits-' + Date.now(),
    refreshHours: 24,
    ui: {}
  })

  try {
    const handler = registeredRoutes.get('/dsh-key-limits/subs')
    assert.ok(handler, '/dsh-key-limits/subs handler must be registered')

    // 1. Cross-site POST with secret
    const crossSiteReq = createMockRequest({
      method: 'POST',
      headers: {
        'sec-fetch-site': 'cross-site',
        host: '127.0.0.1:3080',
        origin: 'http://malicious.org'
      },
      body: {
        provider: 'deepseek',
        secret: 'stolen-secret-key-12345',
        label: 'Hacked Sub'
      }
    })
    const crossSiteRes = createMockResponse()
    await handler(crossSiteReq, crossSiteRes)

    assert.equal(crossSiteRes.statusCode, 403, 'Cross-site POST must return 403 Forbidden')
    assert.equal(credentialsSaved.length, 0, 'credentials.set must NEVER be called on cross-site request')
    const crossSitePayload = JSON.parse(crossSiteRes.body)
    assert.ok(crossSitePayload.error.includes('forbidden'), 'Error payload must indicate forbidden request')

    // 2. Cross-site DELETE
    const deleteReq = createMockRequest({
      method: 'DELETE',
      url: '/dsh-key-limits/subs?id=deepseek-1',
      headers: {
        'sec-fetch-site': 'cross-site'
      }
    })
    const deleteRes = createMockResponse()
    await handler(deleteReq, deleteRes)

    assert.equal(deleteRes.statusCode, 403, 'Cross-site DELETE must return 403 Forbidden')

    // 3. Cross-site GET
    const getReq = createMockRequest({
      method: 'GET',
      headers: {
        'sec-fetch-site': 'cross-site'
      }
    })
    const getRes = createMockResponse()
    await handler(getReq, getRes)

    assert.equal(getRes.statusCode, 403, 'Cross-site GET must return 403 Forbidden')

    // 4. Same-origin POST with secret succeeds and calls credentials.set
    const sameOriginReq = createMockRequest({
      method: 'POST',
      headers: {
        'sec-fetch-site': 'same-origin',
        host: '127.0.0.1:3080',
        origin: 'http://127.0.0.1:3080'
      },
      body: {
        provider: 'deepseek',
        secret: 'legitimate-secret-key',
        label: 'Valid Sub'
      }
    })
    const sameOriginRes = createMockResponse()
    await handler(sameOriginReq, sameOriginRes)

    assert.equal(sameOriginRes.statusCode, 200, 'Same-origin POST must succeed with 200 OK')
    assert.equal(credentialsSaved.length, 1, 'credentials.set must be called for valid same-origin request')
    assert.equal(credentialsSaved[0].secret, 'legitimate-secret-key')
  } finally {
    for (const c of cleanups) {
      try { c() } catch {}
    }
  }
})
