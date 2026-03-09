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

export function inferNeedPriorityFromAnswers(answers = {}, options = {}) {
  const { lastChangedNeed = null } = options;
  const stress = resolveNeedValue(answers, ['stress']);
  const sleep = resolveNeedValue(answers, ['sömn', 'somn', 'sleep']);
  const energy = resolveNeedValue(answers, ['energi', 'energy']);
  const mood = resolveNeedValue(answers, ['humör', 'humor', 'mood']);
  const thoughts = resolveNeedValue(answers, ['tankar', 'thoughts', 'thought']);

  const signalScores = {
    stress: stress === null ? 0 : clampScore(10 - stress),
    sömn: sleep === null ? 0 : clampScore(10 - sleep),
    energi: energy === null ? 0 : clampScore(10 - energy),
    humör: mood === null ? 0 : clampScore(10 - mood),
    tankar: thoughts === null ? 0 : clampScore(10 - thoughts),
  };

  const topSignalValue = Math.max(...Object.values(signalScores));
  const topTiedNeeds = Object.entries(signalScores)
    .filter(([, score]) => score === topSignalValue)
    .map(([need]) => need);

  const priority = Object.entries(signalScores)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];

      const bothTopTied = a[1] === topSignalValue && b[1] === topSignalValue;
      if (bothTopTied && lastChangedNeed) {
        if (a[0] === lastChangedNeed) return -1;
        if (b[0] === lastChangedNeed) return 1;
      }

      return a[0].localeCompare(b[0]);
    })
    .map(([need]) => need);

  const topNeed = priority[0] || null;
  const topSignal = topNeed ? signalScores[topNeed] : 0;

  return {
    priority,
    signalScores,
    hasStrongSignal: topSignal >= DEFAULT_SIGNAL_THRESHOLD,
    topNeed,
    topSignal,
    topTiedNeeds,
  };
}

function getNeedRankScore(need, needPriority = []) {
  const idx = needPriority.indexOf(need);
  if (idx === -1) return 0;
  return Math.max(0, needPriority.length - idx);
}

export function rankQuestions({ questions = [], answers = {}, memory = null, lastChangedNeed = null } = {}) {
  const answeredIds = getAnsweredIds(answers);
  const needSignals = inferNeedPriorityFromAnswers(answers, { lastChangedNeed });
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
  lastChangedNeed = null,
} = {}) {
  const ranked = rankQuestions({ questions, answers, memory, lastChangedNeed });
  if (!ranked.length) return null;

  const needSignals = inferNeedPriorityFromAnswers(answers, { lastChangedNeed });
  if (!needSignals.hasStrongSignal) {
    return ranked
      .slice()
      .sort((a, b) => a.index - b.index)[0]
      ?.question || null;
  }

  return ranked[0]?.question || null;
}

export const DEFAULT_ADAPTIVE_QUESTIONS = Object.freeze([
  { id: 'focus-stress-recovery', need: 'stress', label: 'Hur lätt är det att varva ned i kroppen?', type: 'slider' },
  { id: 'focus-stress-worry', need: 'stress', label: 'Hur mycket oro tar plats just nu?', type: 'slider' },
  { id: 'focus-somn-recovery', need: 'sömn', label: 'Hur återhämtad känner du dig efter sömnen?', type: 'slider' },
  { id: 'focus-somn-settle', need: 'sömn', label: 'Hur lätt var det att komma till ro?', type: 'slider' },
  { id: 'focus-energi-start', need: 'energi', label: 'Hur lätt känns det att komma igång idag?', type: 'slider' },
  { id: 'focus-energi-steady', need: 'energi', label: 'Hur jämn känns energin i kroppen?', type: 'slider' },
  { id: 'focus-tankar-release', need: 'tankar', label: 'Hur lätt är det att släppa tankar för en stund?', type: 'slider' },
  { id: 'focus-tankar-loop', need: 'tankar', label: 'Hur mycket fastnar du i samma tankespår?', type: 'slider' },
  { id: 'focus-humor-positive', need: 'humör', label: 'Hur lätt är det att känna något positivt just nu?', type: 'slider' },
  { id: 'focus-humor-heavy', need: 'humör', label: 'Hur tung känns känslan i kroppen?', type: 'slider' },
]);

export function prioritizeAdaptiveQuestionsByHistory(questions = [], recentQuestionIds = []) {
  const recentOrder = new Map();
  const recentList = Array.isArray(recentQuestionIds) ? recentQuestionIds : [];
  recentList.forEach((id, index) => {
    if (!recentOrder.has(id)) recentOrder.set(id, index);
  });

  return (Array.isArray(questions) ? questions : [])
    .map((question, index) => {
      const historyIndex = recentOrder.has(question?.id) ? recentOrder.get(question.id) : -1;
      return { question, index, historyIndex };
    })
    .sort((a, b) => {
      const aSeen = a.historyIndex >= 0;
      const bSeen = b.historyIndex >= 0;
      if (aSeen !== bSeen) return aSeen ? 1 : -1;
      if (aSeen && bSeen && a.historyIndex !== b.historyIndex) return a.historyIndex - b.historyIndex;
      return a.index - b.index;
    })
    .map((entry) => entry.question)
    .filter(Boolean);
}
