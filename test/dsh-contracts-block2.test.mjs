import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

import { Config, plainConfig, apply, ROUTE_PREFIX } from '../lib/index.js'
import { matchSub } from '../lib/cards.js'
import { CredentialStore } from '../lib/subs.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const clientSource = readFileSync(join(root, 'lib/client.js'), 'utf8')
const srcSettingsSource = readFileSync(join(root, 'src/client/07-settings.js'), 'utf8')
const srcLocaleSource = readFileSync(join(root, 'src/client/02-locale.js'), 'utf8')
const srcModalsSource = readFileSync(join(root, 'src/client/04-modals.js'), 'utf8')

function createMockCtx(overrides = {}) {
  const listeners = new Map()
  const injected = new Map()
  const cleanups = []
  const webRoutes = new Map()

  const ctx = {
    logger: () => ({ warn: () => {}, info: () => {}, error: () => {} }),
    on: (evt, handler) => {
      if (!listeners.has(evt)) listeners.set(evt, [])
      listeners.get(evt).push(handler)
      return () => {
        const arr = listeners.get(evt) || []
        const idx = arr.indexOf(handler)
        if (idx !== -1) arr.splice(idx, 1)
      }
    },
    emit: (evt, ...args) => {
      const arr = listeners.get(evt) || []
      for (const fn of arr) fn(...args)
    },
    inject: (deps, cb) => {
      for (const d of deps) {
        if (!injected.has(d)) injected.set(d, [])
        injected.get(d).push(cb)
      }
      cb(ctx)
    },
    effect: (fn) => {
      const cleanup = typeof fn === 'function' ? fn() : undefined
      if (typeof cleanup === 'function') cleanups.push(cleanup)
      return cleanup
    },
    dispose: () => {
      for (const cleanup of cleanups) {
        try { cleanup() } catch (_) {}
      }
    },
    webServer: {
      register: (reg) => {
        webRoutes.set(reg.path, reg.handler)
        return () => webRoutes.delete(reg.path)
      },
    },
    get: (key) => overrides[key] || ctx[key] || null,
    _listeners: listeners,
    _webRoutes: webRoutes,
    ...overrides,
  }

  return ctx
}

// ---------------------------------------------------------------------------
// #92: Config without .volatile() unavailable in configForms & scope.get() banned
// ---------------------------------------------------------------------------
test('#92: Config schema defines .volatile() on live editable fields and keeps order plain array', () => {
  const dict = Config.dict
  assert.ok(dict, 'Config schema exposes dictionary shape')
  assert.equal(dict.refreshHours.meta?.volatile, true, 'refreshHours must be marked volatile')
  assert.ok(dict.ui?.dict, 'ui nested schema exists')
  assert.equal(dict.ui.dict.floatChip.meta?.volatile, true, 'ui.floatChip must be volatile')
  assert.equal(dict.ui.dict.composerBar.meta?.volatile, true, 'ui.composerBar must be volatile')
  assert.equal(dict.ui.dict.activeOnTop.meta?.volatile, true, 'ui.activeOnTop must be volatile')
  assert.equal(dict.ui.dict.order.meta?.volatile, undefined, 'ui.order must remain non-volatile array')
})

test('#92: plainConfig unwraps getter boxes, arrays, and primitive configurations', () => {
  const boxed = {
    refreshHours: { get: () => 12 },
    ui: {
      floatChip: { get: () => false },
      order: [ { get: () => 'sub-1' }, 'sub-2' ],
    },
    normal: 42,
  }
  const plain = plainConfig(boxed)
  assert.deepEqual(plain, {
    refreshHours: 12,
    ui: {
      floatChip: false,
      order: ['sub-1', 'sub-2'],
    },
    normal: 42,
  })
})

