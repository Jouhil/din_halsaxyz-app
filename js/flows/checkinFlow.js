import { state } from '../state.js';
import { getPrimaryNeed } from '../engines/matchingEngine.js';
import { pickRotated } from '../engines/rotationEngine.js';
import { loadJSON, saveJSON } from '../storage.js';
import { openGuide } from '../ui/helpOverlay.js';

const NEED_KEYS = ['stress', 'humör', 'energi', 'sömn', 'tankar'];
const NEED_LABELS = { stress: 'Stress', humör: 'Humör', energi: 'Energi', sömn: 'Sömn', tankar: 'Tankar' };
const NEED_EMOJIS = { stress: '🫁', humör: '🙂', energi: '⚡', sömn: '🌙', tankar: '🧠' };
const SLIDER_META = {
  stress: { left: 'Stressad', right: 'Lugn' },
  humör: { left: 'Nere', right: 'På topp' },
  energi: { left: 'Trött', right: 'Pigg' },
  sömn: { left: 'Dålig', right: 'Utvilad' },
  tankar: { left: 'Fast i tankar', right: 'Närvarande' },
};

const chips = {
  situation: ['Jobb', 'Relation', 'Sömnbrist', 'Kropp', 'Ekonomi', 'Socialt', 'Studier'],
  emotion: ['Orolig', 'Stressad', 'Ledsen', 'Irriterad', 'Trött', 'Skam', 'Överväldigad'],
  thought: ['Jag räcker inte', 'Det blir fel', 'Ingen förstår', 'Jag hinner inte', 'Jag borde klara allt'],
  alternative: ['Det här är en stund, inte hela sanningen', 'Ett litet steg räcker nu', 'Jag kan vara snäll mot mig själv', 'Tanke ≠ fakta', 'Jag får pausa och börja om'],
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

function mkTool(id, title, need, durationSec, steps, mode = 'lugn') {
  return { id, title, durationSec, needs: [need], mode, intensityMin: 0, intensityMax: 10, steps };
}

let flow;
let timer;

export function initCheckinFlow({ router } = {}) {
  flow = {
    currentFlow: null,
    step: 0,
    preValues: { stress: 5, humör: 5, energi: 5, sömn: 5, tankar: 5 },
    selectedNeed: null,
    selectedTool: null,
    reflection: { situation: '', situationOther: '', emotions: [], intensityBefore: 5, thought: '', thoughtOther: '', truthiness: 'Osäker', alternative: '', intensityAfter: 4 },
    after: { stars: 0, afterSliderNeedVal: null, intensityAfter: null },
    timestamps: {},
    countdown: 0,
    timerRunning: false,
    toolReady: false,
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

  const steps = flow.currentFlow === '8' ? ['Check-in', 'Fokus', 'Reflektion', 'Mikro-verktyg', 'Avslut'] : ['Check-in', 'Fokus', 'Mikro-verktyg', 'Avslut'];
  const showLearn = [2, 3, 4].includes(flow.step) && flow.currentFlow;
  const learnAction = flow.step === 3 && flow.currentFlow === '8' ? 'guide-cbt' : 'guide-focus';
  const headerRow = flow.step > 0
    ? `<div class="step-head-row"><div class="flow-note">Steg ${flow.step}/${steps.length}</div>${showLearn ? `<button class="btn-link" data-action="${learnAction}">Lär mer</button>` : ''}</div>`
    : '';
  const lengthSelector = flow.currentFlow
    ? ''
    : `<div class="card duration-card"><strong>Välj längd</strong><div class="dur-grid"><button class="btn-primary" data-action="start-flow" data-flow="3">3 min Snabb Reset</button><button class="btn-primary" data-action="start-flow" data-flow="8">8 min Reflektion & Reset</button></div></div>`;

  root.innerHTML = `<div class="checkin-flow-wrap">${lengthSelector}${flow.currentFlow ? `<div class="flow-top-row"><div class="flow-step-title">${steps[flow.step - 1]}</div><button class="btn-link" data-action="reset-flow">Byt längd</button></div>` : ''}${headerRow}${renderStep()}</div>`;
  bind(root);
}

function renderStep() {
  if (!flow.currentFlow) return '';
  if (flow.step === 1) return renderPre();
  if (flow.step === 2) return renderNeed();
  if (flow.step === 3 && flow.currentFlow === '8') return renderReflection();
  if ((flow.step === 3 && flow.currentFlow === '3') || (flow.step === 4 && flow.currentFlow === '8')) return renderTool();
  return renderClosing();
}

function renderPre() {
  return `<div class="card">${NEED_KEYS.map((key) => `
    <div class="ci-block">
      <div class="ci-label">${NEED_LABELS[key]}</div>
      <div class="ci-row">
        <div class="ci-row-main"><input type="range" min="0" max="10" value="${flow.preValues[key]}" class="ci-slider" data-action="set-pre" data-key="${key}"></div>
        <small class="ci-val">${flow.preValues[key]}</small>
      </div>
      <div class="ci-anchors"><span class="anchor">${SLIDER_META[key].left}</span><span class="anchor">${SLIDER_META[key].right}</span></div>
    </div>
  `).join('')}<div class="flow-status">${pickFeedback(flow.selectedNeed || getPrimaryNeed(flow.preValues)).text}</div><button class="btn-primary" data-action="next-pre">Fortsätt</button></div>`;
}

function renderNeed() {
  const selected = flow.selectedNeed || getPrimaryNeed(flow.preValues);
  return `<div class="card"><strong>Välj fokus</strong><div class="neo-tile-grid">${NEED_KEYS.map((need) => `<button class="neo-tile ${selected === need ? 'sel' : ''}" data-action="set-need" data-need="${need}"><span class="neo-emoji">${NEED_EMOJIS[need]}</span><span class="neo-label">${NEED_LABELS[need]}</span></button>`).join('')}</div><button class="btn-primary" data-action="next-need">Fortsätt</button></div>`;
}

function renderReflection() {
  const r = flow.reflection;
  return `<div class="card"><strong>CBT-light</strong>${renderChipSet('situation', r.situation, chips.situation)}<input class="txt-in" placeholder="Annat..." value="${r.situationOther || ''}" data-action="field" data-field="situationOther" /><div class="ci-label">Känslor (max 3)</div>${chips.emotion.map((e) => `<button class="chip ${r.emotions.includes(e) ? 'active' : ''}" data-action="toggle-emotion" data-value="${e}">${e}</button>`).join('')}<div class="ci-row"><div class="ci-row-main"><input type="range" min="0" max="10" value="${r.intensityBefore}" class="ci-slider" data-action="field" data-field="intensityBefore"></div><small class="ci-val">${r.intensityBefore}</small></div><div class="ci-anchors"><span class="anchor">Låg</span><span class="anchor">Hög</span></div>${renderChipSet('thought', r.thought, chips.thought)}<input class="txt-in" placeholder="Egen tanke" value="${r.thoughtOther || ''}" data-action="field" data-field="thoughtOther"/><div class="chip-wrap">${['Ja', 'Delvis', 'Osäker'].map((v) => `<button class="chip ${r.truthiness === v ? 'active' : ''}" data-action="field-chip" data-field="truthiness" data-value="${v}">${v}</button>`).join('')}</div>${renderChipSet('alternative', r.alternative, chips.alternative)}<div class="ci-row"><div class="ci-row-main"><input type="range" min="0" max="10" value="${r.intensityAfter}" class="ci-slider" data-action="field" data-field="intensityAfter"></div><small class="ci-val">${r.intensityAfter}</small></div><div class="ci-anchors"><span class="anchor">Låg</span><span class="anchor">Hög</span></div><button class="btn-secondary" data-action="skip-text">Hoppa över skrivdelen</button><button class="btn-primary" data-action="next-reflection">Fortsätt</button></div>`;
}

function renderChipSet(field, current, values) {
  return `<div class="chip-wrap">${values.map((value) => `<button class="chip ${current === value ? 'active' : ''}" data-action="field-chip" data-field="${field}" data-value="${value}">${value}</button>`).join('')}</div>`;
}

function renderTool() {
  const tool = flow.selectedTool || pickTool();
  flow.selectedTool = tool;
  const left = Math.max(0, flow.countdown || tool.durationSec);
  const timerRow = flow.toolReady
    ? '<div class="flow-status done">Klart</div>'
    : `<div class="flow-status">Tid kvar: ${left}s</div>`;
  const primaryLabel = flow.timerRunning ? 'Pausa' : (flow.countdown > 0 ? 'Återuppta' : 'Starta');
  const showContinue = flow.toolReady;

  return `<div class="card"><div class="ex-card"><div class="ex-badge">MIKRO-VERKTYG</div><div class="ex-title">${tool.title}</div><div class="flow-note">~${tool.durationSec}s rekommenderat</div><ul class="ex-steps">${tool.steps.map((s, i) => `<li class="ex-step"><span class="ex-step-num">${i + 1}</span><span class="ex-step-txt">${s}</span></li>`).join('')}</ul></div>${timerRow}<div class="flow-actions"><button class="btn-primary" data-action="start-tool">${primaryLabel}</button><button class="btn-secondary" data-action="swap-tool">Byt verktyg</button><button class="btn-link" data-action="guide-focus">Lär mer</button>${showContinue ? '<button class="btn-primary" data-action="next-tool">Fortsätt</button>' : ''}${!showContinue ? '<button class="btn-secondary" data-action="mark-tool-done">Markera klar</button>' : ''}</div></div>`;
}

function renderClosing() {
  const closing = pickClosing();
  const takeAway = pickTakeAway();
  const focusNeed = flow.selectedNeed || getPrimaryNeed(flow.preValues);
  const pre = flow.preValues[focusNeed] ?? 5;
  const afterValue = flow.after.afterSliderNeedVal;
  const result = afterValue === null ? `${pre} → –` : `${pre} → ${afterValue}`;
  const r = flow.reflection;

  return `<div class="card"><div class="closing-card">${(closing.lines || ['Bra jobbat.']).slice(0, 3).map((line) => `<div class="closing-line">${line}</div>`).join('')}</div><div class="flow-status"><strong>Före → Efter (${NEED_LABELS[focusNeed]}):</strong> ${result}</div>${flow.currentFlow === '8' ? `<div class="flow-note">Situation: ${r.situation || r.situationOther || '–'} · Känslor: ${(r.emotions || []).join(', ') || '–'} (${r.intensityBefore}/10) · Alternativ tanke: ${r.alternative || '–'}</div>` : ''}<div class="ci-block"><div class="ci-label">Snabb efter-skala (${NEED_LABELS[focusNeed]})</div><div class="ci-row"><div class="ci-row-main"><input type="range" min="0" max="10" value="${afterValue ?? pre}" class="ci-slider" data-action="set-after-slider"></div><small class="ci-val">${afterValue ?? pre}</small></div><div class="ci-anchors"><span class="anchor">${SLIDER_META[focusNeed].left}</span><span class="anchor">${SLIDER_META[focusNeed].right}</span></div></div><div class="ci-label">Hur hjälpsam var checken?</div><div class="star-row">${[1, 2, 3, 4, 5].map((n) => `<button class="chip ${flow.after.stars >= n ? 'active' : ''}" data-action="set-star" data-star="${n}">★</button>`).join('')}</div><div class="flow-status"><strong>Ta med dig:</strong><br>${takeAway.lines.join('<br>')}</div><div class="reward-pop">✅ Bra jobbat!</div><button class="btn-primary" data-action="save-log">Spara check</button></div>`;
}

function pickFeedback(need) {
  return pickRotated(microFeedbackByNeed[need] || microFeedbackByNeed.stress, { keyFn: (x) => x.id, historyKey: `rot_feedback_${need}`, avoidLastN: 2 }) || { text: 'Bra att du checkar in.' };
}

function pickTakeAway() {
  const need = flow.selectedNeed || getPrimaryNeed(flow.preValues);
  return pickRotated(takeAwayByNeed[need], { keyFn: (x) => x.id, historyKey: `rot_takeaway_${need}`, avoidLastN: 2 }) || { lines: ['Ta ett litet steg.', 'Du kan alltid börja om.'] };
}

function pickTool() {
  const need = flow.selectedNeed || getPrimaryNeed(flow.preValues);
  const intensity = flow.preValues[need] ?? 5;
  const [minDur, maxDur] = flow.currentFlow === '8' ? [90, 150] : [60, 120];
  const filtered = tools.filter((tool) => tool.needs.includes(need) && tool.durationSec >= minDur && tool.durationSec <= maxDur && intensity >= tool.intensityMin && intensity <= tool.intensityMax);
  return pickRotated(filtered.length ? filtered : tools.filter((tool) => tool.needs.includes(need)), { keyFn: (x) => x.id, historyKey: `rot_tool_${need}`, avoidLastN: 1 }) || tools[0];
}

function pickClosing() {
  const need = flow.selectedNeed || getPrimaryNeed(flow.preValues);
  const closingPool = (state.dailyClosing?.closing_double || []).filter((item) => (item.needs || []).includes(need));
  return pickRotated(closingPool.length ? closingPool : state.dailyClosing?.closing_double || [], { keyFn: (x) => x.id, historyKey: `rot_closing_${need}`, avoidLastN: 1 }) || { lines: ['Bra jobbat.', 'Du tog hand om dig.'] };
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
  flow.timerRunning = false;
}

function resetFlow() {
  stopTimer();
  flow.currentFlow = null;
  flow.step = 0;
  flow.selectedNeed = null;
  flow.selectedTool = null;
  flow.countdown = 0;
  flow.toolReady = false;
}

function bind(root) {
  root.querySelectorAll('[data-action="start-flow"]').forEach((el) => el.addEventListener('click', () => {
    stopTimer();
    flow.currentFlow = el.dataset.flow;
    flow.step = 1;
    flow.timestamps.startedAt = new Date().toISOString();
    flow.selectedNeed = null;
    flow.selectedTool = null;
    flow.countdown = 0;
    flow.toolReady = false;
    flow.after = { stars: 0, afterSliderNeedVal: null, intensityAfter: null };
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
    saveJSON('flowRotationHistory', { ...loadJSON('flowRotationHistory', {}), lastSelectedNeed: flow.selectedNeed });
    render();
  }));

  root.querySelector('[data-action="next-pre"]')?.addEventListener('click', () => { flow.step = 2; render(); });
  root.querySelector('[data-action="next-need"]')?.addEventListener('click', () => { flow.selectedNeed = flow.selectedNeed || getPrimaryNeed(flow.preValues); flow.step = 3; render(); });
  root.querySelector('[data-action="next-reflection"]')?.addEventListener('click', () => { flow.step = 4; render(); });
  root.querySelector('[data-action="next-tool"]')?.addEventListener('click', () => { flow.step = flow.currentFlow === '8' ? 5 : 4; render(); });

  root.querySelector('[data-action="guide-focus"]')?.addEventListener('click', () => openGuide({ need: flow.selectedNeed || getPrimaryNeed(flow.preValues), title: 'Snabb hjälp' }));
  root.querySelector('[data-action="guide-cbt"]')?.addEventListener('click', () => openGuide({ topic: 'cbt_light', title: 'Hur funkar detta?' }));

  root.querySelectorAll('[data-action="field"]').forEach((el) => el.addEventListener('input', () => {
    const key = el.dataset.field;
    flow.reflection[key] = el.type === 'range' ? Number(el.value) : el.value;
    if (key === 'intensityAfter') flow.after.intensityAfter = Number(el.value);
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

    const tool = flow.selectedTool || pickTool();
    flow.selectedTool = tool;
    if (!flow.countdown || flow.countdown <= 0) flow.countdown = tool.durationSec;
    flow.toolReady = false;
    flow.timerRunning = true;
    timer = setInterval(() => {
      flow.countdown -= 1;
      if (flow.countdown <= 0) {
        flow.countdown = 0;
        flow.toolReady = true;
        stopTimer();
      }
      render();
    }, 1000);
    render();
  });

  root.querySelector('[data-action="mark-tool-done"]')?.addEventListener('click', () => {
    flow.toolReady = true;
    stopTimer();
    render();
  });

  root.querySelector('[data-action="swap-tool"]')?.addEventListener('click', () => {
    stopTimer();
    flow.selectedTool = pickTool();
    flow.countdown = 0;
    flow.toolReady = false;
    render();
  });

  root.querySelector('[data-action="set-after-slider"]')?.addEventListener('input', (e) => {
    flow.after.afterSliderNeedVal = Number(e.target.value);
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
  const focusNeed = flow.selectedNeed || getPrimaryNeed(flow.preValues);
  const entry = {
    dateISO: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10),
    sessionLengthMin: Number(flow.currentFlow),
    flowMinutes: Number(flow.currentFlow),
    pre: { ...flow.preValues, tankar: flow.preValues.tankar ?? null },
    focusNeed,
    toolId: flow.selectedTool?.id || null,
    reflection: flow.currentFlow === '8' ? flow.reflection : undefined,
    after: {
      intensityBefore: flow.currentFlow === '8' ? flow.reflection.intensityBefore : undefined,
      intensityAfter: flow.currentFlow === '8' ? flow.reflection.intensityAfter : undefined,
      afterSliderNeedVal: flow.after.afterSliderNeedVal,
    },
    stars: flow.after.stars,
    completedAt: new Date().toISOString(),
    counted: true,
  };
  logs.push(entry);
  saveJSON('dailyFlowLogs', logs);
  resetFlow();
  render();
}
