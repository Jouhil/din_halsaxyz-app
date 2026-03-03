import { loadJSON, saveJSON } from '../storage.js';

const LIB_URL = 'data/library.v1.json?v=1';
const CLOSING_URL = 'data/closing.v1.json?v=1';

let libraryCache = null;
let closingCache = null;

async function fetchAndCache(url, cacheKey, fallback) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const json = await response.json();
      saveJSON(cacheKey, json);
      return json;
    }
  } catch {}
  return loadJSON(cacheKey, fallback);
}

export async function loadDataLibraries({ fallbackLib, fallbackClosing }) {
  [libraryCache, closingCache] = await Promise.all([
    fetchAndCache(LIB_URL, 'libCache_v1', fallbackLib),
    fetchAndCache(CLOSING_URL, 'closingCache_v1', fallbackClosing),
  ]);
  return { library: libraryCache, closing: closingCache };
}

export function getLibrary() {
  return libraryCache;
}

export function getClosing() {
  return closingCache;
}
