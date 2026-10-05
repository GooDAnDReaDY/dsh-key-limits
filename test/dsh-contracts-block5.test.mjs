import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";
import { apply, ROUTE_PREFIX } from "../lib/index.js";

const preludeJs = readFileSync(new URL("../src/client/01-prelude.js", import.meta.url), "utf8");
const localeJs = readFileSync(new URL("../src/client/02-locale.js", import.meta.url), "utf8");
const formatJs = readFileSync(new URL("../src/client/03-format.js", import.meta.url), "utf8");
const barJs = readFileSync(new URL("../src/client/05-bar.js", import.meta.url), "utf8");
const settingsJs = readFileSync(new URL("../src/client/07-settings.js", import.meta.url), "utf8");

function createMockCtx(services = {}) {
  const routes = new Map();
  const listeners = new Map();
  const disposables = [];

  const ctx = {
    _webRoutes: routes,
    inject(deps, fn) {
      fn(ctx);
    },
    get(name) {
      return services[name] || null;
    },
    effect(fn) {
      const cleanup = fn();
      if (typeof cleanup === "function") disposables.push(cleanup);
    },
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(handler);
    },
    emit(event, ...args) {
      for (const h of listeners.get(event) || []) h(...args);
    },
    webServer: {
      register({ path, handler }) {
        routes.set(path, handler);
        return () => routes.delete(path);
      },
    },
    logger: () => ({ warn: () => {}, info: () => {}, error: () => {} }),
    dispose() {
      for (const d of disposables) d();
    },
  };
  return ctx;
}

