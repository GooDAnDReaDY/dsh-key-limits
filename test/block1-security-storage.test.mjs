import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { rmSync, mkdtempSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Readable } from 'node:stream'

import { CredentialStore, isExtraSecret, refreshSubscriptionEntry } from '../lib/subs.js'
import { fetchWithTimeout } from '../lib/provider-fetchers.js'
import { loadSubs } from '../lib/cards.js'
import { apply } from '../lib/index.js'
import { decryptBackup } from '../lib/crypto-backup.js'

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

// ---------------------------------------------------------------------------
// #98: Cross-origin redirect blocking in fetchWithTimeout
// ---------------------------------------------------------------------------
test('#98: fetchWithTimeout defaults redirect to error, blocking cross-origin redirects', async () => {
  let redirectRequested = false
  const server = createServer((req, res) => {
    if (req.url === '/redirect') {
      res.writeHead(302, { Location: '/target' })
      res.end()
    } else if (req.url === '/target') {
      redirectRequested = true
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('leaked')
    }
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  const url = `http://127.0.0.1:${port}/redirect`

  try {
    // Default fetchWithTimeout must fail on redirect (redirect: 'error')
    await assert.rejects(
      async () => {
        await fetchWithTimeout(url)
      },
      (err) => {
        // Node fetch throws TypeError when redirect mode is 'error' and redirect encountered
        return err instanceof TypeError || String(err).toLowerCase().includes('redirect')
      },
      'fetchWithTimeout must throw on redirect to prevent leaking sensitive auth headers'
    )
    assert.equal(redirectRequested, false, 'Redirect destination must not have been requested')
  } finally {
    server.close()
  }
})

// ---------------------------------------------------------------------------
// #96: Ollama session cookie (secret extra) stored in credentials service, not plaintext in subs.json with 0600 mode
// ---------------------------------------------------------------------------
test('#96: Ollama session cookie extra secret is stored in credentials service and omitted from subs.json (0600 mode)', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dsh-key-limits-96-'))
  const registeredRoutes = new Map()
  const credentialsMap = new Map()
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
        credentialsMap.set(ref.name || ref, secret)
      },
      resolve: async (ref) => {
        const val = credentialsMap.get(ref.name || ref)
        return val ? { value: val } : null
      }
    },
    sessions: { getSnapshot: () => ({ currentSessionId: 's1' }) },
    settings: { register: () => ({ get: () => ({}), watch: () => () => {} }) },
    get: (key) => mockCtx[key] || null,
    inject: (deps, fn) => fn(mockCtx),
    on: () => () => {},
    effect: (fn) => {
      const cleanup = fn()
      if (typeof cleanup === 'function') cleanups.push(cleanup)
      return cleanup
    },
    logger: () => ({ warn: () => {}, error: () => {}, info: () => {}, debug: () => {} }),
  }

  try {
    assert.equal(isExtraSecret('ollama'), true, 'ollama extra field must be recognized as secret')
    assert.equal(isExtraSecret('opencode-go'), false, 'opencode-go extra (workspace) is not secret')

    apply(mockCtx, { storageDir: tempDir, refreshHours: 24, ui: {} })
    const subsHandler = registeredRoutes.get('/dsh-key-limits/subs')
    assert.ok(subsHandler, '/dsh-key-limits/subs must be registered')

    // Add an ollama subscription with secret and extra cookie
    const addReq = createMockRequest({
      method: 'POST',
      headers: { host: '127.0.0.1:3080', 'sec-fetch-site': 'same-origin', origin: 'http://127.0.0.1:3080' },
      body: {
        id: 'ollama-test-1',
        provider: 'ollama',
        secret: 'ollama-secret-api-key',
        extra: '__Secure-session=secret-session-cookie-val',
        label: 'My Ollama'
      }
    })
    const addRes = createMockResponse()
    await subsHandler(addReq, addRes)
    assert.equal(addRes.statusCode, 200)

    // Check credentials service: both secret and extra must be stored
    assert.equal(credentialsMap.get('DSH_KEY_LIMITS_OLLAMA_TEST_1'), 'ollama-secret-api-key')
    assert.equal(credentialsMap.get('DSH_KEY_LIMITS_OLLAMA_TEST_1_EXTRA'), '__Secure-session=secret-session-cookie-val')

    // Check subs.json on disk: secret and extra MUST be empty, mode must be 0600
    const subsJsonPath = join(tempDir, 'subs.json')
    const fileContent = JSON.parse(readFileSync(subsJsonPath, 'utf8'))
    const credEntry = fileContent.credentials['ollama-test-1']
    assert.ok(credEntry, 'ollama entry must exist in subs.json')
    assert.equal(credEntry.secret, '', 'secret must NOT be written to disk in plaintext')
    assert.equal(credEntry.extra, '', 'secret extra cookie must NOT be written to disk in plaintext')
    assert.equal(credEntry.extraCredentialRef, 'DSH_KEY_LIMITS_OLLAMA_TEST_1_EXTRA')

    if (process.platform !== 'win32') {
      const mode = statSync(subsJsonPath).mode & 0o777
      assert.equal(mode, 0o600, 'subs.json file permissions must be 0600')
    }
  } finally {
    for (const c of cleanups) try { c() } catch {}
    try { rmSync(tempDir, { recursive: true, force: true }) } catch {}
  }
})

