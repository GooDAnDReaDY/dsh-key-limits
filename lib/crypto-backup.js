// lib/crypto-backup.js — Encrypted export/import for @goodandready/dsh-key-limits
import crypto from 'node:crypto'
import { MAX_BACKUP_ENTRIES } from './http-utils.js'

const SALT_BYTES = 16
const IV_BYTES = 12
const KEY_BYTES = 32

/**
 * Encrypts an array of subscription objects with secrets using AES-256-GCM.
 * @param {string} passphrase - User-supplied password.
 * @param {Array<Object>|Object} subsWithSecrets - Subscription objects or package payload.
 * @param {Object} [options] - Additional options (e.g. ui config).
 * @returns {Object} Serialized encrypted backup package.
 */
export function encryptBackup(passphrase, subsWithSecrets, options = {}) {
  const pwd = String(passphrase || '').trim()
  if (pwd.length < 4) {
    throw new Error('Passphrase must be at least 4 characters long')
  }

  let subs = []
  let ui = options.ui || null

  if (Array.isArray(subsWithSecrets)) {
    subs = subsWithSecrets
  } else if (subsWithSecrets && typeof subsWithSecrets === 'object') {
    subs = Array.isArray(subsWithSecrets.subscriptions) ? subsWithSecrets.subscriptions : []
    if (subsWithSecrets.ui) ui = subsWithSecrets.ui
  } else {
    throw new Error('Subscriptions payload must be an array')
  }

  if (subs.length > MAX_BACKUP_ENTRIES) {
    throw new Error(`Subscriptions count (${subs.length}) exceeds maximum limit of ${MAX_BACKUP_ENTRIES}`)
  }

  // Filter and sanitize entries for export, preserving IDs and labels
  const sanitized = subs.map((s) => ({
    id: typeof s.id === 'string' && s.id.trim() ? s.id.trim() : undefined,
    provider: String(s.provider || '').trim(),
    secret: String(s.secret || '').trim(),
    extra: String(s.extra || '').trim(),
    alias: String(s.alias || s.label || '').trim(),
    label: String(s.label || s.alias || '').trim(),
    active: s.active !== false,
  }))

  const payload = ui ? {
    subscriptions: sanitized,
    ui: {
      order: Array.isArray(ui.order) ? ui.order.filter((x) => typeof x === 'string') : [],
      activeOnTop: ui.activeOnTop !== false,
      floatChip: ui.floatChip !== false,
      composerBar: ui.composerBar !== false,
    },
  } : sanitized

  const salt = crypto.randomBytes(SALT_BYTES)
  const iv = crypto.randomBytes(IV_BYTES)
  const key = crypto.scryptSync(pwd, salt, KEY_BYTES, { N: 16384, r: 8, p: 1 })

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8')
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    version: 1,
    format: 'dsh-key-limits-backup',
    kdf: 'scrypt',
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: encrypted.toString('hex'),
    count: sanitized.length,
    exportedAt: Date.now(),
  }
}

/**
 * Decrypts a backup package using AES-256-GCM.
 * @param {string} passphrase - User-supplied password.
 * @param {Object} backupPackage - The serialized backup package.
 * @returns {Array<Object>} Decrypted array of subscription objects with optional .ui metadata.
 */
export function decryptBackup(passphrase, backupPackage) {
  const pwd = String(passphrase || '').trim()
  if (!pwd) {
    throw new Error('Passphrase is required')
  }
  if (!backupPackage || typeof backupPackage !== 'object') {
    throw new Error('Invalid backup package structure')
  }
  if (backupPackage.format !== 'dsh-key-limits-backup' || backupPackage.version !== 1) {
    throw new Error('Unsupported or corrupt backup package format')
  }

  const { salt, iv, tag, ciphertext } = backupPackage
  if (!salt || !iv || !tag || !ciphertext) {
    throw new Error('Missing required cryptographic parameters in backup')
  }

  try {
    const saltBuf = Buffer.from(salt, 'hex')
    const ivBuf = Buffer.from(iv, 'hex')
    const tagBuf = Buffer.from(tag, 'hex')
    const cipherBuf = Buffer.from(ciphertext, 'hex')

    const key = crypto.scryptSync(pwd, saltBuf, KEY_BYTES, { N: 16384, r: 8, p: 1 })
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuf)
    decipher.setAuthTag(tagBuf)

    const decrypted = Buffer.concat([decipher.update(cipherBuf), decipher.final()])
    const parsed = JSON.parse(decrypted.toString('utf8'))

    let rawSubs = []
    let ui = null

    if (Array.isArray(parsed)) {
      rawSubs = parsed
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.subscriptions)) {
      rawSubs = parsed.subscriptions
      ui = parsed.ui && typeof parsed.ui === 'object' ? parsed.ui : null
    } else {
      throw new Error('Decrypted payload is not a valid subscription array')
    }

    if (rawSubs.length > MAX_BACKUP_ENTRIES) {
      throw new Error(`Backup contains ${rawSubs.length} subscriptions, exceeding limit of ${MAX_BACKUP_ENTRIES}`)
    }

    // Fail-closed validation for each item, preserving ID, label, and alias
    const result = rawSubs.filter((s) => s && typeof s === 'object' && typeof s.provider === 'string').map((s) => ({
      id: typeof s.id === 'string' && s.id.trim() ? s.id.trim() : undefined,
      provider: String(s.provider).trim(),
      secret: String(s.secret || '').trim(),
      extra: String(s.extra || '').trim(),
      alias: String(s.alias || s.label || '').trim(),
      label: String(s.label || s.alias || '').trim(),
      active: s.active !== false,
    }))

    if (ui) {
      result.ui = {
        order: Array.isArray(ui.order) ? ui.order.filter((x) => typeof x === 'string') : [],
        activeOnTop: ui.activeOnTop !== false,
        floatChip: ui.floatChip !== false,
        composerBar: ui.composerBar !== false,
      }
    }

    return result
  } catch (err) {
    if (err.message.includes('auth') || err.message.includes('tag')) {
      throw new Error('Invalid passphrase or corrupted backup package')
    }
    throw err
  }
}
