import { state } from '../state.js';
import { loadJSON, saveJSON } from '../storage.js';
import { pickRotated } from '../engines/rotationEngine.js';
import { buildSessionPlan } from '../engines/aiEngine.js';
import { getHabitMemory } from '../engines/habitMemoryEngine.js';
import { DEFAULT_ADAPTIVE_QUESTIONS, getNextQuestion } from '../engines/questionEngine.js';
import { openGuide } from '../ui/helpOverlay.js';

const NEED_KEYS = ['stress', 'humör', 'energi', 'sömn', 'tankar'];
const NEED_LABELS = { stress: 'Stress', humör: 'Humör', energi: 'Energi', sömn: 'Sömn', tankar: 'Tankar' };
const STEPS = Object.freeze({
  START: 'start',
  PRE: 'pre',
  FOCUS: 'focus',
  REFLECTION: 'reflection',
  TOOL: 'tool',
  CLOSING: 'closing',
  DONE: 'done',
});
const FLOW_PATHS = {
  3: [STEPS.PRE, STEPS.FOCUS, STEPS.TOOL, STEPS.CLOSING, STEPS.DONE],
  8: [STEPS.PRE, STEPS.FOCUS, STEPS.REFLECTION, STEPS.TOOL, STEPS.CLOSING, STEPS.DONE],
};
const FOCUS_META = {
  stress: { label: 'Lugn & ro', subtitle: 'Hantera stress och oro', emoji: '🌿', dim: 'stress' },
  humör: { label: 'Humör', subtitle: 'Stärk ditt välmående', emoji: '☀️', dim: 'mood' },
  energi: { label: 'Energi', subtitle: 'Öka din vitalitet', emoji: '⚡', dim: 'energy' },
  sömn: { label: 'Sömnkvalitet', subtitle: 'Förbättra din återhämtning', emoji: '🌙', dim: 'sleep' },
  tankar: { label: 'Tankar', subtitle: 'Klargör ditt sinne', emoji: '💭', dim: 'thoughts' },
};
const SLIDER_META = {
  stress: { left: 'Stressad', right: 'Lugn', emoji: '😰', dim: 'stress' },
  humör: { left: 'Nere', right: 'På topp', emoji: '🙂', dim: 'mood' },
  energi: { left: 'Trött', right: 'Pigg', emoji: '⚡', dim: 'energy' },
  sömn: { left: 'Dålig', right: 'Utvilad', emoji: '🌙', dim: 'sleep' },
  tankar: { left: 'Fast i tankar', right: 'Närvarande', emoji: '💭', dim: 'thoughts' },
};

const chips = {
  situation: ['Jobb', 'Relation', 'Socialt', 'Kropp', 'Tankar', 'Ekonomi', 'Annat'],
  emotion: ['Orolig', 'Stressad', 'Ledsen', 'Irriterad', 'Arg', 'Rädd', 'Trött', 'Skam', 'Överväldigad'],
  thought: ['Jag räcker inte', 'Det blir fel', 'Ingen förstår', 'Jag hinner inte', 'Jag borde klara allt', 'Jag borde vara bättre', 'Egen tanke'],
  alternative: ['Det här är en stund', 'Ett litet steg räcker', 'Jag får pausa', 'Tanke ≠ fakta', 'Jag kan vara snäll mot mig själv', 'Jag behöver inte lösa allt nu'],
};

const microFeedbackByNeed = Object.fromEntries(NEED_KEYS.map((need) => [need, Array.from({ length: 15 }, (_, i) => ({ id: `${need}-fb-${i + 1}`, text: `${NEED_LABELS[need]}: liten återställning ${i + 1} — ett lugnt andetag räcker för att börja.` }))]));
const takeAwayByNeed = Object.fromEntries(NEED_KEYS.map((need) => [need, Array.from({ length: 10 }, (_, i) => ({ id: `${need}-tw-${i + 1}`, lines: [`Ta med dig: ${NEED_LABELS[need]} kan skifta med små steg.`, `Välj en mikropaus (${i + 1} minut) senare idag och upprepa.`] }))]));

