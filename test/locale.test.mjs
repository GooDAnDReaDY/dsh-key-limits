import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('locale registration handles occupied languages gracefully', () => {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../lib/client.js')
  const src = readFileSync(file, 'utf8')

  assert.equal(src.includes('ctx.locale.register(NS,{en:'), false,
    'registering both languages at once is unsafe')
  assert.match(src, /function addLocale/, 'locales are registered individually')
  assert.match(src, /catch \(alreadyTaken\)/, 'occupied locale does not crash plugin')
  assert.match(src, /addLocale\('en'/, 'en locale registered')
  assert.match(src, /addLocale\('zh'/, 'zh locale registered')
})

test('source code and tests contain no cyrillic characters', () => {
  const check = (rel) => {
    const text = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', rel), 'utf8')
    assert.equal(/[а-яА-ЯёЁ]/.test(text), false, rel + ' must not contain cyrillic')
  }
  check('src/client/02-locale.js')
  check('src/client/04-modals.js')
  check('lib/client.js')
  check('lib/subs.js')
})
