// lib/subs.js — host-half provider quota/balance fetchers for the
// Subscriptions manager, ported from TokenTracker direct-subscriptions
//
// Storage (under the plugin storage dir, next to (no ledger)):
//   subs.json  { credentials: { "<subId>": { credentialRef, meta… } }, meta: {...} }
//   Secrets live in DSH credentials service; plaintext secret field is legacy-only.
//
// Credentials are host-side secrets: they never leave the host. The client
// only receives normalized subscription cards (status/percent/checkedAt), not
// the secrets. UI "add subscription" writes a credential via the host API.

import { mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, chmodSync } from 'node:fs'
import { join } from 'node:path'
import { defaultCredRef, defaultExtraCredRef } from './http-utils.js'

import {
  fetchWithTimeout,
  clearSubCache,
  md8,
  parseOpenCodeWorkspaceId,
  fetchOpenCodeGoQuota,
  fetchOllamaQuota,
  fetchQwenQuota,
  fetchKimiQuota,
  fetchGlmQuota,
  fetchMinimaxQuota,
  fetchClineQuota,
  fetchDeepSeekBalance,
  fetchOpenRouterBalance,
  fetchCommandCodeQuota,
  setProviderLogger,
} from './provider-fetchers.js'
import {
  fetchSiliconFlowBalance,
  fetchGroqQuota,
  fetchAnthropicQuota,
  fetchGeminiQuota,
} from './provider-extra-fetchers.js'

export { fetchWithTimeout, parseOpenCodeWorkspaceId, fetchCommandCodeQuota, clearSubCache, setProviderLogger }

let subsLogger = null
export function setSubsLogger(logger) {
  subsLogger = logger
}

export function isExtraSecret(provider) {
  const def = PROVIDERS[provider]
  if (!def || !Array.isArray(def.fields)) return false
  const extraField = def.fields.find((f) => f.key === 'extra')
  return Boolean(extraField && extraField.secret === true)
}

