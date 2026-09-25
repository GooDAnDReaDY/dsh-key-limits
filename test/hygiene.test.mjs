import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
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

test('internal development files are ignored in .gitignore', () => {
  const gitignore = readFileSync(path.join(root, '.gitignore'), 'utf8')
  const lines = gitignore.split(String.fromCharCode(10)).map((l) => l.trim())
  assert.ok(lines.includes('AGENTS.md'), 'AGENTS.md must be ignored in .gitignore')
  assert.ok(lines.includes('index.md'), 'index.md must be ignored in .gitignore')
  assert.ok(lines.includes('docs/TZ.md'), 'docs/TZ.md must be ignored in .gitignore')
  assert.ok(lines.includes('scripts/deploy-staging.sh'), 'scripts/deploy-staging.sh must be ignored in .gitignore')
})

test('.gitattributes specifies export-ignore for internal development files', () => {
  assert.ok(existsSync(path.join(root, '.gitattributes')), '.gitattributes must exist')
  const attrs = readFileSync(path.join(root, '.gitattributes'), 'utf8')
  assert.match(attrs, /AGENTS\.md\s+export-ignore/, 'AGENTS.md must have export-ignore')
  assert.match(attrs, /index\.md\s+export-ignore/, 'index.md must have export-ignore')
  assert.match(attrs, /publish\.sh\s+export-ignore/, 'publish.sh must have export-ignore')
  assert.match(attrs, /docs\/plans\/\s+export-ignore/, 'docs/plans/ must have export-ignore')
  assert.match(attrs, /scripts\/deploy-staging\.sh\s+export-ignore/, 'scripts/deploy-staging.sh must have export-ignore')
})

test('internal development and deploy files are not tracked in git', () => {
  try {
    const tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' })
      .split(String.fromCharCode(10))
      .map((l) => l.trim())
      .filter(Boolean)

    assert.ok(!tracked.includes('AGENTS.md'), 'AGENTS.md must not be tracked in git')
    assert.ok(!tracked.includes('index.md'), 'index.md must not be tracked in git')
    assert.ok(!tracked.includes('docs/TZ.md'), 'docs/TZ.md must not be tracked in git')
    assert.ok(!tracked.includes('scripts/deploy-staging.sh'), 'scripts/deploy-staging.sh must not be tracked in git')
    assert.ok(!tracked.includes('scripts/smoke-staging.sh'), 'scripts/smoke-staging.sh must not be tracked in git')
  } catch (err) {
    // If git is unavailable in execution context, skip gracefully
    if (err.message.includes('not a git repository')) return
    throw err
  }
})
