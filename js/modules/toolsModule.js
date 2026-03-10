import { init as initCalmModule } from './calmModule.js';
import { init as initHelpModule } from './helpModule.js';

const TOOL_DEFINITIONS = [
  {
    id: 'breathing-4444',
    view: 'breathing',
    title: 'Box breathing 4-4-4-4',
    description: 'Lugn andning i fyra faser för stress, fokus och återhämtning.',
    icon: '🌊',
    tone: 'calm',
  },
  {
    id: 'grounding-54321',
    view: 'grounding',
    title: 'Jordning 5-4-3-2-1',
    description: 'En övning som hjälper dig tillbaka till nuet med hjälp av dina sinnen.',
    icon: '🌿',
    tone: 'earth',
  },
  {
    id: 'thought-catcher',
    view: 'thought-catcher',
    title: 'Tankefångare',
    description: 'Fånga en tanke, mjuka upp den och ge dig själv lite mer inre utrymme.',
    icon: '📝',
    tone: 'thought',
  },
  {
    id: 'return-to-now',
    view: 'return-to-now',
    title: 'Tillbaka till nuet',
    description: 'Landa i det som finns här just nu när tankarna drar iväg.',
    icon: '🧭',
    tone: 'present',
  },
];

const GROUNDING_STEPS = [
  {
    key: 'intro',
    title: 'Vi landar tillsammans',
    body: 'Ta en lugn andning. Vi går igenom fem sinnesankare, ett i taget.',
    support: 'Det räcker att lägga märke till det som redan finns omkring dig.',
    cta: 'Jag är redo',
  },
  {
    key: 'see',
    title: '5 saker du kan se omkring dig',
    body: 'Låt blicken vandra långsamt i rummet och hitta fem saker du ser.',
    support: 'Ta en liten stund här. Inget behöver vara särskilt.',
    cta: 'Jag har sett 5 saker',
  },
  {
    key: 'feel',
    title: '4 saker du kan känna',
    body: 'Känn efter i kroppen och mot underlaget. Hitta fyra saker du kan känna just nu.',
    support: 'Kanske tyg mot huden, fötter mot golvet eller luft mot ansiktet.',
    cta: 'Jag har känt efter',
  },
  {
    key: 'hear',
    title: '3 saker du kan höra',
    body: 'Lyssna utan att leta för mycket. Lägg märke till tre ljud, nära eller längre bort.',
    support: 'Det räcker att ta in det som redan hörs.',
    cta: 'Jag har lyssnat',
  },
  {
    key: 'smell',
    title: '2 saker du kan känna doften av',
    body: 'Känn efter om du märker två dofter i luften, eller minns två dofter som känns trygga.',
    support: 'Du kan vara här en stund även om dofterna är svaga.',
    cta: 'Jag har känt doft',
  },
  {
    key: 'taste',
    title: '1 sak du kan smaka',
    body: 'Lägg märke till en smak i munnen, eller föreställ dig en smak som känns bekant.',
    support: 'Mjukna i axlarna och ge kroppen en sista lugn stund.',
    cta: 'Klar',
  },
  {
    key: 'done',
    title: 'Tillbaka i nuet',
    body: 'Bra gjort. Du har hjälpt kroppen att landa lite mer i det som finns här omkring dig.',
    note: 'Du kan återvända till övningen när det känns mycket.',
    cta: 'Börja om',
  },
];

