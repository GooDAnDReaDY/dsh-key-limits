import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'

import {
  parseRateLimitResetSeconds,
  normalizeOpenCodeAuthCookie,
} from '../lib/provider-parsers.js'
import { fetchOpenCodeGoQuota } from '../lib/provider-fetchers.js'
import {
  refreshSubscriptionEntry,
  CredentialStore,
  PROVIDERS,
  providerSchemas,
} from '../lib/subs.js'
import { saveSubCards, loadSubs } from '../lib/cards.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const clientSource = readFileSync(join(root, 'lib/client.js'), 'utf8')
const srcSettingsSource = readFileSync(join(root, 'src/client/07-settings.js'), 'utf8')

// ---------------------------------------------------------------------------
// #108: ISO reset timestamp parsing does not get mangled by parseFloat
// ---------------------------------------------------------------------------
test('#108: parseRateLimitResetSeconds correctly parses ISO timestamps without year number truncation', () => {
  const iso = '2030-01-01T00:00:00.000Z'
  const expectedEpoch = Date.parse(iso)
  assert.equal(parseRateLimitResetSeconds(iso), expectedEpoch)

  const iso2 = '2027-06-15T12:30:00Z'
  assert.equal(parseRateLimitResetSeconds(iso2), Date.parse(iso2))

  // Pure numbers (seconds delta) must still work
  const beforeSec = Date.now()
  const resSec = parseRateLimitResetSeconds('60')
  assert.ok(resSec >= beforeSec + 59000 && resSec <= beforeSec + 61000)

  // Millisecond duration string
  const beforeMs = Date.now()
  const resMs = parseRateLimitResetSeconds('500ms')
  assert.ok(resMs >= beforeMs + 400 && resMs <= beforeMs + 600)

  // Epoch unix seconds
  assert.equal(parseRateLimitResetSeconds('1728130800'), 1728130800000)
})

// ---------------------------------------------------------------------------
// #101: OpenCode GO cookie header formatting without auth=auth_session= double wrap
// ---------------------------------------------------------------------------
test('#101: normalizeOpenCodeAuthCookie normalizes bare and prefixed tokens without duplication', () => {
  assert.equal(normalizeOpenCodeAuthCookie('AUTH_FAKE'), 'auth_session=AUTH_FAKE')
  assert.equal(normalizeOpenCodeAuthCookie('auth_session=AUTH_FAKE'), 'auth_session=AUTH_FAKE')
  assert.equal(normalizeOpenCodeAuthCookie('auth=AUTH_FAKE'), 'auth=AUTH_FAKE')
  assert.equal(normalizeOpenCodeAuthCookie('auth_session=AUTH_FAKE; path=/'), 'auth_session=AUTH_FAKE; path=/')
  assert.equal(normalizeOpenCodeAuthCookie(''), '')
})

