import test from "node:test";
import assert from "node:assert/strict";

function fmtReset(resetsAt) {
  if (!resetsAt) return "";
  var t = typeof resetsAt === "number" ? resetsAt : Date.parse(resetsAt);
  if (!Number.isFinite(t)) return "";
  var ms = t - Date.now();
  if (ms <= 0) return "refresh";
  var h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return (h ? h + "h " : "") + m + "m";
}

test("fmtReset handles numeric millisecond timestamp", () => {
  const inTwoHours = Date.now() + 2 * 3600000 + 15 * 60000;
  const res = fmtReset(inTwoHours);
  assert.match(res, /^2h 1[45]m$/);
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