const THOUGHT_CATCHER_STEPS = [
  {
    key: 'notice',
    title: 'Vilken tanke tar mest plats just nu?',
    body: 'Börja med att lägga märke till den tanke som känns starkast just nu.',
    support: 'Det räcker att välja det som känns närmast just nu.',
    cta: 'Det här stämmer',
  },
  {
    key: 'impact',
    title: 'Hur påverkar tanken dig just nu?',
    body: 'Känn efter hur tungt eller spänt det känns i dig när tanken är där.',
    support: 'Du behöver inte lösa tanken här.',
    cta: 'Jag vill gå vidare',
  },
  {
    key: 'soften',
    title: 'Finns det en mjukare tanke du kan prova?',
    body: 'Se om du hittar en formulering som känns lite vänligare och lättare att bära.',
    support: 'Se om något känns lite snällare, inte perfekt.',
    cta: 'Prova en mjukare tanke',
  },
  {
    key: 'result',
    title: 'Vad händer i dig med den nya tanken?',
    body: 'Känn efter om kroppen får lite mer lugn eller utrymme nu.',
    support: 'Det räcker om det känns bara lite lättare.',
    cta: 'Klar',
  },
];

const NOTICE_THOUGHT_OPTIONS = [
  'Jag räcker inte',
  'Det blir fel',
  'Ingen förstår',
  'Jag hinner inte',
  'Jag borde klara allt',
  'Jag borde vara bättre',
  'Egen tanke',
];

const SOFT_THOUGHT_OPTIONS = [
  'Ett litet steg räcker',
  'Jag får pausa',
  'Tanke ≠ fakta',
  'Jag kan vara snäll mot mig själv',
  'Jag behöver inte lösa allt nu',
  'Egen tanke',
];

const RETURN_PULL_OPTIONS = [
  'Det som varit',
  'Det som kan hända',
  'Både och',
  'Egen tanke',
];

const RETURN_ACTION_OPTIONS = ['Ja', 'Nej', 'Vet inte'];

const RETURN_PARK_OPTIONS = [
  'Den får vänta en stund',
  'Jag återkommer senare',
  'En tanke, inte en akut uppgift',
  'Jag behöver inte lösa det just nu',
  'Egen tanke',
];

const RETURN_NEXT_STEP_OPTIONS = [
  'Skriv en kort notis',
  'Välj en tid senare idag',
  'Skicka ett kort meddelande',
  'Gör en liten sak nu',
  'Egen tanke',
];

const RETURN_LANDING_VARIANTS = [
  {
    title: 'Här och nu',
    body: 'Vi börjar med det som finns nära dig.',
    support: 'Kom tillbaka lite grann, inte allt på en gång.',
    prompts: [
      'Låt blicken vila på 3 saker',
      'Känn 2 kontaktpunkter mot kroppen',
      'Ta 1 långsam utandning',
    ],
  },
  {
    title: 'Tillbaka till nuet',
    body: 'Låt kroppen hinna ikapp tankarna en liten stund.',
    support: 'Du behöver inte göra mer än det här just nu.',
    prompts: [
      'Hitta 3 saker med blicken',
      'Känn 2 ställen där kroppen har stöd',
      'Andas ut lite långsammare 1 gång',
    ],
  },
  {
    title: 'Landa lite mer',
    body: 'Samla uppmärksamheten i det som finns precis runt dig.',
    support: 'Små skiften kan göra stor skillnad i stunden.',
    prompts: [
      'Lägg märke till 3 saker du ser',
      'Känn 2 saker i eller mot kroppen',
      'Lyssna till 1 ljud innan du andas ut',
    ],
  },
  {
    title: 'En mjuk återgång',
    body: 'Ta in rummet igen, utan att skynda på något.',
    support: 'Du får återvända steg för steg.',
    prompts: [
      'Se 3 former eller färger nära dig',
      'Känn 2 ytor som håller upp kroppen',
      'Släpp ut 1 lugn utandning',
    ],
  },
  {
    title: 'Ner i tempo',
    body: 'Låt tempot sjunka lite, bara i den här stunden.',
    support: 'Ett kort stopp kan räcka för att hitta fotfästet igen.',
    prompts: [
      'Välj 3 saker som står stilla omkring dig',
      'Känn 2 punkter där kroppen möter underlaget',
      'Ta 1 lång utandning i din egen takt',
    ],
  },
  {
    title: 'Kom tillbaka varsamt',
    body: 'Flytta fokus från tankar till det som faktiskt känns i kroppen just nu.',
    support: 'Det får vara enkelt och mjukt.',
    prompts: [
      'Se 3 saker som är närmast dig',
      'Känn 2 områden med tyngd eller värme',
      'Lyssna efter 1 ljud som pågår just nu',
    ],
  },
  {
    title: 'Lite mer närvaro',
    body: 'Vi tar en kort landning i det som bär dig här och nu.',
    support: 'Små signaler från kroppen kan hjälpa dig tillbaka.',
    prompts: [
      'Lägg märke till 3 detaljer i rummet',
      'Känn 2 punkter där du har stöd',
      'Ta 1 utandning och mjukna i axlarna',
    ],
  },
];

