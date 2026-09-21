// lib/http-utils.js — HTTP request/response helpers and credential ref resolution

export function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

export function readQuery(req) {
  try {
    const u = new URL(req.url || '/', 'http://x')
    const out = {}
    for (const [k, v] of u.searchParams.entries()) out[k] = v
    return out
  } catch {
    return {}
  }
}

export async function readJsonBody(req, logger = null) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text.trim()) return {}
  try {
    return JSON.parse(text)
  } catch (err) {
    logger?.warn?.('[dsh-key-limits] readJsonBody JSON.parse failed:', err && err.message)
    return {}
  }
}

export async function toCredentialRef(name) {
  try {
    const mod = await import('@deepseek-ai/dsh-credentials')
    if (typeof mod.credentialRef === 'function') return mod.credentialRef(name)
  } catch { /* unit tests / bare node */ }
  return { type: 'env', name: String(name || '') }
}

export function defaultCredRef(id) {
  return ('DSH_KEY_LIMITS_' + String(id || 'sub')).toUpperCase().replace(/[^A-Z0-9_]+/g, '_')
}