const tools = [
  ...['4-6 andning', 'Box breathing', 'Axelsläpp', '5-4-3-2-1 grounding', 'Långsam utandning', 'Tryck fötterna i golvet'].map((t, i) => mkTool(`stress-${i}`, t, 'stress', 70 + i * 10, ['Andas in mjukt genom näsan i 4 sekunder.', 'Andas ut långsamt i 6 sekunder och släpp axlarna.', 'Upprepa 6–10 andetag i jämn rytm.'])),
  ...['Märk tanken', '3-sinneankare', 'Worry container', 'Tanke ≠ fakta', 'Namnge och släpp', 'Andning med fokusord'].map((t, i) => mkTool(`tankar-${i}`, t, 'tankar', 80 + i * 10, ['Stanna upp och märk tanken som dyker upp.', 'Flytta fokus till ett sinnesintryck runt dig.', 'Säg en hjälpsam fras och återgå till nuet.'])),
  ...['Självmedkänsla 60s', 'Tacksamhetsmicro', 'Skicka ett hej', 'Vänlig hand på bröstet', 'Mjuk aktivering', 'Säg något snällt till dig'].map((t, i) => mkTool(`humor-${i}`, t, 'humör', 70 + i * 10, ['Lägg handen på bröstet och andas lugnt.', 'Säg något vänligt till dig själv i tysthet.', 'Avsluta med en liten handling som känns snäll.'])),
  ...['60s rörelse', 'Kallt vatten', 'Res dig & sträck', 'Ljuspaus', 'Powerpose', 'Skaka loss'].map((t, i) => mkTool(`energi-${i}`, t, 'energi', 60 + i * 10, ['Res dig upp och aktivera kroppen i lugn takt.', 'Håll tempot i cirka en minut med medveten andning.', 'Stanna och notera energi i kroppen innan du går vidare.'], 'pepp')),
  ...['4-7-8', 'Body scan mini', 'Skärm ned 1 min', 'Långsam utandning', 'Progressiv avslappning', 'Mjuk kvällsankare'].map((t, i) => mkTool(`somn-${i}`, t, 'sömn', 90 + i * 10, ['Slut ögonen och låt kroppen få stöd.', 'Skanna av kroppen från topp till tå i lugn takt.', 'Sänk tempot ytterligare med en långsam utandning.'])),
];

const TOOL_STEP_OVERRIDES = {
  '4-6 andning': ['Andas in lugnt i 4 sekunder genom näsan.', 'Andas ut i 6 sekunder och släpp käken.', 'Upprepa i jämn rytm och räkna tyst 1–6.'],
  'Box breathing': ['Andas in i 4 sekunder.', 'Håll andan i 4 sekunder, andas sedan ut i 4.', 'Pausa 4 sekunder innan nästa varv.'],
  Axelsläpp: ['Lyft axlarna upp mot öronen i en inandning.', 'Andas ut och släpp axlarna tungt ned.', 'Upprepa 5 gånger och känn skillnaden.'],
  '5-4-3-2-1 grounding': ['Nämn 5 saker du ser omkring dig.', 'Nämn 4 du kan känna och 3 du kan höra.', 'Avsluta med 2 du kan lukta och 1 du kan smaka.'],
  'Långsam utandning': ['Andas in normalt genom näsan.', 'Förläng utandningen tills den är längre än inandningen.', 'Fortsätt i 60–90 sekunder i lugn takt.'],
  'Tryck fötterna i golvet': ['Placera båda fötterna stadigt i golvet.', 'Tryck lätt ner och känn kontakt genom benen.', 'Släpp spänningen mjukt och upprepa tre gånger.'],
  'Märk tanken': ['Sätt ord på tanken: “Jag har en tanke om …”.', 'Notera att det är en tanke, inte ett faktum.', 'För tillbaka uppmärksamheten till andningen.'],
  '3-sinneankare': ['Välj ett ljud och lyssna aktivt i 10 sekunder.', 'Känn ett kroppsområde tydligt, t.ex. händerna.', 'Fokusera blicken på en färg i rummet.'],
  'Worry container': ['Skriv ner orostanken i en kort mening.', 'Bestäm en senare tid då du får återkomma till den.', 'Säg “inte nu” och återgå till stunden.'],
  'Tanke ≠ fakta': ['Identifiera en jobbig tanke.', 'Fråga: vilket bevis har jag för och emot?', 'Formulera en mer hjälpsam och balanserad tanke.'],
  'Namnge och släpp': ['Namnge känslan eller tanken kort.', 'Ta en långsam utandning medan du säger “släpp”.', 'Låt uppmärksamheten landa i kroppen igen.'],
  'Andning med fokusord': ['Andas in och tänk ordet “här”.', 'Andas ut och tänk ordet “nu”.', 'Fortsätt i cirka en minut.'],
  'Självmedkänsla 60s': ['Lägg en hand på bröstet.', 'Säg tyst: “Det här är svårt just nu”.', 'Avsluta med: “Jag får vara vänlig mot mig själv”.'],
  Tacksamhetsmicro: ['Nämn en liten sak som var okej idag.', 'Notera vad den gjorde med ditt humör.', 'Ta ett lugnt andetag och bär med dig känslan.'],
  'Skicka ett hej': ['Tänk på en person du uppskattar.', 'Skicka ett kort “hej” eller en vänlig emoji.', 'Lägg märke till om kontakten gav energi.'],
  'Vänlig hand på bröstet': ['Placera handen mjukt på bröstet.', 'Andas långsamt och känn värmen från handen.', 'Upprepa en vänlig fras till dig själv.'],
  'Mjuk aktivering': ['Rulla axlarna bakåt i lugn takt.', 'Sträck armarna uppåt och andas in.', 'Andas ut och släpp ner armarna långsamt.'],
  'Säg något snällt till dig': ['Säg en vänlig mening till dig själv.', 'Upprepa meningen med lite långsammare tempo.', 'Notera om tonen i kroppen mjuknar.'],
  '60s rörelse': ['Res dig upp och rör kroppen i 60 sekunder.', 'Håll ett tempo där du fortfarande kan andas lugnt.', 'Stanna och känn efter hur energin känns nu.'],
  'Kallt vatten': ['Skölj handlederna i kallt vatten 20–30 sekunder.', 'Fokusera på känslan och andas jämnt.', 'Torka av dig och notera ökad vakenhet.'],
  'Res dig & sträck': ['Res dig upp från stolen.', 'Sträck dig uppåt och åt sidorna i tre andetag.', 'Rulla nacken mjukt innan du sätter dig igen.'],
  Ljuspaus: ['Gå till ett fönster eller tänd starkare ljus.', 'Låt blicken vila långt bort i 20 sekunder.', 'Ta tre djupa andetag medan du står där.'],
  Powerpose: ['Stå stadigt med fötterna höftbrett.', 'Öppna bröstet och håll en trygg hållning i 45 sekunder.', 'Avsluta med ett långsamt andetag in och ut.'],
  'Skaka loss': ['Skaka loss armar och händer i 20 sekunder.', 'Lägg till ben och axlar i mjuk rytm.', 'Stanna upp och känn cirkulationen i kroppen.'],
  '4-7-8': ['Andas in genom näsan i 4 sekunder.', 'Håll andan i 7 sekunder.', 'Andas ut långsamt i 8 sekunder och upprepa.'],
  'Body scan mini': ['Rikta uppmärksamheten till pannan och käken.', 'Skanna vidare genom axlar, bröst och mage.', 'Släpp spänning där du hittar den.'],
  'Skärm ned 1 min': ['Sänk skärmens ljusstyrka och lägg bort mobilen.', 'Vila blicken på en stilla punkt.', 'Andas långsamt tills minuten är över.'],
  'Progressiv avslappning': ['Spänn händerna lätt i 5 sekunder.', 'Släpp och känn skillnaden i avslappning.', 'Fortsätt med axlar eller ben i ett varv till.'],
  'Mjuk kvällsankare': ['Välj en lugn plats och sitt bekvämt.', 'Låt utandningen bli längre än inandningen.', 'Påminn dig: “Nu får kroppen varva ned”.'],
};