// ---------------------------------------------------------------------------
// #97: Revoked credentials cleared in memory cache and excluded from export
// ---------------------------------------------------------------------------
test('#97: Revoked credential is reset in memory and does not leak into export', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dsh-key-limits-97-'))
  const registeredRoutes = new Map()
  const credentialsMap = new Map([
    ['DSH_KEY_LIMITS_SUB_REVOKE', 'active-secret-123']
  ])
  const cleanups = []

  const mockCtx = {
    webServer: {
      register: (spec) => {
        registeredRoutes.set(spec.path, spec.handler)
        return () => registeredRoutes.delete(spec.path)
      }
    },
    credentials: {
      set: async (ref, secret) => { credentialsMap.set(ref.name || ref, secret) },
      resolve: async (ref) => {
        const val = credentialsMap.get(ref.name || ref)
        return val ? { value: val } : null
      }
    },
    sessions: { getSnapshot: () => ({ currentSessionId: 's1' }) },
    settings: { register: () => ({ get: () => ({}), watch: () => () => {} }) },
    get: (key) => mockCtx[key] || null,
    inject: (deps, fn) => fn(mockCtx),
    on: () => () => {},
    effect: (fn) => {
      const cleanup = fn()
      if (typeof cleanup === 'function') cleanups.push(cleanup)
      return cleanup
    },
    logger: () => ({ warn: () => {}, error: () => {}, info: () => {}, debug: () => {} }),
  }

  try {
    // Pre-create subs.json with sub-revoke
    const initialSubs = {
      credentials: {
        'sub-revoke': {
          provider: 'deepseek',
          kind: 'balance',
          secret: '',
          extra: '',
          label: 'Revoke Test',
          credentialRef: 'DSH_KEY_LIMITS_SUB_REVOKE'
        }
      },
      meta: {}
    }
    writeFileSync(join(tempDir, 'subs.json'), JSON.stringify(initialSubs))

    apply(mockCtx, { storageDir: tempDir, refreshHours: 24, ui: {} })
    const exportHandler = registeredRoutes.get('/dsh-key-limits/export')

    // First export when credential is valid: backup should contain secret
    const exportReq1 = createMockRequest({
      method: 'POST',
      url: '/dsh-key-limits/export',
      headers: { host: '127.0.0.1:3080', 'sec-fetch-site': 'same-origin', origin: 'http://127.0.0.1:3080' },
      body: { passphrase: 'test-passphrase' }
    })
    const exportRes1 = createMockResponse()
    await exportHandler(exportReq1, exportRes1)
    assert.equal(exportRes1.statusCode, 200)
    const backup1 = JSON.parse(exportRes1.body).backup
    const decrypted1 = decryptBackup('test-passphrase', backup1)
    assert.equal(decrypted1[0].secret, 'active-secret-123')

    // Now revoke the credential by deleting it from the credentials service
    credentialsMap.delete('DSH_KEY_LIMITS_SUB_REVOKE')

    // Second export after revocation: secret must be empty string in decrypted payload
    const exportReq2 = createMockRequest({
      method: 'POST',
      url: '/dsh-key-limits/export',
      headers: { host: '127.0.0.1:3080', 'sec-fetch-site': 'same-origin', origin: 'http://127.0.0.1:3080' },
      body: { passphrase: 'test-passphrase' }
    })
    const exportRes2 = createMockResponse()
    await exportHandler(exportReq2, exportRes2)
    assert.equal(exportRes2.statusCode, 200)
    const backup2 = JSON.parse(exportRes2.body).backup
    const decrypted2 = decryptBackup('test-passphrase', backup2)
    assert.equal(decrypted2[0].secret, '', 'Revoked credential must not leak old memory secret into export')
  } finally {
    for (const c of cleanups) try { c() } catch {}
    try { rmSync(tempDir, { recursive: true, force: true }) } catch {}
  }
})

