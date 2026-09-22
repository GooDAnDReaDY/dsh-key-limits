import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const client = readFileSync(join(root, 'lib/client.js'), 'utf8')
const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

test('row seat key is the package name plus the row id from cordis.patch.yml', () => {
  const rowId = patch.match(/^\s*- id:\s*(\S+)\s*$/m)
  assert.ok(rowId, 'cordis.patch.yml declares a row id')
  assert.match(client, /PKG="@goodandready\/dsh-key-limits"/)
  assert.match(client, new RegExp('ROW_ID="' + rowId[1] + '"'))
  assert.match(client, /ROW_CONFIG_KEY=PKG\+"#"\+ROW_ID/)
  assert.equal(pkg.name, '@goodandready/dsh-key-limits')
})

test('settings register into plugins.row.config first, legacy seat stays as fallback', () => {
  const rowSeat = client.indexOf('trySlot("plugins.row.config"')
  const legacySeat = client.indexOf('trySlot("settings.plugin.item"')
  assert.ok(rowSeat > -1, 'row seat is registered')
  assert.ok(legacySeat > -1, 'legacy seat is kept for older cores')
  assert.ok(rowSeat < legacySeat, 'row seat is registered before the legacy seat')
  assert.match(client, /name:"plugins\.row\.config",key:ROW_CONFIG_KEY/)
  assert.match(client, /name:"settings\.plugin\.item",key:NS/)
})

test('the page view renders the settings form bare, without the accordion card', () => {
  assert.match(client, /view\s*===\s*"summary"/)
  // The page branch returns the bare form component directly — no card wrapper.
  assert.match(client, /view\s*===\s*"page"\)\{\s*return jsx\(KeyLimitsSettingsForm/)
  assert.match(client, /function KeyLimitsSettingsForm\(props\)\{[\s\S]{0,400}className:"kl-page"/)
})

test('no duplicate settings.section surface is registered', () => {
  assert.doesNotMatch(client, /name:"settings\.section"/)
})
