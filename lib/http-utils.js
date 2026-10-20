// lib/http-utils.js — HTTP request/response helpers and credential ref resolution

export const DEFAULT_MAX_BODY_BYTES = 64 * 1024 // 64 KB
export const MAX_BACKUP_BODY_BYTES = 8 * 1024 * 1024 // 8 MB for export/import
export const MAX_BACKUP_ENTRIES = 500

export class PayloadTooLargeError extends Error {
  constructor(message = "payload too large: request body exceeds limit", limit = DEFAULT_MAX_BODY_BYTES) {
    super(message)
    this.name = "PayloadTooLargeError"
    this.status = 413
    this.code = "PAYLOAD_TOO_LARGE"
    this.limit = limit
  }
}

export class JsonParseError extends Error {
  constructor(message = "invalid json body") {
    super(message)
    this.name = "JsonParseError"
    this.status = 400
    this.code = "INVALID_JSON_BODY"
  }
}

export function json(res, status, body, headers = {}) {
  const mergedHeaders = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...(status === 413 ? { "connection": "close" } : {}),
    ...headers,
  }
  res.writeHead(status, mergedHeaders)
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
      if (typeof req.resume === "function") req.resume()
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
    throw new JsonParseError(`invalid json body: ${err?.message || "syntax error"}`)
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

export function defaultExtraCredRef(id) {
  return defaultCredRef(id) + "_EXTRA"
}

export function isLoopbackAddress(ip) {
  if (!ip || typeof ip !== "string") return false
  let clean = ip.trim().toLowerCase().replace(/^\[|\]$/g, "")
  if (clean.startsWith("::ffff:")) clean = clean.slice(7)
  return (
    clean === "localhost" ||
    clean === "localhost." ||
    clean === "127.0.0.1" ||
    clean === "::1" ||
    clean.startsWith("127.")
  )
}

export function isLanAddress(ip) {
  if (!ip || typeof ip !== "string") return false
  let clean = ip.trim().toLowerCase().replace(/^\[|\]$/g, "")
  if (clean.startsWith("::ffff:")) clean = clean.slice(7)
  if (isLoopbackAddress(clean)) return true
  if (clean.startsWith("10.") || clean.startsWith("192.168.")) return true
  const match172 = clean.match(/^172\.(\d+)\./)
  if (match172) {
    const octet = parseInt(match172[1], 10)
    if (octet >= 16 && octet <= 31) return true
  }
  return false
}

export function isTrustedAddress(ipOrHost) {
  if (!ipOrHost || typeof ipOrHost !== "string") return false
  let h = ipOrHost.trim().toLowerCase()
  if (h.startsWith("::ffff:")) {
    h = h.slice(7)
  }
  if (h.startsWith("[")) {
    const end = h.indexOf("]")
    if (end > 0) {
      h = h.slice(1, end)
    }
  } else if (!h.includes("::") && (h.match(/:/g) || []).length === 1) {
    h = h.split(":")[0]
  }
  if (!h) return false
  if (h === "localhost" || h === "localhost." || h.endsWith(".local")) return true
  return isLoopbackAddress(h) || isLanAddress(h)
}

export function isLoopback(value) {
  return isLoopbackAddress(value)
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

  // Enforce trusted remote address when socket/connection is present (block public WAN callers)
  const remote = request.socket?.remoteAddress || request.connection?.remoteAddress || ""
  if (remote && !isTrustedAddress(remote)) {
    return false
  }

  const rawHost = headers.host || headers["x-forwarded-host"]

  // Enforce trusted Host header when present (reject external DNS rebinding / host spoofing)
  if (rawHost && !isTrustedAddress(rawHost)) {
    return false
  }

  const secFetchSite = typeof headers["sec-fetch-site"] === "string" ? headers["sec-fetch-site"].trim().toLowerCase() : ""
  if (secFetchSite === "cross-site") {
    return false
  }

  const origin = headers.origin

  // If Origin header is present, it MUST match Host and target a trusted address
  if (origin && typeof origin === "string") {
    if (!rawHost || typeof rawHost !== "string" || !rawHost.trim()) {
      return false
    }
    const expectedHost = rawHost.trim().toLowerCase()
    try {
      const u = new URL(origin)
      if (u.host.toLowerCase() !== expectedHost || !isTrustedAddress(u.hostname)) {
        return false
      }
    } catch {
      return false
    }
  }

  // Explicit internal caller header: only trusted when remote and Host are loopback or LAN (#155)
  const internalAuth = headers["x-dsh-internal-auth"]
  if (internalAuth === "true" || internalAuth === "1") {
    const remoteOk = !remote || isTrustedAddress(remote)
    const hostOk = !rawHost || isTrustedAddress(rawHost)
    if (remoteOk && hostOk) {
      return true
    }
    return false
  }

  // For non-internal requests, Host is mandatory and must be trusted loopback/LAN
  if (!rawHost || typeof rawHost !== "string" || !rawHost.trim() || !isTrustedAddress(rawHost)) {
    return false
  }
  const expectedHost = rawHost.trim().toLowerCase()

  let hasValidOrigin = false
  if (origin && typeof origin === "string") {
    hasValidOrigin = true
  }

  let hasValidReferer = false
  let isCustomSchemeReferer = false
  const referer = headers.referer
  if (referer && typeof referer === "string") {
    try {
      const u = new URL(referer)
      if (u.protocol === "http:" || u.protocol === "https:") {
        if (u.host.toLowerCase() !== expectedHost || !isTrustedAddress(u.hostname)) {
          return false
        }
        hasValidReferer = true
      } else {
        isCustomSchemeReferer = true
      }
    } catch {
      return false
    }
  }

  const hasValidSecFetchSite = (
    secFetchSite === "same-origin" ||
    secFetchSite === "same-site" ||
    secFetchSite === "none"
  )

  const expectedHostName = expectedHost.split(":")[0]
  const isLoopbackRemote = isLoopback(remote) || (!remote && isLoopback(expectedHostName))

  // Non-http custom scheme referer (e.g. dsh-app:// in DSH Desktop Electron) is trusted from loopback
  if (isCustomSchemeReferer && isLoopbackRemote) {
    hasValidReferer = true
  }

  if (hasValidOrigin || hasValidReferer || hasValidSecFetchSite) {
    return true
  }

  return false
}