const toolsState = {
  activeView: 'home',
  stepIndex: 0,
  selfHelpExpanded: false,
  thoughtCatcher: {
    stepIndex: 0,
    selectedThought: '',
    customThought: '',
    impactValue: 50,
    selectedAlternative: '',
    customAlternative: '',
    reliefValue: 50,
  },
  returnToNow: {
    stepIndex: 0,
    selectedPull: '',
    customPull: '',
    selectedActionability: '',
    selectedStepChoice: '',
    customStepChoice: '',
    selectedLandingVariant: null,
  },
};

let initialized = false;

function resetGrounding() {
  toolsState.stepIndex = 0;
}

function nextGroundingStep() {
  toolsState.stepIndex = Math.min(toolsState.stepIndex + 1, GROUNDING_STEPS.length - 1);
}

function resetThoughtCatcher() {
  toolsState.thoughtCatcher = {
    stepIndex: 0,
    selectedThought: '',
    customThought: '',
    impactValue: 50,
    selectedAlternative: '',
    customAlternative: '',
    reliefValue: 50,
  };
}

function getProgress() {
  const progressStepIndex = Math.min(Math.max(toolsState.stepIndex - 1, 0), 5);
  const percentage = Math.round((progressStepIndex / 5) * 100);
  return {
    progressStepIndex,
    percentage,
  };
}

function resetReturnToNow() {
  toolsState.returnToNow = {
    stepIndex: 0,
    selectedPull: '',
    customPull: '',
    selectedActionability: '',
    selectedStepChoice: '',
    customStepChoice: '',
    selectedLandingVariant: null,
  };
}

function getSelectedLandingVariant() {
  const state = toolsState.returnToNow;
  if (state.selectedLandingVariant) {
    return state.selectedLandingVariant;
  }

  state.selectedLandingVariant = RETURN_LANDING_VARIANTS[
    Math.floor(Math.random() * RETURN_LANDING_VARIANTS.length)
  ];
  return state.selectedLandingVariant;
}

function getReturnToNowProgress() {
  const state = toolsState.returnToNow;
  const capped = Math.min(state.stepIndex + 1, 4);
  const percentage = Math.round((capped / 4) * 100);
  return {
    stepLabel: `Steg ${capped} av 4`,
    percentage,
  };
}

function setToolsView(view) {
  const nextView = ['home', 'breathing', 'grounding', 'thought-catcher', 'return-to-now'].includes(view) ? view : 'home';
  toolsState.activeView = nextView;

  const sections = [
    { element: document.getElementById('tools-home-view'), id: 'home' },
    { element: document.getElementById('tools-breathing-view'), id: 'breathing' },
    { element: document.getElementById('tools-grounding-view'), id: 'grounding' },
    { element: document.getElementById('tools-thought-catcher-view'), id: 'thought-catcher' },
    { element: document.getElementById('tools-return-to-now-view'), id: 'return-to-now' },
  ];

  sections.forEach(({ element, id }) => {
    if (!element) return;
    const isActive = id === nextView;
    element.hidden = !isActive;
    element.setAttribute('aria-hidden', String(!isActive));
  });
}