test('#92: ConfigFields in client uses getSnapshot, subscribe and mutate without calling scope.get', () => {
  assert.doesNotMatch(clientSource, /scope\.get\(/, 'lib/client.js must never call scope.get()' )
  assert.doesNotMatch(srcSettingsSource, /scope\.get\(/, 'src/client/07-settings.js must never call scope.get()' )
  assert.match(clientSource, /scope\.getSnapshot/, 'client must call scope.getSnapshot()')
  assert.match(clientSource, /scope\.subscribe/, 'client must call scope.subscribe()')
  assert.match(clientSource, /scope\.mutate/, 'client must call scope.mutate()')
})

// ---------------------------------------------------------------------------
// #93: Dead settings.register removed, describeRow and volatile-update supported
// ---------------------------------------------------------------------------
test('#93: settings.register is completely absent from plugin backend and client', () => {
  assert.doesNotMatch(clientSource, /settings\.register\(/, 'lib/client.js has no settings.register call')
  const indexSource = readFileSync(join(root, 'lib/index.js'), 'utf8')
  assert.doesNotMatch(indexSource, /settings\.register\(/, 'lib/index.js has no settings.register call')
})

test('#93: Host updates configuration on settings/document-updated and loader/volatile-update', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dsh-kl-test-93-'))
  let ctx = null
  try {
    let mockRowValue = {
      refreshHours: 8,
      ui: { floatChip: false, composerBar: false, activeOnTop: false, order: ['custom-1'] },
    }
    const mockSettings = {
      describe: () => [
        { ns: 'dsh-key-limits', value: mockRowValue },
      ],
    }
    ctx = createMockCtx({
      settings: mockSettings,
    })

    apply(ctx, { storageDir: tempDir, refreshHours: 24 })
    const configHandler = ctx._webRoutes.get(`${ROUTE_PREFIX}/config`)
    assert.ok(configHandler, '/config handler registered')

    let resData = null
    const res = {
      writeHead: () => {},
      end: (str) => { resData = JSON.parse(str) },
      headers: {},
    }
    await configHandler({ method: 'GET', headers: { origin: 'http://localhost:3000', host: 'localhost:3000' } }, res)
    assert.equal(resData.refreshHours, 8)
    assert.equal(resData.ui.floatChip, false)

    // Simulate volatile update from host
    mockRowValue = {
      refreshHours: 6,
      ui: { floatChip: true, composerBar: true, activeOnTop: true, order: ['custom-2'] },
    }
    ctx.emit('loader/volatile-update', 'dsh-key-limits')

    await configHandler({ method: 'GET', headers: { origin: 'http://localhost:3000', host: 'localhost:3000' } }, res)
    assert.equal(resData.refreshHours, 6)
    assert.equal(resData.ui.floatChip, true)
  } finally {
    if (ctx) ctx.dispose()
    rmSync(tempDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// #102: Canonical session events and startup session hydration
// ---------------------------------------------------------------------------
test('#102: Canonical request/header and request/context events update session route and invalidate provider bindings', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dsh-kl-test-102-'))
  let ctx = null
  try {
    ctx = createMockCtx()
    apply(ctx, { storageDir: tempDir })

    const activeHandler = ctx._webRoutes.get(`${ROUTE_PREFIX}/active-sub`)
    assert.ok(activeHandler, '/active-sub handler registered')

    // 1. Send canonical request/header event
    ctx.emit('session/event', { id: 'sess-102' }, {
      type: 'request/header',
      data: {
        header: {
          config: {
            provider: 'deepseek',
            model: 'deepseek-chat',
          },
        },
      },
    })

    const fetchActive = async () => {
      let data = null
      const res = {
        writeHead: () => {},
        end: (str) => { data = JSON.parse(str) },
        headers: {},
      }
      await activeHandler({
        method: 'GET',
        url: `${ROUTE_PREFIX}/active-sub?sessionId=sess-102`,
        headers: { origin: 'http://localhost:3000', host: 'localhost:3000' },
      }, res)
      return data
    }

    let active = await fetchActive()
    assert.equal(active.route.provider, 'deepseek')
    assert.equal(active.route.model, 'deepseek-chat')

    // 2. Switch provider via canonical request/context event
    ctx.emit('session/event', { id: 'sess-102' }, {
      type: 'request/context',
      data: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet',
      },
    })

    active = await fetchActive()
    assert.equal(active.route.provider, 'anthropic')
    assert.equal(active.route.model, 'claude-3-5-sonnet')
  } finally {
    if (ctx) ctx.dispose()
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('#102: Startup hydration pre-populates existing sessions from ctx.sessions.list()', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dsh-kl-test-102-seed-'))
  let ctx = null
  try {
    const mockSessions = {
      list: () => [
        {
          id: 'sess-existing-1',
          header: { cwd: '/workspace/test' },
          snapshotEvents: () => [
            {
              type: 'request/header',
              data: {
                header: {
                  config: { provider: 'gemini', model: 'gemini-2.0-flash' },
                },
              },
            },
          ],
        },
      ],
    }
    ctx = createMockCtx({ sessions: mockSessions })
    apply(ctx, { storageDir: tempDir })

    const activeHandler = ctx._webRoutes.get(`${ROUTE_PREFIX}/active-sub`)
    let data = null
    const res = {
      writeHead: () => {},
      end: (str) => { data = JSON.parse(str) },
      headers: {},
    }
    await activeHandler({
      method: 'GET',
      url: `${ROUTE_PREFIX}/active-sub?sessionId=sess-existing-1`,
      headers: { origin: 'http://localhost:3000', host: 'localhost:3000' },
    }, res)

    assert.ok(data, 'active sub returned for hydrated session')
    assert.equal(data.route.provider, 'gemini')
    assert.equal(data.route.model, 'gemini-2.0-flash')
  } finally {
    if (ctx) ctx.dispose()
    rmSync(tempDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// #103: Session credentials binding & ambiguous multi-account handling
// ---------------------------------------------------------------------------
test('#103: Ambient credentials match specific account; rotation updates active binding', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dsh-kl-test-103-'))
  let ctx = null
  try {
    const store = new CredentialStore(tempDir)
    store.upsert('ds-account-a', {
      provider: 'deepseek',
      secret: 'sk-key-a-secret',
      label: 'Account A',
    })
    store.upsert('ds-account-b', {
      provider: 'deepseek',
      secret: 'sk-key-b-secret',
      label: 'Account B',
    })

    let currentAmbientKey = 'sk-key-b-secret'
    const mockCredentials = {
      resolve: async (ref) => {
        if (ref === 'DEEPSEEK_API_KEY' || ref === 'env:DEEPSEEK_API_KEY') return { value: currentAmbientKey }
        return null
      },
    }

    ctx = createMockCtx({ credentials: mockCredentials })
    apply(ctx, { storageDir: tempDir })

    ctx.emit('session/event', { id: 'sess-103' }, {
      type: 'request/header',
      data: {
        header: { config: { provider: 'deepseek', model: 'deepseek-chat' } },
      },
    })

    const activeHandler = ctx._webRoutes.get(`${ROUTE_PREFIX}/active-sub`)
    const fetchActive = async () => {
      let data = null
      const res = {
        writeHead: () => {},
        end: (str) => { data = JSON.parse(str) },
        headers: {},
      }
      await activeHandler({
        method: 'GET',
        url: `${ROUTE_PREFIX}/active-sub?sessionId=sess-103`,
        headers: { origin: 'http://localhost:3000', host: 'localhost:3000' },
      }, res)
      return data
    }

    // 1. Should match Account B via AS-M4 (ambient credential matches secret)
    let act = await fetchActive()
        assert.equal(act.subId, 'ds-account-b')
    assert.equal(act.rule, 'AS-M4')

    // 2. Rotate ambient key to Account A
    currentAmbientKey = 'sk-key-a-secret'
    // Invalidate cached binding by emitting a session event or route touch
    ctx.emit('session/event', { id: 'sess-103' }, {
      type: 'request/header',
      data: {
        header: { config: { provider: 'deepseek', model: 'deepseek-chat' } },
      },
    })

    act = await fetchActive()
    assert.equal(act.subId, 'ds-account-a')
    assert.equal(act.rule, 'AS-M4')
  } finally {
    if (ctx) ctx.dispose()
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('#103: Ambiguous credentials without ambient match return degraded state and AS-M1-multi', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'dsh-kl-test-103-ambig-'))
  let ctx = null
  try {
    const store = new CredentialStore(tempDir)
    store.upsert('ds-1', {
      provider: 'deepseek',
      secret: 'sk-111',
      label: 'Account 1',
    })
    store.upsert('ds-2', {
      provider: 'deepseek',
      secret: 'sk-222',
      label: 'Account 2',
    })

    const mockCredentials = {
      resolve: async () => null,
    }

    ctx = createMockCtx({ credentials: mockCredentials })
    apply(ctx, { storageDir: tempDir })

    ctx.emit('session/event', { id: 'sess-ambig' }, {
      type: 'request/context',
      data: { provider: 'deepseek', model: 'deepseek-chat' },
    })

    const activeHandler = ctx._webRoutes.get(`${ROUTE_PREFIX}/active-sub`)
    let data = null
    const res = {
      writeHead: () => {},
      end: (str) => { data = JSON.parse(str) },
      headers: {},
    }
    await activeHandler({
      method: 'GET',
      url: `${ROUTE_PREFIX}/active-sub?sessionId=sess-ambig`,
      headers: { origin: 'http://localhost:3000', host: 'localhost:3000' },
    }, res)

    assert.equal(data.subId, null, 'must not guess hits[0] when multiple accounts exist')
    assert.equal(data.rule, 'AS-M1-multi')
    assert.equal(data.degraded, true)
    assert.equal(data.error, 'ambiguous')
  } finally {
    if (ctx) ctx.dispose()
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('#103: matchSub returns degraded and multi rule when ambiguous', () => {
  const subs = [
    { id: 'sub-a', provider: 'openai', fingerprint: 'fp-dup' },
    { id: 'sub-b', provider: 'openai', fingerprint: 'fp-dup' },
  ]
  const res = matchSub(subs, { provider: 'openai', fingerprint: 'fp-dup' })
  assert.equal(res.sub, null)
  assert.equal(res.rule, 'AS-M4-multi')
  assert.equal(res.degraded, true)
})

// ---------------------------------------------------------------------------
// #109: LocaleFace contract, localized eyebrows, provider hints and labels
// ---------------------------------------------------------------------------
test('#109: LocaleFace subscription and bind methods are wired in client', () => {
  assert.match(srcLocaleSource, /ctx\.locale\.getSnapshot/, 'useActiveLocale checks getSnapshot')
  assert.match(srcLocaleSource, /ctx\.locale\.subscribe/, 'useActiveLocale subscribes to locale changes')
  assert.match(srcLocaleSource, /locale\.bind\(/, 'klT binds to namespace dsh-key-limits')
})

test('#109: Eyebrow texts and all 14 provider labels/hints exist in EN and ZH dictionaries', () => {
  const providers = [
    'deepseek', 'openrouter', 'kimi', 'glm', 'minimax',
    'siliconflow', 'groq', 'anthropic', 'gemini',
    'opencode_go', 'cline', 'ollama', 'commandcode'
  ]

  for (const p of providers) {
    assert.match(srcLocaleSource, new RegExp(`prov_label_${p}:`), `prov_label_${p} label must exist in dictionary`)
    assert.match(srcLocaleSource, new RegExp(`prov_hint_${p}:`), `prov_hint_${p} hint must exist in dictionary`)
  }

  assert.match(srcLocaleSource, /activeSessionEyebrow:/, 'activeSessionEyebrow key exists')
  assert.match(srcLocaleSource, /hubEyebrow:/, 'hubEyebrow key exists')

  // Verify modals use translation key instead of hardcoded strings
  assert.doesNotMatch(srcModalsSource, /"ACTIVE SESSION LIMIT"/, 'hardcoded ACTIVE SESSION LIMIT removed')
  assert.doesNotMatch(srcModalsSource, /"KEY LIMITS & SUBSCRIPTION HUB"/, 'hardcoded KEY LIMITS & SUBSCRIPTION HUB removed')
  assert.match(srcModalsSource, /klT\("activeSessionEyebrow"\)/, 'activeSessionEyebrow translated via klT')
  assert.match(srcModalsSource, /klT\("hubEyebrow"\)/, 'hubEyebrow translated via klT')
})