/**
 * Safely resolve the DSH connection service from context or request.
 *
 * @param {object} ctx
 * @returns {object|undefined}
 */
export function getConnection(ctx) {
  try {
    return ctx?.reflect?.get ? ctx.reflect.get('connection') : (ctx?.get ? (ctx.get('connection') ?? ctx.connection) : ctx?.connection)
  } catch {
    return undefined
  }
}

/**
 * Session-aware authorization gate for plugin routes (#166).
 * Enforces:
 * 1. CSRF, Origin/Host, and network perimeter validation (isTrustedSettingsRequest).
 * 2. Canonical DSH connection.requestRejection(req) session admission.
 * 3. Rejection of unauthenticated LAN / remote callers (LAN is not authentication).
 * 4. Fail-closed handling for unauthenticated remote callers.
 *
 * @param {object} ctx - Cordis context
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {object} [options]
 * @param {boolean} [options.allowLoopbackHealth] - Allow loopback healthcheck probes without DSH session
 * @param {boolean} [options.requireStrictAuth] - Enforce session authentication strictly (e.g. export/import)
 * @returns {boolean} true if authorized, false if rejected (response already sent)
 */
export function authorizeSettingsRequest(ctx, req, res, options = {}) {
  // 1. Layer 1: CSRF, Origin/Host matching, and remote network boundary
  if (!isTrustedSettingsRequest(req)) {
    const error = options.allowLoopbackHealth ? 'forbidden' : 'forbidden: cross-site request rejected'
    json(res, 403, { ok: false, error })
    return false
  }

  const remote = req.socket?.remoteAddress || req.connection?.remoteAddress || ''
  const hostHeader = req.headers?.host || req.headers?.['x-forwarded-host'] || ''
  const hostName = hostHeader.split(':')[0].toLowerCase()
  const internalAuth = req.headers?.['x-dsh-internal-auth']
  const isInternal = internalAuth === 'true' || internalAuth === '1'
  const isLoop = isLoopback(remote) || (!remote && (isLoopback(hostName) || isInternal))

  // Allow unauthenticated loopback GET /health probes (e.g. systemd/curl probes)
  if (options.allowLoopbackHealth && isLoop && req.method === 'GET') {
    return true
  }

  // 2. Layer 2: DSH Connection Service session authentication (#166)
  const conn = getConnection(ctx) || req.connectionService || req.connection
  if (conn && typeof conn.requestRejection === 'function') {
    let rejection
    try {
      rejection = conn.requestRejection(req)
    } catch {
      json(res, 503, { ok: false, error: 'authentication service unavailable' })
      return false
    }

    if (rejection !== undefined) {
      const status = rejection === 401 ? 401 : 403
      json(res, status, {
        ok: false,
        error: status === 401 ? 'unauthorized: DSH browser authentication required' : 'forbidden'
      })
      return false
    }

    return true
  }

  // 3. Fallback when connection service is not registered (e.g. standalone test runner):
  // Non-loopback remote callers (LAN / WAN) MUST NOT bypass authentication. Fail-closed!
  if (!isLoop) {
    json(res, 401, {
      ok: false,
      error: 'unauthorized: session authentication required for remote caller'
    })
    return false
  }

  return true
}
