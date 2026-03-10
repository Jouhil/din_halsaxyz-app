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
    description: 'Fånga en tanke, mjuka upp den och prova ett mer hjälpsamt perspektiv.',
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
    title: 'Jordning 5-4-3-2-1',
    body: 'Vi tar det lugnt tillsammans, steg för steg, för att hjälpa kroppen att landa i nuet.',
    support: 'Det finns inget rätt eller fel här.',
    cta: 'Jag är redo',
  },
  {
    key: 'see',
    title: '5 saker du kan se',
    body: 'Låt blicken vandra långsamt. Lägg märke till fem saker du kan se omkring dig.',
    support: 'Du behöver inte stressa fram svaren.',
    cta: 'Jag har sett 5 saker',
  },
  {
    key: 'feel',
    title: '4 saker du kan känna',
    body: 'Ta en liten stund och lägg märke till fyra saker du kan känna i eller mot kroppen.',
    support: 'Ta några sekunder här innan du går vidare.',
    cta: 'Jag har känt efter',
  },
  {
    key: 'hear',
    title: '3 saker du kan höra',
    body: 'Lyssna efter tre ljud omkring dig, nära eller längre bort.',
    support: 'Det räcker att bara lägga märke till det som finns.',
    cta: 'Jag har lyssnat',
  },
  {
    key: 'smell',
    title: '2 saker du kan känna doften av',
    body: 'Lägg märke till två dofter omkring dig, eller tänk på två dofter du minns.',
    support: 'Om det är svårt går det bra att föreställa sig en doft.',
    cta: 'Jag är redo',
  },
  {
    key: 'taste',
    title: '1 sak du kan smaka',
    body: 'Lägg märke till en smak i munnen, eller föreställ dig en trygg smak.',
    support: 'Mjukna i axlarna medan du tar in det du känner.',
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
    body: 'Välj den tanke som känns tydligast, eller skriv en egen.',
    support: 'Börja med att lägga märke till tanken – du behöver inte lösa den direkt.',
    cta: 'Det här stämmer',
  },
  {
    key: 'impact',
    title: 'Hur tung känns den tanken?',
    body: 'Känn efter hur mycket tanken påverkar dig just nu.',
    support: 'Du behöver inte ändra tanken direkt.',
    cta: 'Jag vill gå vidare',
  },
  {
    key: 'soften',
    title: 'Finns en mjukare tanke att prova?',
    body: 'Välj en tanke som känns lite vänligare eller mer hjälpsam att bära.',
    support: 'Prova om det finns en tanke som känns lite mjukare att bära.',
    cta: 'Prova en mjukare tanke',
  },
  {
    key: 'result',
    title: 'Hur känns den nya tanken i kroppen?',
    body: 'Känn efter om den ger lite mer utrymme just nu.',
    support: 'Små skiften räknas.',
    cta: 'Känn efter',
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
  'Inte nu',
  'Jag tar det senare',
  'Tanke, inte uppgift',
  'Jag behöver inte lösa det nu',
  'Egen tanke',
];

const RETURN_NEXT_STEP_OPTIONS = [
  'Skriv ner det',
  'Ta det senare idag',
  'Prata med någon',
  'Gör en liten sak nu',
  'Egen tanke',
];

