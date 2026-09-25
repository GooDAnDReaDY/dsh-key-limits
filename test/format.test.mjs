import test from "node:test";
import assert from "node:assert/strict";

function fmtReset(resetsAt) {
  if (!resetsAt) return "";
  var t = typeof resetsAt === "number" ? resetsAt : Date.parse(resetsAt);
  if (!Number.isFinite(t)) return "";
  var ms = t - Date.now();
  if (ms <= 0) return "refresh";
  var totalMinutes = Math.floor(ms / 60000);
  var totalHours = Math.floor(totalMinutes / 60);
  var m = totalMinutes % 60;
  if (totalHours < 24) {
    return (totalHours ? totalHours + "h " : "") + m + "m";
  }
  var d = Math.floor(totalHours / 24);
  var h = totalHours % 24;
  return d + "d " + (h ? h + "h " : "") + m + "m";
}

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
