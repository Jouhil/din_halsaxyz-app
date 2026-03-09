import { init as initCalmModule } from './calmModule.js';
import { init as initHelpModule } from './helpModule.js';

const TOOL_DEFINITIONS = [
  {
    id: 'grounding-54321',
    title: 'Jordning 5-4-3-2-1',
    subtitle: 'Landa i nuet med dina sinnen',
    category: 'grounding',
    icon: '🌿',
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

const groundingState = {
  activeToolId: TOOL_DEFINITIONS[0].id,
  stepIndex: 0,
};

let initialized = false;

function getActiveTool() {
  return TOOL_DEFINITIONS.find((tool) => tool.id === groundingState.activeToolId) || TOOL_DEFINITIONS[0];
}

function resetGrounding() {
  groundingState.stepIndex = 0;
}

function nextGroundingStep() {
  groundingState.stepIndex = Math.min(groundingState.stepIndex + 1, GROUNDING_STEPS.length - 1);
}

function getProgress() {
  const progressStepIndex = Math.min(Math.max(groundingState.stepIndex - 1, 0), 5);
  const percentage = Math.round((progressStepIndex / 5) * 100);
  return {
    progressStepIndex,
    percentage,
  };
}

function renderGroundingTool() {
  const container = document.getElementById('grounding-tool-root');
  if (!container) return;

  const tool = getActiveTool();
  const currentStep = GROUNDING_STEPS[groundingState.stepIndex] || GROUNDING_STEPS[0];
  const isDone = currentStep.key === 'done';
  const { progressStepIndex, percentage } = getProgress();

  const progressLabel = isDone ? 'Steg 5 av 5' : `Steg ${Math.max(progressStepIndex, 1)} av 5`;

  container.innerHTML = `
    <article class="micro-card grounding-card" data-dim="stress">
      <div class="micro-tool-card">
        <div class="micro-tool-head">
          <div>
            <span class="ex-badge">${tool.icon} ${tool.category}</span>
            <h4 class="ex-title">${tool.title}</h4>
            <p class="ex-subtitle">${tool.subtitle}</p>
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
          ${groundingState.stepIndex > 0 && !isDone ? '<button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-grounding-action="restart">Börja om</button>' : ''}
        </div>
      </div>
    </article>
  `;
}

function bindGroundingEvents() {
  const section = document.getElementById('grounding-tool-section');
  if (!section) return;

  section.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.groundingAction;
    if (!action) return;

    if (action === 'restart') {
      resetGrounding();
      renderGroundingTool();
      return;
    }

    if (groundingState.stepIndex >= GROUNDING_STEPS.length - 1) {
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
  bindGroundingEvents();
  renderGroundingTool();
}