function mkTool(id, title, need, durationSec, steps, mode = 'lugn') {
  return { id, title, durationSec, needs: [need], mode, intensityMin: 0, intensityMax: 10, steps };
}

let flow;
let timer;
let saveToastTimer;

function getAdaptiveAnswers() {
  const answers = { ...flow.preValues, ...(flow.questionAnswers || {}) };
  if (flow.selectedNeed) answers.selectedNeed = flow.selectedNeed;
  return answers;
}

function getAdaptiveSelection() {
  const memory = getHabitMemory();
  const nextQuestion = getNextQuestion({
    questions: DEFAULT_ADAPTIVE_QUESTIONS,
    answers: getAdaptiveAnswers(),
    memory,
  });

  return {
    nextQuestion,
    debug: {
      selectedQuestionId: nextQuestion?.id || null,
      priorityNeed: nextQuestion?.need || null,
      reason: nextQuestion ? 'signal-ranked' : 'no-unanswered-question',
    },
  };
}

export function initCheckinFlow() {
  flow = {
    currentFlow: null,
    step: STEPS.START,
    preValues: { stress: 5, humör: 5, energi: 5, sömn: 5, tankar: 5 },
    selectedNeed: null,
    selectedTool: null,
    questionAnswers: {},
    adaptiveDebug: null,
    plan: null,
    reflection: { situation: '', situationOther: '', emotions: [], intensityBefore: 5, thought: '', thoughtOther: '', alternative: '', intensityAfter: 4 },
    after: { stars: 0 },
    timestamps: {},
    countdown: 0,
    timerRunning: false,
    toolReady: false,
    saveToast: false,
  };
  render();
  return { render };
}

