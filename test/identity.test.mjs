import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(path.join(root, rel), 'utf8')

test('private package identity matches in all loader sites', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.name, '@goodandready-private/dsh-key-limits')
  assert.equal(pkg.publishConfig.registry, 'https://npm.pkg.github.com')
  assert.equal(pkg.private, undefined)
  assert.ok(read('cordis.patch.yml').includes("name: '" + pkg.name + "'"))
  assert.ok(read('lib/client.js').includes('load({id:"' + pkg.name + '"'))
})

test('package metadata points to the private GitHub repository', () => {
  const pkg = JSON.parse(read('package.json'))
  const expected = 'github.com/goodandready-private/dsh-key-limits'
  assert.ok(pkg.repository.url.includes(expected))
  assert.ok(pkg.homepage.includes(expected))
  assert.ok(pkg.bugs.url.includes(expected))
})
