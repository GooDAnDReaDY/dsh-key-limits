import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { isTrustedSettingsRequest } from '../lib/http-utils.js'
import { apply } from '../lib/index.js'

test('isTrustedSettingsRequest: rejects cross-site Sec-Fetch-Site', () => {
  assert.equal(isTrustedSettingsRequest({ headers: { host: '127.0.0.1:3080', 'sec-fetch-site': 'cross-site' } }), false)
  assert.equal(isTrustedSettingsRequest({ headers: { host: '127.0.0.1:3080', 'sec-fetch-site': 'same-origin' } }), true)
  assert.equal(isTrustedSettingsRequest({ headers: { host: '127.0.0.1:3080', 'sec-fetch-site': 'same-site' } }), true)
  assert.equal(isTrustedSettingsRequest({ headers: { host: '127.0.0.1:3080', 'sec-fetch-site': 'none' } }), true)
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

test('isTrustedSettingsRequest: strictly fails closed on missing headers or request (#60)', () => {
  assert.equal(isTrustedSettingsRequest({ headers: {} }), false, 'Empty headers must be rejected')
  assert.equal(isTrustedSettingsRequest(null), false, 'Null request must be rejected')
  assert.equal(isTrustedSettingsRequest({}), false, 'Empty request object must be rejected')
  assert.equal(isTrustedSettingsRequest({ headers: { host: '127.0.0.1:3080' } }), false, 'Missing source headers must be rejected')
})

test('isTrustedSettingsRequest: allows explicit internal auth bypass', () => {
  assert.equal(isTrustedSettingsRequest({ headers: { 'x-dsh-internal-auth': 'true' } }), true)
  assert.equal(isTrustedSettingsRequest({ headers: { 'x-dsh-internal-auth': '1' } }), true)
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

function createMockRequest({ method, url = '/dsh-key-limits/subs', headers = {}, body = null, rawChunks = null }) {
  let stream
  if (rawChunks) {
    stream = Readable.from(rawChunks)
  } else if (body) {
    stream = Readable.from([Buffer.from(JSON.stringify(body))])
  } else {
    stream = Readable.from([])
  }
  stream.method = method
  stream.url = url
  stream.headers = headers
  return stream
}

test('HTTP routes: security hardening (#12, #60, #64, #65)', async () => {
  const registeredRoutes = new Map()
  const credentialsSaved = []
  const cleanups = []
  const testStorageDir = '/tmp/test-dsh-key-limits-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)

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
      resolve: async (ref) => ({ value: 'mocked-secret' }),
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
    storageDir: testStorageDir,
    refreshHours: 24,
    ui: {}
  })

  try {
    const subsHandler = registeredRoutes.get('/dsh-key-limits/subs')
    const healthHandler = registeredRoutes.get('/dsh-key-limits/health')
    assert.ok(subsHandler, '/dsh-key-limits/subs handler must be registered')
    assert.ok(healthHandler, '/dsh-key-limits/health handler must be registered')

    // 1. #65: GET /health must NOT expose storageDir or internal file paths
    const healthReq = createMockRequest({ method: 'GET', url: '/dsh-key-limits/health' })
    const healthRes = createMockResponse()
    await healthHandler(healthReq, healthRes)
    assert.equal(healthRes.statusCode, 200)
    const healthData = JSON.parse(healthRes.body)
    assert.equal(healthData.ok, true)
    assert.equal(healthData.status, 'healthy')
    assert.equal(healthData.storageDir, undefined, '#65: storageDir must NOT be exposed in health response')

    // 2. #60: Fail-closed denial when source headers are missing
    const missingHeadersReq = createMockRequest({
      method: 'POST',
      headers: {},
      body: { provider: 'deepseek', secret: 'hacked-key' }
    })
    const missingHeadersRes = createMockResponse()
    await subsHandler(missingHeadersReq, missingHeadersRes)
    assert.equal(missingHeadersRes.statusCode, 403, '#60: Requests with empty headers must be rejected with 403')
    assert.equal(credentialsSaved.length, 0, 'credentials.set must NOT be called on denied request')

    // 3. #60: Explicit cross-site rejection
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
    await subsHandler(crossSiteReq, crossSiteRes)
    assert.equal(crossSiteRes.statusCode, 403, '#60: Cross-site POST must return 403 Forbidden')
    assert.equal(credentialsSaved.length, 0)

    // 4. #64: Bounded body reader rejects oversized body with 413
    const oversizedChunk = Buffer.alloc(70 * 1024, 'x')
    const oversizedReq = createMockRequest({
      method: 'POST',
      headers: {
        host: '127.0.0.1:3080',
        'sec-fetch-site': 'same-origin',
        origin: 'http://127.0.0.1:3080'
      },
      rawChunks: [oversizedChunk]
    })
    const oversizedRes = createMockResponse()
    await subsHandler(oversizedReq, oversizedRes)
    assert.equal(oversizedRes.statusCode, 413, '#64: Oversized body must return 413 Payload Too Large')
    assert.equal(credentialsSaved.length, 0, '#64: credentials.set must NOT be called when body exceeds limit')

    // 5. Same-origin valid POST succeeds, calls credentials.set (#60)
    const validReq = createMockRequest({
      method: 'POST',
      headers: {
        host: '127.0.0.1:3080',
        'sec-fetch-site': 'same-origin',
        origin: 'http://127.0.0.1:3080'
      },
      body: {
        provider: 'deepseek',
        secret: 'my-super-secret-key-999',
        label: 'My Production Key'
      }
    })
    const validRes = createMockResponse()
    await subsHandler(validReq, validRes)
    assert.equal(validRes.statusCode, 200, 'Valid same-origin POST must succeed with 200 OK')
    assert.equal(credentialsSaved.length, 1)
    assert.equal(credentialsSaved[0].secret, 'my-super-secret-key-999')

    // 6. #12: Verify that subs.json on disk contains NO plaintext secret
    const subsJsonPath = join(testStorageDir, 'subs.json')
    const subsJsonContent = JSON.parse(readFileSync(subsJsonPath, 'utf8'))
    assert.ok(subsJsonContent.credentials, 'subs.json must contain credentials block')
    for (const [subId, entry] of Object.entries(subsJsonContent.credentials)) {
      assert.equal(entry.secret, '', '#12: subs.json must NEVER store plaintext secret')
      assert.ok(entry.credentialRef, '#12: entry must have credentialRef')
    }
  } finally {
    for (const c of cleanups) {
      try { c() } catch {}
    }
    try { rmSync(testStorageDir, { recursive: true, force: true }) } catch {}
  }
})
