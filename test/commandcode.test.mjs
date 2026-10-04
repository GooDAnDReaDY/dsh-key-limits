import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { PROVIDERS, providerSchemas, fetchCommandCodeQuota } from '../lib/subs.js'
import { loadSubs } from '../lib/cards.js'

test('commandcode is registered in PROVIDERS and providerSchemas', () => {
  assert.ok(PROVIDERS.commandcode, 'commandcode exists in PROVIDERS')
  assert.equal(PROVIDERS.commandcode.kind, 'api_key')
  assert.deepEqual(PROVIDERS.commandcode.credentialRefs, ['COMMANDCODE_API_KEY'])

  const schemas = providerSchemas()
  assert.ok(schemas.commandcode, 'commandcode schema is exposed')
  assert.equal(schemas.commandcode.fields.length, 1)
  assert.equal(schemas.commandcode.fields[0].key, 'secret')
})

test('fetchCommandCodeQuota returns error on missing key', async () => {
  const res = await fetchCommandCodeQuota('')
  assert.equal(res.status, 'error')
  assert.ok(res.message.includes('API key required'))
})

test('loadSubs returns subscriptions present in meta even if credentials empty', () => {
  const dir = mkdtempSync(join(tmpdir(), 'loadsubs-test-'))
  try {
    const raw = {
      credentials: {},
      meta: {
        'card-1': {
          label: 'Card 1',
          provider: 'commandcode',
          card: { status: 'ok', plan: 'Command Code' }
        }
      }
    }
    writeFileSync(join(dir, 'subs.json'), JSON.stringify(raw))
    const list = loadSubs(dir)
    assert.equal(list.length, 1)
    assert.equal(list[0].id, 'card-1')
    assert.equal(list[0].label, 'Card 1')
    assert.equal(list[0].provider, 'commandcode')
    assert.equal(list[0].card.plan, 'Command Code')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
