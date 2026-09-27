import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const formatJs = readFileSync(new URL("../src/client/03-format.js", import.meta.url), "utf8");

function toPlain(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createTestSandbox(initialStorage = {}) {
  const store = Object.assign({}, initialStorage);
  const sandbox = {
    klT: (key) => key,
    Date,
    Math,
    Number,
    String,
    JSON,
    DANGER: 15,
    WARN: 30,
    localStorage: {
      getItem: (k) => (store[k] !== undefined ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    __store: store,
  };
  vm.createContext(sandbox);
  vm.runInContext(
    formatJs +
      "\n;globalThis.__exports = { poolStats, findNearestReset, loadUsageHistory, recordUsageSnapshot, calcBurnRate, minRemaining };",
    sandbox
  );
  return sandbox;
}

test("poolStats returns zeroes on empty or non-array input", () => {
  const { __exports: { poolStats } } = createTestSandbox();
  const res = poolStats([]);
  assert.equal(res.total, 0);
  assert.equal(res.healthy, 0);
  assert.equal(res.warning, 0);
  assert.equal(res.exhausted, 0);
  assert.deepEqual(toPlain(res.byProvider), {});

  const resNull = poolStats(null);
  assert.equal(resNull.total, 0);
});

test("poolStats categorizes healthy, warning, exhausted and errored subscriptions correctly", () => {
  const { __exports: { poolStats } } = createTestSandbox();
  const subs = [
    { provider: "deepseek", quota: { windows: [{ remainingPercent: 85 }] } },
    { provider: "deepseek", quota: { windows: [{ remainingPercent: 20 }] } },
    { provider: "openrouter", quota: { windows: [{ remainingPercent: 8 }] } },
    { provider: "openrouter", quota: { error: "upstream timeout" } },
    { provider: "minimax", quota: { windows: [{ remainingPercent: 95 }] } },
  ];

  const res = poolStats(subs);
  assert.equal(res.total, 5);
  assert.equal(res.healthy, 2); // 85%, 95%
  assert.equal(res.warning, 1); // 20%
  assert.equal(res.exhausted, 2); // 8%, error

  assert.equal(res.byProvider.deepseek.total, 2);
  assert.equal(res.byProvider.deepseek.healthy, 1);
  assert.equal(res.byProvider.deepseek.warning, 1);
  assert.equal(res.byProvider.deepseek.exhausted, 0);

  assert.equal(res.byProvider.openrouter.total, 2);
  assert.equal(res.byProvider.openrouter.exhausted, 2);

  assert.equal(res.byProvider.minimax.total, 1);
  assert.equal(res.byProvider.minimax.healthy, 1);
});

test("findNearestReset finds nearest future reset timestamp across subscriptions", () => {
  const { __exports: { findNearestReset } } = createTestSandbox();
  const now = Date.now();
  const past = now - 60000;
  const inOneHour = now + 3600000;
  const inTwoHours = now + 7200000;

  const subs = [
    { quota: { windows: [{ resetsAt: past }, { resetsAt: inTwoHours }] } },
    { quota: { windows: [{ resetsAt: inOneHour }] } },
    { quota: {} },
  ];

  const nearest = findNearestReset(subs);
  assert.equal(nearest, inOneHour);

  assert.equal(findNearestReset([]), null);
  assert.equal(findNearestReset([{ quota: { windows: [{ resetsAt: past }] } }]), null);
});

test("calcBurnRate calculates burn rate and hours remaining accurately", () => {
  const { __exports: { calcBurnRate } } = createTestSandbox();
  const now = Date.now();

  // Insufficient history
  assert.deepEqual(toPlain(calcBurnRate([])), { rate: 0, hoursLeft: null, idle: true });
  assert.deepEqual(toPlain(calcBurnRate([{ t: now, q: 80 }])), { rate: 0, hoursLeft: null, idle: true });

  // Time span under 5 minutes is idle
  const shortHistory = [
    { t: now - 60000, q: 90 },
    { t: now, q: 85 }
  ];
  assert.deepEqual(toPlain(calcBurnRate(shortHistory)), { rate: 0, hoursLeft: null, idle: true });

  // No consumption (flat or increasing quota)
  const flatHistory = [
    { t: now - 3600000, q: 80 },
    { t: now, q: 80 }
  ];
  assert.deepEqual(toPlain(calcBurnRate(flatHistory)), { rate: 0, hoursLeft: null, idle: true });

  // Dropping quota: 100% to 70% in 3 hours -> 10% per hour, 70/10 = 7.0 hours left
  const dropHistory = [
    { t: now - 3 * 3600000, q: 100 },
    { t: now, q: 70 }
  ];
  const res = calcBurnRate(dropHistory);
  assert.equal(res.idle, false);
  assert.equal(res.rate, 10);
  assert.equal(res.hoursLeft, 7);
});

test("recordUsageSnapshot and loadUsageHistory manage rolling 24h history in localStorage", () => {
  const sandbox = createTestSandbox();
  const { __exports: { recordUsageSnapshot, loadUsageHistory } } = sandbox;

  assert.deepEqual(toPlain(loadUsageHistory()), []);

  recordUsageSnapshot(85.4);
  const h1 = loadUsageHistory();
  assert.equal(h1.length, 1);
  assert.equal(h1[0].q, 85.4);

  // Updating within 60s replaces last snapshot
  recordUsageSnapshot(82.1);
  const h2 = loadUsageHistory();
  assert.equal(h2.length, 1);
  assert.equal(h2[0].q, 82.1);
});
