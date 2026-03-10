const DEFAULT_REASON = 'Vi börjar här för att ge dig en lugn och tydlig start just nu.';

function toNumber(value, fallback = 5) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function getBaseSeverity(checkinValues = {}) {
  return {
    stress: 10 - toNumber(checkinValues.stress, 5),
    tankar: 10 - toNumber(checkinValues.tankar, 5),
    sömn: 10 - toNumber(checkinValues.sömn, 5),
    energi: 10 - toNumber(checkinValues.energi, 5),
    humör: 10 - toNumber(checkinValues.humör, 5),
  };
}

function answerSeverity(questionId = '', value = 5) {
  const lowMeansWorse = ['recovery', 'settle', 'rhythm', 'start', 'steady', 'drive', 'release', 'clarity', 'positive', 'connection', 'hope'];
  const highMeansWorse = ['worry', 'tension', 'pressure', 'nightwake', 'crash', 'loop', 'speed', 'heavy'];
  if (highMeansWorse.some((marker) => questionId.includes(marker))) return toNumber(value, 5);
  if (lowMeansWorse.some((marker) => questionId.includes(marker))) return 10 - toNumber(value, 5);
  return 10 - toNumber(value, 5);
}

function getAdaptiveSignalSummary(adaptiveAnswers = {}) {
  const perNeed = { stress: 0, tankar: 0, sömn: 0, energi: 0, humör: 0 };
  Object.entries(adaptiveAnswers || {}).forEach(([key, value]) => {
    if (!key.startsWith('focus-')) return;
    const [, rawNeed] = key.split('-');
    const need = rawNeed === 'somn' ? 'sömn' : rawNeed === 'humor' ? 'humör' : rawNeed;
    if (!Object.prototype.hasOwnProperty.call(perNeed, need)) return;
    perNeed[need] += answerSeverity(key, value);
  });
  return perNeed;
}

function toolKind(tool = {}) {
  const text = `${tool.id || ''} ${tool.title || ''}`.toLowerCase();
  if (text.includes('box') || text.includes('4-6') || text.includes('4-7-8') || text.includes('utandning') || text.includes('breathing')) return 'breathing';
  if (text.includes('jordning') || text.includes('grounding') || text.includes('5-4-3-2-1') || text.includes('fötterna')) return 'grounding';
  if (text.includes('tankefångare') || text.includes('thought-catcher') || text.includes('tanke ≠ fakta') || text.includes('märk tanken')) return 'thought-catcher';
  if (text.includes('tillbaka till nuet') || text.includes('return-to-now') || text.includes('sinneankare') || text.includes('namnge och släpp')) return 'return-to-now';
  return 'generic';
}

function buildReason({ kind, primaryNeed, thoughtLoad, stressLoad, overwhelmLoad, bodyLoad }) {
  if (kind === 'breathing' && (stressLoad >= 7 || bodyLoad >= 6)) return 'Det här verktyget passar när stressen är hög och kroppen behöver varva ned.';
  if (kind === 'return-to-now' && thoughtLoad >= 7) return 'Det här verktyget hjälper när tankarna drar iväg och du vill landa mjukt i nuet igen.';
  if (kind === 'grounding' && overwhelmLoad >= 7) return 'Det här verktyget passar när du behöver komma tillbaka till kroppen och omgivningen.';
  if (kind === 'thought-catcher') return 'Det här verktyget passar när tankemönster fastnar och du vill få lite mer luft i perspektivet.';
  if (primaryNeed === 'energi') return 'Det här verktyget hjälper dig att samla energi utan att pressa upp tempot.';
  return DEFAULT_REASON;
}

export function getRecommendedTool({
  primaryNeed,
  checkinValues = {},
  adaptiveAnswers = {},
  memory = null,
  recentToolIds = [],
  availableTools = [],
} = {}) {
  if (!Array.isArray(availableTools) || !availableTools.length) {
    return { toolId: null, reasonShort: DEFAULT_REASON, alternatives: [] };
  }

  const baseSeverity = getBaseSeverity(checkinValues);
  const adaptiveSeverity = getAdaptiveSignalSummary(adaptiveAnswers);
  const stressLoad = (baseSeverity.stress || 0) + (adaptiveSeverity.stress || 0) * 0.6;
  const thoughtLoad = (baseSeverity.tankar || 0) + (adaptiveSeverity.tankar || 0) * 0.6;
  const overwhelmLoad = Math.max(stressLoad, thoughtLoad);
  const bodyLoad = stressLoad + ((adaptiveSeverity.stress || 0) * 0.3);

  const history = Array.isArray(recentToolIds) ? recentToolIds.filter(Boolean) : [];
  const latestToolId = history[0] || memory?.recent?.lastToolId || null;
  const recentSet = new Set(history.slice(0, 2));

  const scored = availableTools.map((tool, index) => {
    const kind = toolKind(tool);
    let score = 1;

    if ((tool.needs || []).includes(primaryNeed)) score += 2.5;
    if (primaryNeed === 'stress' && kind === 'breathing') score += 2;
    if (primaryNeed === 'stress' && overwhelmLoad >= 7 && kind === 'grounding') score += 1.2;
    if (primaryNeed === 'stress' && thoughtLoad >= 7 && kind === 'return-to-now') score += 1.5;
    if (primaryNeed === 'tankar' && (kind === 'return-to-now' || kind === 'thought-catcher')) score += 2.4;
    if (primaryNeed === 'humör' && kind === 'thought-catcher') score += 1.8;
    if (primaryNeed === 'humör' && kind === 'return-to-now') score += 1;
    if (primaryNeed === 'sömn' && kind === 'breathing') score += 2;
    if (primaryNeed === 'sömn' && thoughtLoad >= 7 && (kind === 'return-to-now' || kind === 'thought-catcher')) score += 1.7;
    if (primaryNeed === 'energi' && thoughtLoad >= 6 && kind === 'return-to-now') score += 2;
    if (primaryNeed === 'energi' && stressLoad <= 5 && kind === 'breathing') score += 1;
    if (bodyLoad >= 7 && kind === 'breathing') score += 1.5;
    if (overwhelmLoad >= 8 && kind === 'grounding') score += 1.4;
    if (thoughtLoad >= 8 && kind === 'thought-catcher') score += 1.5;

    if (latestToolId && tool.id === latestToolId) score -= 1.4;
    if (recentSet.has(tool.id)) score -= 0.8;

    return { tool, index, kind, score };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const selected = scored[0] || null;
  if (!selected) return { toolId: null, reasonShort: DEFAULT_REASON, alternatives: [] };

  const alternatives = scored
    .slice(1, 3)
    .map((entry) => ({ toolId: entry.tool.id, title: entry.tool.title }));

  return {
    toolId: selected.tool.id,
    reasonShort: buildReason({
      kind: selected.kind,
      primaryNeed,
      thoughtLoad,
      stressLoad,
      overwhelmLoad,
      bodyLoad,
    }),
    alternatives,
  };
}