function render() {
  const root = document.getElementById('flow-root');
  if (!root) return;
  if (!state.dailyLib || !state.dailyClosing) {
    root.innerHTML = '<div class="flow-loading"><span class="spinner">⏳</span>Laddar dagens innehåll…</div>';
    return;
  }

  const steps = flow.currentFlow === '8'
    ? ['Check-in', 'Fokus', 'Reflektion', 'Mikro-verktyg', 'Avslut']
    : ['Check-in', 'Fokus', 'Mikro-verktyg', 'Avslut'];
  const stepIndex = getCurrentStepIndex();

  const headerRow = stepIndex > 0 ? `<div class="step-head-row"><div class="flow-note">Steg ${stepIndex}/${steps.length}</div></div>` : '';

  const topHeader = flow.currentFlow
    ? `<div class="flow-top-row"><div class="flow-step-title">${steps[stepIndex - 1] || 'Check-in'}</div>${showLengthSwitch() ? '<button class="neo-btn neo-btn--outline neo-btn--sm" data-action="reset-flow">↺ Byt längd</button>' : ''}</div>${headerRow}`
    : '';

  const startTiles = flow.currentFlow ? '' : renderStartTiles();

  let content = '';
  if (flow.currentFlow) {
    if (flow.step === STEPS.PRE) content = renderPreStep();
    else if (flow.step === STEPS.FOCUS) content = renderFocusStep();
    else if (flow.step === STEPS.REFLECTION) content = renderReflectionStep();
    else if (flow.step === STEPS.TOOL) content = renderToolStep();
    else content = renderClosing();
  }

  const successToast = flow.saveToast ? '<div class="reward-pop">✅ Bra jobbat!</div>' : '';
  root.innerHTML = `<div class="checkin-flow-wrap">${startTiles}${successToast}${topHeader}${content}</div>`;
  bind(root);
}

function showLengthSwitch() {
  if (!flow.currentFlow) return false;
  return [STEPS.PRE, STEPS.FOCUS, STEPS.REFLECTION, STEPS.TOOL].includes(flow.step);
}


function getFlowPath() {
  return FLOW_PATHS[Number(flow.currentFlow)] || [];
}

function getCurrentStepIndex() {
  const path = getFlowPath();
  const idx = path.indexOf(flow.step);
  return idx >= 0 ? idx + 1 : 0;
}

function transitionTo(nextStep) {
  if (nextStep === STEPS.START) {
    flow.step = STEPS.START;
    return true;
  }
  const path = getFlowPath();
  const currentIdx = path.indexOf(flow.step);
  const nextIdx = path.indexOf(nextStep);
  if (nextIdx === -1) return false;
  if (currentIdx === -1 || nextIdx === currentIdx + 1 || nextIdx === currentIdx) {
    flow.step = nextStep;
    return true;
  }
  return false;
}

function loadRotationHistory() {
  return loadJSON('flowRotationHistory', {});
}

function pushHistoryKey(history, key, value, max = 12) {
  if (!value) return;
  const next = Array.isArray(history[key]) ? history[key].filter((item) => item !== value) : [];
  next.push(value);
  history[key] = next.slice(-max);
}

function persistPlanHistory(plan) {
  if (!plan) return;
  const nextHistory = loadRotationHistory();
  pushHistoryKey(nextHistory, `tool:${plan.primaryNeed}`, plan.selectedTool?.id);
  pushHistoryKey(nextHistory, `closing:${plan.primaryNeed}`, plan.closingMessage?.id);
  pushHistoryKey(nextHistory, `prompt:${plan.primaryNeed}`, plan.selectedPrompt);
  saveJSON('flowRotationHistory', nextHistory);
}

function refreshPlan({ persist = false } = {}) {
  if (!state.dailyLib || !state.dailyClosing || !flow.currentFlow) return;
  flow.plan = buildSessionPlan({
    checkinValues: flow.preValues,
    selectedNeed: flow.selectedNeed,
    libraries: { library: state.dailyLib, closing: state.dailyClosing },
    rotationHistory: loadRotationHistory(),
    userPrefs: state.settings || {},
    tools,
    flowMinutes: Number(flow.currentFlow),
    now: new Date().toISOString(),
  });
  flow.selectedNeed = flow.plan?.primaryNeed || flow.selectedNeed;
  flow.selectedTool = flow.plan?.selectedTool || flow.selectedTool;
  state.flowState = { ...(state.flowState || {}), plan: flow.plan };
  if (persist) persistPlanHistory(flow.plan);
}

function renderStartTiles() {
  return `<div class="card duration-card"><div class="ci-label">Välj längd</div><div class="dur-grid"><button class="neo-tile duration-tile duration-tile--3" data-action="start-flow" data-flow="3"><span class="tile-icon" aria-hidden="true">⏱️</span><span class="tile-text"><span class="tile-title">3 min Snabb Reset</span><span class="tile-sub">Snabb reglering</span></span></button><button class="neo-tile duration-tile duration-tile--8" data-action="start-flow" data-flow="8"><span class="tile-icon" aria-hidden="true">⏱️✨</span><span class="tile-text"><span class="tile-title">8 min Reflektion & Reset</span><span class="tile-sub">Reflektion + reset</span></span></button></div></div>`;
}

