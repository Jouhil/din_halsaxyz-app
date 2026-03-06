const DEFAULT_SIGNAL_THRESHOLD = 6;

function isAnsweredValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return true;
}

export function getAnsweredIds(answers = {}) {
  if (!answers || typeof answers !== 'object') return new Set();
  return new Set(Object.entries(answers)
    .filter(([, value]) => isAnsweredValue(value))
    .map(([id]) => id));
}

function resolveNeedValue(answers = {}, keys = []) {
  for (const key of keys) {
    const value = answers?.[key];
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
  }
  return null;
}

function clampScore(value) {
  return Math.max(0, Math.min(10, value));
}

export function inferNeedPriorityFromAnswers(answers = {}) {
  const stress = resolveNeedValue(answers, ['stress']);
  const sleep = resolveNeedValue(answers, ['sömn', 'somn', 'sleep']);
  const energy = resolveNeedValue(answers, ['energi', 'energy']);

  const signalScores = {
    stress: stress === null ? 0 : clampScore(10 - stress),
    sömn: sleep === null ? 0 : clampScore(10 - sleep),
    energi: energy === null ? 0 : clampScore(10 - energy),
  };

  const priority = Object.entries(signalScores)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([need]) => need);

  const topNeed = priority[0] || null;
  const topSignal = topNeed ? signalScores[topNeed] : 0;

  return {
    priority,
    signalScores,
    hasStrongSignal: topSignal >= DEFAULT_SIGNAL_THRESHOLD,
    topNeed,
    topSignal,
  };
}

function getNeedRankScore(need, needPriority = []) {
  const idx = needPriority.indexOf(need);
  if (idx === -1) return 0;
  return Math.max(0, needPriority.length - idx);
}

export function rankQuestions({ questions = [], answers = {}, memory = null } = {}) {
  const answeredIds = getAnsweredIds(answers);
  const needSignals = inferNeedPriorityFromAnswers(answers);
  const memoryNeed = memory?.dominantNeed || null;

  return (Array.isArray(questions) ? questions : [])
    .map((question, index) => {
      const answered = answeredIds.has(question?.id);
      const needRank = question?.need ? getNeedRankScore(question.need, needSignals.priority) : 0;
      const signalScore = question?.need ? (needSignals.signalScores[question.need] || 0) : 0;
      const memoryBoost = memoryNeed && question?.need === memoryNeed ? 0.4 : 0;
      const score = needRank + (signalScore * 0.1) + memoryBoost;
      return {
        question,
        index,
        answered,
        score,
      };
    })
    .filter((entry) => entry.question && !entry.answered)
    .sort((a, b) => b.score - a.score || a.index - b.index);
}

export function getNextQuestion({
  questions = [],
  answers = {},
  memory = null,
} = {}) {
  const ranked = rankQuestions({ questions, answers, memory });
  if (!ranked.length) return null;

  const needSignals = inferNeedPriorityFromAnswers(answers);
  if (!needSignals.hasStrongSignal) {
    return ranked
      .slice()
      .sort((a, b) => a.index - b.index)[0]
      ?.question || null;
  }

  return ranked[0]?.question || null;
}

export const DEFAULT_ADAPTIVE_QUESTIONS = Object.freeze([
  { id: 'focus-stress', need: 'stress', label: 'Hur är stressnivån just nu?', type: 'slider' },
  { id: 'focus-stress-recovery', need: 'stress', label: 'Hur lätt är det att varva ned i kroppen?', type: 'slider' },
  { id: 'focus-somn', need: 'sömn', label: 'Hur har sömnen varit senaste dygnet?', type: 'slider' },
  { id: 'focus-somn-recovery', need: 'sömn', label: 'Hur återhämtad känner du dig efter sömnen?', type: 'slider' },
  { id: 'focus-energi', need: 'energi', label: 'Hur är energin i kroppen just nu?', type: 'slider' },
  { id: 'focus-tankar', need: 'tankar', label: 'Hur påfrestande känns tankarna?', type: 'slider' },
  { id: 'focus-humor', need: 'humör', label: 'Hur känns humöret i stunden?', type: 'slider' },
]);
