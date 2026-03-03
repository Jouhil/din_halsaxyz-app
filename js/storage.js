export function getItem(key, fallback = null) {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value;
}

export function setItem(key, value) {
  localStorage.setItem(key, value);
}

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