function renderPreStep() {
  const primary = flow.selectedNeed || flow.plan?.primaryNeed || 'stress';
  return `<div class="card">${NEED_KEYS.map((key) => {
    const meta = SLIDER_META[key];
    return `<div class="ci-row" data-dim="${meta.dim}"><div class="ci-row-main"><div class="ci-label">${meta.emoji} ${NEED_LABELS[key]}</div><input type="range" min="0" max="10" value="${flow.preValues[key]}" class="ci-slider" data-action="set-pre" data-key="${key}"></div><small class="ci-val">${flow.preValues[key]}</small></div><div class="ci-anchors"><span class="anchor">${meta.left}</span><span class="anchor">${meta.right}</span></div>`;
  }).join('')}<div class="flow-status">${pickFeedback(primary).text}</div><div class="flow-actions"><button class="neo-btn neo-btn--filled neo-btn--cta" data-action="next-pre">Fortsätt →</button></div></div>`;
}

function renderFocusStep() {
  const { nextQuestion, debug } = getAdaptiveSelection();
  flow.adaptiveDebug = debug;
  const selected = flow.selectedNeed || nextQuestion?.need || flow.plan?.primaryNeed || 'stress';
  const orderedNeeds = nextQuestion?.need
    ? [nextQuestion.need, ...NEED_KEYS.filter((need) => need !== nextQuestion.need)]
    : NEED_KEYS;
  const ctaLabel = flow.currentFlow === '8' ? 'Nästa: Reflektion →' : 'Nästa: Mikro-verktyg →';
  return `<div class="card"><div class="focus-list">${orderedNeeds.map((need) => {
    const meta = FOCUS_META[need];
    const isSelected = selected === need;
    return `<button class="row-btn ${isSelected ? 'is-selected' : ''}" data-action="set-need" data-need="${need}" data-dim="${meta.dim}"><span class="row-emoji">${meta.emoji}</span><span class="row-main"><strong>${meta.label}</strong><span class="row-sub">${meta.subtitle}</span></span><span class="row-check" aria-hidden="true">✓</span></button>`;
  }).join('')}</div><div class="flow-actions"><button class="neo-btn neo-btn--filled neo-btn--cta" data-action="next-need" ${selected ? '' : 'disabled'}>${ctaLabel}</button></div></div>`;
}

function renderChipSet(field, selectedValue, options) {
  return `<div class="chip-wrap">${options.map((option) => `<button class="chip ${selectedValue === option ? 'active' : ''}" data-action="field-chip" data-field="${field}" data-value="${option}">${option}</button>`).join('')}</div>`;
}

function renderReflectionStep() {
  const r = flow.reflection;
  const thoughtIsCustom = r.thought === 'Egen tanke';
  return `<div class="card">
    <div class="ci-block"><div class="ci-label">Vad triggar detta?</div>${renderChipSet('situation', r.situation, chips.situation)}${r.situation === 'Annat' ? `<input class="txt-in txt-in-sm" placeholder="Skriv kort (valfritt)…" value="${r.situationOther || ''}" data-action="field" data-field="situationOther" />` : ''}</div>
    <div class="ci-block"><div class="ci-label">Vad känner du? (max 3)</div><div class="chip-wrap">${chips.emotion.map((emotion) => `<button class="chip ${r.emotions.includes(emotion) ? 'active' : ''}" data-action="toggle-emotion" data-value="${emotion}">${emotion}</button>`).join('')}</div><div class="ci-row"><div class="ci-row-main"><input type="range" min="0" max="10" value="${r.intensityBefore}" class="ci-slider" data-action="field" data-field="intensityBefore"></div><small class="ci-val">${r.intensityBefore}</small></div><div class="ci-anchors"><span class="anchor">Låg</span><span class="anchor">Stark</span></div><div class="flow-note">Det här hjälper dig se om det blir lättare efteråt.</div></div>
    <div class="ci-block"><div class="ci-label">Vilken tanke dyker upp?</div>${renderChipSet('thought', r.thought, chips.thought)}${thoughtIsCustom ? `<input class="txt-in txt-in-sm" placeholder="Skriv egen (valfritt)…" value="${r.thoughtOther || ''}" data-action="field" data-field="thoughtOther"/>` : ''}</div>
    <div class="ci-block"><div class="ci-label">Vad kan vara en hjälpsam tanke?</div>${renderChipSet('alternative', r.alternative, chips.alternative)}</div>
    <div class="ci-block"><div class="ci-label">Hur stark känns känslan nu?</div><div class="ci-row"><div class="ci-row-main"><input type="range" min="0" max="10" value="${r.intensityAfter}" class="ci-slider" data-action="field" data-field="intensityAfter"></div><small class="ci-val">${r.intensityAfter}</small></div><div class="ci-anchors"><span class="anchor">Låg</span><span class="anchor">Stark</span></div><div class="flow-note">Före: ${r.intensityBefore}/10 → Efter: ${r.intensityAfter}/10</div></div>
    <div class="flow-actions"><button class="neo-btn neo-btn--outline neo-btn--cta" data-action="skip-text">Hoppa över skrivdelen</button><button class="neo-link" data-action="guide-cbt">❓ Lär mer</button><button class="neo-btn neo-btn--filled neo-btn--cta" data-action="next-reflection">Fortsätt →</button></div>
  </div>`;
}

