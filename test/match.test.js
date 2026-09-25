import test from 'node:test'
import assert from 'node:assert/strict'
import { matchSub, inferProviderFromSub, quotaWindowsFromCard } from '../lib/cards.js'
import { credentialFingerprint, allocateSubId } from '../lib/subs.js'

test('credentialFingerprint is stable', () => {
  const a = credentialFingerprint('sk-test', 'extra')
  const b = credentialFingerprint('sk-test', 'extra')
  assert.equal(a, b)
  assert.notEqual(a, credentialFingerprint('sk-other', 'extra'))
})

test('matchSub prefers fingerprint over provider', () => {
  const subs = [
    { id: 'cline-1', provider: 'cline', fingerprint: 'aaa' },
    { id: 'cline-2', provider: 'cline', fingerprint: 'bbb' },
  ]
  const r = matchSub(subs, { provider: 'cline', fingerprint: 'bbb' })
  assert.equal(r.sub.id, 'cline-2')
  assert.equal(r.rule, 'AS-M4')
})

test('inferProviderFromSub from id', () => {
  assert.equal(inferProviderFromSub({ id: 'openrouter-3' }), 'openrouter')
})

test('quotaWindowsFromCard', () => {
  const w = quotaWindowsFromCard({
    primaryWindow: { usedPercent: 40, remainingPercent: 60, resetsAt: null },
  })
  assert.equal(w.length, 1)
  assert.equal(w[0].remainingPercent, 60)
})

test('allocateSubId', () => {
  const id = allocateSubId({ provider: 'cline' }, 'cline')
  assert.match(id, /^cline-/)
})