const RETURN_LANDING_VARIANTS = [
  {
    title: 'Landning i nuet',
    body: 'Nu hjälper vi kroppen och uppmärksamheten tillbaka till det som finns här.',
    prompts: [
      'Se 3 saker omkring dig',
      'Känn 2 saker i eller mot kroppen',
      'Ta 1 lugn utandning',
    ],
  },
  {
    title: 'Tillbaka till nuet',
    body: 'Vi landar i det som finns omkring dig just nu.',
    prompts: [
      'Lägg märke till 3 saker du ser',
      'Känn efter på 2 ställen i kroppen',
      'Låt 1 utandning bli lite längre',
    ],
  },
  {
    title: 'Här och nu',
    body: 'Bara lite grann tillbaka till det som är här.',
    prompts: [
      'Hitta 3 saker med blicken',
      'Känn 2 kontaktpunkter mot stolen eller golvet',
      'Ta 1 mjuk utandning',
    ],
  },
  {
    title: 'Landa lite mer',
    body: 'Nu får kroppen och uppmärksamheten komma tillbaka hit.',
    prompts: [
      'Se 3 detaljer i rummet',
      'Känn 2 områden där kroppen har stöd',
      'Ta 1 långsam utandning',
    ],
  },
  {
    title: 'Ett steg tillbaka till nuet',
    body: 'Vi hjälper uppmärksamheten tillbaka till det som finns här, i din takt.',
    prompts: [
      'Låt blicken vila på 3 saker nära dig',
      'Känn 2 punkter där kroppen möter underlaget',
      'Ta 1 mjuk och lugn utandning',
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
            <p>Du kan återvända till övningen när tankarna drar iväg igen.</p>
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
    title = 'Vad drar dig bort från nuet?';
    body = 'Välj det som passar bäst just nu.';
    support = 'Det räcker att bara lägga märke till vad som drar iväg dig.';
    cta = 'Det här stämmer';
    stepContent = `
      ${renderThoughtOptionChips(RETURN_PULL_OPTIONS, state.selectedPull, 'return-pull')}
      ${state.selectedPull === 'Egen tanke' ? `<input class="txt-in txt-in-sm" type="text" placeholder="Skriv din tanke" value="${state.customPull || ''}" data-return-custom-input="pull">` : ''}
    `;
  }

  if (state.stepIndex === 1) {
    title = 'Går det att göra något åt det just nu?';
    body = 'Du behöver inte lösa allt nu. Börja med att se om det här är något du faktiskt kan agera på i denna stund.';
    support = 'Det här handlar inte om rätt svar, bara om vad som är sant just nu.';
    cta = 'Jag vill gå vidare';
    stepContent = renderThoughtOptionChips(RETURN_ACTION_OPTIONS, state.selectedActionability, 'return-actionability');
  }

  if (state.stepIndex === 2) {
    title = isActionable ? 'Ett litet nästa steg' : 'Tankeparkering';
    body = isActionable
      ? 'Om det går att göra något åt det nu, välj ett litet steg — inte hela lösningen.'
      : 'Du behöver inte bära den här tanken hela tiden. Låt den få vänta en stund.';
    support = isActionable
      ? 'Det räcker med ett litet steg.'
      : 'Att parkera en tanke är inte att ignorera den. Det är att välja när du vill möta den.';
    cta = 'Tillbaka till nuet';
    stepContent = `
      ${renderThoughtOptionChips(isActionable ? RETURN_NEXT_STEP_OPTIONS : RETURN_PARK_OPTIONS, state.selectedStepChoice, 'return-step-choice')}
      ${state.selectedStepChoice === 'Egen tanke' ? `<input class="txt-in txt-in-sm" type="text" placeholder="Skriv din formulering" value="${state.customStepChoice || ''}" data-return-custom-input="step-choice">` : ''}
    `;
  }

  if (state.stepIndex === 3) {
    const landingVariant = getSelectedLandingVariant();
    title = landingVariant.title;
    body = landingVariant.body;
    support = 'Du behöver inte göra det perfekt. Bara kom tillbaka lite grann.';
    cta = 'Jag är här nu';
    stepContent = `
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
            <p class="ex-subtitle">Landa i det som finns här just nu när tankarna drar iväg.</p>
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
  const progressLabel = isDone ? 'Steg 5 av 5' : `Steg ${Math.max(progressStepIndex, 1)} av 5`;

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
    stepLabel: `Steg ${capped} av ${THOUGHT_CATCHER_STEPS.length}`,
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
              <p class="ex-subtitle">Bra gjort. Du har tagit ett steg från automatisk tanke till något mer medvetet.</p>
            </div>
          </div>
          <div class="thought-catcher-step">
            <p>Du kan återvända till övningen när samma tanke dyker upp igen.</p>
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
  const { stepLabel, percentage } = getThoughtCatcherProgress();

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
            <p class="ex-subtitle">Fånga en tanke, mjuka upp den och prova ett mer hjälpsamt perspektiv.</p>
          </div>
        </div>
        <div class="tool-progress" aria-live="polite">
          <div class="tool-progress-bar"><span style="width:${percentage}%;"></span></div>
          <div class="tool-time">${stepLabel}</div>
        </div>
        <div class="thought-catcher-step" aria-live="polite">
          <h5>${step.title}</h5>
          <p>${step.body}</p>
          ${step.support ? `<p class="thought-catcher-support">${step.support}</p>` : ''}
          ${stepContent}
        </div>
        <div class="thought-catcher-actions">
          <button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-thought-catcher-action="next">${state.stepIndex === THOUGHT_CATCHER_STEPS.length - 1 ? 'Klar' : step.cta || 'Nästa'}</button>
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
