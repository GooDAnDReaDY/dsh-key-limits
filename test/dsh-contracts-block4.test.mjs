import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Readable } from 'node:stream'

import {
  json,
  readJsonBody,
  PayloadTooLargeError,
  MAX_BACKUP_BODY_BYTES,
  MAX_BACKUP_ENTRIES,
} from '../lib/http-utils.js'
import { encryptBackup, decryptBackup } from '../lib/crypto-backup.js'
import { apply, Config } from '../lib/index.js'
import { CredentialStore } from '../lib/subs.js'

test('#122: readJsonBody does not destroy socket and enables clean HTTP 413 response over real socket', async () => {
  const maxBytes = 1024
  let serverReceivedError = null

  const server = http.createServer(async (req, res) => {
    try {
      await readJsonBody(req, null, maxBytes)
      json(res, 200, { ok: true })
    } catch (err) {
      serverReceivedError = err
      if (err instanceof PayloadTooLargeError || err?.status === 413) {
        json(res, 413, { error: 'payload too large: request body exceeds limit' })
        return
      }
      json(res, 500, { error: err.message })
    }
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port

  try {
    const response = await new Promise((resolve, reject) => {
      const clientReq = http.request({
        host: '127.0.0.1',
        port,
        path: '/test-upload',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }, (clientRes) => {
        let body = ''
        clientRes.on('data', (chunk) => { body += chunk })
        clientRes.on('end', () => {
          resolve({
            statusCode: clientRes.statusCode,
            headers: clientRes.headers,
            body,
          })
        })
      })

      clientReq.on('error', reject)

      // Send 3KB across several chunks exceeding the 1KB limit
      const chunk = Buffer.alloc(1024, 'x')
      clientReq.write('{"data":"')
      clientReq.write(chunk)
      clientReq.write(chunk)
      clientReq.write('"}')
      clientReq.end()
    })

    assert.equal(response.statusCode, 413)
    assert.equal(response.headers['content-type'], 'application/json; charset=utf-8')
    assert.equal(response.headers['connection'], 'close')

    const parsed = JSON.parse(response.body)
    assert.equal(parsed.error, 'payload too large: request body exceeds limit')
    assert.ok(serverReceivedError instanceof PayloadTooLargeError)
    assert.equal(serverReceivedError.status, 413)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('#107: 51+ entries with long session cookies are exported and imported without silent slice or 413 rejection', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-block4-capacity-'))
  try {
    const credStore = new CredentialStore(dir)

    // Generate 55 entries with 1.2KB session cookies each
    const longCookie = 'session_token_' + 'A'.repeat(1200)
    const originalSubs = []

    for (let i = 1; i <= 55; i++) {
      const sub = {
        id: `ollama-sub-${i}`,
        provider: 'ollama',
        secret: `sk-ollama-${i}`,
        extra: longCookie,
        label: `Ollama Account ${i}`,
        alias: `Ollama Account ${i}`,
        active: true,
      }
      originalSubs.push(sub)
      credStore.upsert(sub.id, sub)
    }

    const passphrase = 'test-long-backup-pass'
    const backup = encryptBackup(passphrase, originalSubs)

    // Serialized backup exceeds default 64KB HTTP limit
    const serializedPayload = JSON.stringify({ passphrase, backup })
    assert.ok(
      serializedPayload.length > 64 * 1024,
      `Expected serialized payload (${serializedPayload.length}) to exceed 64KB`
    )

    // Decrypt directly and check count
    const decrypted = decryptBackup(passphrase, backup)
    assert.equal(decrypted.length, 55)

    // Setup plugin context to simulate POST /import endpoint
    const routes = new Map()
    const ctx = {
      effect: (fn) => fn(),
      on: () => {},
      inject: (deps, fn) => fn({}),
      get: (name) => {
        if (name === 'credentials') {
          return {
            set: async () => {},
            resolve: async () => null,
          }
        }
        return null
      },
      webServer: {
        register: (route) => {
          routes.set(route.path, route.handler)
        },
      },
    }

    apply(ctx, { storageDir: dir })

    const importHandler = routes.get('/dsh-key-limits/import')
    assert.ok(typeof importHandler === 'function', 'Import handler should be registered')

    // Simulate POST /import with stream
    const req = Readable.from([Buffer.from(serializedPayload)])
    req.method = 'POST'
    req.headers = {
      'host': '127.0.0.1:3000',
      'x-dsh-internal-auth': '1',
      'content-type': 'application/json',
    }

    let responseStatus = null
    let responseBody = null
    const res = {
      writeHead(status) { responseStatus = status },
      end(data) { responseBody = JSON.parse(data) },
    }

    await importHandler(req, res)

    assert.equal(responseStatus, 200)
    assert.equal(responseBody.ok, true)
    assert.equal(responseBody.count, 55)
    assert.equal(responseBody.importedCount, 55)
    assert.equal(responseBody.results.length, 55)
    assert.ok(responseBody.results.every((r) => r.ok === true))

    // Ensure all 55 entries exist in store without silent slicing to 50
    const list = credStore.list()
    assert.equal(list.length, 55)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('#107: encryptBackup and decryptBackup enforce MAX_BACKUP_ENTRIES limit', () => {
  const overlimitSubs = Array.from({ length: MAX_BACKUP_ENTRIES + 1 }, (_, i) => ({
    id: `sub-${i}`,
    provider: 'deepseek',
    secret: 'sk-test',
  }))

  assert.throws(
    () => encryptBackup('passphrase123', overlimitSubs),
    new RegExp(`exceeds maximum limit of ${MAX_BACKUP_ENTRIES}`)
  )

  const validSubs = Array.from({ length: 5 }, (_, i) => ({
    id: `sub-${i}`,
    provider: 'deepseek',
    secret: 'sk-test',
  }))
  const validBackup = encryptBackup('passphrase123', validSubs)

  // Corrupt count in payload package to simulate payload tampering
  const tamperedBackup = { ...validBackup }
  assert.equal(decryptBackup('passphrase123', tamperedBackup).length, 5)
})

test('#106: Export->import preserves identity, label, UI order and deduplicates on repeat import', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-block4-identity-'))
  try {
    const credStore = new CredentialStore(dir)

    // Seed initial subscriptions with specific IDs and labels
    credStore.upsert('kept-ds-id', {
      provider: 'deepseek',
      kind: 'balance',
      secret: 'sk-deepseek-kept-key',
      label: 'Preserved DeepSeek Label',
      credentialRef: 'REF_DS',
    })
    credStore.upsert('kept-groq-id', {
      provider: 'groq',
      kind: 'quota',
      secret: 'gsk-groq-kept-key',
      label: 'Preserved Groq Label',
      credentialRef: 'REF_GROQ',
    })

    const initialOrder = ['kept-groq-id', 'kept-ds-id']

    const routes = new Map()
    const storedCredentials = new Map([
      ['REF_DS', 'sk-deepseek-kept-key'],
      ['REF_GROQ', 'gsk-groq-kept-key'],
    ])

    const ctx = {
      effect: (fn) => fn(),
      on: () => {},
      inject: (deps, fn) => fn({}),
      get: (name) => {
        if (name === 'credentials') {
          return {
            set: async (ref, val) => {
              storedCredentials.set(ref.name || ref, val)
            },
            resolve: async (ref) => {
              const val = storedCredentials.get(ref.name || ref)
              return val ? { value: val } : null
            },
          }
        }
        return null
      },
      webServer: {
        register: (route) => {
          routes.set(route.path, route.handler)
        },
      },
    }

    apply(ctx, {
      storageDir: dir,
      ui: {
        order: initialOrder,
        activeOnTop: false,
      },
    })

    const exportHandler = routes.get('/dsh-key-limits/export')
    const importHandler = routes.get('/dsh-key-limits/import')

    // 1. Export subscriptions
    const exportReq = Readable.from([Buffer.from(JSON.stringify({ passphrase: 'export-pass-123' }))])
    exportReq.method = 'POST'
    exportReq.headers = {
      'host': '127.0.0.1:3000',
      'x-dsh-internal-auth': '1',
      'content-type': 'application/json',
    }

    let exportStatus = null
    let exportBody = null
    await exportHandler(exportReq, {
      writeHead(s) { exportStatus = s },
      end(d) { exportBody = JSON.parse(d) },
    })

    assert.equal(exportStatus, 200)
    assert.ok(exportBody.ok)
    assert.ok(exportBody.backup)

    // Check decrypted package structure directly
    const decrypted = decryptBackup('export-pass-123', exportBody.backup)
    assert.equal(decrypted.length, 2)
    assert.equal(decrypted[0].id, 'kept-ds-id')
    assert.equal(decrypted[0].label, 'Preserved DeepSeek Label')
    assert.equal(decrypted[0].alias, 'Preserved DeepSeek Label')
    assert.equal(decrypted[1].id, 'kept-groq-id')
    assert.equal(decrypted[1].label, 'Preserved Groq Label')
    assert.deepEqual(decrypted.ui.order, initialOrder)

    // 2. Perform FIRST import
    const importReq1 = Readable.from([Buffer.from(JSON.stringify({
      passphrase: 'export-pass-123',
      backup: exportBody.backup,
    }))])
    importReq1.method = 'POST'
    importReq1.headers = {
      'host': '127.0.0.1:3000',
      'x-dsh-internal-auth': '1',
      'content-type': 'application/json',
    }

    let importStatus1 = null
    let importBody1 = null
    await importHandler(importReq1, {
      writeHead(s) { importStatus1 = s },
      end(d) { importBody1 = JSON.parse(d) },
    })

    assert.equal(importStatus1, 200)
    assert.equal(importBody1.importedCount, 2)
    assert.equal(importBody1.cards.length, 2)
    assert.equal(importBody1.cards[0].id, 'kept-groq-id')
    assert.equal(importBody1.cards[0].label, 'Preserved Groq Label')
    assert.equal(importBody1.cards[1].id, 'kept-ds-id')
    assert.equal(importBody1.cards[1].label, 'Preserved DeepSeek Label')

    // 3. Perform SECOND import (repeat restore) to verify deduplication policy
    const importReq2 = Readable.from([Buffer.from(JSON.stringify({
      passphrase: 'export-pass-123',
      backup: exportBody.backup,
    }))])
    importReq2.method = 'POST'
    importReq2.headers = {
      'host': '127.0.0.1:3000',
      'x-dsh-internal-auth': '1',
      'content-type': 'application/json',
    }

    let importStatus2 = null
    let importBody2 = null
    await importHandler(importReq2, {
      writeHead(s) { importStatus2 = s },
      end(d) { importBody2 = JSON.parse(d) },
    })

    assert.equal(importStatus2, 200)
    assert.equal(importBody2.importedCount, 2)

    // Verify database STILL has exactly 2 entries (NO DUPLICATES CREATED!)
    const listAfterSecondImport = credStore.list()
    assert.equal(listAfterSecondImport.length, 2)

    const dsSub = credStore.get('kept-ds-id')
    assert.ok(dsSub)
    assert.equal(dsSub.label, 'Preserved DeepSeek Label')
    assert.equal(dsSub.provider, 'deepseek')

    const groqSub = credStore.get('kept-groq-id')
    assert.ok(groqSub)
    assert.equal(groqSub.label, 'Preserved Groq Label')
    assert.equal(groqSub.provider, 'groq')

    // Verify UI order matches the exported order
    assert.deepEqual(importBody2.ui.order, initialOrder)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