test('#101: fetchOpenCodeGoQuota sends exact Cookie header without auth=auth_session= double wrap', async () => {
  let receivedCookieHeader = null
  const server = createServer((req, res) => {
    receivedCookieHeader = req.headers.cookie || null
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end('<html><body><div data-slot="50% used"></div></body></html>')
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port

  try {
    // Intercept fetch or call via mocked URL
    const originalFetch = globalThis.fetch
    globalThis.fetch = async (url, opts) => {
      if (typeof url === 'string' && url.includes('opencode.ai/workspace/wrk_test101/go')) {
        return originalFetch(`http://127.0.0.1:${port}/`, opts)
      }
      return originalFetch(url, opts)
    }

    try {
      await fetchOpenCodeGoQuota('BARE_SECRET_TOKEN', 'wrk_test101')
      assert.equal(receivedCookieHeader, 'auth_session=BARE_SECRET_TOKEN')

      await fetchOpenCodeGoQuota('auth_session=EXPLICIT_TOKEN', 'wrk_test101')
      assert.equal(receivedCookieHeader, 'auth_session=EXPLICIT_TOKEN')

      await fetchOpenCodeGoQuota('auth=AUTH_TOKEN', 'wrk_test101')
      assert.equal(receivedCookieHeader, 'auth=AUTH_TOKEN')
    } finally {
      globalThis.fetch = originalFetch
    }
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

// ---------------------------------------------------------------------------
// #100: AddKeyModal renders dynamic schema fields for multi-credential providers
// ---------------------------------------------------------------------------
test('#100: providerSchemas defines required and secret fields for ollama and opencode-go', () => {
  const schemas = providerSchemas()
  assert.ok(schemas['opencode-go'], 'opencode-go schema exists')
  assert.ok(schemas.ollama, 'ollama schema exists')

  const ogFields = schemas['opencode-go'].fields
  assert.equal(ogFields.length, 2)
  assert.equal(ogFields[0].key, 'secret')
  assert.equal(ogFields[0].required, true)
  assert.equal(ogFields[1].key, 'extra')
  assert.equal(ogFields[1].required, true)

  const olFields = schemas.ollama.fields
  assert.equal(olFields.length, 2)
  assert.equal(olFields[0].key, 'secret')
  assert.equal(olFields[1].key, 'extra')
  assert.equal(olFields[1].required, true)
})

test('#100: AddKeyModal client code iterates fields array and validates required inputs', () => {
  assert.doesNotMatch(srcSettingsSource, /schema&&schema\.extra/, 'src/client/07-settings.js does not check dead schema.extra')
  assert.doesNotMatch(clientSource, /schema&&schema\.extra/, 'lib/client.js does not check dead schema.extra')

  assert.match(srcSettingsSource, /fields\.map/, 'src/client/07-settings.js dynamically maps schema fields')
  assert.match(clientSource, /fields\.map/, 'lib/client.js dynamically maps schema fields')

  assert.match(srcSettingsSource, /f\.required/, 'src/client/07-settings.js validates required fields')
  assert.match(clientSource, /f\.required/, 'lib/client.js validates required fields')
})

// ---------------------------------------------------------------------------
// #99: Card normalization extracts nested balance, quota windows, and CNY
// ---------------------------------------------------------------------------
test('#99: refreshSubscriptionEntry extracts nested balance and quota windows from providers', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dsh-kl-test-99-'))
  try {
    const store = new CredentialStore(tempDir)

    // 1. SiliconFlow returns balance: { currency, remaining, cnyRemaining, message }
    store.upsert('sf-test', {
      provider: 'siliconflow',
      secret: 'sk-sf-test',
      label: 'SiliconFlow Test',
    })

    const originalSfFetch = PROVIDERS.siliconflow.fetch
    PROVIDERS.siliconflow.fetch = async () => ({
      status: 'ok',
      balance: {
        currency: '$',
        remaining: 19.66,
        cnyRemaining: 142.50,
        message: 'SiliconCloud: ¥142.50 ($19.66)',
      },
    })

    let cardSf
    try {
      cardSf = await refreshSubscriptionEntry(store, store.get('sf-test'))
    } finally {
      PROVIDERS.siliconflow.fetch = originalSfFetch
    }

    assert.equal(cardSf.kind, 'balance')
    assert.equal(cardSf.remaining, 19.66)
    assert.equal(cardSf.cnyRemaining, 142.50)
    assert.equal(cardSf.currency, '$')
    assert.equal(cardSf.message, 'SiliconCloud: ¥142.50 ($19.66)')

    // 2. Groq returns quota: { windows: [...] }
    store.upsert('groq-test', {
      provider: 'groq',
      secret: 'gsk-test',
      label: 'Groq Test',
    })

    const originalGroqFetch = PROVIDERS.groq.fetch
    PROVIDERS.groq.fetch = async () => ({
      status: 'ok',
      quota: {
        windows: [
          { id: 'req', label: 'Requests/min', remainingPercent: 85, resetsAt: 1728130800000 },
          { id: 'tok', label: 'Tokens/min', remainingPercent: 95, resetsAt: 1728130800000 },
        ],
        fetchedAt: Date.now(),
      },
    })

    let cardGroq
    try {
      cardGroq = await refreshSubscriptionEntry(store, store.get('groq-test'))
    } finally {
      PROVIDERS.groq.fetch = originalGroqFetch
    }

    assert.ok(cardGroq.primaryWindow, 'primaryWindow is populated from quota windows')
    assert.equal(cardGroq.primaryWindow.remainingPercent, 85)
    assert.ok(cardGroq.secondaryWindow, 'secondaryWindow is populated from quota windows')
    assert.equal(cardGroq.secondaryWindow.remainingPercent, 95)

    // 3. DeepSeek preserves cnyRemaining and cnyLimit through full pipeline
    store.upsert('ds-test', {
      provider: 'deepseek',
      secret: 'sk-ds-test',
      label: 'DeepSeek Test',
    })

    const originalDsFetch = PROVIDERS.deepseek.fetch
    PROVIDERS.deepseek.fetch = async () => ({
      status: 'ok',
      kind: 'balance',
      remaining: 25.50,
      limit: 100.00,
      currency: '$',
      cnyRemaining: 185.00,
      cnyLimit: 720.00,
      checkedAt: Date.now(),
    })

    let cardDs
    try {
      cardDs = await refreshSubscriptionEntry(store, store.get('ds-test'))
    } finally {
      PROVIDERS.deepseek.fetch = originalDsFetch
    }

    assert.equal(cardDs.cnyRemaining, 185.00)
    assert.equal(cardDs.cnyLimit, 720.00)

    // 4. Persistence roundtrip through saveSubCards and loadSubs
    saveSubCards(tempDir, [cardSf, cardDs], store)
    const loaded = loadSubs(tempDir)

    const loadedSf = loaded.find((s) => s.id === 'sf-test')
    assert.ok(loadedSf, 'SiliconFlow card loaded from disk')
    assert.equal(loadedSf.card.remaining, 19.66)
    assert.equal(loadedSf.card.cnyRemaining, 142.50)

    const loadedDs = loaded.find((s) => s.id === 'ds-test')
    assert.ok(loadedDs, 'DeepSeek card loaded from disk')
    assert.equal(loadedDs.card.remaining, 25.50)
    assert.equal(loadedDs.card.cnyRemaining, 185.00)
    assert.equal(loadedDs.card.cnyLimit, 720.00)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})
