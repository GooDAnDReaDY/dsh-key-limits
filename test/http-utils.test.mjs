import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import {
  json,
  readQuery,
  readJsonBody,
  toCredentialRef,
  defaultCredRef,
  PayloadTooLargeError,
} from '../lib/http-utils.js'

test('http-utils: defaultCredRef formats deterministic environment variable names', () => {
  assert.equal(defaultCredRef('openrouter-1'), 'DSH_KEY_LIMITS_OPENROUTER_1')
  assert.equal(defaultCredRef('deepseek.key'), 'DSH_KEY_LIMITS_DEEPSEEK_KEY')
  assert.equal(defaultCredRef(''), 'DSH_KEY_LIMITS_SUB')
})

test('http-utils: toCredentialRef produces credential ref or fallback descriptor', async () => {
  const ref = await toCredentialRef('MY_API_KEY')
  if (typeof ref === 'string') {
    assert.equal(ref, 'MY_API_KEY')
  } else {
    assert.equal(ref.type, 'env')
    assert.equal(ref.name, 'MY_API_KEY')
  }
})

test('http-utils: readQuery parses URL search params safely', () => {
  const req = { url: '/dsh-key-limits/subs?id=sub-1&refresh=true' }
  assert.deepEqual(readQuery(req), { id: 'sub-1', refresh: 'true' })
  assert.deepEqual(readQuery({}), {})
  assert.deepEqual(readQuery({ url: null }), {})
})

test('http-utils: json sets headers and stringifies body', () => {
  let statusCode = null
  let headers = {}
  let writtenData = ''
  const res = {
    writeHead(code, h) {
      statusCode = code
      headers = h
    },
    end(data) {
      writtenData = data
    },
  }
  json(res, 200, { ok: true, count: 42 })
  assert.equal(statusCode, 200)
  assert.equal(headers['content-type'], 'application/json; charset=utf-8')
  assert.equal(headers['cache-control'], 'no-store')
  assert.deepEqual(JSON.parse(writtenData), { ok: true, count: 42 })
})

test('http-utils: readJsonBody parses JSON body and logs warning on syntax error', async () => {
  const validStream = Readable.from([Buffer.from('{"hello":'), Buffer.from('"world"}')])
  const valid = await readJsonBody(validStream)
  assert.deepEqual(valid, { hello: 'world' })

  const emptyStream = Readable.from([])
  assert.deepEqual(await readJsonBody(emptyStream), {})

  const logs = []
  const mockLogger = { warn: (msg) => logs.push(msg) }
  const invalidStream = Readable.from([Buffer.from('invalid-json')])
  const result = await readJsonBody(invalidStream, mockLogger)
  assert.deepEqual(result, {})
  assert.equal(logs.length, 1)
  assert.ok(logs[0].includes('JSON.parse failed'))
})

test('http-utils: readJsonBody throws PayloadTooLargeError when body exceeds maxBytes', async () => {
  const oversizedData = Buffer.alloc(1000, 'a')
  const stream = Readable.from([oversizedData])
  await assert.rejects(
    async () => {
      await readJsonBody(stream, null, 500)
    },
    (err) => {
      assert.ok(err instanceof PayloadTooLargeError)
      assert.equal(err.status, 413)
      assert.equal(err.code, 'PAYLOAD_TOO_LARGE')
      return true
    }
  )
})