function renderReturnToNowTool() {
  const container = document.getElementById('return-to-now-tool-root');
  if (!container) return;

  const state = toolsState.returnToNow;
  const isDone = state.stepIndex >= 4;

  if (isDone) {
    container.innerHTML = `
      <article class="micro-card" data-dim="present">
        <div class="micro-tool-card">
          <div class="micro-tool-head">
            <div>
              <span class="ex-badge">🧭 tillbaka till nuet</span>
              <h4 class="ex-title">Lite mer här och nu</h4>
              <p class="ex-subtitle">Bra gjort. Du har tagit ett steg tillbaka till det som finns här just nu.</p>
            </div>
          </div>
          <div class="thought-catcher-step return-to-now-step">
            <p>Du kan återvända hit när tankarna drar iväg igen.</p>
          </div>
          <div class="thought-catcher-actions">
            <button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-return-action="restart">Börja om</button>
          </div>
        </div>
      </article>
    `;
    return;
  }

  const { stepLabel, percentage } = getReturnToNowProgress();
  const isActionable = state.selectedActionability === 'Ja';
  let title = '';
  let body = '';
  let support = '';
  let cta = '';
  let stepContent = '';

  if (state.stepIndex === 0) {
    title = 'Vad drar dig bort från nuet just nu?';
    body = 'Börja med att lägga märke till vad som tar dig bort från stunden.';
    support = 'Det räcker att notera det som pågår i huvudet just nu.';
    cta = 'Det här stämmer';
    stepContent = `
      ${renderThoughtOptionChips(RETURN_PULL_OPTIONS, state.selectedPull, 'return-pull')}
      ${state.selectedPull === 'Egen tanke' ? `<input class="txt-in txt-in-sm" type="text" placeholder="Skriv din tanke" value="${state.customPull || ''}" data-return-custom-input="pull">` : ''}
    `;
  }

  if (state.stepIndex === 1) {
    title = 'Går det att göra något åt det just nu?';
    body = 'Du behöver inte reda ut allt nu. Känn efter om det här går att påverka i den här stunden.';
    support = 'Du behöver inte hitta rätt svar, bara det som känns sant just nu.';
    cta = 'Jag vill gå vidare';
    stepContent = renderThoughtOptionChips(RETURN_ACTION_OPTIONS, state.selectedActionability, 'return-actionability');
  }

  if (state.stepIndex === 2) {
    title = isActionable ? 'Ett litet nästa steg' : 'Tankeparkering';
    body = isActionable
      ? 'Om det går att göra något nu, välj ett litet steg. Du behöver inte hela lösningen.'
      : 'Du behöver inte bära tanken hela tiden. Ibland räcker det att låta den vänta en stund.';
    support = isActionable
      ? 'Ett litet steg är nog för att lätta trycket.'
      : 'Att parkera en tanke är att ge dig själv en paus, inte att ge upp.';
    cta = isActionable ? 'Ett steg är valt' : 'Tanken får vänta';
    stepContent = `
      ${renderThoughtOptionChips(isActionable ? RETURN_NEXT_STEP_OPTIONS : RETURN_PARK_OPTIONS, state.selectedStepChoice, 'return-step-choice')}
      ${state.selectedStepChoice === 'Egen tanke' ? `<input class="txt-in txt-in-sm" type="text" placeholder="Skriv din formulering" value="${state.customStepChoice || ''}" data-return-custom-input="step-choice">` : ''}
    `;
  }

  if (state.stepIndex === 3) {
    const landingVariant = getSelectedLandingVariant();
    title = landingVariant.title;
    body = landingVariant.body;
    support = landingVariant.support;
    cta = 'Jag är här nu';
    stepContent = `
      <p class="return-now-prompt-intro">Nu hjälper vi kroppen och uppmärksamheten tillbaka hit:</p>
      <div class="return-now-checklist">
        ${landingVariant.prompts.map((prompt) => `<div class="return-now-item">${prompt}</div>`).join('')}
      </div>
    `;
  }

  container.innerHTML = `
    <article class="micro-card" data-dim="present">
      <div class="micro-tool-card">
        <div class="micro-tool-head">
          <div>
            <span class="ex-badge">🧭 tillbaka till nuet</span>
            <h4 class="ex-title">Tillbaka till nuet</h4>
            <p class="ex-subtitle">När tankarna drar iväg hjälper vi dig tillbaka, lugnt och steg för steg.</p>
          </div>
        </div>
        <div class="tool-progress" aria-live="polite">
          <div class="tool-progress-bar"><span style="width:${percentage}%;"></span></div>
          <div class="tool-time">${stepLabel}</div>
        </div>
        <div class="thought-catcher-step return-to-now-step" aria-live="polite">
          <h5>${title}</h5>
          <p>${body}</p>
          ${support ? `<p class="thought-catcher-support">${support}</p>` : ''}
          ${stepContent}
        </div>
        <div class="thought-catcher-actions">
          <button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-return-action="next">${cta}</button>
          ${(state.stepIndex > 0) ? '<button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="back">Tillbaka</button>' : ''}
          ${(state.stepIndex > 0) ? '<button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="restart">Börja om</button>' : ''}
        </div>
      </div>
    </article>
  `;
}

