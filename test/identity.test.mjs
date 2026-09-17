import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(path.join(root, rel), 'utf8')

test('public package identity matches in all four loader sites', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.name, '@goodandready/dsh-key-limits')
  assert.equal(pkg.publishConfig.access, 'public')
  assert.equal(pkg.private, undefined)
  assert.ok(read('cordis.patch.yml').includes("name: '" + pkg.name + "'"), 'cordis.patch.yml has matching name')
  assert.ok(read('lib/client.js').includes('load({id:"' + pkg.name + '"'), 'lib/client.js has matching id')
  assert.ok(read('lib/index.js').includes("export const name = '" + pkg.name + "'"), 'lib/index.js has matching export const name')
})

test('no legacy private scope remains in lib files', () => {
  assert.ok(!read('lib/index.js').includes('goodandready-private'), 'lib/index.js must not mention private scope')
  assert.ok(!read('lib/plugin-updater.js').includes('goodandready-private'), 'lib/plugin-updater.js must not mention private scope')
})

test('package metadata points to the public GitHub repository', () => {
  const pkg = JSON.parse(read('package.json'))
  const expected = 'github.com/GooDAnDReaDY/dsh-key-limits'
  assert.ok(pkg.repository.url.includes(expected))
  assert.ok(pkg.homepage.includes(expected))
  assert.ok(pkg.bugs.url.includes(expected))
})

test('client styles use data-dsh-plugin attribute for isolation', () => {
  assert.ok(read('lib/client.js').includes('data-dsh-plugin="dsh-key-limits"'))
})


test('settings namespace and route prefix are distinct and match client key', () => {
  const indexSrc = read('lib/index.js')
  const routePrefixMatch = indexSrc.match(/export const ROUTE_PREFIX = '([^']+)'/)
  const settingsNsMatch = indexSrc.match(/export const SETTINGS_NS = '([^']+)'/)
  assert.ok(routePrefixMatch, 'ROUTE_PREFIX must be exported')
  assert.ok(settingsNsMatch, 'SETTINGS_NS must be exported')
  const routePrefix = routePrefixMatch[1]
  const settingsNs = settingsNsMatch[1]
  assert.equal(routePrefix, '/dsh-key-limits')
  assert.equal(settingsNs, 'dsh-key-limits')
  assert.ok(!settingsNs.startsWith('/'), 'SETTINGS_NS must not start with /')
  assert.ok(routePrefix.startsWith('/'), 'ROUTE_PREFIX must start with /')

  const prelude = read('src/client/01-prelude.js')
  assert.ok(prelude.includes('NS="' + settingsNs + '"'), 'client NS must match host SETTINGS_NS')
})

test('settings card requests core chevron icon with safe fallback', () => {
  const clientSrc = read('lib/client.js')
  assert.ok(clientSrc.includes('IconChevronDownOutline14'), 'must request core IconChevronDownOutline14')
  assert.ok(clientSrc.includes('@deepseek-ai/dsh-client-ui-primitives'), 'must require primitives package')
  assert.ok(clientSrc.includes('catch'), 'primitives require must be wrapped in try/catch')
})

test('client styles use theme variables with zero standalone hex or rgba', () => {
  
  const clientDir = path.join(root, 'src/client')
  const files = readdirSync(clientDir).filter((f) => f.endsWith('.js'))
  for (const file of files) {
    const content = read(path.join('src/client', file))
    assert.equal(content.includes('rgba('), false, file + ' must contain zero rgba(')
    assert.equal(/#[0-9a-fA-F]{3,6}/.test(content), false, file + ' must contain zero hex colors')
  }
})