export class CredentialStore {
  constructor(dir) {
    this.dir = dir
    this.path = join(dir, 'subs.json')
    this.creds = new Map() // subId -> { provider, kind, secret, extra, label, credentialRef, extraCredentialRef, updatedAt, rev }
    this.meta = {}
    this.rev = 1
    this._load()
  }
  _load() {
    try {
      const raw = JSON.parse(readFileSync(this.path, 'utf8'))
      if (raw && typeof raw === 'object' && raw.meta && typeof raw.meta === 'object') {
        this.meta = { ...raw.meta }
      }
      if (raw && typeof raw === 'object' && raw.credentials && typeof raw.credentials === 'object') {
        for (const [id, v] of Object.entries(raw.credentials)) {
          if (v && typeof v === 'object') {
            const secretExtra = isExtraSecret(v.provider)
            this.creds.set(id, {
              ...v,
              id,
              secret: typeof v.secret === 'string' ? v.secret : '',
              extra: typeof v.extra === 'string' ? v.extra : '',
              credentialRef: v.credentialRef || defaultCredRef(id),
              extraCredentialRef: v.extraCredentialRef || (secretExtra ? defaultExtraCredRef(id) : undefined),
              rev: typeof v.rev === 'number' ? v.rev : 1,
            })
          }
        }
      } else if (raw && typeof raw === 'object') {
        // legacy flat map {id: secret}
        for (const [id, secret] of Object.entries(raw)) {
          if (typeof secret === 'string') {
            this.creds.set(id, {
              id,
              provider: id,
              kind: 'api_key',
              secret,
              extra: '',
              label: '',
              credentialRef: defaultCredRef(id),
              rev: 1,
            })
          }
        }
      }
      let maxRev = 1
      for (const c of this.creds.values()) {
        if (typeof c.rev === 'number' && c.rev > maxRev) maxRev = c.rev
      }
      this.rev = maxRev
    } catch (err) {
      if (err && err.code !== 'ENOENT') {
        subsLogger?.warn?.('[dsh-key-limits] CredentialStore read error:', err.message)
      }
    }
  }
  _save() {
    try {
      mkdirSync(this.dir, { recursive: true })
    } catch (err) {
      if (err && err.code !== 'EEXIST') {
        subsLogger?.warn?.('[dsh-key-limits] CredentialStore mkdir error:', err.message)
        throw err
      }
    }
    const creds = {}
    for (const [id, v] of this.creds) {
      const ref = v.credentialRef || defaultCredRef(id)
      const secretExtra = isExtraSecret(v.provider)
      const extraRef = secretExtra ? (v.extraCredentialRef || defaultExtraCredRef(id)) : undefined
      creds[id] = {
        provider: v.provider,
        kind: v.kind,
        secret: '',
        extra: secretExtra ? '' : (v.extra || ''),
        label: v.label || '',
        credentialRef: ref,
        extraCredentialRef: extraRef,
        updatedAt: v.updatedAt,
        rev: v.rev || 1,
      }
    }
    let tmp = null
    try {
      tmp = `${this.path}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`
      writeFileSync(tmp, JSON.stringify({ credentials: creds, meta: this.meta }, null, 2), { mode: 0o600 })
      try { chmodSync(tmp, 0o600) } catch (e) { /* best-effort on Windows or restricted fs */ }
      renameSync(tmp, this.path)
      try { chmodSync(this.path, 0o600) } catch (e) { /* best-effort on Windows or restricted fs */ }
    } catch (err) {
      if (tmp) {
        try { unlinkSync(tmp) } catch (e) { /* best-effort tmp cleanup */ }
      }
      subsLogger?.warn?.('[dsh-key-limits] CredentialStore save error:', err.message)
      throw err
    }
  }
  list() {
    return [...this.creds.values()].map((v) => ({
      id: v.id,
      provider: v.provider,
      kind: v.kind,
      label: v.label || '',
      extra: v.extra || '',
      credentialRef: v.credentialRef,
      extraCredentialRef: v.extraCredentialRef,
      updatedAt: v.updatedAt,
      rev: v.rev || 1,
    }))
  }
  get(id) { return this.creds.get(id) }
  saveCards(cards, cardFromRefresh) {
    const prevMeta = JSON.parse(JSON.stringify(this.meta))
    for (const c of cards || []) {
      if (!c || !c.id) continue
      if (!this.creds.has(c.id)) {
        delete this.meta[c.id]
        continue
      }
      const currentCred = this.creds.get(c.id)
      if (c.rev != null && currentCred && currentCred.rev != null && c.rev !== currentCred.rev) {
        continue
      }
      const prev = this.meta[c.id]
      const prevCard = prev?.card
      let card = typeof cardFromRefresh === 'function' ? cardFromRefresh(c) : c
      if (c.status === 'error' && prevCard && prevCard.status === 'ok') {
        const msg = String(c.message || '').toLowerCase()
        if (msg.includes('fetch failed') || msg.includes('econnreset') || msg.includes('timeout') || msg.includes('socket')) {
          card = { ...prevCard, stale: true }
        }
      }
      this.meta[c.id] = {
        ...prev,
        label: c.name || prev?.label || c.id,
        provider: c.provider || prev?.provider,
        card,
      }
    }
    try {
      this._save()
    } catch (err) {
      this.meta = prevMeta
      throw err
    }
  }
  upsert(id, { provider, kind, secret, extra, label, credentialRef, extraCredentialRef }) {
    const prev = this.creds.get(id)
    const prevMeta = this.meta[id] ? { ...this.meta[id] } : undefined
    const prevRev = this.rev
    const nextRev = (this.rev = (this.rev || 0) + 1)
    const next = {
      id,
      provider: provider || (prev && prev.provider) || id,
      kind: kind || (prev && prev.kind) || 'api_key',
      secret: secret !== undefined ? secret : (prev && prev.secret) || '',
      extra: extra !== undefined ? extra : (prev && prev.extra) || '',
      label: label !== undefined ? label : (prev && prev.label) || '',
      credentialRef: String(credentialRef || (prev && prev.credentialRef) || defaultCredRef(id)).trim(),
      extraCredentialRef: String(extraCredentialRef || (prev && prev.extraCredentialRef) || '').trim() || undefined,
      updatedAt: Date.now(),
      rev: nextRev,
    }
    this.creds.set(id, next)
    this.meta[id] = {
      ...this.meta[id],
      fingerprint: credentialFingerprint(next.secret, next.extra),
      credentialRef: next.credentialRef || undefined,
      extraCredentialRef: next.extraCredentialRef || undefined,
    }
    try {
      this._save()
    } catch (err) {
      if (prev !== undefined) {
        this.creds.set(id, prev)
      } else {
        this.creds.delete(id)
      }
      if (prevMeta !== undefined) {
        this.meta[id] = prevMeta
      } else {
        delete this.meta[id]
      }
      this.rev = prevRev
      throw err
    }
  }
  remove(id) {
    const prev = this.creds.get(id)
    const prevMeta = this.meta[id] ? { ...this.meta[id] } : undefined
    const prevRev = this.rev
    this.creds.delete(id)
    delete this.meta[id]
    this.rev = (this.rev || 0) + 1
    try {
      this._save()
    } catch (err) {
      if (prev !== undefined) {
        this.creds.set(id, prev)
      }
      if (prevMeta !== undefined) {
        this.meta[id] = prevMeta
      }
      this.rev = prevRev
      throw err
    }
  }
  dirname() { return this.dir }
}