function canAdvanceReturnToNowStep() {
  const state = toolsState.returnToNow;
  if (state.stepIndex === 0) {
    if (!state.selectedPull) return false;
    if (state.selectedPull === 'Egen tanke') return Boolean(state.customPull.trim());
  }

  if (state.stepIndex === 1) {
    return Boolean(state.selectedActionability);
  }

  if (state.stepIndex === 2) {
    if (!state.selectedStepChoice) return false;
    if (state.selectedStepChoice === 'Egen tanke') return Boolean(state.customStepChoice.trim());
  }

  return true;
}

function openTool(toolId) {
  const tool = TOOL_DEFINITIONS.find((item) => item.id === toolId);
  if (!tool || tool.disabled) return;
  setToolsView(tool.view);
}

function renderToolsHomeCards() {
  const container = document.getElementById('tools-home-cards');
  if (!container) return;

  container.innerHTML = TOOL_DEFINITIONS.map((tool) => `
    <button
      class="tool-select-card ${tool.disabled ? 'is-disabled' : ''}"
      type="button"
      data-tool-target="${tool.id}"
      data-tone="${tool.tone || 'calm'}"
      ${tool.disabled ? 'disabled aria-disabled="true"' : ''}
    >
      <div class="tool-select-icon">${tool.icon}</div>
      <div class="tool-select-copy">
        <h3>${tool.title}</h3>
        <p>${tool.description}</p>
      </div>
    </button>
  `).join('');
}

function renderGroundingTool() {
  const container = document.getElementById('grounding-tool-root');
  if (!container) return;

  const currentStep = GROUNDING_STEPS[toolsState.stepIndex] || GROUNDING_STEPS[0];
  const isDone = currentStep.key === 'done';
  const { progressStepIndex, percentage } = getProgress();
  const currentProgress = Math.max(progressStepIndex, 1);
  const progressLabel = isDone ? 'Steg 5 av 5 · Landning klar' : `Steg ${currentProgress} av 5 · Sinnesankare ${currentProgress}`;

  container.innerHTML = `
    <article class="micro-card grounding-card" data-dim="stress">
      <div class="micro-tool-card">
        <div class="micro-tool-head">
          <div>
            <span class="ex-badge">🌿 grounding</span>
            <h4 class="ex-title">Jordning 5-4-3-2-1</h4>
            <p class="ex-subtitle">Landa i nuet med dina sinnen</p>
          </div>
        </div>
        <div class="tool-progress grounding-progress" aria-live="polite">
          <div class="tool-progress-bar"><span style="width:${percentage}%;"></span></div>
          <div class="tool-time">${progressLabel}</div>
        </div>
        <div class="grounding-step" aria-live="polite">
          ${!isDone ? `<p class="grounding-step-kicker">Sinnesankare ${currentProgress}</p>` : ''}
          <h5>${currentStep.title}</h5>
          <p>${currentStep.body}</p>
          ${currentStep.support ? `<p class="grounding-support">${currentStep.support}</p>` : ''}
          ${currentStep.note ? `<p class="grounding-note">${currentStep.note}</p>` : ''}
        </div>
        <div class="grounding-actions">
          <button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-grounding-action="next">${currentStep.cta}</button>
          ${toolsState.stepIndex > 0 && !isDone ? '<button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-grounding-action="restart">Börja om</button>' : ''}
        </div>
      </div>
    </article>
  `;
}

