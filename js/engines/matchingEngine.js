export function hasThemeMatch(item, theme) {
  if (!theme || !item) return true;
  if (!item.tags || !Array.isArray(item.tags)) return true;
  return item.tags.length === 0 || item.tags.includes(theme);
}

export function pickByModeWithHistory(items = [], mode, recentIds = []) {
  const modeItems = items.filter((item) => !mode || item.mode === mode || item.mode === 'neutral');
  const withoutRecent = modeItems.filter((item) => !recentIds.includes(item.id));
  const pool = withoutRecent.length ? withoutRecent : modeItems;
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
