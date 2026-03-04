import { state } from '../state.js';
import { getPrimaryNeed } from '../engines/matchingEngine.js';
import { pickRotated } from '../engines/rotationEngine.js';
import { loadJSON, saveJSON } from '../storage.js';
import { openGuide } from '../ui/helpOverlay.js';

const NEED_KEYS = ['stress', 'humör', 'energi', 'sömn', 'tankar'];
const NEED_LABELS = { stress: 'Stress', humör: 'Humör', energi: 'Energi', sömn: 'Sömn', tankar: 'Tankar' };
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

function mkTool(id, title, need, durationSec, steps, mode = 'lugn') {
  return { id, title, durationSec, needs: [need], mode, intensityMin: 0, intensityMax: 10, steps };
}

let flow;
let timer;
let saveToastTimer;

export function initCheckinFlow() {
  flow = {
    currentFlow: null,
    step: 0,
    preValues: { stress: 5, humör: 5, energi: 5, sömn: 5, tankar: 5 },
    selectedNeed: null,
    selectedTool: null,
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

  const headerRow = flow.step > 0 ? `<div class="step-head-row"><div class="flow-note">Steg ${flow.step}/${steps.length}</div></div>` : '';

  const topHeader = flow.currentFlow
    ? `<div class="flow-top-row"><div class="flow-step-title">${steps[flow.step - 1] || 'Check-in'}</div>${showLengthSwitch() ? '<button class="neo-btn neo-btn--outline neo-btn--sm" data-action="reset-flow">↺ Byt längd</button>' : ''}</div>${headerRow}`
    : '';

  const startTiles = flow.currentFlow ? '' : renderStartTiles();

  let content = '';
  if (flow.currentFlow) {
    if (flow.step === 1) content = renderPreStep();
    else if (flow.step === 2) content = renderFocusStep();
    else if (flow.currentFlow === '8' && flow.step === 3) content = renderReflectionStep();
    else if ((flow.currentFlow === '8' && flow.step === 4) || (flow.currentFlow === '3' && flow.step === 3)) content = renderToolStep();
    else content = renderClosing();
  }

  const successToast = flow.saveToast ? '<div class="reward-pop">✅ Bra jobbat!</div>' : '';
  root.innerHTML = `<div class="checkin-flow-wrap">${startTiles}${successToast}${topHeader}${content}</div>`;
  bind(root);
}

function showLengthSwitch() {
  if (!flow.currentFlow) return false;
  if (flow.currentFlow === '8') return flow.step >= 1 && flow.step <= 4;
  return flow.step >= 1 && flow.step <= 3;
}

function renderStartTiles() {
  return `<div class="card duration-card"><div class="ci-label">Välj längd</div><div class="dur-grid"><button class="neo-tile duration-tile duration-tile--3" data-action="start-flow" data-flow="3"><span class="tile-icon" aria-hidden="true">⏱️</span><span class="tile-text"><span class="tile-title">3 min Snabb Reset</span><span class="tile-sub">Snabb reglering</span></span></button><button class="neo-tile duration-tile duration-tile--8" data-action="start-flow" data-flow="8"><span class="tile-icon" aria-hidden="true">⏱️✨</span><span class="tile-text"><span class="tile-title">8 min Reflektion & Reset</span><span class="tile-sub">Reflektion + reset</span></span></button></div></div>`;
}

function renderPreStep() {
  const primary = flow.selectedNeed || getPrimaryNeed(flow.preValues);
  return `<div class="card">${NEED_KEYS.map((key) => {
    const meta = SLIDER_META[key];
    return `<div class="ci-row" data-dim="${meta.dim}"><div class="ci-row-main"><div class="ci-label">${meta.emoji} ${NEED_LABELS[key]}</div><input type="range" min="0" max="10" value="${flow.preValues[key]}" class="ci-slider" data-action="set-pre" data-key="${key}"></div><small class="ci-val">${flow.preValues[key]}</small></div><div class="ci-anchors"><span class="anchor">${meta.left}</span><span class="anchor">${meta.right}</span></div>`;
  }).join('')}<div class="flow-status">${pickFeedback(primary).text}</div><div class="flow-actions"><button class="neo-btn neo-btn--filled neo-btn--cta" data-action="next-pre">Fortsätt →</button></div></div>`;
}

function renderFocusStep() {
  const selected = flow.selectedNeed || getPrimaryNeed(flow.preValues);
  const ctaLabel = flow.currentFlow === '8' ? 'Nästa: Reflektion →' : 'Nästa: Mikro-verktyg →';
  return `<div class="card"><div class="focus-list">${NEED_KEYS.map((need) => {
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
  const tool = flow.selectedTool || pickTool();
  const selectedNeed = flow.selectedNeed || getPrimaryNeed(flow.preValues);
  const selectedDim = FOCUS_META[selectedNeed]?.dim || 'stress';
  flow.selectedTool = tool;

  const progress = tool.durationSec > 0 ? Math.round(((tool.durationSec - flow.countdown) / tool.durationSec) * 100) : 0;
  const remaining = formatTime(flow.countdown || tool.durationSec);
  const isDone = flow.toolReady || flow.countdown === 0;

  return `<div class="card">
    <div class="neo-card micro-tool-card micro-card" data-dim="${selectedDim}">
      <div class="ex-badge">MIKRO-VERKTYG</div>
      <div class="micro-tool-head"><div class="ex-title">${tool.title}</div><button class="neo-btn neo-btn--soft neo-btn--sm" data-action="start-tool">${flow.timerRunning ? '⏸ Pausa' : '▶ Fortsätt'}</button></div>
      <div class="flow-note">~${tool.durationSec}s rekommenderat</div>
      <ul class="ex-steps">${tool.steps.map((step, i) => `<li class="ex-step"><span class="ex-step-num">${i + 1}</span><span class="ex-step-txt">${step}</span></li>`).join('')}</ul>
      <div class="tool-progress"><div class="tool-progress-bar"><span style="width:${Math.max(0, Math.min(progress, 100))}%"></span></div><div class="tool-time">Tid kvar: <span>${remaining}</span></div></div>
    </div>
    <div class="flow-actions">
      <button class="neo-btn neo-btn--outline neo-btn--cta" data-action="swap-tool">🔁 Byt verktyg</button>
      <button class="neo-link" data-action="guide-focus">❓ Lär mer</button>
      ${isDone ? '<button class="neo-btn neo-btn--filled neo-btn--cta" data-action="next-tool">Fortsätt →</button>' : '<button class="neo-btn neo-btn--filled neo-btn--cta" data-action="mark-tool-done">✅ Markera klar</button>'}
    </div>
  </div>`;
}

function renderClosing() {
  const closing = pickClosing();
  const takeAway = pickTakeAway();
  const r = flow.reflection;

  return `<div class="card closing-layout">
    <div class="neo-card">${(closing.lines || ['Bra jobbat.']).slice(0, 3).map((line) => `<div class="closing-line">${line}</div>`).join('')}</div>
    ${flow.currentFlow === '8' ? `<div class="flow-note">Situation: ${r.situation || r.situationOther || '–'} · Känslor: ${(r.emotions || []).join(', ') || '–'} (${r.intensityBefore}/10) · Alternativ tanke: ${r.alternative || '–'} · Efter: ${r.intensityAfter}/10</div>` : ''}
    <div class="closing-rating"><div class="ci-label">Hur hjälpsam var checken?</div><div class="star-row">${[1, 2, 3, 4, 5].map((n) => `<button class="chip ${flow.after.stars >= n ? 'active' : ''}" data-action="set-star" data-star="${n}">★</button>`).join('')}</div></div>
    <div class="neo-card"><div class="flow-status"><strong>Ta med dig:</strong><br>${takeAway.lines.join('<br>')}</div></div>
    <div class="flow-actions"><button class="neo-btn neo-btn--filled neo-btn--cta" data-action="save-log">💾 Spara check</button></div>
  </div>`;
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

function startToolTimer(restart = false) {
  const tool = flow.selectedTool || pickTool();
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
  if (flow.step !== 4 && !(flow.currentFlow === '3' && flow.step === 3)) return;
  if (flow.toolReady || flow.timerRunning) return;
  startToolTimer(true);
}

function resetFlow() {
  stopTimer();
  clearTimeout(saveToastTimer);
  flow.currentFlow = null;
  flow.step = 0;
  flow.selectedNeed = null;
  flow.selectedTool = null;
  flow.countdown = 0;
  flow.toolReady = false;
  flow.saveToast = false;
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
    saveJSON('flowRotationHistory', { ...loadJSON('flowRotationHistory', {}), lastSelectedNeed: flow.selectedNeed });
    render();
  }));

  root.querySelector('[data-action="next-pre"]')?.addEventListener('click', () => { flow.step = 2; render(); });
  root.querySelector('[data-action="next-need"]')?.addEventListener('click', () => {
    flow.selectedNeed = flow.selectedNeed || getPrimaryNeed(flow.preValues);
    flow.step = 3;
    if (flow.currentFlow === '3') ensureToolAutoStart();
    render();
  });
  root.querySelector('[data-action="next-reflection"]')?.addEventListener('click', () => { flow.step = 4; ensureToolAutoStart(); render(); });
  root.querySelector('[data-action="next-tool"]')?.addEventListener('click', () => { flow.step = flow.currentFlow === '8' ? 5 : 4; render(); });

  root.querySelector('[data-action="guide-focus"]')?.addEventListener('click', () => openGuide({ need: flow.selectedNeed || getPrimaryNeed(flow.preValues), title: 'Snabb hjälp', source: 'checkin' }));
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
    flow.selectedTool = pickTool();
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
  const focusNeed = flow.selectedNeed || getPrimaryNeed(flow.preValues);
  const entry = {
    dateISO: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10),
    sessionLengthMin: Number(flow.currentFlow),
    flowMinutes: Number(flow.currentFlow),
    pre: { ...flow.preValues, tankar: flow.preValues.tankar ?? null },
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
    completedAt: new Date().toISOString(),
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
