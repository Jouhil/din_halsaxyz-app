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

const RETURN_ACUTE_SUPPORT_OPTIONS = [
  'Jag ser 3 saker omkring mig',
  'Jag känner fötterna mot underlaget',
  'Jag tar en långsam utandning',
  'Jag lägger handen på bröstet',
  'Egen förankring',
];

const RETURN_PREVENTIVE_PRACTICE_OPTIONS = [
  'Jag vill öva 1 minut',
  'Jag vill öva 3 lugna andetag',
  'Jag vill checka in med kroppen',
  'Jag vill påminna mig om tempo',
  'Egen intention',
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
    currentStep: 'concern',
    stepHistory: ['concern'],
    selectedConcernType: '',
    customConcern: '',
    selectedTrack: '',
    acuteSupportChoice: '',
    customAcuteSupportChoice: '',
    preventivePracticeChoice: '',
    customPreventivePracticeChoice: '',
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
    currentStep: 'concern',
    stepHistory: ['concern'],
    selectedConcernType: '',
    customConcern: '',
    selectedTrack: '',
    acuteSupportChoice: '',
    customAcuteSupportChoice: '',
    preventivePracticeChoice: '',
    customPreventivePracticeChoice: '',
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
  const totalSteps = 4;
  const currentStep = Math.min(state.stepHistory.length, totalSteps);
  const percentage = Math.round((currentStep / totalSteps) * 100);
  return {
    stepLabel: `Steg ${currentStep} av ${totalSteps}`,
    percentage,
  };
}

function goToReturnToNowStep(nextStep) {
  const state = toolsState.returnToNow;
  state.currentStep = nextStep;
  if (state.stepHistory[state.stepHistory.length - 1] !== nextStep) {
    state.stepHistory.push(nextStep);
  }
}