/** Stable id for POST /subs. String(undefined) is "undefined" (truthy) — never use it. */
export function allocateSubId(body, provider) {
  const raw = body && body.id
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  const p = String(provider || 'sub')
  return p + '-' + Math.random().toString(36).slice(2, 8)
}


// ---------------------------------------------------------------------------
/** Stable fingerprint for matching harness credential ↔ stored sub (never expose raw secret). */
export function credentialFingerprint(secret, extra = '') {
  return md8(String(secret || '') + '|' + String(extra || ''))
}

// ---------------------------------------------------------------------------
// Provider registry + client-safe field schemas (mirrors TT LIVE_CREDENTIAL_META)
// ---------------------------------------------------------------------------
export function providerSchemas() {
  const out = {}
  for (const [id, def] of Object.entries(PROVIDERS)) {
    out[id] = {
      id,
      label: def.label,
      kind: def.kind,
      hint: def.hint || '',
      fields: (def.fields || []).map((f) => ({
        key: f.key,
        label: f.label,
        placeholder: f.placeholder || '',
        secret: f.secret !== false,
        required: f.required !== false,
      })),
    }
  }
  return out
}

export const PROVIDERS = {
  'opencode-go': {
    kind: 'oauth',
    label: 'OpenCode GO',
    hint: 'DevTools → Application → Cookies on opencode.ai: auth cookie value. Workspace is the ID or full URL to /go.',
    fields: [
      { key: 'secret', label: 'Session cookie (auth=...)', placeholder: 'Fe26.2**...', secret: true, required: true },
      { key: 'extra', label: 'Workspace ID or URL', placeholder: 'wrk_01... or https://opencode.ai/workspace/wrk_01.../go', secret: false, required: true },
    ],
    fetch: fetchOpenCodeGoQuota,
  },
  ollama: {
    credentialRefs: ['OLLAMA_API_KEY'],
    kind: 'api_key',
    label: 'Ollama Cloud',
    hint: 'Ollama Cloud API key + session cookie from ollama.com. Key is used for POST /api/me, cookie for usage on /settings.',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'API key from Ollama Cloud', secret: true, required: true },
      { key: 'extra', label: 'Session cookie', placeholder: '__Secure-session value or full Cookie header', secret: true, required: true },
    ],
    fetch: fetchOllamaQuota,
  },
  qwen: {
    kind: 'oauth',
    label: 'Qwen Cloud',
    hint: 'Cookie from curl -b or Request Headers → cookie on home.qwencloud.com/analytics/token-plan/individual',
    fields: [
      { key: 'secret', label: 'Session cookie', placeholder: 'Cookie string from curl -b (all cookies joined by ;)', secret: true, required: true },
      { key: 'extra', label: 'sec_token (optional)', placeholder: 'from --data-raw sec_token=... if requests without cookie fail', secret: false, required: false },
    ],
    fetch: fetchQwenQuota,
  },
  kimi: {
    credentialRefs: ['KIMI_FOR_CODING_API_KEY', 'KIMI_API_KEY'],
    kind: 'api_key',
    label: 'Kimi for Coding',
    hint: 'Kimi for Coding API key (sk-kimi-...). JWT/cookie is not currently supported.',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'sk-kimi-...', secret: true, required: true },
    ],
    fetch: fetchKimiQuota,
  },
  glm: {
    credentialRefs: ['ZAI_API_KEY', 'GLM_API_KEY'],
    kind: 'api_key',
    label: 'GLM (Z.ai)',
    hint: 'API key from personal account on z.ai (sent in Authorization header without Bearer).',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'zai-...', secret: true, required: true },
    ],
    fetch: fetchGlmQuota,
  },
  minimax: {
    kind: 'api_key',
    label: 'MiniMax',
    hint: 'MiniMax Coding Plan API key (sk-cp-...).',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'sk-cp-...', secret: true, required: true },
    ],
    fetch: fetchMinimaxQuota,
  },
  cline: {
    credentialRefs: ['CLINE_API_KEY'],
    kind: 'api_key',
    label: 'Cline',
    hint: 'Bearer API key from cline.bot. Quotas: 5h / week / month (usage-limits).',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'Bearer token from Cline', secret: true, required: true },
    ],
    fetch: fetchClineQuota,
  },
  deepseek: {
    credentialRefs: ['DEEPSEEK_API_KEY'],
    kind: 'balance',
    label: 'DeepSeek',
    hint: 'API key — remaining balance in $ (GET api.deepseek.com/user/balance; CNY is converted to USD).',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'sk-...', secret: true, required: true },
    ],
    fetch: fetchDeepSeekBalance,
  },
  commandcode: {
    credentialRefs: ['COMMANDCODE_API_KEY'],
    kind: 'api_key',
    label: 'Command Code',
    hint: 'Command Code API key (user_... or COMMANDCODE_API_KEY). Quotas: 5h / weekly window.',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'user_...', secret: true, required: true },
    ],
    fetch: fetchCommandCodeQuota,
  },
  openrouter: {
    kind: 'balance',
    label: 'OpenRouter',
    hint: 'OpenRouter API key — shows $ balance (credits − usage).',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'sk-or-...', secret: true, required: true },
    ],
    fetch: fetchOpenRouterBalance,
  },
  siliconflow: {
    credentialRefs: ['SILICONFLOW_API_KEY', 'SILICON_API_KEY'],
    kind: 'balance',
    label: 'SiliconFlow',
    hint: 'SiliconFlow (SiliconCloud) API key (sk-...). Shows balance in ¥ and $.',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'sk-...', secret: true, required: true },
    ],
    fetch: fetchSiliconFlowBalance,
  },
  anthropic: {
    credentialRefs: ['ANTHROPIC_API_KEY'],
    kind: 'api_key',
    label: 'Anthropic',
    hint: 'Anthropic Console API key (sk-ant-...). Validates key and monitors rate limits.',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'sk-ant-...', secret: true, required: true },
    ],
    fetch: fetchAnthropicQuota,
  },
  groq: {
    credentialRefs: ['GROQ_API_KEY'],
    kind: 'api_key',
    label: 'Groq',
    hint: 'Groq API key (gsk_...). Shows live rate limit windows and tokens remaining.',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'gsk_...', secret: true, required: true },
    ],
    fetch: fetchGroqQuota,
  },
  gemini: {
    credentialRefs: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    kind: 'api_key',
    label: 'Google Gemini',
    hint: 'Google Gemini API key from Google AI Studio (AIzaSy...).',
    fields: [
      { key: 'secret', label: 'API key', placeholder: 'AIzaSy...', secret: true, required: true },
    ],
    fetch: fetchGeminiQuota,
  },
}