// ---------------------------------------------------------------------------
// #104: Disk persistence errors in CredentialStore._save() rollback and fail closed
// ---------------------------------------------------------------------------
test('#104: CredentialStore rollback on save failure, no false success in CRUD', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dsh-key-limits-104-'))
  try {
    const store = new CredentialStore(tempDir)
    store.upsert('sub-ok', { provider: 'deepseek', secret: 'k1', label: 'OK Sub' })
    assert.equal(store.creds.has('sub-ok'), true)

    // Force _save to fail by corrupting path to an invalid directory path
    const realSave = store._save
    let saveFailed = false
    store._save = function () {
      saveFailed = true
      throw new Error('ENOSPC: no space left on device')
    }

    // Upserting new sub must throw and rollback in-memory state
    assert.throws(
      () => {
        store.upsert('sub-fail', { provider: 'deepseek', secret: 'k2' })
      },
      /ENOSPC/,
      'upsert must throw persistence error'
    )
    assert.equal(saveFailed, true)
    assert.equal(store.creds.has('sub-fail'), false, 'Failed sub must be rolled back from creds')
    assert.equal(store.meta['sub-fail'], undefined, 'Failed sub must be rolled back from meta')

    // Removing existing sub when save fails must throw and rollback in-memory state
    assert.throws(
      () => {
        store.remove('sub-ok')
      },
      /ENOSPC/,
      'remove must throw persistence error'
    )
    assert.equal(store.creds.has('sub-ok'), true, 'Existing sub must be preserved on remove failure')
    assert.ok(store.meta['sub-ok'], 'Existing sub meta must be preserved on remove failure')

    // Restore real save
    store._save = realSave
  } finally {
    try { rmSync(tempDir, { recursive: true, force: true }) } catch {}
  }
})

// ---------------------------------------------------------------------------
// #105: Deleted subscription is not resurrected by in-flight refresh or stale card rev
// ---------------------------------------------------------------------------
test('#105: In-flight refresh finishing after remove() does not resurrect subscription', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dsh-key-limits-105-'))
  try {
    const store = new CredentialStore(tempDir)
    store.upsert('sub-ghost', { provider: 'deepseek', secret: 'k', label: 'Ghost Account' })
    const initialRev = store.get('sub-ghost').rev

    // Simulate in-flight refresh getting the card with rev = initialRev
    const inFlightCard = {
      id: 'sub-ghost',
      rev: initialRev,
      name: 'Ghost Account',
      provider: 'deepseek',
      status: 'ok',
      remaining: 25.0
    }

    // User removes sub-ghost while refresh is in flight
    store.remove('sub-ghost')
    assert.equal(store.creds.has('sub-ghost'), false)
    assert.equal(store.meta['sub-ghost'], undefined)

    // Now in-flight refresh completes and calls saveCards
    store.saveCards([inFlightCard])

    // Verify sub-ghost was NOT resurrected in meta or creds
    assert.equal(store.creds.has('sub-ghost'), false, 'Deleted sub must not be restored in creds')
    assert.equal(store.meta['sub-ghost'], undefined, 'Deleted sub must not be restored in meta')

    // Check disk subs.json
    const diskSubs = loadSubs(tempDir)
    const hit = diskSubs.find((s) => s.id === 'sub-ghost')
    assert.equal(hit, undefined, 'loadSubs must not return deleted ghost subscription')

    // Test rev mismatch protection
    store.upsert('sub-rev', { provider: 'deepseek', secret: 'key-v1' })
    const rev1 = store.get('sub-rev').rev
    // Update credential, incrementing rev
    store.upsert('sub-rev', { provider: 'deepseek', secret: 'key-v2' })
    const rev2 = store.get('sub-rev').rev
    assert.ok(rev2 > rev1)

    // Stale card from rev1 arrives
    const staleCard = {
      id: 'sub-rev',
      rev: rev1,
      name: 'Stale Card',
      provider: 'deepseek',
      status: 'ok',
      remaining: 99.0
    }
    store.saveCards([staleCard])
    assert.notEqual(store.meta['sub-rev']?.card?.remaining, 99.0, 'Stale rev card must be discarded')
  } finally {
    try { rmSync(tempDir, { recursive: true, force: true }) } catch {}
  }
})
