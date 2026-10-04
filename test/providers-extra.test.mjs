import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSiliconFlowInfo,
  parseRateLimitResetSeconds,
  parseGroqRateLimits,
  parseAnthropicRateLimits
} from '../lib/provider-parsers.js';
import {
  fetchSiliconFlowBalance,
  fetchGroqQuota,
  fetchAnthropicQuota,
  fetchGeminiQuota
} from '../lib/provider-extra-fetchers.js';

test('parseSiliconFlowInfo parses balance, charge and currency', () => {
  const sample = {
    code: 20000,
    message: 'ok',
    data: {
      id: 'user-123',
      name: 'Tester',
      balance: '42.50',
      chargeBalance: '100.00',
      totalBalance: '142.50',
      currency: 'CNY'
    }
  };
  const parsed = parseSiliconFlowInfo(sample);
  assert.equal(parsed.cnyRemaining, 142.5);
  assert.equal(parsed.currency, '$');
  assert.ok(parsed.remaining > 0);
  assert.ok(parsed.message.includes('SiliconCloud: ¥142.50'));
});

test('parseRateLimitResetSeconds parses diverse time notations into epoch ms', () => {
  const now = Date.now();
  const reset15s = parseRateLimitResetSeconds('15s');
  assert.ok(reset15s >= now + 14000 && reset15s <= now + 16000);

  const reset500ms = parseRateLimitResetSeconds('500ms');
  assert.ok(reset500ms >= now + 400 && reset500ms <= now + 600);

  assert.equal(parseRateLimitResetSeconds(null), null);
  assert.equal(parseRateLimitResetSeconds(undefined), null);
  assert.equal(parseRateLimitResetSeconds('invalid'), null);
});

test('parseGroqRateLimits computes windows and resets correctly', () => {
  const headers = {
    'x-ratelimit-remaining-requests': '25',
    'x-ratelimit-limit-requests': '30',
    'x-ratelimit-reset-requests': '10s',
    'x-ratelimit-remaining-tokens': '4000',
    'x-ratelimit-limit-tokens': '6000',
    'x-ratelimit-reset-tokens': '20s'
  };
  const parsed = parseGroqRateLimits(headers);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].label, 'Requests');
  assert.equal(parsed[0].remainingPercent, 83);
  assert.ok(parsed[0].resetsAt > Date.now());
  assert.equal(parsed[1].label, 'Tokens/min');
  assert.equal(parsed[1].remainingPercent, 67);
  assert.ok(parsed[1].resetsAt > Date.now());
});

test('parseAnthropicRateLimits parses headers safely', () => {
  const resetIso = new Date(Date.now() + 60000).toISOString();
  const headers = {
    'anthropic-ratelimit-requests-remaining': '45',
    'anthropic-ratelimit-requests-limit': '50',
    'anthropic-ratelimit-requests-reset': resetIso,
    'anthropic-ratelimit-tokens-remaining': '80000',
    'anthropic-ratelimit-tokens-limit': '100000',
    'anthropic-ratelimit-tokens-reset': resetIso
  };
  const parsed = parseAnthropicRateLimits(headers);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].label, 'Requests');
  assert.equal(parsed[0].remainingPercent, 90);
  assert.equal(parsed[1].label, 'Tokens');
  assert.equal(parsed[1].remainingPercent, 80);
});

test('fetchGeminiQuota validates api key presence', async () => {
  const resEmpty = await fetchGeminiQuota('');
  assert.equal(resEmpty.status, 'error');
  assert.ok(resEmpty.message && resEmpty.message.includes('API key'));
});

test('fetchSiliconFlowBalance validates api key presence', async () => {
  const resEmpty = await fetchSiliconFlowBalance('');
  assert.equal(resEmpty.status, 'error');
  assert.ok(resEmpty.message && resEmpty.message.includes('API key'));
});

test('fetchGroqQuota validates api key presence', async () => {
  const resEmpty = await fetchGroqQuota('');
  assert.equal(resEmpty.status, 'error');
  assert.ok(resEmpty.message && resEmpty.message.includes('API key'));
});

test('fetchAnthropicQuota validates api key presence', async () => {
  const resEmpty = await fetchAnthropicQuota('');
  assert.equal(resEmpty.status, 'error');
  assert.ok(resEmpty.message && resEmpty.message.includes('API key'));
});
