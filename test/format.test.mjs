import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const formatJs = readFileSync(new URL("../src/client/03-format.js", import.meta.url), "utf8");
const sandbox = {
  klT: (key) => key,
  Date,
  Math,
  Number,
  String,
  JSON,
  localStorage: { getItem: () => null, setItem: () => {} },
};
vm.createContext(sandbox);
vm.runInContext(formatJs + "\n;globalThis.__format_exports = { fmtReset, fmtPct, minRemaining, pctClass, floatPctClass };", sandbox);
const { fmtReset, fmtPct, minRemaining, pctClass, floatPctClass } = sandbox.__format_exports;

test("fmtReset handles numeric millisecond timestamp under 24 hours", () => {
  const inTwoHours = Date.now() + 2 * 3600000 + 15 * 60000;
  const res = fmtReset(inTwoHours);
  assert.match(res, /^2h 1[45]m$/);
});

test("fmtReset handles countdowns greater than 24 hours with days and hours", () => {
  const inFiveDays = Date.now() + (5 * 24 + 5) * 3600000 + 19 * 60000;
  const res = fmtReset(inFiveDays);
  assert.match(res, /^5d 5h 1[89]m$/);
});

test("fmtReset handles ISO date string", () => {
  const inOneHour = new Date(Date.now() + 3600000 + 10 * 60000).toISOString();
  const res = fmtReset(inOneHour);
  assert.match(res, /^1h 10m|1h 9m$/);
});

test("fmtReset returns empty string on null/empty", () => {
  assert.equal(fmtReset(null), "");
  assert.equal(fmtReset(""), "");
  assert.equal(fmtReset(undefined), "");
});

test("fmtReset returns refresh if already expired", () => {
  assert.equal(fmtReset(Date.now() - 5000), "refresh");
});

test("fmtPct and minRemaining format percentages accurately from production module", () => {
  assert.equal(fmtPct(42.3), "42%");
  assert.equal(fmtPct("invalid"), "—");
  assert.equal(minRemaining([{ remainingPercent: 80 }, { remainingPercent: 35 }]), 35);
  assert.equal(minRemaining([]), null);
});
