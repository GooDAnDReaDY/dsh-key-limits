import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export const DEFAULT_STORE_DIR = join(homedir(), '.dsh', 'storages', 'dsh-key-limits')

export function ensureStoreDir(dir) {
  const d = dir || DEFAULT_STORE_DIR
  try { mkdirSync(d, { recursive: true }) } catch { /* best-effort */ }
  return d
}
