// Run: node src/utils/dayMatch.test.js
import assert from "node:assert/strict";
import { matchDays } from "./dayMatch.js";

const days = (...amounts) => amounts.map((amount, i) => ({ day: i + 1, amount }));
const amounts = (list) => list.map((d) => d.amount);

let r = matchDays(days(300, 500, 700, 1200), days(450, 280, 800));
assert.deepEqual(
  r.pairs.map((p) => [p.day.amount, p.target.amount]),
  [[280, 300], [450, 500], [800, 1200]]
);
assert.deepEqual(amounts(r.remaining), [700]);
assert.deepEqual(r.failed, []);

// equal counts as a cut, a day above every target fails
r = matchDays(days(500, 700), days(500, 900));
assert.deepEqual(amounts(r.remaining), [700]);
assert.deepEqual(amounts(r.failed), [900]);

// a zero target can only be cut by a zero day
r = matchDays(days(0, 400), days(0, 100, 50));
assert.equal(r.pairs.length, 2);
assert.deepEqual(amounts(r.failed), [100]);

console.log("dayMatch ok");
