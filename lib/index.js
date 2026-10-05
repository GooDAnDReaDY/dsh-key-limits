// @goodandready/dsh-key-limits — host: key/subscription quotas only
import z from '@deepseek-ai/schemastery'

import {
  CredentialStore,
  setSubsLogger,
  setProviderLogger,
} from './subs.js'
import { setCardsLogger } from './cards.js'
import { setExtraLogger } from './provider-extra-fetchers.js'
import { DEFAULT_STORE_DIR, ensureStoreDir } from './paths.js'
import { registerPluginUpdater } from './plugin-updater.js'
import { createSessionTracker, extractRouteFromEvent } from './session-tracker.js'
import { createSubManager } from './sub-manager.js'
import { registerRoutes } from './routes.js'

export const name = '@goodandready/dsh-key-limits'
export const inject = ['webServer', 'sessions', 'credentials', 'settings']

export const ROUTE_PREFIX = '/dsh-key-limits'
export const SETTINGS_NS = 'dsh-key-limits'

// Defensive polyfill for environments / runners with schemastery < 3.18.4
const proto = z?.Schema?.prototype || (typeof z?.number === 'function' ? Object.getPrototypeOf(z.number()) : null)
if (proto && typeof proto.volatile !== 'function') {
  proto.volatile = function volatile() {
    return typeof this.extra === 'function' ? this.extra('volatile', true) : this
  }
}

// Unwrap Volatile boxes before any caller reads a value
export function plainConfig(value) {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(plainConfig)
  if (typeof value.get === 'function') return plainConfig(value.get())
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plainConfig(v)]))
}

export const Config = z.object({
  storageDir: z.string().default(DEFAULT_STORE_DIR),
  refreshHours: z.number().volatile().default(24),
  ui: z.object({
    floatChip: z.boolean().volatile().default(true),
    composerBar: z.boolean().volatile().default(true),
    activeOnTop: z.boolean().volatile().default(true),
    order: z.array(z.string()).volatile().default([]),
  }).default({}),
})

export function apply(ctx, rawConfig) {
  let current = plainConfig(Config(plainConfig(rawConfig || {})))
  const getConfig = () => current
  const logger = typeof ctx.logger === 'function' ? ctx.logger('dsh-key-limits') : (ctx.logger || ctx)
  if (logger && logger.warn) {
    setProviderLogger(logger)
    setSubsLogger(logger)
    setCardsLogger(logger)
    setExtraLogger(logger)
  }

  const storeDir = ensureStoreDir(current.storageDir || DEFAULT_STORE_DIR)
  const credStore = new CredentialStore(storeDir)

  let settingsSvc = null
  const describeRow = () => {
    if (typeof settingsSvc?.describe !== 'function') return null
    try {
      return settingsSvc.describe().find((r) => r && r.ns === SETTINGS_NS) || null
    } catch (err) {
      logger?.warn?.('[dsh-key-limits] describe failed: ' + String(err && err.message || err))
      return null
    }
  }

  const syncSettingsSnapshot = (next) => {
    try {
      const fresh = next !== undefined ? next : (describeRow()?.value ?? rawConfig)
      current = plainConfig(Config(plainConfig(fresh || {})))
    } catch { /* keep existing snapshot on error */ }
  }

  ctx.inject(['settings'], (sctx) => {
    try {
      settingsSvc = sctx.settings || (typeof sctx.get === 'function' ? sctx.get('settings') : null) || null
      if (!settingsSvc) return
      const served = describeRow()
      if (served && served.value) {
        syncSettingsSnapshot(served.value)
      }
      if (typeof sctx.effect === 'function') {
        sctx.effect(() => () => { settingsSvc = null })
      }
    } catch (err) {
      logger?.warn?.('[dsh-key-limits] settings service unavailable: ' + String(err && err.message || err))
    }
  })

  let subManager = null

  const onSettingsChanged = (ns) => {
    if (ns && ns !== SETTINGS_NS) return
    try {
      const row = describeRow()
      if (row && row.value) syncSettingsSnapshot(row.value)
      else syncSettingsSnapshot()
    } catch { /* keep existing on error */ }
    subManager?.rescheduleRefresh?.()
  }

  ctx.on('settings/document-updated', onSettingsChanged)
  ctx.on('loader/volatile-update', onSettingsChanged)
  ctx.on('config', (cfg) => {
    syncSettingsSnapshot(cfg)
    subManager?.rescheduleRefresh?.()
  })

  // Initialize session tracking & subscription orchestration
  const sessionTracker = createSessionTracker(ctx, { storeDir, credStore, getConfig, logger })
  subManager = createSubManager({ storeDir, credStore, ctx, logger, getConfig, sessionTracker })

  // Periodic quota refresh
  subManager.startPeriodicRefresh()

  // Register REST routes
  registerRoutes(ctx, {
    ROUTE_PREFIX,
    SETTINGS_NS,
    credStore,
    sessionTracker,
    subManager,
    getConfig,
    describeRow,
    getSettingsSvc: () => settingsSvc,
    logger,
  })

  // Loopback plugin updater
  ctx.effect(() => registerPluginUpdater(ctx, {
    packageName: '@goodandready/dsh-key-limits',
    endpoint: `${ROUTE_PREFIX}/update`,
    manifestUrl: new URL('../package.json', import.meta.url),
    registry: 'https://registry.npmjs.org',
  }), 'key-limits: updater')
}

export { extractRouteFromEvent }