function formatTime(sec) {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function renderToolStep() {
  const tool = flow.selectedTool || flow.plan?.selectedTool || tools[0];
  const selectedNeed = flow.selectedNeed || flow.plan?.primaryNeed || 'stress';
  const selectedDim = FOCUS_META[selectedNeed]?.dim || 'stress';
  flow.selectedTool = tool;

  const progress = tool.durationSec > 0 ? Math.round(((tool.durationSec - flow.countdown) / tool.durationSec) * 100) : 0;
  const remaining = formatTime(flow.countdown || tool.durationSec);
  const isDone = flow.toolReady || flow.countdown === 0;

  return `<div class="card">
    <div class="neo-card micro-tool-card micro-card" data-dim="${selectedDim}">
      ${renderMicroTool(tool)}
      <div class="tool-progress"><div class="tool-progress-bar"><span style="width:${Math.max(0, Math.min(progress, 100))}%"></span></div><div class="tool-time">Tid kvar: <span>${remaining}</span></div></div>
    </div>
    <div class="flow-actions">
      <button class="neo-btn neo-btn--outline neo-btn--cta neo-btn--dim" data-dim="${selectedDim}" data-action="swap-tool">🔁 Byt verktyg</button>
      <button class="neo-link" data-action="guide-focus">❓ Lär mer</button>
      ${isDone ? '<button class="neo-btn neo-btn--filled neo-btn--cta" data-action="next-tool">Fortsätt →</button>' : '<button class="neo-btn neo-btn--filled neo-btn--cta" data-action="mark-tool-done">✅ Markera klar</button>'}
    </div>
  </div>`;
}

function renderMicroTool(tool) {
  const normalizedSteps = normalizeToolSteps(tool).map((step, i) => (step
    ? `<li class="ex-step"><span class="ex-step-num">${i + 1}</span><span class="ex-step-txt">${step}</span></li>`
    : '')).join('');
  return `<div class="ex-badge">MIKRO-VERKTYG</div>
      <div class="micro-tool-head"><div><div class="ex-title micro-title">${tool.title}</div><div class="flow-note micro-meta">~${tool.durationSec}s rekommenderat</div></div><button class="neo-btn neo-btn--soft neo-btn--sm" data-action="start-tool">${flow.timerRunning ? '⏸ Pausa' : '▶ Fortsätt'}</button></div>
      ${flow.plan?.selectedPrompt ? `<div class="flow-note">${flow.plan.selectedPrompt}</div>` : ''}
      <ul class="ex-steps micro-steps">${normalizedSteps}</ul>`;
}

function normalizeToolSteps(tool) {
  const baseSteps = TOOL_STEP_OVERRIDES[tool.title] || tool.steps || [];
  return [0, 1, 2].map((idx) => baseSteps[idx] || '').filter(Boolean);
}

function renderClosing() {
  const closing = flow.plan?.closingMessage || { lines: ['Du tog hand om dig i dag.', 'Små steg gör skillnad.'] };
  const takeAway = pickTakeAway();
  const selectedNeed = flow.selectedNeed || flow.plan?.primaryNeed || 'stress';
  const selectedMeta = FOCUS_META[selectedNeed] || FOCUS_META.stress;
  const selectedDim = selectedMeta.dim || 'stress';
  const closingLines = sanitizeClosingLines((closing.lines || []).slice(0, 3));
  const r = flow.reflection;

  return `<div class="card closing-layout" data-dim="${selectedDim}">
    <div class="neo-card neo-card--tinted"><div class="closing-card-head"><span>${selectedMeta.emoji}</span><span>Avslut</span></div>${closingLines.map((line) => `<div class="closing-line">${line}</div>`).join('')}</div>
    ${flow.currentFlow === '8' ? `<div class="flow-note">Situation: ${r.situation || r.situationOther || '–'} · Känslor: ${(r.emotions || []).join(', ') || '–'} (${r.intensityBefore}/10) · Alternativ tanke: ${r.alternative || '–'} · Efter: ${r.intensityAfter}/10</div>` : ''}
    <div class="closing-rating"><div class="ci-label">Hur hjälpsam var checken?</div><div class="rating-accent" aria-hidden="true"></div><div class="star-row">${[1, 2, 3, 4, 5].map((n) => `<button class="chip ${flow.after.stars >= n ? 'active' : ''}" data-action="set-star" data-star="${n}">★</button>`).join('')}</div></div>
    <div class="neo-card neo-card--tinted"><div class="closing-card-head"><span>${selectedMeta.emoji}</span><span>Ta med dig</span></div><div class="flow-status">${takeAway.lines.join('<br>')}</div></div>
    <div class="flow-actions"><button class="neo-btn neo-btn--filled neo-btn--cta" data-action="save-log">💾 Spara check</button></div>
  </div>`;
}

function sanitizeClosingLines(lines) {
  const filtered = lines.filter((line) => !/bra\s+jobbat/i.test(line || ''));
  return filtered.length ? filtered : ['Du tog hand om dig i dag.', 'Små steg gör skillnad.'];
}

function pickFeedback(need) {
  return pickRotated(microFeedbackByNeed[need] || microFeedbackByNeed.stress, { keyFn: (x) => x.id, historyKey: `rot_feedback_${need}`, avoidLastN: 2 }) || { text: 'Bra att du checkar in.' };
}

function pickTakeAway() {
  const need = flow.selectedNeed || flow.plan?.primaryNeed || 'stress';
  return pickRotated(takeAwayByNeed[need], { keyFn: (x) => x.id, historyKey: `rot_takeaway_${need}`, avoidLastN: 2 }) || { lines: ['Ta ett litet steg.', 'Du kan alltid börja om.'] };
}


function stopTimer() {
  clearInterval(timer);
  timer = null;
  flow.timerRunning = false;
}

function startToolTimer(restart = false) {
  const tool = flow.selectedTool || flow.plan?.selectedTool || tools[0];
  flow.selectedTool = tool;
  if (restart || !flow.countdown || flow.countdown <= 0) {
    flow.countdown = tool.durationSec;
  }
  flow.toolReady = false;
  flow.timerRunning = true;
  clearInterval(timer);
  timer = setInterval(() => {
    flow.countdown -= 1;
    if (flow.countdown <= 0) {
      flow.countdown = 0;
      flow.toolReady = true;
      stopTimer();
    }
    render();
  }, 1000);
}

function ensureToolAutoStart() {
  if (flow.step !== STEPS.TOOL) return;
  if (flow.toolReady || flow.timerRunning) return;
  startToolTimer(true);
}

function resetFlow() {
  stopTimer();
  clearTimeout(saveToastTimer);
  flow.currentFlow = null;
  transitionTo(STEPS.START);
  flow.selectedNeed = null;
  flow.selectedTool = null;
  flow.plan = null;
  flow.questionAnswers = {};
  flow.adaptiveDebug = null;
  flow.countdown = 0;
  flow.toolReady = false;
  flow.saveToast = false;
}

function bind(root) {
  root.querySelectorAll('[data-action="start-flow"]').forEach((el) => el.addEventListener('click', () => {
    stopTimer();
    flow.currentFlow = el.dataset.flow;
    transitionTo(STEPS.PRE);
    flow.timestamps.startedAt = new Date().toISOString();
    flow.selectedNeed = null;
    flow.selectedTool = null;
    flow.plan = null;
    flow.questionAnswers = {};
    flow.adaptiveDebug = null;
    flow.countdown = 0;
    flow.toolReady = false;
    flow.after = { stars: 0 };
    render();
  }));

  root.querySelector('[data-action="reset-flow"]')?.addEventListener('click', () => {
    resetFlow();
    render();
  });

  root.querySelectorAll('[data-action="set-pre"]').forEach((el) => el.addEventListener('input', () => {
    flow.preValues[el.dataset.key] = Number(el.value);
    render();
  }));

  root.querySelectorAll('[data-action="set-need"]').forEach((el) => el.addEventListener('click', () => {
    flow.selectedNeed = el.dataset.need;
    flow.questionAnswers[`focus-${el.dataset.need === 'sömn' ? 'somn' : el.dataset.need}`] = el.dataset.need;
    saveJSON('flowRotationHistory', { ...loadRotationHistory(), lastSelectedNeed: flow.selectedNeed });
    render();
  }));

  root.querySelector('[data-action="next-pre"]')?.addEventListener('click', () => {
    const { nextQuestion, debug } = getAdaptiveSelection();
    flow.adaptiveDebug = debug;
    if (!flow.selectedNeed && nextQuestion?.need) flow.selectedNeed = nextQuestion.need;
    state.flowState = { ...(state.flowState || {}), adaptiveQuestion: flow.adaptiveDebug };
    transitionTo(STEPS.FOCUS);
    render();
  });
  root.querySelector('[data-action="next-need"]')?.addEventListener('click', () => {
    refreshPlan({ persist: true });
    transitionTo(flow.currentFlow === '8' ? STEPS.REFLECTION : STEPS.TOOL);
    if (flow.currentFlow === '3') ensureToolAutoStart();
    render();
  });
  root.querySelector('[data-action="next-reflection"]')?.addEventListener('click', () => { transitionTo(STEPS.TOOL); ensureToolAutoStart(); render(); });
  root.querySelector('[data-action="next-tool"]')?.addEventListener('click', () => { transitionTo(STEPS.CLOSING); render(); });

  root.querySelector('[data-action="guide-focus"]')?.addEventListener('click', () => openGuide({ need: flow.selectedNeed || flow.plan?.primaryNeed || 'stress', title: 'Snabb hjälp', source: 'checkin' }));
  root.querySelector('[data-action="guide-cbt"]')?.addEventListener('click', () => openGuide({ topic: 'cbt_light', title: 'Hur funkar detta?' }));

  root.querySelectorAll('[data-action="field"]').forEach((el) => el.addEventListener('input', () => {
    const key = el.dataset.field;
    flow.reflection[key] = el.type === 'range' ? Number(el.value) : el.value;
    render();
  }));

  root.querySelectorAll('[data-action="field-chip"]').forEach((el) => el.addEventListener('click', () => {
    flow.reflection[el.dataset.field] = el.dataset.value;
    render();
  }));

  root.querySelectorAll('[data-action="toggle-emotion"]').forEach((el) => el.addEventListener('click', () => {
    const val = el.dataset.value;
    const emotions = new Set(flow.reflection.emotions);
    if (emotions.has(val)) emotions.delete(val);
    else if (emotions.size < 3) emotions.add(val);
    flow.reflection.emotions = [...emotions];
    render();
  }));

  root.querySelector('[data-action="skip-text"]')?.addEventListener('click', () => {
    flow.reflection.situationOther = '';
    flow.reflection.thoughtOther = '';
    render();
  });

  root.querySelector('[data-action="start-tool"]')?.addEventListener('click', () => {
    if (flow.timerRunning) {
      stopTimer();
      render();
      return;
    }
    startToolTimer(false);
    render();
  });

  root.querySelector('[data-action="mark-tool-done"]')?.addEventListener('click', () => {
    flow.toolReady = true;
    stopTimer();
    render();
  });

  root.querySelector('[data-action="swap-tool"]')?.addEventListener('click', () => {
    stopTimer();
    refreshPlan({ persist: true });
    startToolTimer(true);
    render();
  });

  root.querySelectorAll('[data-action="set-star"]').forEach((el) => el.addEventListener('click', () => {
    flow.after.stars = Number(el.dataset.star);
    render();
  }));

  root.querySelector('[data-action="save-log"]')?.addEventListener('click', saveLog);
}

function saveLog() {
  const logs = loadJSON('dailyFlowLogs', []);
  const focusNeed = flow.selectedNeed || flow.plan?.primaryNeed || 'stress';
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    dateISO: timestamp,
    date: timestamp.slice(0, 10),
    sessionLengthMin: Number(flow.currentFlow),
    flowMinutes: Number(flow.currentFlow),
    pre: { ...flow.preValues, tankar: flow.preValues.tankar ?? null },
    primaryNeed: focusNeed,
    focusNeed,
    toolId: flow.selectedTool?.id || null,
    reflection: flow.currentFlow === '8' ? {
      trigger: flow.reflection.situation,
      triggerText: flow.reflection.situationOther,
      feelings: flow.reflection.emotions,
      intensityBefore: flow.reflection.intensityBefore,
      thought: flow.reflection.thought,
      thoughtText: flow.reflection.thoughtOther,
      altThought: flow.reflection.alternative,
      intensityAfter: flow.reflection.intensityAfter,
    } : undefined,
    after: flow.currentFlow === '8' ? {
      intensityBefore: flow.reflection.intensityBefore,
      intensityAfter: flow.reflection.intensityAfter,
    } : undefined,
    stars: flow.after.stars,
    completedAt: timestamp,
    counted: true,
  };
  logs.push(entry);
  saveJSON('dailyFlowLogs', logs);

  flow.saveToast = true;
  render();
  clearTimeout(saveToastTimer);
  saveToastTimer = window.setTimeout(() => {
    resetFlow();
    render();
  }, 1200);
}
