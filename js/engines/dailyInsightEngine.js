const DEFAULT_INSIGHT = 'Du tog en stund för dig själv idag. Det är viktigt.';

const INSIGHTS_BY_NEED = {
  stress: [
    'Idag verkar stressen ha varit tydlig, men du tog ett steg för att landa.',
    'Stressignalerna var där idag, men du gav kroppen en stund att andas.',
    'Det verkar ha funnits lite oro idag, men små pauser kan göra stor skillnad.',
  ],
  energi: [
    'Din energi verkar ha varit lite låg idag, men små steg kan hjälpa kroppen att komma igång.',
    'Det verkar som att kroppen behövde lite extra kraft idag.',
    'Energin var kanske inte på topp idag, men varje liten handling räknas.',
  ],
  sömn: [
    'Sömnen verkar ha påverkat dagen lite, men kroppen kan återhämta sig steg för steg.',
    'Det verkar som att återhämtningen behöver lite stöd just nu.',
    'Din kropp signalerar att vila är viktig just nu.',
  ],
  humör: [
    'Humöret verkar ha varit lite tyngre idag, men du tog ett steg mot något bättre.',
    'Känslan i kroppen verkar ha varit lite låg idag.',
    'Även små ljusglimtar kan göra stor skillnad i hur dagen känns.',
  ],
  tankar: [
    'Tankarna verkar ha varit lite intensiva idag.',
    'Det verkar som att huvudet haft mycket att bära idag.',
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
  return list[Math.floor(Math.random() * list.length)];
}
