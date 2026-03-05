import { getPrimaryNeed } from './matchingEngine.js';

const DEFAULT_NEED = 'stress';

const PROMPT_BY_NEED = {
  stress: 'Ett lugnt andetag kan vara tillräckligt för att börja.',
  humör: 'Små vänliga handlingar kan lyfta ditt mående steg för steg.',
  energi: 'Kort aktivering nu kan ge mer driv resten av timmen.',
  sömn: 'Låt tempot sjunka lite – kroppen kan hitta tillbaka till vila.',
  tankar: 'Notera tanken, släpp taget en stund och återvänd till nuet.',
};

function chooseByRotation(items = [], history = [], keyFn = (item) => item?.id) {
  if (!Array.isArray(items) || !items.length) return null;
  const recentSet = new Set(history || []);
  const withKeys = items
    .map((item) => ({ item, key: keyFn(item) }))
    .filter((entry) => entry.key);
  const pool = withKeys.filter((entry) => !recentSet.has(entry.key));
  const source = pool.length ? pool : withKeys;
  return source[0]?.item || null;
}

function normalizeIntensity(preValues = {}, need) {
  return Number(preValues?.[need] ?? 5);
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

function selectTool({ primaryNeed, intensity, flowMinutes, tools = [], rotationHistory = {} }) {
  const [minDur, maxDur] = flowMinutes === 8 ? [90, 150] : [60, 120];
  const matchingNeed = tools.filter((tool) => (tool.needs || []).includes(primaryNeed));
  const filtered = matchingNeed.filter((tool) => {
    const inDuration = tool.durationSec >= minDur && tool.durationSec <= maxDur;
    const inIntensity = intensity >= (tool.intensityMin ?? 0) && intensity <= (tool.intensityMax ?? 10);
    return inDuration && inIntensity;
  });
  const candidates = filtered.length ? filtered : matchingNeed;
  const key = `tool:${primaryNeed}`;
  return chooseByRotation(candidates, rotationHistory[key], (tool) => tool.id) || matchingNeed[0] || tools[0] || null;
}

function selectPrompt({ primaryNeed, selectedTool, library, rotationHistory = {} }) {
  const suggestions = library?.micro_tools?.filter((item) => (item.needs || []).includes(primaryNeed)) || [];
  const key = `prompt:${primaryNeed}`;
  const picked = chooseByRotation(suggestions, rotationHistory[key], (item) => item.id);
  if (picked?.description) return picked.description;
  if (selectedTool?.mode === 'pepp') return 'Kort pepp: rör kroppen lite och notera energiökningen.';
  return PROMPT_BY_NEED[primaryNeed] || PROMPT_BY_NEED[DEFAULT_NEED];
}

function selectClosing({ primaryNeed, closing, rotationHistory = {} }) {
  const all = closing?.closing_double || [];
  const tagged = all.filter((item) => (item.needs || []).includes(primaryNeed));
  const key = `closing:${primaryNeed}`;
  return chooseByRotation(tagged.length ? tagged : all, rotationHistory[key], (item) => item.id) || { lines: ['Du tog hand om dig i dag.', 'Små steg gör skillnad.'] };
}

export function buildSessionPlan(input = {}) {
  const {
    preValues = {},
    selectedNeed,
    userPreferences = {},
    libraries = {},
    rotationHistory = {},
    tools = [],
    flowMinutes = 3,
  } = input;

  const primaryNeed = selectedNeed || getPrimaryNeed(preValues) || DEFAULT_NEED;
  const intensity = normalizeIntensity(preValues, primaryNeed);
  const selectedTool = selectTool({ primaryNeed, intensity, flowMinutes, tools, rotationHistory });
  const selectedPrompt = selectPrompt({ primaryNeed, selectedTool, library: libraries.library, rotationHistory });
  const closingMessage = selectClosing({ primaryNeed, closing: libraries.closing, rotationHistory });

  return {
    primaryNeed,
    selectedTool,
    selectedPrompt,
    closingMessage,
    rationale: {
      source: 'deterministic-heuristics',
      intensity,
      flowMinutes,
      preferredMode: userPreferences.mode || 'default',
      usedNeedOverride: Boolean(selectedNeed),
    },
    uiHints: inferUiHints(primaryNeed, intensity),
  };
}
