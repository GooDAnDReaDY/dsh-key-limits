import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

test('no release tgz archives exist in repository root', () => {
  const files = readdirSync(root)
  const tgzFiles = files.filter((f) => f.endsWith('.tgz'))
  assert.deepEqual(tgzFiles, [], 'Repository root must not contain release .tgz archives')
})

test('openwiki is listed in .gitignore', () => {
  const gitignore = readFileSync(path.join(root, '.gitignore'), 'utf8')
  const lines = gitignore.split(String.fromCharCode(10)).map((l) => l.trim())
  assert.ok(lines.includes('openwiki/'), 'openwiki/ must be ignored in .gitignore')
})
