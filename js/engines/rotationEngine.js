import { loadJSON, saveJSON } from '../storage.js';

export function getRecentIds(key, max = 8) {
  return loadJSON(key, []).slice(-max);
}

export function pushRecentId(key, id, max = 8) {
  const recent = getRecentIds(key, max).filter((x) => x !== id);
  recent.push(id);
  saveJSON(key, recent.slice(-max));
}
