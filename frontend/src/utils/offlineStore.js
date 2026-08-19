const PENDING_KEY = "hisabkitab_pending_transactions";
const CACHE_PREFIX = "hisabkitab_cache_";

export function getPendingTransactions() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY)) || [];
  } catch {
    return [];
  }
}

function savePendingTransactions(items) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(items));
}

export function queueTransaction(endpoint, payload) {
  const items = getPendingTransactions();
  const item = {
    localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    endpoint,
    payload,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  savePendingTransactions(items);
  return item;
}

export function removePendingTransaction(localId) {
  savePendingTransactions(getPendingTransactions().filter((item) => item.localId !== localId));
}

export function cacheReferenceData(key, data) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
  } catch {
    // storage full or unavailable, skip caching
  }
}

export function getCachedReferenceData(key) {
  try {
    return JSON.parse(localStorage.getItem(`${CACHE_PREFIX}${key}`));
  } catch {
    return null;
  }
}
