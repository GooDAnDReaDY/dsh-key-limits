// lib/http-utils.js — HTTP request/response helpers and credential ref resolution

export const DEFAULT_MAX_BODY_BYTES = 64 * 1024 // 64 KB

export class PayloadTooLargeError extends Error {
  constructor(message = "payload too large: request body exceeds limit", limit = DEFAULT_MAX_BODY_BYTES) {
    super(message)
    this.name = "PayloadTooLargeError"
    this.status = 413
    this.code = "PAYLOAD_TOO_LARGE"
    this.limit = limit
  }
}

export function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" })
  res.end(JSON.stringify(body))
}

export function readQuery(req) {
  try {
    const u = new URL(req.url || "/", "http://x")
    const out = {}
    for (const [k, v] of u.searchParams.entries()) out[k] = v
    return out
  } catch {
    return {}
  }
}

export async function readJsonBody(req, logger = null, maxBytes = DEFAULT_MAX_BODY_BYTES) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBytes) {
      if (typeof req.destroy === "function") req.destroy()
      throw new PayloadTooLargeError(`payload exceeded limit of ${maxBytes} bytes`, maxBytes)
    }
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString("utf8")
  if (!text.trim()) return {}
  try {
    return JSON.parse(text)
  } catch (err) {
    logger?.warn?.("[dsh-key-limits] readJsonBody JSON.parse failed:", err && err.message)
    return {}
  }
}

export async function toCredentialRef(name) {
  try {
    const mod = await import("@deepseek-ai/dsh-credentials")
    if (typeof mod.credentialRef === "function") return mod.credentialRef(name)
  } catch { /* unit tests / bare node */ }
  return { type: "env", name: String(name || "") }
}

export function defaultCredRef(id) {
  return ("DSH_KEY_LIMITS_" + String(id || "sub")).toUpperCase().replace(/[^A-Z0-9_]+/g, "_")
}

/**
 * Validate that an incoming HTTP request is trusted for settings and credential access (CSRF / source defense).
 *
 * Enforces strict fail-closed validation:
 * - Rejects missing, null, or non-object request.
 * - Requires a valid Host or X-Forwarded-Host header.
 * - Rejects any explicit Sec-Fetch-Site: cross-site.
 * - If Origin header is present, validates that Origin host/port strictly matches Host / X-Forwarded-Host.
 * - If Referer header is present, validates that Referer host/port strictly matches Host / X-Forwarded-Host.
 * - Requires at least one verifiable source indicator:
 *     1) Origin matching Host
 *     2) Referer matching Host
 *     3) Sec-Fetch-Site in ( same-origin, same-site, none)
 *     4) Explicit internal caller header (x-dsh-internal-auth: 1 / true)
 * - Rejects requests with empty or missing source headers (fail-closed).
 *
 * @param {import(node:http).IncomingMessage} request
 * @returns {boolean}
 */
export function isTrustedSettingsRequest(request) {
  if (!request || typeof request !== "object") {
    return false
  }
  const headers = request.headers
  if (!headers || typeof headers !== "object") {
    return false
  }

  const internalAuth = headers["x-dsh-internal-auth"]
  if (internalAuth === "true" || internalAuth === "1") {
    return true
  }

  const rawHost = headers.host || headers["x-forwarded-host"]
  if (!rawHost || typeof rawHost !== "string" || !rawHost.trim()) {
    return false
  }
  const expectedHost = rawHost.trim().toLowerCase()

  const secFetchSite = typeof headers["sec-fetch-site"] === "string" ? headers["sec-fetch-site"].trim().toLowerCase() : ""
  if (secFetchSite === "cross-site") {
    return false
  }

  let hasValidOrigin = false
  const origin = headers.origin
  if (origin && typeof origin === "string") {
    try {
      const u = new URL(origin)
      if (u.host.toLowerCase() !== expectedHost) {
        return false
      }
      hasValidOrigin = true
    } catch {
      return false
    }
  }

  let hasValidReferer = false
  const referer = headers.referer
  if (referer && typeof referer === "string") {
    try {
      const u = new URL(referer)
      if (u.host.toLowerCase() !== expectedHost) {
        return false
      }
      hasValidReferer = true
    } catch {
      return false
    }
  }

  const hasValidSecFetchSite = (
    secFetchSite === "same-origin" ||
    secFetchSite === "same-site" ||
    secFetchSite === "none"
  )

  if (hasValidOrigin || hasValidReferer || hasValidSecFetchSite) {
    return true
  }

  return false
}
