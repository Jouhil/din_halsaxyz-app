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
    title: 'Vilken tanke dyker upp?',
    body: 'Välj den tanke som ligger närmast just nu, eller skriv en egen.',
  },
  {
    key: 'impact',
    title: 'Hur hjälpsam känns tanken?',
    body: 'Du behöver inte ändra tanken direkt. Börja med att se hur den påverkar dig.',
  },
  {
    key: 'soften',
    title: 'Vad skulle vara en mjukare tanke?',
    body: 'Välj ett alternativ som känns lite mer hjälpsamt just nu.',
  },
  {
    key: 'result',
    title: 'Hur känns den nya tanken?',
    body: 'Se om den känns lite lättare att bära just nu.',
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

function setToolsView(view) {
  const nextView = ['home', 'breathing', 'grounding', 'thought-catcher'].includes(view) ? view : 'home';
  toolsState.activeView = nextView;

  const sections = [
    { element: document.getElementById('tools-home-view'), id: 'home' },
    { element: document.getElementById('tools-breathing-view'), id: 'breathing' },
    { element: document.getElementById('tools-grounding-view'), id: 'grounding' },
    { element: document.getElementById('tools-thought-catcher-view'), id: 'thought-catcher' },
  ];

  sections.forEach(({ element, id }) => {
    if (!element) return;
    const isActive = id === nextView;
    element.hidden = !isActive;
    element.setAttribute('aria-hidden', String(!isActive));
  });
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
              <p class="ex-subtitle">Bra gjort. Du har gett tanken lite mindre makt och skapat mer utrymme.</p>
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
          ${stepContent}
        </div>
        <div class="thought-catcher-actions">
          <button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-thought-catcher-action="next">${state.stepIndex === THOUGHT_CATCHER_STEPS.length - 1 ? 'Klar' : 'Nästa'}</button>
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
      }
      if (stepKey === 'soften') {
        toolsState.thoughtCatcher.selectedAlternative = value;
      }
      renderThoughtCatcherTool();
      return;
    }

    const thoughtAction = target.dataset.thoughtCatcherAction;
    if (!thoughtAction) return;

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
  setSelfHelpExpanded(false);
  setToolsView('home');
}
