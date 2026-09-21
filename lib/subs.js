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

import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'

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

export { fetchWithTimeout, parseOpenCodeWorkspaceId, fetchCommandCodeQuota, clearSubCache, setProviderLogger }

let subsLogger = null
export function setSubsLogger(logger) {
  subsLogger = logger
}

export class CredentialStore {
  constructor(dir) {
    this.dir = dir
    this.path = join(dir, 'subs.json')
    this.creds = new Map() // subId -> { provider, kind, secret, extra, label, updatedAt }
    this.meta = {}
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
          if (v && typeof v === 'object' && typeof v.secret === 'string') {
            this.creds.set(id, { ...v, id })
          }
        }
      } else if (raw && typeof raw === 'object') {
        // legacy flat map {id: secret}
        for (const [id, secret] of Object.entries(raw)) {
          if (typeof secret === 'string') this.creds.set(id, { id, provider: id, kind: 'api_key', secret, extra: '', label: '' })
        }
      }
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
      }
    }
    const creds = {}
    for (const [id, v] of this.creds) {
      creds[id] = { provider: v.provider, kind: v.kind, secret: v.credentialRef ? '' : (v.secret || ''), extra: v.extra || '', label: v.label || '', credentialRef: v.credentialRef || '', updatedAt: v.updatedAt }
    }
    try {
      const tmp = `${this.path}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`
      writeFileSync(tmp, JSON.stringify({ credentials: creds, meta: this.meta }, null, 2))
      renameSync(tmp, this.path)
    } catch (err) {
      subsLogger?.warn?.('[dsh-key-limits] CredentialStore save error:', err.message)
    }
  }
  list() {
    return [...this.creds.values()].map((v) => ({ id: v.id, provider: v.provider, kind: v.kind, label: v.label || '', extra: v.extra || '', updatedAt: v.updatedAt }))
  }
  get(id) { return this.creds.get(id) }
  upsert(id, { provider, kind, secret, extra, label, credentialRef }) {
    const prev = this.creds.get(id)
    const next = {
      id,
      provider: provider || (prev && prev.provider) || id,
      kind: kind || (prev && prev.kind) || 'api_key',
      secret,
      extra: extra || '',
      label: label || '',
      credentialRef: String(credentialRef || (prev && prev.credentialRef) || '').trim(),
      updatedAt: Date.now(),
    }
    this.creds.set(id, next)
    this.meta[id] = {
      ...this.meta[id],
      fingerprint: credentialFingerprint(next.secret, next.extra),
      credentialRef: next.credentialRef || undefined,
    }
    this._save()
  }
  remove(id) { this.creds.delete(id); delete this.meta[id]; this._save() }
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
  if (!def) return { id: entry.id, name: entry.provider, kind: "api_key", status: "unsupported", message: `unknown provider ${entry.provider}`, checkedAt: Date.now() }
  try {
    const cred = store.get(entry.id)
    if (!cred || !cred.secret) return { id: entry.id, name: entry.provider, kind: def.kind, status: "error", message: "no credential found", checkedAt: Date.now() }
    const partial = await def.fetch(cred.secret, cred.extra)
    return {
      id: entry.id, name: entry.label || def.label || entry.provider, provider: entry.provider,
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
    return { id: entry.id, name: entry.provider, provider: entry.provider, kind: def.kind, status: "error", message: String((e && e.message) || e).slice(0, 200), checkedAt: Date.now() }
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

