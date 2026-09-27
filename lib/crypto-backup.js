// lib/crypto-backup.js — Encrypted export/import for @goodandready/dsh-key-limits
import crypto from 'node:crypto'

const SALT_BYTES = 16
const IV_BYTES = 12
const KEY_BYTES = 32

/**
 * Encrypts an array of subscription objects with secrets using AES-256-GCM.
 * @param {string} passphrase - User-supplied password.
 * @param {Array<Object>} subsWithSecrets - Subscription objects including secrets.
 * @returns {Object} Serialized encrypted backup package.
 */
export function encryptBackup(passphrase, subsWithSecrets) {
  const pwd = String(passphrase || '').trim()
  if (pwd.length < 4) {
    throw new Error('Passphrase must be at least 4 characters long')
  }
  if (!Array.isArray(subsWithSecrets)) {
    throw new Error('Subscriptions payload must be an array')
  }

  // Filter and sanitize entries for export
  const sanitized = subsWithSecrets.map((s) => ({
    id: s.id,
    provider: s.provider,
    secret: s.secret || '',
    extra: s.extra || '',
    alias: s.alias || '',
    active: s.active !== false,
  }))

  const salt = crypto.randomBytes(SALT_BYTES)
  const iv = crypto.randomBytes(IV_BYTES)
  const key = crypto.scryptSync(pwd, salt, KEY_BYTES, { N: 16384, r: 8, p: 1 })

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const plaintext = Buffer.from(JSON.stringify(sanitized), 'utf8')
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
 * @returns {Array<Object>} Decrypted array of subscription objects.
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
    const subs = JSON.parse(decrypted.toString('utf8'))

    if (!Array.isArray(subs)) {
      throw new Error('Decrypted payload is not a valid subscription array')
    }

    // Fail-closed validation for each item
    return subs.filter((s) => s && typeof s === 'object' && typeof s.provider === 'string').map((s) => ({
      provider: String(s.provider).trim(),
      secret: String(s.secret || '').trim(),
      extra: String(s.extra || '').trim(),
      alias: String(s.alias || '').trim(),
      active: s.active !== false,
    }))
  } catch (err) {
    if (err.message.includes('auth') || err.message.includes('tag')) {
      throw new Error('Invalid passphrase or corrupted backup package')
    }
    throw err
  }
}
