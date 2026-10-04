import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptBackup, decryptBackup } from '../lib/crypto-backup.js';

test('encryptBackup and decryptBackup roundtrip successfully', () => {
  const sampleSubs = [
    { id: 'sub-1', provider: 'deepseek', secret: 'sk-test-deepseek-12345', extra: '', alias: 'Primary DS' },
    { id: 'sub-2', provider: 'groq', secret: 'gsk_test_groq_key_67890', extra: '', alias: 'Groq Fast' },
    { id: 'sub-3', provider: 'opencode-go', secret: 'Fe26.2.auth-token', extra: 'wrk_01test', alias: 'OpenCode Team' }
  ];

  const passphrase = 'super-secret-backup-pass!';
  const backup = encryptBackup(passphrase, sampleSubs);

  assert.equal(backup.version, 1);
  assert.equal(backup.format, 'dsh-key-limits-backup');
  assert.equal(backup.count, 3);
  assert.ok(backup.salt);
  assert.ok(backup.iv);
  assert.ok(backup.tag);
  assert.ok(backup.ciphertext);

  const restored = decryptBackup(passphrase, backup);
  assert.equal(restored.length, 3);
  assert.equal(restored[0].provider, 'deepseek');
  assert.equal(restored[0].secret, 'sk-test-deepseek-12345');
  assert.equal(restored[0].alias, 'Primary DS');
  assert.equal(restored[1].provider, 'groq');
  assert.equal(restored[2].extra, 'wrk_01test');
});

test('decryptBackup fails with incorrect passphrase', () => {
  const sampleSubs = [
    { provider: 'deepseek', secret: 'sk-123' }
  ];
  const backup = encryptBackup('correct-password-123', sampleSubs);

  assert.throws(() => {
    decryptBackup('wrong-password-999', backup);
  }, /Invalid passphrase/);
});

test('encryptBackup rejects passwords that are too short', () => {
  assert.throws(() => {
    encryptBackup('12', []);
  }, /Passphrase must be at least 4 characters/);
});

test('decryptBackup rejects malformed backup packages', () => {
  assert.throws(() => {
    decryptBackup('any-pass', null);
  }, /Invalid backup package/);

  assert.throws(() => {
    decryptBackup('any-pass', { version: 2 });
  }, /Unsupported or corrupt backup package/);

  assert.throws(() => {
    decryptBackup('any-pass', { version: 1, format: 'dsh-key-limits-backup' });
  }, /Missing required cryptographic parameters/);
});