function getThoughtCatcherProgress() {
  const step = toolsState.thoughtCatcher.stepIndex;
  const capped = Math.min(step + 1, THOUGHT_CATCHER_STEPS.length);
  const percentage = Math.round((capped / THOUGHT_CATCHER_STEPS.length) * 100);
  return {
    stepLabel: `Del ${capped} av ${THOUGHT_CATCHER_STEPS.length} · steg för steg`,
    stepKicker: `Steg ${capped}: ${capped === 1 ? 'Lägg märke till tanken' : capped === 2 ? 'Se påverkan' : capped === 3 ? 'Prova en mjukare tanke' : 'Känn skillnaden'}`,
    percentage,
  };
}

function renderThoughtOptionChips(options, selected, stepKey) {
  return `
    <div class="flow-chip-wrap">
      ${options.map((option) => `
        <button
          type="button"
          class="flow-chip ${selected === option ? 'sel' : ''}"
          data-thought-chip-step="${stepKey}"
          data-thought-chip-value="${option}"
        >${option}</button>
      `).join('')}
    </div>
  `;
}

function renderThoughtCatcherTool() {
  const container = document.getElementById('thought-catcher-tool-root');
  if (!container) return;

  const state = toolsState.thoughtCatcher;
  const isDone = state.stepIndex >= THOUGHT_CATCHER_STEPS.length;

  if (isDone) {
    container.innerHTML = `
      <article class="micro-card" data-dim="sleep">
        <div class="micro-tool-card">
          <div class="micro-tool-head">
            <div>
              <span class="ex-badge">📝 tankefångare</span>
              <h4 class="ex-title">Lite mer utrymme</h4>
              <p class="ex-subtitle">Bra gjort. Du har tagit ett steg från en automatisk tanke till något mer medvetet.</p>
            </div>
          </div>
          <div class="thought-catcher-step">
            <p>Stanna gärna en kort stund och märk vad som känns annorlunda nu.</p>
            <p class="thought-catcher-support">Du kan återvända till övningen när samma tanke dyker upp igen.</p>
          </div>
          <div class="thought-catcher-actions">
            <button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-thought-catcher-action="restart">Börja om</button>
          </div>
        </div>
      </article>
    `;
    return;
  }

  const step = THOUGHT_CATCHER_STEPS[state.stepIndex];
  const { stepLabel, stepKicker, percentage } = getThoughtCatcherProgress();

  let stepContent = '';
  if (step.key === 'notice') {
    stepContent = `
      ${renderThoughtOptionChips(NOTICE_THOUGHT_OPTIONS, state.selectedThought, step.key)}
      ${state.selectedThought === 'Egen tanke' ? '<input class="txt-in txt-in-sm" type="text" placeholder="Skriv din tanke" value="' + (state.customThought || '') + '" data-thought-custom-input="notice">' : ''}
    `;
  }

  if (step.key === 'impact') {
    stepContent = `
      <div class="thought-slider">
        <input type="range" min="0" max="100" value="${state.impactValue}" data-thought-slider="impact">
        <div class="thought-slider-labels"><span>Inte alls</span><span>Mycket</span></div>
      </div>
    `;
  }

  if (step.key === 'soften') {
    stepContent = `
      ${renderThoughtOptionChips(SOFT_THOUGHT_OPTIONS, state.selectedAlternative, step.key)}
      ${state.selectedAlternative === 'Egen tanke' ? '<input class="txt-in txt-in-sm" type="text" placeholder="Skriv en mjukare tanke" value="' + (state.customAlternative || '') + '" data-thought-custom-input="soften">' : ''}
    `;
  }

  if (step.key === 'result') {
    stepContent = `
      <div class="thought-slider">
        <input type="range" min="0" max="100" value="${state.reliefValue}" data-thought-slider="result">
        <div class="thought-slider-labels"><span>Tung</span><span>Lättare</span></div>
      </div>
    `;
  }

  container.innerHTML = `
    <article class="micro-card" data-dim="sleep">
      <div class="micro-tool-card">
        <div class="micro-tool-head">
          <div>
            <span class="ex-badge">📝 tankefångare</span>
            <h4 class="ex-title">Tankefångare</h4>
            <p class="ex-subtitle">Ett lugnt steg i taget: lägg märke till tanken, mjuka upp den och känn efter.</p>
          </div>
        </div>
        <div class="tool-progress" aria-live="polite">
          <div class="tool-progress-bar"><span style="width:${percentage}%;"></span></div>
          <div class="tool-time">${stepLabel}</div>
        </div>
        <div class="thought-catcher-step" aria-live="polite">
          <p class="thought-catcher-kicker">${stepKicker}</p>
          <h5>${step.title}</h5>
          <p>${step.body}</p>
          ${step.support ? `<p class="thought-catcher-support">${step.support}</p>` : ''}
          ${stepContent}
        </div>
        <div class="thought-catcher-actions">
          <button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-thought-catcher-action="next">${step.cta || 'Nästa'}</button>
          ${(state.stepIndex > 0) ? '<button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-thought-catcher-action="back">Tillbaka</button>' : ''}
          ${(state.stepIndex > 0) ? '<button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-thought-catcher-action="restart">Börja om</button>' : ''}
        </div>
      </div>
    </article>
  `;
}

