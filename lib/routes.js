// lib/routes.js — HTTP REST API route handlers
import { PROVIDERS, providerSchemas } from './subs.js'
import {
  json,
  readQuery,
  readJsonBody,
  isTrustedSettingsRequest,
  MAX_BACKUP_BODY_BYTES,
  MAX_BACKUP_ENTRIES,
} from './http-utils.js'
import { encryptBackup, decryptBackup } from './crypto-backup.js'

export function registerRoutes(ctx, {
  ROUTE_PREFIX,
  SETTINGS_NS,
  credStore,
  sessionTracker,
  subManager,
  getConfig,
  describeRow,
  getSettingsSvc,
  logger,
}) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/health`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
      return json(res, 200, { ok: true, name: 'dsh-key-limits', status: 'healthy' })
    },
  }), 'key-limits: health')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/config`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
      if (!isTrustedSettingsRequest(req)) {
        return json(res, 403, { error: 'forbidden: cross-site request rejected' })
      }
      const cfg = getConfig()
      return json(res, 200, {
        ui: cfg.ui || {},
        refreshHours: cfg.refreshHours,
        schemas: providerSchemas(),
        providers: Object.keys(PROVIDERS),
      })
    },
  }), 'key-limits: config')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/active-sub`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
      if (!isTrustedSettingsRequest(req)) {
        return json(res, 403, { error: 'forbidden: cross-site request rejected' })
      }
      const q = readQuery(req)
      const sessionId = q.sessionId || ''
      if (!sessionId) return json(res, 400, { error: 'sessionId required' })
      return json(res, 200, await sessionTracker.buildActiveSub(sessionId))
    },
  }), 'key-limits: active-sub')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/subs`,
    handler: async (req, res) => {
      try {
        if (!isTrustedSettingsRequest(req)) {
          return json(res, 403, { error: 'forbidden: cross-site request rejected' })
        }
        if (req.method === 'GET') {
          const q = readQuery(req)
          const force = q.refresh === '1' || q.refresh === 'true'
          const subId = q.id || q.subId || ''
          const sessionId = q.sessionId || ''
          const refreshMs = subManager.getRefreshIntervalMs()
          const subsCache = subManager.getCache()
          const stale = !subsCache.at || Date.now() - subsCache.at >= refreshMs
          const refreshing = subsCache.refreshInFlight != null
          if (force) {
            if (subId) void subManager.refreshSubCard(subId).catch((err) => { logger?.warn?.('[dsh-key-limits] force refreshSubCard error:', err && err.message) })
            else void subManager.refreshSubCards(true).catch((err) => { logger?.warn?.('[dsh-key-limits] force refreshSubCards error:', err && err.message) })
          } else if (stale && !refreshing) {
            void subManager.refreshSubCards(true).catch((err) => { logger?.warn?.('[dsh-key-limits] stale refreshSubCards error:', err && err.message) })
          }
          const subscriptions = await subManager.buildSubsList({ activeSubId: q.activeSubId || null, sessionId })
          return json(res, 200, {
            providers: Object.keys(PROVIDERS),
            providerSchemas: providerSchemas(),
            subscriptions,
            refreshedAt: subsCache.at || null,
            stale: stale && !refreshing,
            refreshing: subsCache.refreshInFlight != null,
          })
        }
        if (req.method === 'POST') {
          let body
          try {
            body = await readJsonBody(req, logger)
          } catch (err) {
            if (err?.status === 413 || err?.code === 'PAYLOAD_TOO_LARGE') {
              return json(res, 413, { error: 'payload too large: request body exceeds limit' })
            }
            return json(res, 400, { error: 'invalid json body' })
          }
          const r = await subManager.upsertSubFromBody(body)
          if (r.error) {
            const isSaveErr = r.error.includes('failed to save subscription')
            return json(res, isSaveErr ? 500 : 400, { error: r.error })
          }
          subManager.clearCache()
          await subManager.refreshSubCards(true)
          return json(res, 200, r)
        }
        if (req.method === 'DELETE') {
          const u = new URL(req.url || '/', 'http://x')
          const id = u.searchParams.get('id')
          if (!id) return json(res, 400, { error: 'missing id' })
          try {
            credStore.remove(id)
          } catch (err) {
            return json(res, 500, { error: `failed to remove subscription: ${err?.message || 'disk write error'}` })
          }
          subManager.clearCache()
          return json(res, 200, { ok: true })
        }
        return json(res, 405, { error: 'method not allowed' })
      } catch (e) {
        return json(res, 500, { error: String((e && e.message) || e) })
      }
    },
  }), 'key-limits: subs')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/refresh-all`,
    handler: async (req, res) => {
      try {
        if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
        if (!isTrustedSettingsRequest(req)) {
          return json(res, 403, { error: 'forbidden: cross-site request rejected' })
        }
        subManager.clearCache()
        const cards = await subManager.refreshSubCards(true)
        return json(res, 200, { ok: true, count: cards.length, cards })
      } catch (err) {
        return json(res, 500, { error: String((err && err.message) || err) })
      }
    },
  }), 'key-limits: refresh-all')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/export`,
    handler: async (req, res) => {
      try {
        if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
        if (!isTrustedSettingsRequest(req)) {
          return json(res, 403, { error: 'forbidden: cross-site request rejected' })
        }
        await subManager.hydrateSecretsFromCredentials()
        let body
        try {
          body = await readJsonBody(req, logger)
        } catch (err) {
          if (err?.status === 413 || err?.code === 'PAYLOAD_TOO_LARGE') {
            return json(res, 413, { error: 'payload too large: request body exceeds limit' })
          }
          return json(res, 400, { error: 'invalid json body' })
        }
        const passphrase = body?.passphrase
        if (!passphrase || String(passphrase).trim().length < 4) {
          return json(res, 400, { error: 'passphrase must be at least 4 characters long' })
        }
        const subs = credStore.list()
        if (subs.length > MAX_BACKUP_ENTRIES) {
          return json(res, 400, { error: `cannot export ${subs.length} subscriptions: limit is ${MAX_BACKUP_ENTRIES}` })
        }
        const fullSubs = []
        const warnings = []
        for (const s of subs) {
          const cred = credStore.get(s.id)
          const secret = cred?.secret || ''
          const extra = cred?.extra || ''
          if (!secret && cred?.credentialRef) {
            warnings.push({
              id: s.id,
              provider: s.provider,
              warning: 'unresolved_credential',
            })
          }
          fullSubs.push({
            id: s.id,
            provider: s.provider,
            secret,
            extra,
            alias: s.label || '',
            label: s.label || '',
            active: s.active !== false,
          })
        }
        const cfg = getConfig()
        const uiConfig = cfg.ui ? {
          order: Array.isArray(cfg.ui.order) ? cfg.ui.order : [],
          activeOnTop: cfg.ui.activeOnTop !== false,
          floatChip: cfg.ui.floatChip !== false,
          composerBar: cfg.ui.composerBar !== false,
        } : null
        const backup = encryptBackup(passphrase, fullSubs, { ui: uiConfig })

        // Symmetrically verify exported envelope against import limit
        const serializedEnvelope = JSON.stringify({ passphrase: 'x'.repeat(passphrase.length), backup })
        const envelopeBytes = Buffer.byteLength(serializedEnvelope, 'utf8')
        if (envelopeBytes > MAX_BACKUP_BODY_BYTES) {
          return json(res, 400, {
            error: `exported backup size (${envelopeBytes} bytes) exceeds import limit of ${MAX_BACKUP_BODY_BYTES} bytes`,
          })
        }

        const warningMsg = warnings.length > 0
          ? `${warnings.length} subscription(s) have unresolved credentials`
          : null

        return json(res, 200, {
          ok: true,
          count: fullSubs.length,
          backup,
          warning: warningMsg,
          warnings: warnings.length > 0 ? warnings : null,
          errors: null,
        })
      } catch (err) {
        return json(res, 500, { error: String((err && err.message) || err) })
      }
    },
  }), 'key-limits: export')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${ROUTE_PREFIX}/import`,
    handler: async (req, res) => {
      try {
        if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
        if (!isTrustedSettingsRequest(req)) {
          return json(res, 403, { error: 'forbidden: cross-site request rejected' })
        }
        let body
        try {
          body = await readJsonBody(req, logger, MAX_BACKUP_BODY_BYTES)
        } catch (err) {
          if (err?.status === 413 || err?.code === 'PAYLOAD_TOO_LARGE') {
            return json(res, 413, { error: 'payload too large: request body exceeds limit' })
          }
          return json(res, 400, { error: 'invalid json body' })
        }
        const { passphrase, backup } = body || {}
        if (!passphrase || !backup) {
          return json(res, 400, { error: 'both passphrase and backup payload are required' })
        }
        let restored
        try {
          restored = decryptBackup(passphrase, backup)
        } catch (decErr) {
          return json(res, 400, { error: decErr.message || 'failed to decrypt backup' })
        }
        if (!Array.isArray(restored)) {
          return json(res, 400, { error: 'restored backup payload must be a subscription array' })
        }
        if (restored.length > MAX_BACKUP_ENTRIES) {
          return json(res, 400, { error: `backup contains ${restored.length} entries, exceeding limit of ${MAX_BACKUP_ENTRIES}` })
        }

        // Restore UI configuration if present in backup
        let uiPersistWarning = null
        if (restored.ui && typeof restored.ui === 'object') {
          const cfg = getConfig()
          const targetUi = {
            ...(cfg.ui || {}),
            order: Array.isArray(restored.ui.order) ? restored.ui.order : [],
            activeOnTop: restored.ui.activeOnTop !== false,
            floatChip: restored.ui.floatChip !== false,
            composerBar: restored.ui.composerBar !== false,
          }
          const row = describeRow()
          const settingsSvc = getSettingsSvc()
          if (row && settingsSvc && typeof settingsSvc.update === 'function') {
            try {
              await settingsSvc.update(row.ns, { ui: targetUi }, row.revision)
              cfg.ui = targetUi
            } catch (uiErr) {
              logger?.warn?.('[dsh-key-limits] failed to persist imported ui config:', uiErr && uiErr.message)
              uiPersistWarning = 'failed to persist imported UI configuration'
            }
          } else {
            logger?.warn?.('[dsh-key-limits] settings service unavailable to persist imported ui config')
            uiPersistWarning = 'failed to persist imported UI configuration'
          }
        }

        const results = []
        let importedCount = 0
        for (const item of restored) {
          const r = await subManager.upsertSubFromBody(item)
          if (r.error) {
            results.push({ id: item.id || null, provider: item.provider, ok: false, error: r.error })
          } else {
            importedCount++
            results.push({ id: r.id, provider: item.provider, ok: true })
          }
        }
        subManager.clearCache()
        await subManager.refreshSubCards(true)
        const cfg = getConfig()
        const subscriptions = await subManager.buildSubsList()
        const responseData = {
          ok: true,
          count: restored.length,
          importedCount,
          results,
          cards: subscriptions,
          subscriptions,
          ui: cfg.ui || {},
        }
        if (uiPersistWarning) {
          responseData.warning = uiPersistWarning
          responseData.warnings = [{ id: 'ui_config', warning: 'settings_update_failed' }]
        }
        return json(res, 200, responseData)
      } catch (err) {
        return json(res, 400, { error: String((err && err.message) || err) })
      }
    },
  }), 'key-limits: import')
}
