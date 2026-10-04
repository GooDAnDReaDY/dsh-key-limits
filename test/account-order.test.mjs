import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  sortSubscriptions,
  loadSubs,
  saveSubCards,
  matchSub,
  quotaWindowsFromCard,
  inferProviderFromSub,
} from '../lib/cards.js'

test('sortSubscriptions orders accounts according to custom order', () => {
  const subs = [
    { id: 'acc-1', provider: 'deepseek' },
    { id: 'acc-2', provider: 'qwen' },
    { id: 'acc-3', provider: 'commandcode' },
  ]

  const ordered = sortSubscriptions(subs, { order: ['acc-3', 'acc-1', 'acc-2'] })
  assert.deepEqual(ordered.map((s) => s.id), ['acc-3', 'acc-1', 'acc-2'])
})

test('sortSubscriptions pins active account on top when activeOnTop is true', () => {
  const subs = [
    { id: 'acc-1', provider: 'deepseek' },
    { id: 'acc-2', provider: 'qwen' },
    { id: 'acc-3', provider: 'commandcode' },
  ]

  const sorted = sortSubscriptions(subs, {
    order: ['acc-1', 'acc-2', 'acc-3'],
    activeOnTop: true,
    activeSubId: 'acc-3',
  })
  assert.deepEqual(sorted.map((s) => s.id), ['acc-3', 'acc-1', 'acc-2'])
})

test('sortSubscriptions leaves order unchanged when no rules provided', () => {
  const subs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  assert.deepEqual(sortSubscriptions(subs).map((s) => s.id), ['a', 'b', 'c'])
  assert.deepEqual(sortSubscriptions(null), [])
})

test('saveSubCards and loadSubs persist cards and handle stale marks on network fail', () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'dsh-key-limits-test-'))
  try {
    const cardOk = {
      id: 'sub-test-1',
      provider: 'deepseek',
      status: 'ok',
      checkedAt: Date.now(),
      remaining: 15.5,
    }
    saveSubCards(tempDir, [cardOk])

    const loaded1 = loadSubs(tempDir)
    assert.equal(loaded1.length, 1)
    assert.equal(loaded1[0].id, 'sub-test-1')
    assert.equal(loaded1[0].card.status, 'ok')

    // Simulate subsequent network failure on refresh -> should preserve card with stale=true
    const cardFail = {
      id: 'sub-test-1',
      provider: 'deepseek',
      status: 'error',
      message: 'fetch failed (timeout)',
    }
    saveSubCards(tempDir, [cardFail])

    const loaded2 = loadSubs(tempDir)
    assert.equal(loaded2.length, 1)
    assert.equal(loaded2[0].card.stale, true)
    assert.equal(loaded2[0].card.remaining, 15.5)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('matchSub disambiguates correctly across subId, fingerprint, and provider', () => {
  const subs = [
    { id: 'deepseek-1', provider: 'deepseek', fingerprint: 'fp-ds-1' },
    { id: 'deepseek-2', provider: 'deepseek', fingerprint: 'fp-ds-2' },
    { id: 'kimi-1', provider: 'kimi', fingerprint: 'fp-km' },
  ]

  // Direct subId match
  assert.equal(matchSub(subs, { subId: 'deepseek-2' }).rule, 'AS-M0')
  // Unique fingerprint match
  assert.equal(matchSub(subs, { fingerprint: 'fp-km' }).rule, 'AS-M4')
  // Unique provider match
  assert.equal(matchSub(subs, { provider: 'kimi' }).rule, 'AS-M1')
  // Ambiguous provider match (returns first matching sub)
  assert.equal(matchSub(subs, { provider: 'deepseek' }).rule, 'AS-M1-multi')
  // Non-matching provider
  assert.equal(matchSub(subs, { provider: 'unknown' }).rule, 'no-match')
})

test('quotaWindowsFromCard extracts 5h, weekly, monthly windows safely', () => {
  assert.equal(quotaWindowsFromCard(null), null)
  assert.equal(quotaWindowsFromCard({}), null)

  const card = {
    primaryWindow: { usedPercent: 20, resetAt: 12345 },
    secondaryWindow: { usedPercent: 40 },
    tertiaryWindow: { usedPercent: 80 },
  }
  const windows = quotaWindowsFromCard(card)
  assert.equal(windows.length, 3)
  assert.equal(windows[0].id, 'rolling')
  assert.equal(windows[0].remainingPercent, 80)
  assert.equal(windows[1].id, 'weekly')
  assert.equal(windows[1].remainingPercent, 60)
  assert.equal(windows[2].id, 'monthly')
  assert.equal(windows[2].remainingPercent, 20)
})

test('inferProviderFromSub handles id suffixes and sub objects', () => {
  assert.equal(inferProviderFromSub({ provider: 'qwen' }), 'qwen')
  assert.equal(inferProviderFromSub({ id: 'deepseek-1234' }), 'deepseek')
  assert.equal(inferProviderFromSub({ id: 'commandcode' }), 'commandcode')
  assert.equal(inferProviderFromSub(null), '')
})

test('sortSubscriptions integrates with buildSubsList ordering contract (#48)', () => {
  const rawList = [
    { id: 'sub-1', label: 'First', provider: 'deepseek' },
    { id: 'sub-2', label: 'Second', provider: 'qwen' },
    { id: 'sub-3', label: 'Third', provider: 'openrouter' },
  ]
  // With custom order and active account pinned
  const sorted = sortSubscriptions(rawList, {
    order: ['sub-2', 'sub-3', 'sub-1'],
    activeOnTop: true,
    activeSubId: 'sub-3',
  })
  assert.deepEqual(sorted.map((s) => s.id), ['sub-3', 'sub-2', 'sub-1'])

  // When activeOnTop is false
  const noPin = sortSubscriptions(rawList, {
    order: ['sub-2', 'sub-3', 'sub-1'],
    activeOnTop: false,
    activeSubId: 'sub-3',
  })
  assert.deepEqual(noPin.map((s) => s.id), ['sub-2', 'sub-3', 'sub-1'])
})