function canAdvanceThoughtCatcherStep() {
  const state = toolsState.thoughtCatcher;
  const step = THOUGHT_CATCHER_STEPS[state.stepIndex];
  if (!step) return true;

  if (step.key === 'notice') {
    if (!state.selectedThought) return false;
    if (state.selectedThought === 'Egen tanke') return Boolean(state.customThought.trim());
  }

  if (step.key === 'soften') {
    if (!state.selectedAlternative) return false;
    if (state.selectedAlternative === 'Egen tanke') return Boolean(state.customAlternative.trim());
  }

  return true;
}

function setSelfHelpExpanded(expanded) {
  toolsState.selfHelpExpanded = expanded;
  const detail = document.getElementById('tools-selfhelp-detail');
  const button = document.querySelector('[data-tools-selfhelp-toggle]');
  if (detail) detail.hidden = !expanded;
  if (button instanceof HTMLButtonElement) {
    button.textContent = expanded ? 'Visa mindre' : 'Läs mer';
    button.setAttribute('aria-expanded', String(expanded));
  }
}

function bindToolsEvents() {
  const toolsTab = document.getElementById('tab-tools');
  if (!toolsTab) return;

  toolsTab.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const toolButton = target.closest('[data-tool-target]');
    if (toolButton instanceof HTMLElement) {
      openTool(toolButton.dataset.toolTarget || '');
      return;
    }

    if (target.closest('[data-tools-back]')) {
      if (toolsState.activeView === 'return-to-now') {
        toolsState.returnToNow.selectedLandingVariant = null;
      }
      setToolsView('home');
      return;
    }

    if (target.closest('[data-tools-selfhelp-toggle]')) {
      setSelfHelpExpanded(!toolsState.selfHelpExpanded);
      return;
    }

    const groundingAction = target.dataset.groundingAction;
    if (groundingAction) {
      if (groundingAction === 'restart') {
        resetGrounding();
        renderGroundingTool();
        return;
      }

      if (toolsState.stepIndex >= GROUNDING_STEPS.length - 1) {
        resetGrounding();
      } else {
        nextGroundingStep();
      }

      renderGroundingTool();
      return;
    }

    const thoughtChip = target.closest('[data-thought-chip-step]');
    if (thoughtChip instanceof HTMLElement) {
      const stepKey = thoughtChip.dataset.thoughtChipStep;
      const value = thoughtChip.dataset.thoughtChipValue || '';
      if (stepKey === 'notice') {
        toolsState.thoughtCatcher.selectedThought = value;
        renderThoughtCatcherTool();
        return;
      }
      if (stepKey === 'soften') {
        toolsState.thoughtCatcher.selectedAlternative = value;
        renderThoughtCatcherTool();
        return;
      }
      if (stepKey === 'return-pull') {
        toolsState.returnToNow.selectedPull = value;
        renderReturnToNowTool();
        return;
      }
      if (stepKey === 'return-actionability') {
        toolsState.returnToNow.selectedActionability = value;
        renderReturnToNowTool();
        return;
      }
      if (stepKey === 'return-step-choice') {
        toolsState.returnToNow.selectedStepChoice = value;
        renderReturnToNowTool();
        return;
      }
    }

    const thoughtAction = target.dataset.thoughtCatcherAction;
    if (thoughtAction) {
      if (thoughtAction === 'restart') {
        resetThoughtCatcher();
        renderThoughtCatcherTool();
        return;
      }

      if (thoughtAction === 'back') {
        toolsState.thoughtCatcher.stepIndex = Math.max(0, toolsState.thoughtCatcher.stepIndex - 1);
        renderThoughtCatcherTool();
        return;
      }

      if (!canAdvanceThoughtCatcherStep()) return;
      toolsState.thoughtCatcher.stepIndex += 1;
      renderThoughtCatcherTool();
      return;
    }

    const returnAction = target.dataset.returnAction;
    if (!returnAction) return;

    if (returnAction === 'restart') {
      resetReturnToNow();
      renderReturnToNowTool();
      return;
    }

    if (returnAction === 'back') {
      toolsState.returnToNow.stepIndex = Math.max(0, toolsState.returnToNow.stepIndex - 1);
      renderReturnToNowTool();
      return;
    }

    if (!canAdvanceReturnToNowStep()) return;
    toolsState.returnToNow.stepIndex += 1;
    renderReturnToNowTool();
  });

  toolsTab.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('[data-thought-custom-input="notice"]')) {
      toolsState.thoughtCatcher.customThought = target.value;
      return;
    }

    if (target.matches('[data-thought-custom-input="soften"]')) {
      toolsState.thoughtCatcher.customAlternative = target.value;
      return;
    }

    if (target.matches('[data-thought-slider="impact"]')) {
      toolsState.thoughtCatcher.impactValue = Number(target.value);
      return;
    }

    if (target.matches('[data-thought-slider="result"]')) {
      toolsState.thoughtCatcher.reliefValue = Number(target.value);
      return;
    }

    if (target.matches('[data-return-custom-input="pull"]')) {
      toolsState.returnToNow.customPull = target.value;
      return;
    }

    if (target.matches('[data-return-custom-input="step-choice"]')) {
      toolsState.returnToNow.customStepChoice = target.value;
    }
  });
}

export function init() {
  if (initialized) return;
  initialized = true;
  initCalmModule();
  initHelpModule();
  bindToolsEvents();
  renderToolsHomeCards();
  renderGroundingTool();
  renderThoughtCatcherTool();
  renderReturnToNowTool();
  setSelfHelpExpanded(false);
  setToolsView('home');
}