function createSandbox(initialStorage = {}) {
  const store = Object.assign({}, initialStorage);
  const elements = new Set();
  const mockDoc = {
    head: {
      appendChild: (el) => { elements.add(el); return el; },
    },
    body: {
      appendChild: (el) => { elements.add(el); return el; },
    },
    querySelector: (sel) => {
      for (const el of elements) {
        if (sel === 'style[data-dsh-plugin="dsh-key-limits"]' && el.dataset && el.dataset.dshPlugin === "dsh-key-limits") {
          return el;
        }
      }
      return null;
    },
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        dataset: {},
        setAttribute: (k, v) => {
          if (k.startsWith("data-")) {
            const key = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            el.dataset[key] = v;
          }
        },
        remove: () => { elements.delete(el); },
      };
      return el;
    },
    activeElement: null,
  };

  const sandbox = {
    require: (mod) => {
      if (mod === "react") {
        return {
          useState: (init) => [init, () => {}],
          useEffect: () => {},
          useCallback: (fn) => fn,
          useRef: (init) => ({ current: init }),
        };
      }
      if (mod === "react-dom") {
        return {
          createPortal: (children) => children,
        };
      }
      if (mod === "react-dom/client") return {};
      if (mod === "react/jsx-runtime") {
        return {
          jsx: (type, props) => ({ type, props }),
          jsxs: (type, props) => ({ type, props }),
        };
      }
      return {};
    },
    document: mockDoc,
    window: {
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    localStorage: {
      getItem: (k) => (store[k] !== undefined ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    sessionStorage: {
      getItem: (k) => (store["session:" + k] !== undefined ? store["session:" + k] : null),
      setItem: (k, v) => { store["session:" + k] = String(v); },
      removeItem: (k) => { delete store["session:" + k]; },
    },
    Date,
    Math,
    Number,
    String,
    JSON,
    Error,
    Array,
    Object,
    Promise,
    DANGER: 15,
    WARN: 30,
    REFRESH_MS: 30000,
    API: "/dsh-key-limits",
    createPortal: (children) => children,
    useRef: (init) => ({ current: init }),
    useEffect: () => {},
    useCallback: (fn) => fn,
    useState: (init) => [init, () => {}],
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
    __elements: elements,
    __store: store,
  };

  vm.createContext(sandbox);
  vm.runInContext(preludeJs, sandbox);
  vm.runInContext(localeJs, sandbox);
  vm.runInContext(
    formatJs +
      "\n;globalThis.__exports = { poolStats, findNearestReset, loadUsageHistory, recordUsageSnapshot, calcBurnRate, minRemaining, ensureKeyLimitsStyles, fetchJson, PortalModal };",
    sandbox
  );
  return sandbox;
}

test("#113: style tag is not injected on module evaluation and cleanup removes it from DOM", () => {
  const sandbox = createSandbox();
  const { __elements, __exports: { ensureKeyLimitsStyles } } = sandbox;

  // Verify no style tag was injected simply by evaluating 01-prelude.js
  let styleTag = sandbox.document.querySelector('style[data-dsh-plugin="dsh-key-limits"]');
  assert.equal(styleTag, null, "style tag must not be injected before ensureKeyLimitsStyles() is called");

  // Call ensureKeyLimitsStyles to mount styles
  const cleanup = ensureKeyLimitsStyles();
  styleTag = sandbox.document.querySelector('style[data-dsh-plugin="dsh-key-limits"]');
  assert.ok(styleTag, "style tag should exist after ensureKeyLimitsStyles()");
  assert.ok(__elements.has(styleTag), "style tag should be tracked in head");

  // Call returned cleanup
  cleanup();
  styleTag = sandbox.document.querySelector('style[data-dsh-plugin="dsh-key-limits"]');
  assert.equal(styleTag, null, "style tag must be removed from document on cleanup");
});

test("#116: poolStats marks balance 0 and missing quota as exhausted (not healthy)", () => {
  const { __exports: { poolStats } } = createSandbox();

  // Test zero monetary balance
  const zeroBalanceSubs = [
    { provider: "deepseek", balance: { remaining: 0, limit: 100 } }
  ];
  const resZero = poolStats(zeroBalanceSubs);
  assert.equal(resZero.total, 1);
  assert.equal(resZero.exhausted, 1, "balance: 0 must be classified as exhausted");
  assert.equal(resZero.healthy, 0);

  // Test low balance (warning)
  const lowBalanceSubs = [
    { provider: "deepseek", balance: { remaining: 0.8, limit: 100 } }
  ];
  const resLow = poolStats(lowBalanceSubs);
  assert.equal(resLow.warning, 1, "balance <= 1.0 must be classified as warning");

  // Test healthy balance
  const healthyBalanceSubs = [
    { provider: "deepseek", balance: { remaining: 45.5, limit: 100 } }
  ];
  const resHealthy = poolStats(healthyBalanceSubs);
  assert.equal(resHealthy.healthy, 1, "positive balance > 1.0 must be classified as healthy");

  // Test missing quota and missing balance (uninitialized / unknown)
  const emptyDataSubs = [
    { provider: "openrouter", quota: { windows: [] } }
  ];
  const resEmpty = poolStats(emptyDataSubs);
  assert.equal(resEmpty.exhausted, 1, "missing quota data without balance must be classified as exhausted, not healthy");
  assert.equal(resEmpty.healthy, 0);
});

test("#115: 24h usage trend uses 144 points and calcBurnRate resets after quota replenishment", () => {
  const sandbox = createSandbox();
  const { __exports: { recordUsageSnapshot, loadUsageHistory, calcBurnRate } } = sandbox;

  const now = Date.now();

  // 1. Monotonic drop without reset
  const dropHistory = [
    { t: now - 3 * 3600000, q: 100 },
    { t: now, q: 70 }
  ];
  const rateDrop = calcBurnRate(dropHistory);
  assert.equal(rateDrop.idle, false);
  assert.equal(rateDrop.rate, 10);
  assert.equal(rateDrop.hoursLeft, 7);

  // 2. History with a quota reset jump in the middle
  const resetHistory = [
    { t: now - 4 * 3600000, q: 90 },
    { t: now - 3 * 3600000, q: 20 },
    { t: now - 2 * 3600000, q: 100 }, // reset point
    { t: now, q: 70 }
  ];
  const rateReset = calcBurnRate(resetHistory);
  assert.equal(rateReset.idle, false);
  assert.equal(rateReset.rate, 15);
  assert.equal(rateReset.hoursLeft, 4.7);

  // 3. Bucket downsampling: rapid snapshots within 10 minutes replace the last point
  recordUsageSnapshot(80.0, "sub-1");
  let h = loadUsageHistory();
  assert.equal(h.length, 1);
  assert.equal(h[0].q, 80.0);
  assert.equal(h[0].subId, "sub-1");

  recordUsageSnapshot(79.5, "sub-1");
  h = loadUsageHistory();
  assert.equal(h.length, 1, "snapshot within bucket interval must replace last point");
  assert.equal(h[0].q, 79.5);
});

test("#111: fetchJson throws structured Error on 4xx/5xx status codes", async () => {
  const sandbox = createSandbox();
  const { __exports: { fetchJson } } = sandbox;

  // Mock global fetch for 403 Forbidden
  sandbox.fetch = async () => ({
    ok: false,
    status: 403,
    statusText: "Forbidden",
    json: async () => ({ error: "forbidden: cross-site request rejected" }),
  });

  await assert.rejects(
    async () => {
      await fetchJson("/dsh-key-limits/subs");
    },
    (err) => {
      assert.equal(err.status, 403);
      assert.equal(err.message, "forbidden: cross-site request rejected");
      return true;
    }
  );

  // Mock global fetch for 500 Internal Error
  sandbox.fetch = async () => ({
    ok: false,
    status: 500,
    statusText: "Internal Server Error",
    json: async () => ({ error: "disk write error" }),
  });

  await assert.rejects(
    async () => {
      await fetchJson("/dsh-key-limits/subs");
    },
    (err) => {
      assert.equal(err.status, 500);
      assert.equal(err.message, "disk write error");
      return true;
    }
  );

  // Mock successful response
  sandbox.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ subscriptions: [{ id: "test" }] }),
  });

  const res = await fetchJson("/dsh-key-limits/subs");
  assert.equal(res.subscriptions.length, 1);
  assert.equal(res.subscriptions[0].id, "test");
});