function goBackReturnToNowStep() {
  const state = toolsState.returnToNow;
  if (state.stepHistory.length <= 1) return;
  state.stepHistory.pop();
  state.currentStep = state.stepHistory[state.stepHistory.length - 1] || 'concern';
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
  const isDone = state.currentStep === 'done';

  if (isDone) {
    const doneTitle = state.selectedTrack === 'acute' ? 'Du hanterade en akut stund' : 'Du har tränat närvaro';
    const doneSubtitle = state.selectedTrack === 'acute'
      ? 'Fint jobbat. Du tog tillbaka kontakt med nuet när tankarna drog iväg.'
      : 'Fint jobbat. Du byggde närvaro i förväg med ett lugnt steg.';
    const doneBody = state.selectedTrack === 'acute'
      ? 'Kom gärna tillbaka hit direkt nästa gång det börjar snurra.'
      : 'En kort övning då och då gör det lättare att landa i stunden.';
    container.innerHTML = `
      <article class="micro-card" data-dim="present">
        <div class="micro-tool-card">
          <div class="micro-tool-head">
            <div>
              <span class="ex-badge">🧭 tillbaka till nuet</span>
              <h4 class="ex-title">${doneTitle}</h4>
              <p class="ex-subtitle">${doneSubtitle}</p>
            </div>
          </div>
          <div class="thought-catcher-step return-to-now-step">
            <p>${doneBody}</p>
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
  let title = '';
  let body = '';
  let support = '';
  let cta = '';
  let stepContent = '';

  if (state.currentStep === 'concern') {
    title = 'Vad drar dig bort från nuet?';
    body = 'Välj det som passar bäst just nu.';
    support = 'Det räcker att bara lägga märke till vad som drar iväg dig.';
    cta = 'Fortsätt';
    stepContent = `
      ${renderThoughtOptionChips(RETURN_PULL_OPTIONS, state.selectedConcernType, 'return-concern')}
      ${state.selectedConcernType === 'Egen tanke' ? `<input class="txt-in txt-in-sm" type="text" placeholder="Skriv din tanke" value="${state.customConcern || ''}" data-return-custom-input="concern">` : ''}
    `;
  }

  if (state.currentStep === 'track-choice') {
    title = 'Var är du just nu?';
    body = 'Välj spåret som passar din stund bäst. Vi anpassar hjälpen direkt efter ditt val.';
    support = '';
    cta = state.selectedTrack === 'acute'
      ? 'Fortsätt med akut stöd'
      : state.selectedTrack === 'preventive'
        ? 'Fortsätt med övning'
        : 'Välj ett spår';
    stepContent = `
      <div class="return-track-grid">
        <button class="return-track-card ${state.selectedTrack === 'acute' ? 'is-selected' : ''}" type="button" data-return-track="acute">
          <span class="return-track-card__eyebrow">Akut</span>
          <span class="return-track-card__title">Tankarna drar iväg just nu</span>
          <span class="return-track-card__body">För dig som behöver snabb hjälp att landa här och nu.</span>
        </button>
        <button class="return-track-card ${state.selectedTrack === 'preventive' ? 'is-selected' : ''}" type="button" data-return-track="preventive">
          <span class="return-track-card__eyebrow">Förebyggande</span>
          <span class="return-track-card__title">Jag vill öva mig på nuet</span>
          <span class="return-track-card__body">För dig som vill träna upp närvaro i lugnare tempo.</span>
        </button>
      </div>
    `;
  }

  if (state.currentStep === 'acute-core') {
    title = 'Bra att du stannade upp';
    body = 'Välj en enkel förankring och gör den direkt. Målet är att få tillbaka lite kontakt med nuet.';
    support = 'Du behöver inte känna dig klar först. Börja bara med en sak.';
    cta = 'Det hjälper';
    stepContent = `
      ${renderThoughtOptionChips(RETURN_ACUTE_SUPPORT_OPTIONS, state.acuteSupportChoice, 'return-acute-support')}
      ${state.acuteSupportChoice === 'Egen förankring' ? `<input class="txt-in txt-in-sm" type="text" placeholder="Skriv din egen förankring" value="${state.customAcuteSupportChoice || ''}" data-return-custom-input="acute-support">` : ''}
    `;
  }

  if (state.currentStep === 'preventive-core') {
    title = 'Stärk närvaro i förväg';
    body = 'Välj hur du vill öva nu. En kort medveten stund kan göra det lättare att stanna kvar i nuet senare.';
    support = 'Håll det enkelt och vänligt.';
    cta = 'Starta övningen';
    stepContent = `
      ${renderThoughtOptionChips(RETURN_PREVENTIVE_PRACTICE_OPTIONS, state.preventivePracticeChoice, 'return-preventive-practice')}
      ${state.preventivePracticeChoice === 'Egen intention' ? `<input class="txt-in txt-in-sm" type="text" placeholder="Skriv din intention" value="${state.customPreventivePracticeChoice || ''}" data-return-custom-input="preventive-practice">` : ''}
    `;
  }

  if (state.currentStep === 'acute-landing') {
    const landingVariant = getSelectedLandingVariant();
    title = 'Akutstöd klart';
    body = 'Bra jobbat. Du har redan brutit spiralen och skapat lite mer utrymme.';
    support = landingVariant.support;
    cta = 'Jag är mer här nu';
    stepContent = `
      <p class="return-now-prompt-intro">Fortsätt i samma lugna riktning med tre små steg:</p>
      <div class="return-now-checklist">
        ${landingVariant.prompts.map((prompt) => `<div class="return-now-item">${prompt}</div>`).join('')}
      </div>
    `;
  }

  if (state.currentStep === 'preventive-landing') {
    title = 'Närvaroövning klar';
    body = 'Fint. Du har tränat uppmärksamheten medan det var lugnare.';
    support = 'Det här gör det lättare att hitta tillbaka snabbare när tankarna senare drar iväg.';
    cta = 'Ta med detta vidare';
    stepContent = `
      <div class="return-now-checklist">
        <div class="return-now-item">Notera en sak du ser just nu.</div>
        <div class="return-now-item">Notera en kontaktpunkt i kroppen.</div>
        <div class="return-now-item">Välj ett ord för tempot du vill bära med dig.</div>
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
          ${(state.stepHistory.length > 1) ? '<button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="back">Tillbaka</button>' : ''}
          ${(state.stepHistory.length > 1) ? '<button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="restart">Börja om</button>' : ''}
        </div>
      </div>
    </article>
  `;
}

function canAdvanceReturnToNowStep() {
  const state = toolsState.returnToNow;
  if (state.currentStep === 'concern') {
    if (!state.selectedConcernType) return false;
    if (state.selectedConcernType === 'Egen tanke') return Boolean(state.customConcern.trim());
  }

  if (state.currentStep === 'track-choice') {
    return Boolean(state.selectedTrack);
  }

  if (state.currentStep === 'acute-core') {
    if (!state.acuteSupportChoice) return false;
    if (state.acuteSupportChoice === 'Egen förankring') return Boolean(state.customAcuteSupportChoice.trim());
  }

  if (state.currentStep === 'preventive-core') {
    if (!state.preventivePracticeChoice) return false;
    if (state.preventivePracticeChoice === 'Egen intention') return Boolean(state.customPreventivePracticeChoice.trim());
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
      if (toolsState.activeView === 'return-to-now') toolsState.returnToNow.selectedLandingVariant = null;
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
      if (stepKey === 'return-concern') {
        toolsState.returnToNow.selectedConcernType = value;
        if (value !== 'Egen tanke') toolsState.returnToNow.customConcern = '';
        renderReturnToNowTool();
        return;
      }
      if (stepKey === 'return-acute-support') {
        toolsState.returnToNow.acuteSupportChoice = value;
        if (value !== 'Egen förankring') toolsState.returnToNow.customAcuteSupportChoice = '';
        renderReturnToNowTool();
        return;
      }
      if (stepKey === 'return-preventive-practice') {
        toolsState.returnToNow.preventivePracticeChoice = value;
        if (value !== 'Egen intention') toolsState.returnToNow.customPreventivePracticeChoice = '';
        renderReturnToNowTool();
        return;
      }
    }

    const trackCard = target.closest('[data-return-track]');
    if (trackCard instanceof HTMLElement) {
      toolsState.returnToNow.selectedTrack = trackCard.dataset.returnTrack || '';
      renderReturnToNowTool();
      return;
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
      goBackReturnToNowStep();
      renderReturnToNowTool();
      return;
    }

    if (!canAdvanceReturnToNowStep()) return;
    const state = toolsState.returnToNow;
    if (state.currentStep === 'concern') {
      goToReturnToNowStep('track-choice');
    } else if (state.currentStep === 'track-choice') {
      goToReturnToNowStep(state.selectedTrack === 'acute' ? 'acute-core' : 'preventive-core');
    } else if (state.currentStep === 'acute-core') {
      goToReturnToNowStep('acute-landing');
    } else if (state.currentStep === 'preventive-core') {
      goToReturnToNowStep('preventive-landing');
    } else if (state.currentStep === 'acute-landing' || state.currentStep === 'preventive-landing') {
      goToReturnToNowStep('done');
    }
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

    if (target.matches('[data-return-custom-input="concern"]')) {
      toolsState.returnToNow.customConcern = target.value;
      return;
    }

    if (target.matches('[data-return-custom-input="acute-support"]')) {
      toolsState.returnToNow.customAcuteSupportChoice = target.value;
      return;
    }

    if (target.matches('[data-return-custom-input="preventive-practice"]')) {
      toolsState.returnToNow.customPreventivePracticeChoice = target.value;
      return;
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
