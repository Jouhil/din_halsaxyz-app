const NEED_ALIASES = {
  humor: 'humör',
  mood: 'humör',
  energy: 'energi',
  sleep: 'sömn',
  somn: 'sömn',
  thoughts: 'tankar',
  thought: 'tankar',
};

const WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeNeed(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return NEED_ALIASES[trimmed] || trimmed;
}

function toTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  const ts = date.getTime();
  return Number.isNaN(ts) ? null : ts;
}

function getNeed(log = {}) {
  return normalizeNeed(log.primaryNeed || log.need || log.plan?.primaryNeed || null);
}

function getToolId(log = {}) {
  return log.toolId || log.selectedTool?.id || log.plan?.selectedTool?.id || null;
}

function getTimestamp(log = {}) {
  return toTimestamp(log.timestamp || log.createdAt || log.date);
}

function getSliderValue(log = {}, key) {
  const pre = log.pre && typeof log.pre === 'object' ? log.pre : null;
  const answers = log.answers && typeof log.answers === 'object' ? log.answers : null;
  const checkin = log.checkin && typeof log.checkin === 'object' ? log.checkin : null;
  const value = pre?.[key] ?? answers?.[key] ?? checkin?.[key];
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isCalmingTool(toolId = '') {
  if (!toolId) return false;
  const id = String(toolId).toLowerCase();
  return id.includes('stress') || id.includes('calm') || id.includes('breath') || id.includes('ground');
}

function isReflectiveTool(toolId = '') {
  if (!toolId) return false;
  const id = String(toolId).toLowerCase();
  return id.includes('tankar') || id.includes('thought') || id.includes('reflect') || id.includes('journal');
}

export function buildWeeklyPattern({ logs = [], now = new Date() } = {}) {
  const source = Array.isArray(logs) ? logs : [];
  if (source.length < 3) return null;

  const nowTs = toTimestamp(now) || Date.now();
  const minTs = nowTs - (WINDOW_DAYS * DAY_MS);

  const normalized = source
    .map((log, index) => {
      if (!log || typeof log !== 'object') return null;
      const timestampMs = getTimestamp(log);
      return {
        index,
        timestampMs,
        need: getNeed(log),
        toolId: getToolId(log),
        sleep: getSliderValue(log, 'sömn'),
        energy: getSliderValue(log, 'energi'),
        mood: getSliderValue(log, 'humör'),
        thoughts: getSliderValue(log, 'tankar'),
      };
    })
    .filter(Boolean);

  const withTimestamp = normalized.filter((entry) => typeof entry.timestampMs === 'number' && entry.timestampMs >= minTs && entry.timestampMs <= nowTs);
  const recent = withTimestamp.length >= 3 ? withTimestamp : normalized.slice(-7);
  if (recent.length < 3) return null;

  const needCounts = recent.reduce((acc, entry) => {
    if (!entry.need) return acc;
    acc[entry.need] = (acc[entry.need] || 0) + 1;
    return acc;
  }, {});

  const [topNeed, topNeedCount = 0] = Object.entries(needCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || [];

  if (topNeedCount >= 3) {
    if (topNeed === 'stress') return 'Stress har varit förhöjd flera gånger den här veckan.';
    if (topNeed === 'sömn') return 'Sömn har återkommit som ett viktigt område den här veckan.';
    if (topNeed === 'humör') return 'Humör verkar vara ett återkommande tema för dig den här veckan.';
    return `${topNeed.charAt(0).toUpperCase() + topNeed.slice(1)} återkommer flera gånger den här veckan.`;
  }

  const lowSleepLowEnergyCount = recent.filter((entry) => entry.sleep !== null && entry.energy !== null && entry.sleep <= 4 && entry.energy <= 4).length;
  if (lowSleepLowEnergyCount >= 2) return 'Sömn och låg energi verkar ofta hänga ihop för dig.';

  const lowMoodHighThoughtCount = recent.filter((entry) => entry.mood !== null && entry.thoughts !== null && entry.mood <= 4 && entry.thoughts <= 4).length;
  if (lowMoodHighThoughtCount >= 2) return 'Humör och tankar verkar ofta röra sig tillsammans.';

  const highStressWithCalmingTool = recent.filter((entry) => entry.need === 'stress' && isCalmingTool(entry.toolId)).length;
  if (highStressWithCalmingTool >= 2) return 'Du väljer ofta lugna verktyg när stressen är hög.';

  const lowMoodWithReflectiveTool = recent.filter((entry) => entry.need === 'humör' && isReflectiveTool(entry.toolId)).length;
  if (lowMoodWithReflectiveTool >= 2) return 'Du väljer ofta reflekterande verktyg när humöret är lågt.';

  return null;
}
