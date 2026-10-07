// Cuts each of this month's days against the smallest unused last-month day that is >= it,
// so cheap days never waste a big target. Both inputs are [{ day, amount }].
export function matchDays(lastMonth, thisMonth) {
  const byAmount = (a, b) => a.amount - b.amount;
  const targets = [...lastMonth].sort(byAmount);
  const pairs = [];
  const failed = [];
  const remaining = [];
  let t = 0;
  for (const day of [...thisMonth].sort(byAmount)) {
    while (t < targets.length && targets[t].amount < day.amount) remaining.push(targets[t++]);
    if (t < targets.length) pairs.push({ target: targets[t++], day });
    else failed.push(day);
  }
  remaining.push(...targets.slice(t));
  return { pairs, failed, remaining };
}
