import { loadJSON } from '../storage.js';

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function inferNeed(log = {}) {
  return log.primaryNeed || log.need || log.focusNeed || log.plan?.primaryNeed || null;
}

function inferToolId(log = {}) {
  return log.toolId || log.selectedTool?.id || log.plan?.selectedTool?.id || null;
}

function inferTimestamp(log = {}) {
  return toIso(log.timestamp || log.createdAt || log.date || log.dateISO || log.completedAt);
}

function rankByCount(map = {}, limit = 1) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key]) => key);
}

function toLocalDayKey(timestampMs) {
  if (typeof timestampMs !== 'number' || Number.isNaN(timestampMs)) return null;
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateStreakDays(items = []) {
  const uniqueDays = [...new Set(items.map((item) => toLocalDayKey(item.timestampMs)).filter(Boolean))]
    .sort((a, b) => Date.parse(b) - Date.parse(a));

  if (!uniqueDays.length) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i += 1) {
    const prevMs = Date.parse(uniqueDays[i - 1]);
    const nextMs = Date.parse(uniqueDays[i]);
    const dayDiff = Math.round((prevMs - nextMs) / (24 * 60 * 60 * 1000));
    if (dayDiff !== 1) break;
    streak += 1;
  }

  return streak;
}

function pickDominantNeed(entries = []) {
  const withNeed = entries.filter((entry) => entry.need);
  if (!withNeed.length) return null;

  const counts = withNeed.reduce((acc, entry) => {
    acc[entry.need] = (acc[entry.need] || 0) + 1;
    return acc;
  }, {});

  let bestNeed = null;
  let bestCount = 0;
  let bestTs = -1;

  withNeed.forEach((entry) => {
    const count = counts[entry.need] || 0;
    const ts = typeof entry.timestampMs === 'number' ? entry.timestampMs : -1;
    if (count > bestCount || (count === bestCount && ts > bestTs)) {
      bestNeed = entry.need;
      bestCount = count;
      bestTs = ts;
    }
  });

  return bestNeed;
}

export function getHabitMemory({ now = new Date(), days = 14 } = {}) {
  const notes = [];
  const windowDays = Number(days) > 0 ? Number(days) : 14;
  const source = loadJSON('dailyFlowLogs', []);
  const logs = Array.isArray(source) ? source : [];

  if (!Array.isArray(source)) notes.push('dailyFlowLogs was not an array; using empty fallback.');
  if (!logs.length) notes.push('No daily flow logs found.');

  const nowDate = new Date(now);
  const nowTs = Number.isNaN(nowDate.getTime()) ? Date.now() : nowDate.getTime();
  const minTs = nowTs - windowDays * 24 * 60 * 60 * 1000;

  const normalized = logs
    .map((log, index) => {
      const timestamp = inferTimestamp(log);
      return {
        index,
        log,
        timestamp,
        timestampMs: timestamp ? Date.parse(timestamp) : null,
        need: inferNeed(log),
        toolId: inferToolId(log),
      };
    })
    .filter((item) => item.log && typeof item.log === 'object');

  const withTs = normalized.filter((item) => typeof item.timestampMs === 'number' && !Number.isNaN(item.timestampMs));
  const withoutTs = normalized.filter((item) => item.timestampMs === null);
  if (withoutTs.length) notes.push(`${withoutTs.length} logs missing parseable timestamp/date; kept for compatibility.`);

  let inWindow = withTs.filter((item) => item.timestampMs >= minTs && item.timestampMs <= nowTs);
  if (!inWindow.length && withoutTs.length) {
    notes.push('Used last N log items because timestamps were missing/outside range.');
    inWindow = withoutTs.slice(-windowDays);
  }

  const byNeed = {};
  const byToolId = {};
  inWindow.forEach((entry) => {
    if (entry.need) byNeed[entry.need] = (byNeed[entry.need] || 0) + 1;
    if (entry.toolId) byToolId[entry.toolId] = (byToolId[entry.toolId] || 0) + 1;
  });

  const sortedRecent = normalized
    .slice()
    .sort((a, b) => {
      if (a.timestampMs && b.timestampMs) return b.timestampMs - a.timestampMs;
      if (a.timestampMs) return -1;
      if (b.timestampMs) return 1;
      return b.index - a.index;
    });

  const latest = sortedRecent[0] || null;
  const recentTools = sortedRecent.map((item) => item.toolId).filter(Boolean);
  const streakDays = calculateStreakDays(withTs);
  const dominantNeed = pickDominantNeed(inWindow);
  const favoredToolIds = rankByCount(byToolId, 3);
  const repeatedToolIds = rankByCount(
    Object.fromEntries(Object.entries(byToolId).filter(([, count]) => count >= 2)),
    10,
  );
  const toolHintNotes = [];
  if (favoredToolIds.length) toolHintNotes.push(`Favored tools in ${windowDays}d: ${favoredToolIds.join(', ')}.`);
  if (withoutTs.length) toolHintNotes.push('Some logs had no valid timestamp.');

  return {
    windowDays,
    totals: {
      sessions: inWindow.length,
      byNeed,
      byToolId,
    },
    recent: {
      lastNeed: latest?.need || null,
      lastToolId: latest?.toolId || null,
      lastSessionAt: latest?.timestamp || null,
    },
    preferences: {
      favoredNeed: rankByCount(byNeed, 1)[0] || null,
      favoredTools: favoredToolIds,
      avoidTools: recentTools.slice(0, 2),
    },
    streakDays,
    dominantNeed,
    toolSuccessHints: {
      favoredToolIds,
      repeatedToolIds,
      notes: toolHintNotes,
    },
    notes,
  };
}
