import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  name,
  inject,
  ROUTE_PREFIX,
  SETTINGS_NS,
  extractRouteFromEvent,
  apply,
} from '../lib/index.js'
import {
  createSessionTracker,
  extractRouteFromEvent as extractFromTracker,
  MAX_LIVE_SESSIONS,
} from '../lib/session-tracker.js'
import { createSubManager } from '../lib/sub-manager.js'
import { registerRoutes } from '../lib/routes.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('#51: lib/index.js is decomposed and stays under 250 lines', () => {
  const content = readFileSync(join(root, 'lib/index.js'), 'utf8')
  const lines = content.split('\n')
  assert.ok(
    lines.length < 250,
    `lib/index.js line count (${lines.length}) exceeds maximum limit of 250 lines`
  )
})

test('#51: lib/session-tracker.js exports createSessionTracker, MAX_LIVE_SESSIONS, and extractRouteFromEvent', () => {
  assert.equal(typeof createSessionTracker, 'function')
  assert.equal(typeof extractFromTracker, 'function')
  assert.equal(typeof MAX_LIVE_SESSIONS, 'number')
  assert.equal(MAX_LIVE_SESSIONS, 500)

  // Test extractRouteFromEvent parity
  const evt = {
    type: 'request/header',
    data: {
      header: {
        config: {
          provider: 'deepseek',
          model: 'deepseek-chat',
        },
      },
    },
  }
  const r1 = extractRouteFromEvent(evt)
  const r2 = extractFromTracker(evt)
  assert.deepEqual(r1, { provider: 'deepseek', model: 'deepseek-chat' })
  assert.deepEqual(r1, r2)
})

test('#51: lib/sub-manager.js exports createSubManager and manages cache', () => {
  assert.equal(typeof createSubManager, 'function')
  const dummyCtx = { effect: () => {}, get: () => null }
  const mgr = createSubManager({
    storeDir: '/tmp',
    credStore: { creds: new Map(), list: () => [], get: () => null },
    ctx: dummyCtx,
    logger: null,
    getConfig: () => ({ refreshHours: 6 }),
    sessionTracker: null,
  })
  assert.equal(mgr.getRefreshIntervalMs(), 6 * 3600_000)
  assert.equal(mgr.getCache().at, 0)
  mgr.setCacheAt(12345)
  assert.equal(mgr.getCache().at, 12345)
  mgr.clearCache()
  assert.equal(mgr.getCache().at, 0)
})

test('#51: lib/routes.js registers all required REST endpoints', () => {
  assert.equal(typeof registerRoutes, 'function')
  const registered = []
  const mockCtx = {
    effect: (fn) => fn(),
    webServer: {
      register: (entry) => {
        registered.push(entry.path)
      },
    },
  }
  registerRoutes(mockCtx, {
    ROUTE_PREFIX: '/test-prefix',
    SETTINGS_NS: 'test-ns',
    credStore: { list: () => [] },
    sessionTracker: { buildActiveSub: async () => ({}) },
    subManager: {
      getCache: () => ({ at: 0 }),
      getRefreshIntervalMs: () => 3600_000,
      refreshSubCard: async () => [],
      refreshSubCards: async () => [],
      buildSubsList: async () => [],
      clearCache: () => {},
    },
    getConfig: () => ({}),
    describeRow: () => null,
    getSettingsSvc: () => null,
    logger: null,
  })

  const expectedPaths = [
    '/test-prefix/health',
    '/test-prefix/config',
    '/test-prefix/active-sub',
    '/test-prefix/subs',
    '/test-prefix/refresh-all',
    '/test-prefix/export',
    '/test-prefix/import',
  ]
  for (const p of expectedPaths) {
    assert.ok(registered.includes(p), `Missing endpoint: ${p}`)
  }
})
