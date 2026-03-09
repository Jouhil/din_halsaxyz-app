import { loadJSON, saveJSON } from '../storage.js';

const DEFAULT_INSIGHT = 'Du tog en stund för dig själv idag. Det är viktigt.';
const INSIGHT_ROTATION_KEY = 'dailyInsightRotation';

const INSIGHTS_BY_NEED = {
  stress: [
    'Stressen har kanske varit tydlig idag, och du tog ett steg för att landa.',
    'Stressignalerna fanns där idag, men du gav kroppen en stund att andas.',
    'Det kan ha funnits oro idag, och små pauser kan göra stor skillnad.',
  ],
  energi: [
    'Energin har kanske varit låg idag, men små steg kan hjälpa kroppen igång.',
    'Kroppen verkade behöva lite extra kraft idag.',
    'Energin var kanske inte på topp idag, men varje liten handling räknas.',
  ],
  sömn: [
    'Sömnen verkar ha påverkat dagen, men kroppen kan återhämta sig steg för steg.',
    'Återhämtningen verkar behöva lite extra stöd idag.',
    'Kroppen signalerar att vila är extra viktig just nu.',
  ],
  humör: [
    'Humöret kan ha känts tyngre idag, men du tog ett steg mot något bättre.',
    'Känslan i kroppen verkar ha varit låg idag.',
    'Även en liten ljusglimt kan göra skillnad i hur dagen känns.',
  ],
  tankar: [
    'Tankarna verkar ha varit intensiva idag.',
    'Huvudet verkar ha haft mycket att bära idag.',
    'Att stanna upp en stund kan hjälpa tankarna att landa.',
  ],
};

export function buildDailyInsight({
  primaryNeed,
  answers,
  toolId,
} = {}) {
  void answers;
  void toolId;
  const list = INSIGHTS_BY_NEED[primaryNeed] || [DEFAULT_INSIGHT];
  if (list.length <= 1) return list[0];

  const history = loadJSON(INSIGHT_ROTATION_KEY, {});
  const needKey = typeof primaryNeed === 'string' && primaryNeed ? primaryNeed : 'default';
  const currentIndex = Number(history?.[needKey]);
  const nextIndex = Number.isInteger(currentIndex) && currentIndex >= 0
    ? (currentIndex + 1) % list.length
    : 0;

  saveJSON(INSIGHT_ROTATION_KEY, {
    ...(history || {}),
    [needKey]: nextIndex,
  });

  return list[nextIndex];
}
