import { loadJSON, saveJSON } from '../storage.js';

export function getRecentIds(key, max = 8) {
  return loadJSON(key, []).slice(-max);
}

export function pushRecentId(key, id, max = 8) {
  const recent = getRecentIds(key, max).filter((x) => x !== id);
  recent.push(id);
  saveJSON(key, recent.slice(-max));
}

export function pickRotated(items = [], { keyFn = (item) => item?.id, historyKey, avoidLastN = 1 } = {}) {
  if (!Array.isArray(items) || !items.length) return null;

  const history = historyKey ? loadJSON(historyKey, []) : [];
  const recent = history.slice(-Math.max(avoidLastN, 0));
  const withKeys = items.map((item) => ({ item, key: keyFn(item) })).filter((entry) => entry.key);
  const pool = withKeys.filter((entry) => !recent.includes(entry.key));
  const source = pool.length ? pool : withKeys;

  if (!source.length) return items[0] || null;
  const picked = source[Math.floor(Math.random() * source.length)];

  if (historyKey && picked?.key) {
    const nextHistory = history.filter((key) => key !== picked.key);
    nextHistory.push(picked.key);
    saveJSON(historyKey, nextHistory.slice(-12));
  }

  return picked?.item || null;
}
