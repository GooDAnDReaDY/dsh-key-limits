import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Язык для чужого пространства объявляют и словарные пакеты. Ядро на
// повторное объявление той же пары бросает исключение, и незащищённый вызов
// уносит с собой весь плагин — а в интерфейсе это читается как отказ
// загрузить сразу несколько соседних. Ошибка тихая ровно до того момента,
// когда становится громкой, поэтому проверяем форму вызова по исходнику.
test('регистрация словарей переживает занятый язык', () => {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../lib/client.js')
  const src = readFileSync(file, 'utf8')

  assert.equal(src.includes('ctx.locale.register(NS,{en:'), false,
    'обе пары разом — тот самый незащищённый вызов')
  assert.match(src, /function addLocale/, 'языки объявляются по одному')
  assert.match(src, /catch \(alreadyTaken\)/, 'занятый язык не должен ронять плагин')
  assert.match(src, /addLocale\('en'/, 'английский свой')
  assert.match(src, /addLocale\('ru'/, 'русский свой')
})
