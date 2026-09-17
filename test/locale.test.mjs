import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

test('apply behavior: survives when core or translation pack already claimed locale', () => {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../lib/client.js')
  const code = readFileSync(file, 'utf8')

  let loadedModule = null
  const registeredLocales = []
  const registeredSlots = []
  const effects = []

  const mockWindow = {
    get window() { return mockWindow },
    __ModuleLoader__: {
      load: ({ id, factory }) => {
        const mockRequire = (mod) => {
          if (mod === 'react') {
            return {
              useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
              useEffect: () => {},
              useCallback: (fn) => fn,
              useRef: () => ({ current: null }),
            }
          }
          if (mod === 'react-dom/client') {
            return { createRoot: () => ({ render: () => {}, unmount: () => {} }) }
          }
          if (mod === 'react-dom') {
            return { createPortal: () => null }
          }
          if (mod === 'react/jsx-runtime') {
            return { jsx: () => null, jsxs: () => null }
          }
          return {}
        }
        loadedModule = factory(mockRequire)
      },
    },
    document: {
      querySelector: () => null,
      createElement: () => ({
        setAttribute: () => {},
        dataset: {},
        remove: () => {},
      }),
      head: { appendChild: () => {} },
      body: { appendChild: () => {} },
    },
  }

  const context = vm.createContext(mockWindow)
  vm.runInContext(code, context)

  assert.ok(loadedModule, 'client module should be loaded via __ModuleLoader__')
  assert.equal(typeof loadedModule.apply, 'function', 'loaded module must export apply')

  const mockCtx = {
    locale: {
      locale: 'en',
      register: (ns, lang, dict) => {
        if (lang === 'zh') {
          throw new Error('occupied: zh locale already registered by dsh-lang-zh')
        }
        registeredLocales.push({ ns, lang, dict })
        return () => {}
      },
      watch: () => () => {},
    },
    slots: {
      inject: (slotName, fn) => {
        registeredSlots.push(slotName)
      },
      register: (spec, comp) => spec,
    },
    effect: (fn, name) => {
      effects.push({ name, undo: fn() })
    },
  }

  // Calling apply MUST not throw even though 'zh' throws "occupied"
  assert.doesNotThrow(() => {
    loadedModule.apply(mockCtx)
  }, 'apply must gracefully handle already taken locale registrations')

  assert.equal(registeredLocales.length, 1, 'en locale was registered successfully')
  assert.equal(registeredLocales[0].lang, 'en')
  assert.ok(effects.length >= 2, 'effects for styles and locales mounted')

  // Calling effect unmount cleanups
  for (const eff of effects) {
    if (typeof eff.undo === 'function') {
      assert.doesNotThrow(() => eff.undo())
    }
  }
})

test('source code and tests contain no cyrillic characters', () => {
  const check = (rel) => {
    const text = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', rel), 'utf8')
    assert.equal(/[а-яА-ЯёЁ]/.test(text), false, rel + ' must not contain cyrillic')
  }
  check('src/client/02-locale.js')
  check('src/client/04-modals.js')
  check('lib/client.js')
  check('lib/subs.js')
  check('lib/provider-fetchers.js')
})
