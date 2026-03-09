import { init as initCalmModule } from './calmModule.js';
import { init as initHelpModule } from './helpModule.js';

const TOOL_DEFINITIONS = [
  {
    id: 'breathing-4444',
    view: 'breathing',
    title: 'Box breathing 4-4-4-4',
    description: 'Lugn andning i fyra faser för stress, fokus och återhämtning.',
    icon: '🌊',
  },
  {
    id: 'grounding-54321',
    view: 'grounding',
    title: 'Jordning 5-4-3-2-1',
    description: 'En övning som hjälper dig tillbaka till nuet med hjälp av dina sinnen.',
    icon: '🌿',
  },
  {
    id: 'thought-catcher',
    view: 'thought-catcher',
    title: 'Tankefångare',
    description: 'Kommer snart – fånga tankar och skapa lugnare perspektiv.',
    icon: '📝',
    disabled: true,
  },
];

const GROUNDING_STEPS = [
  {
    key: 'intro',
    title: 'Jordning 5-4-3-2-1',
    body: 'En kort övning för att hjälpa dig landa i nuet med hjälp av dina sinnen.',
    cta: 'Starta',
  },
  {
    key: 'see',
    title: '5 saker du kan se',
    body: 'Se dig omkring och lägg märke till fem saker du kan se.',
    cta: 'Nästa',
  },
  {
    key: 'feel',
    title: '4 saker du kan känna',
    body: 'Lägg märke till fyra saker du kan känna i eller mot kroppen.',
    cta: 'Nästa',
  },
  {
    key: 'hear',
    title: '3 saker du kan höra',
    body: 'Lyssna efter tre ljud omkring dig.',
    cta: 'Nästa',
  },
  {
    key: 'smell',
    title: '2 saker du kan känna doften av',
    body: 'Lägg märke till två dofter omkring dig, eller tänk på två dofter du minns.',
    cta: 'Nästa',
  },
  {
    key: 'taste',
    title: '1 sak du kan smaka',
    body: 'Lägg märke till en smak i munnen, eller föreställ dig en trygg smak.',
    cta: 'Klar',
  },
  {
    key: 'done',
    title: 'Tillbaka i nuet',
    body: 'Bra gjort. Du har tagit ett steg tillbaka till nuet.',
    note: 'Du kan återvända till övningen när det känns mycket.',
    cta: 'Börja om',
  },
];

const toolsState = {
  activeView: 'home',
  stepIndex: 0,
};

let initialized = false;

function resetGrounding() {
  toolsState.stepIndex = 0;
}

function nextGroundingStep() {
  toolsState.stepIndex = Math.min(toolsState.stepIndex + 1, GROUNDING_STEPS.length - 1);
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
  const nextView = ['home', 'breathing', 'grounding'].includes(view) ? view : 'home';
  toolsState.activeView = nextView;

  const sections = [
    { element: document.getElementById('tools-home-view'), id: 'home' },
    { element: document.getElementById('tools-breathing-view'), id: 'breathing' },
    { element: document.getElementById('tools-grounding-view'), id: 'grounding' },
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

    const groundingAction = target.dataset.groundingAction;
    if (!groundingAction) return;

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
  setToolsView('home');
}
