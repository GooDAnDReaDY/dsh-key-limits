#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'src/client')
const order = readFileSync(join(srcDir, 'ORDER'), 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
const PKG = '@goodandready/dsh-key-limits'
const header = `window.__ModuleLoader__.load({id:"${PKG}",factory:(require)=>{`
const footer = `exports.apply=apply;exports.inject=["slots","sessions","locale","settingsScope"];return module.exports}})`
let body = ''
for (const file of order) {
  const text = readFileSync(join(srcDir, file), 'utf8')
  const lines = text.split('\n')
  const cleaned = lines[0].startsWith('/*') ? lines.slice(1).join('\n') : text
  body += cleaned.trimEnd() + '\n'
}
const out = header + body + footer + '\n'
writeFileSync(join(root, 'lib/client.js'), out)
console.log('built lib/client.js', out.length, 'bytes')