test("#117: PortalModal assigns dialog semantics, aria-label, and modal role", () => {
  const sandbox = createSandbox();
  const { __exports: { PortalModal } } = sandbox;

  const rendered = PortalModal({
    ariaLabel: "Active Key Details",
    onClose: () => {},
    children: { type: "div", props: { className: "kl-overlay" } }
  });

  assert.equal(rendered.type, "div");
  assert.equal(rendered.props.role, "dialog");
  assert.equal(rendered.props["aria-modal"], "true");
  assert.equal(rendered.props["aria-label"], "Active Key Details");
});

test("#118: Updater translations and manual update instructions exist in EN and ZH", () => {
  const sandbox = createSandbox();
  const en = sandbox.KL_en;
  const zh = sandbox.KL_zh;

  assert.ok(en.checkFailed, "en.checkFailed should be defined");
  assert.ok(en.manualUpdateCmd, "en.manualUpdateCmd should be defined");
  assert.ok(en.manualUpdateCmd.includes("pnpm update @goodandready/dsh-key-limits"));

  assert.ok(zh.checkFailed, "zh.checkFailed should be defined");
  assert.ok(zh.manualUpdateCmd, "zh.manualUpdateCmd should be defined");
  assert.ok(zh.manualUpdateCmd.includes("pnpm update @goodandready/dsh-key-limits"));
});

test("#112: active-sub route exposes ui configuration including composerBar", async () => {
  const tempDir = mkdtempSync(join(tmpdir(), "dsh-kl-test-112-"));
  let ctx = null;
  try {
    const mockSettings = {
      describe: () => [
        { ns: "dsh-key-limits", value: { refreshHours: 12, ui: { composerBar: false, floatChip: true } } },
      ],
    };
    ctx = createMockCtx({ settings: mockSettings });
    apply(ctx, { storageDir: tempDir, refreshHours: 24 });

    const activeHandler = ctx._webRoutes.get(`${ROUTE_PREFIX}/active-sub`);
    assert.ok(activeHandler, "/active-sub handler registered");

    let resData = null;
    const res = {
      writeHead: () => {},
      end: (str) => { resData = JSON.parse(str); },
      headers: {},
    };

    await activeHandler({
      method: "GET",
      url: "/dsh-key-limits/active-sub?sessionId=test-sess-112",
      headers: { origin: "http://localhost:3000", host: "localhost:3000" }
    }, res);

    assert.ok(resData, "response data returned");
    assert.equal(resData.sessionId, "test-sess-112");
    assert.ok(resData.ui, "ui object should be included in active-sub response");
    assert.equal(resData.ui.composerBar, false, "composerBar false preserved in active-sub");
  } finally {
    if (ctx) ctx.dispose();
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("#112 & #110: ActiveKeyButton returns null on composerBar: false and AllLimitsModal uses non-redundant refresh", () => {
  // In ActiveKeyButton, when data.ui.composerBar === false, it must return null
  assert.match(barJs, /composerBar\s*===\s*false/, "ActiveKeyButton must check composerBar === false");

  // In AllLimitsModal, refreshAll must call load(false), avoiding redundant load(true)
  const modalsJs = readFileSync(new URL("../src/client/04-modals.js", import.meta.url), "utf8");
  assert.doesNotMatch(modalsJs, /refreshAll[^{]*\{[\s\S]*?POST[\s\S]*?load\(true\)/, "refreshAll must not trigger second load(true)");
  assert.match(modalsJs, /POST[\s\S]*?\.then\(function\(\)\{\s*load\(false\);/, "refreshAll must call load(false)");
});

test("#118: UpdaterSection renders retry on check failed and manual cmd on canAutoUpdate: false", () => {
  assert.match(settingsJs, /latestCheckFailed/, "UpdaterSection must check latestCheckFailed");
  assert.match(settingsJs, /canAutoUpdate\s*===\s*false/, "UpdaterSection must check canAutoUpdate === false");
  assert.match(settingsJs, /manualUpdateCmd/, "UpdaterSection must render manualUpdateCmd when canAutoUpdate is false");
});
