import { getPrimaryNeed } from './matchingEngine.js';
import { pickRotated } from './rotationEngine.js';
import { getHabitMemory } from './habitMemoryEngine.js';

const DEFAULT_NEED = 'stress';
const DEFAULT_CLOSING = { lines: ['Du tog hand om dig i dag.', 'Små steg gör skillnad.'] };

const PROMPT_BY_NEED = {
  stress: 'Ett lugnt andetag kan vara tillräckligt för att börja.',
  humör: 'Små vänliga handlingar kan lyfta ditt mående steg för steg.',
  energi: 'Kort aktivering nu kan ge mer driv resten av timmen.',
  sömn: 'Låt tempot sjunka lite – kroppen kan hitta tillbaka till vila.',
  tankar: 'Notera tanken, släpp taget en stund och återvänd till nuet.',
};

function pickFromHistory(items = [], recent = [], keyFn = (item) => item?.id) {
  if (!Array.isArray(items) || !items.length) return null;
  const recentSet = new Set(Array.isArray(recent) ? recent : []);
  const withKeys = items.map((item) => ({ item, key: keyFn(item) })).filter((entry) => entry.key);
  const pool = withKeys.filter((entry) => !recentSet.has(entry.key));
  const source = pool.length ? pool : withKeys;
  return source[0]?.item || null;
}

function pickWithRotation(items = [], { recent = [], keyFn = (item) => item?.id } = {}) {
  // Keep engine pure by preferring explicit history; use rotationEngine fallback when no history is provided.
  if (Array.isArray(recent) && recent.length) return pickFromHistory(items, recent, keyFn);
  return pickRotated(items, { keyFn, avoidLastN: 0 });
}

function normalizeIntensity(checkinValues = {}, need) {
  return Number(checkinValues?.[need] ?? 5);
}

function inferUiHints(primaryNeed, intensity) {
  const accentByNeed = {
    stress: 'calm',
    humör: 'calm',
    energi: 'energy',
    sömn: 'calm',
    tankar: 'focus',
  };

  return {
    accent: accentByNeed[primaryNeed] || 'calm',
    intensity: intensity >= 7 ? 'high' : intensity <= 3 ? 'low' : 'med',
  };
}

function selectTool({
  primaryNeed,
  checkinValues,
  userPrefs = {},
  tools = [],
  rotationHistory = {},
  flowMinutes = 3,
  avoidToolIds = [],
  favoredToolIds = [],
}) {
  const [minDur, maxDur] = flowMinutes === 8 ? [90, 150] : [60, 120];
  const intensity = normalizeIntensity(checkinValues, primaryNeed);
  const preferredMode = userPrefs?.mode;

  const matchingNeed = tools.filter((tool) => (tool.needs || []).includes(primaryNeed));
  const modeFiltered = preferredMode ? matchingNeed.filter((tool) => tool.mode === preferredMode || tool.mode === 'lugn') : matchingNeed;
  const candidates = (modeFiltered.length ? modeFiltered : matchingNeed).filter((tool) => {
    const durationOk = tool.durationSec >= minDur && tool.durationSec <= maxDur;
    const intensityOk = intensity >= (tool.intensityMin ?? 0) && intensity <= (tool.intensityMax ?? 10);
    return durationOk && intensityOk;
  });

  const source = candidates.length ? candidates : (modeFiltered.length ? modeFiltered : matchingNeed);
  const avoidSet = new Set(Array.isArray(avoidToolIds) ? avoidToolIds : []);
  const favoredSet = new Set(Array.isArray(favoredToolIds) ? favoredToolIds : []);
  const withoutAvoid = source.filter((tool) => !avoidSet.has(tool.id));
  const eligible = withoutAvoid.length ? withoutAvoid : source;
  const favoredEligible = eligible.filter((tool) => favoredSet.has(tool.id));
  const selectionPool = favoredEligible.length ? favoredEligible : eligible;
  return pickWithRotation(selectionPool, { recent: rotationHistory[`tool:${primaryNeed}`], keyFn: (tool) => tool.id }) || matchingNeed[0] || tools[0] || null;
}

function selectPrompt({ primaryNeed, selectedTool, library = {}, rotationHistory = {} }) {
  const fromLibrary = library?.micro_tools?.filter((item) => (item.needs || []).includes(primaryNeed)) || [];
  const picked = pickWithRotation(fromLibrary, { recent: rotationHistory[`prompt:${primaryNeed}`], keyFn: (item) => item.id });
  if (picked?.description) return picked.description;
  if (selectedTool?.mode === 'pepp') return 'Kort pepp: rör kroppen lite och notera energiökningen.';
  return PROMPT_BY_NEED[primaryNeed] || PROMPT_BY_NEED[DEFAULT_NEED];
}

function selectClosing({ primaryNeed, closing = {}, rotationHistory = {} }) {
  const all = closing?.closing_double || [];
  const tagged = all.filter((item) => (item.needs || []).includes(primaryNeed));
  return pickWithRotation(tagged.length ? tagged : all, { recent: rotationHistory[`closing:${primaryNeed}`], keyFn: (item) => item.id }) || DEFAULT_CLOSING;
}

export function buildSessionPlan(input = {}) {
  const {
    checkinValues = {},
    libraries = {},
    rotationHistory = {},
    userPrefs = {},
    selectedNeed,
    tools = [],
    flowMinutes = 3,
    now = new Date().toISOString(),
  } = input;

  const memory = getHabitMemory({ now });
  const inferredNeed = getPrimaryNeed(checkinValues);
  const hasCheckinValues = Object.keys(checkinValues || {}).length > 0;
  const isWeakNeed = !inferredNeed || inferredNeed === DEFAULT_NEED;
  const memoryNeed = memory.dominantNeed || memory.preferences.favoredNeed;
  const primaryNeed = selectedNeed || (hasCheckinValues && !isWeakNeed ? inferredNeed : null) || memoryNeed || inferredNeed || DEFAULT_NEED;
  const intensity = normalizeIntensity(checkinValues, primaryNeed);
  const selectedTool = selectTool({
    primaryNeed,
    checkinValues,
    userPrefs,
    tools,
    rotationHistory,
    flowMinutes,
    avoidToolIds: memory.preferences.avoidTools,
    favoredToolIds: memory.toolSuccessHints?.favoredToolIds || memory.preferences.favoredTools,
  });
  const selectedPrompt = selectPrompt({ primaryNeed, selectedTool, library: libraries.library, rotationHistory });
  const closingMessage = selectClosing({ primaryNeed, closing: libraries.closing, rotationHistory });

  return {
    primaryNeed,
    selectedTool,
    selectedPrompt,
    closingMessage,
    rationale: {
      source: 'deterministic-heuristics',
      selectedNeed,
      flowMinutes,
      timestamp: now,
      intensity,
      preferredMode: userPrefs?.mode || 'default',
      memory: {
        windowDays: memory.windowDays,
        favoredNeed: memory.preferences.favoredNeed,
        favoredTools: memory.preferences.favoredTools,
        favoredToolIds: memory.toolSuccessHints?.favoredToolIds || [],
        avoidTools: memory.preferences.avoidTools,
        lastNeed: memory.recent.lastNeed,
        lastToolId: memory.recent.lastToolId,
        streakDays: memory.streakDays || 0,
        dominantNeed: memory.dominantNeed || null,
        notes: memory.notes,
      },
    },
    uiHints: inferUiHints(primaryNeed, intensity),
  };
}
