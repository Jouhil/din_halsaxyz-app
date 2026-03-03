const NEED_PRIORITY = ['tankar', 'stress', 'humör', 'energi', 'sömn'];

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

export function getPrimaryNeed(preValues = {}) {
  const values = {
    stress: Number(preValues.stress ?? 5),
    humör: Number(preValues.humör ?? 5),
    energi: Number(preValues.energi ?? 5),
    sömn: Number(preValues.sömn ?? 5),
    tankar: Number(preValues.tankar ?? preValues.tanketryck ?? 5),
  };

  const triggers = {
    tankar: values.tankar >= 7,
    stress: values.stress >= 7,
    humör: values.humör <= 3,
    energi: values.energi <= 3,
    sömn: values.sömn <= 3,
  };

  for (const need of NEED_PRIORITY) {
    if (triggers[need]) return need;
  }

  const weighted = [
    { need: 'tankar', score: values.tankar },
    { need: 'stress', score: values.stress },
    { need: 'humör', score: 10 - values.humör },
    { need: 'energi', score: 10 - values.energi },
    { need: 'sömn', score: 10 - values.sömn },
  ].sort((a, b) => b.score - a.score || NEED_PRIORITY.indexOf(a.need) - NEED_PRIORITY.indexOf(b.need));

  return weighted[0]?.need || 'stress';
}
