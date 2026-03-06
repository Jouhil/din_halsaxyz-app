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

function rankByCount(map = {}, limit = 1) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key]) => key);
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
      const timestamp = toIso(log?.timestamp || log?.dateISO || log?.completedAt);
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
      favoredTools: rankByCount(byToolId, 3),
      avoidTools: recentTools.slice(0, 2),
    },
    notes,
  };
}