// ---------------------------------------------------------------------------
// Refresh all configured subscriptions
// ---------------------------------------------------------------------------
const REFRESH_CONCURRENCY = 4

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      try {
        results[i] = { status: 'fulfilled', value: await fn(items[i], i) }
      } catch (e) {
        results[i] = { status: 'rejected', reason: e }
      }
    }
  }
  const n = Math.min(concurrency, items.length)
  if (n > 0) await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}

export async function refreshSubscriptionEntry(store, entry) {
  const def = PROVIDERS[entry.provider]
  if (!def) return { id: entry.id, rev: entry.rev, name: entry.provider, kind: "api_key", status: "unsupported", message: `unknown provider ${entry.provider}`, checkedAt: Date.now() }
  try {
    const cred = store.get(entry.id)
    if (!cred || !cred.secret) return { id: entry.id, rev: entry.rev, name: entry.provider, kind: def.kind, status: "error", message: "no credential found", checkedAt: Date.now() }
    const partial = await def.fetch(cred.secret, cred.extra)
    return {
      id: entry.id, rev: entry.rev, name: entry.label || def.label || entry.provider, provider: entry.provider,
      kind: partial.kind || def.kind, status: partial.status || "ok",
      plan: partial.plan || null, message: partial.message || null, checkedAt: partial.checkedAt || Date.now(),
      remaining: partial.remaining ?? null, limit: partial.limit ?? null,
      currency: partial.currency || null,
      display: partial.display || null,
      spendWeek: partial.spendWeek ?? null,
      spendMonth: partial.spendMonth ?? null,
      primaryWindow: partial.primaryWindow || null, secondaryWindow: partial.secondaryWindow || null, tertiaryWindow: partial.tertiaryWindow || null,
    }
  } catch (e) {
    subsLogger?.warn?.(`[dsh-key-limits] refreshSubscriptionEntry error for ${entry.provider} (${entry.id}):`, e && e.message)
    return { id: entry.id, rev: entry.rev, name: entry.provider, provider: entry.provider, kind: def.kind, status: "error", message: String((e && e.message) || e).slice(0, 200), checkedAt: Date.now() }
  }
}

export async function refreshSubscriptions(store) {
  const list = store.list()
  const results = await mapPool(list, REFRESH_CONCURRENCY, async (entry) => refreshSubscriptionEntry(store, entry))
  const cards = []
  for (const r of results) if (r && r.status === "fulfilled" && r.value) cards.push(r.value)
  return cards
}

/* removed duplicate */

