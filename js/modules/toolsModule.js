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
    currentStep: 'track-choice',
    stepHistory: ['track-choice'],
    selectedTrack: '',
    worryMode: false,
    selectedAcuteTime: '20:00',
    acuteReminderOn: false,
    acuteWorryText: '',
    selectedPrevTime: '20:00',
    prevReminderOn: false,
    groundingCompleted: [false, false, false],
    preventiveExercise: '',
    preventiveBodySelections: [],
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
    currentStep: 'track-choice',
    stepHistory: ['track-choice'],
    selectedTrack: '',
    worryMode: false,
    selectedAcuteTime: '20:00',
    acuteReminderOn: false,
    acuteWorryText: '',
    selectedPrevTime: '20:00',
    prevReminderOn: false,
    groundingCompleted: [false, false, false],
    preventiveExercise: '',
    preventiveBodySelections: [],
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
  state.currentStep = state.stepHistory[state.stepHistory.length - 1] || 'track-choice';
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

  const acuteHeaderMap = {
    'acute-1': ['Det är okej', 'Vi tar det ett litet steg i taget.', 0],
    'acute-2': ['Märk det', 'Du behöver inte lösa något just nu.', 20],
    'acute-defusion': ['Skapa avstånd', 'Tanken kan finnas utan att styra dig.', 45],
    'acute-worry': ['Parkera oron', 'Ge den en tid – och frigör resten av dagen.', 45],
    'acute-3': ['Landa i nuet', 'Låt kroppen hjälpa tankarna.', 70],
    'acute-4': ['Lite mer här och nu', '', 100],
  };

  const getModeCard = () => `
    <article class="micro-card" data-dim="present">
      <div class="micro-tool-card return-to-now-card return-ref-shell">
        <div class="tool-header">
          <div class="tool-badge">⏱ Tillbaka till nuet</div>
          <h1>Var är du just nu?</h1>
          <p class="subtitle">Välj det läge som passar bäst.</p>
        </div>
        <div class="mode-selector" style="padding-top:0">
          <button class="mode-card acute ${state.selectedTrack === 'acute' ? 'is-selected' : ''}" type="button" data-return-track="acute">
            <div class="mode-icon">🌊</div>
            <h3>Tankarna drar iväg just nu</h3>
            <p>Något tar plats. Jag behöver hjälp att landa i nuet.</p>
          </button>
          <button class="mode-card preventive ${state.selectedTrack === 'preventive' ? 'is-selected' : ''}" type="button" data-return-track="preventive">
            <div class="mode-icon">🌱</div>
            <h3>Jag vill öva mig på nuet</h3>
            <p>Allt är okej just nu, men jag vill stärka min förmåga.</p>
          </button>
        </div>
      </div>
    </article>
  `;

  if (state.currentStep === 'track-choice') {
    container.innerHTML = getModeCard();
    return;
  }

  if (state.currentStep.startsWith('acute-')) {
    const [title, subtitle, progress] = acuteHeaderMap[state.currentStep] || acuteHeaderMap['acute-1'];
    let stepHtml = '';
    let controls = '';

    if (state.currentStep === 'acute-1') {
      stepHtml = `
        <div class="grounding-step active">
          <div class="step-content return-center" style="padding: 28px 20px;">
            <div class="breath-circle"></div>
            <p class="emphasis" style="margin-bottom:8px">Andas ut.</p>
            <p class="body-text">Bara en lång utandning.<br>Inget mer behöver hända just nu.</p>
            <div class="auto-hint">Tryck när du är redo</div>
          </div>
        </div>
      `;
      controls = '<button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-return-action="next">Jag andades ut</button>';
    }

    if (state.currentStep === 'acute-2') {
      stepHtml = `
        <div class="grounding-step active">
          <div class="step-content">
            <h3>Det är okej att det tar plats</h3>
            <p class="body-text">Tankar om det som hänt, oro för det som kan hända – eller båda på en gång. Det är vanligare än du tror.</p>
            <p class="body-text">Du behöver inte förstå varför just nu. Det räcker att märka att något tar plats.</p>
            <div class="insight-box" style="margin-top:4px">
              <p>Det här verktyget hjälper dig inte att lösa det – det hjälper dig att lägga ner det en stund.</p>
            </div>
            <button class="worry-nudge" style="margin-top:14px" type="button" data-return-toggle-worry="true">
              <span>⏰</span>
              <div>
                <strong>Handlar det mest om oro?</strong>
                <p>Tryck här så anpassar vi stegen efter det.</p>
              </div>
              <span class="arrow">${state.worryMode ? '✓' : '›'}</span>
            </button>
          </div>
        </div>
      `;
      controls = '<button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-return-action="next">Jag är redo att fortsätta</button><button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="back">Tillbaka</button><button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="restart">Börja om</button>';
    }

    if (state.currentStep === 'acute-defusion') {
      stepHtml = `
        <div class="grounding-step active">
          <div class="step-content">
            <h3>Skapa lite avstånd till tanken</h3>
            <p class="body-text">När en tanke tar över känns det som att den <em>är</em> sann, som att den <em>är</em> du. Men tanken är inte verkligheten – det är en signal hjärnan skickar.</p>
            <p class="body-text">Du behöver inte argumentera bort den. Det räcker att märka den.</p>
            <div class="defusion-box">
              <p class="defusion-label">Säg tyst för dig själv:</p>
              <p class="defusion-phrase">"Jag märker att jag har tanken att&nbsp;…"</p>
              <p class="defusion-hint">Fyll i det som tar plats. Sedan – låt den passera förbi.</p>
            </div>
            <div class="insight-box">
              <p>Det är skillnad att <strong>ha</strong> en tanke och att <strong>tro på</strong> en tanke. Den kan finnas utan att den behöver styra.</p>
            </div>
            ${state.worryMode ? '<div style="margin-top:14px"><button class="worry-nudge" type="button" data-return-go-worry="true"><span>⏰</span><div><strong>Vill du ge oron en egen tid?</strong><p>Schemalägg den – och låt resten av dagen vara fri.</p></div><span class="arrow">›</span></button></div>' : ''}
          </div>
        </div>
      `;
      controls = '<button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-return-action="next">Jag märkte tanken</button><button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="back">Tillbaka</button><button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="restart">Börja om</button>';
    }

    if (state.currentStep === 'acute-worry') {
      const times = ['18:00', '19:00', '20:00', '21:00'];
      stepHtml = `
        <div class="grounding-step active">
          <div class="step-content">
            <h3>Ge oron en egen tid</h3>
            <p class="body-text">Hjärnan behöver veta att oron inte glöms bort – bara skjuts upp. Skriv ner vad du oroar dig för just nu, så slipper hjärnan hålla i det hela dagen.</p>
            <textarea class="worry-textarea" placeholder="Vad oroar dig? Skriv det här…" data-return-worry-text="acute">${state.acuteWorryText || ''}</textarea>
            <p class="emphasis" style="margin: 16px 0 10px">När ska oron få komma?</p>
            <div class="time-picker-wrap">${times.map((time) => `<button class="time-slot ${state.selectedAcuteTime === time ? 'selected' : ''}" type="button" data-return-time="acute" data-return-time-value="${time}">${time}</button>`).join('')}</div>
            <button class="reminder-toggle" type="button" data-return-reminder="acute">
              <div>
                <strong>Påminn mig kl <span>${state.selectedAcuteTime}</span></strong>
                <p>En mild signal när orotiden är här.</p>
              </div>
              <div class="toggle-switch ${state.acuteReminderOn ? 'on' : ''}"><div class="toggle-knob"></div></div>
            </button>
            <div class="insight-box" style="margin-top:14px">
              <p>När oron dyker upp innan dess – påminn dig: <em>"Klockan 20 får du all min uppmärksamhet."</em></p>
            </div>
          </div>
        </div>
      `;
      controls = '<button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-return-action="next">Oron är parkerad – fortsätt</button><button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="back">Tillbaka</button><button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="restart">Börja om</button>';
    }

    if (state.currentStep === 'acute-3') {
      const cfg = [
        ['3', 'Hitta 3 saker du kan se', 'Titta runt dig. Nämn dem tyst.', 'Tryck när du hittat tre saker →'],
        ['2', 'Känn 2 ställen där kroppen har stöd', 'Stolen, golvet, kudden. Stanna en stund.', 'Tryck när du känt →'],
        ['1', 'Andas ut lite långsammare', 'Bara en gång. Lite längre än vanligt.', 'Tryck när du andades →'],
      ];
      const idx = state.groundingCompleted.findIndex((done) => !done);
      const active = idx === -1 ? 2 : idx;
      stepHtml = `
        <div class="grounding-step active">
          <div class="step-content">
            <h3>Låt kroppen hjälpa tankarna</h3>
            <p class="body-text">En sak i taget. Tryck när du gjort varje del.</p>
            ${cfg.map((item, i) => `
              <div style="margin-top:16px; ${i === active ? '' : 'display:none;'}">
                <div class="big-instruction">
                  <div class="big-number">${item[0]}</div>
                  <p class="action">${item[1]}</p>
                  <p class="hint">${item[2]}</p>
                </div>
                <button class="tap-area ${state.groundingCompleted[i] ? 'done' : ''}" type="button" data-return-ground-step="${i}">${state.groundingCompleted[i] ? '✓ Gjort' : item[3]}</button>
              </div>
            `).join('')}
            <div class="mini-progress">
              ${[0, 1, 2].map((i) => `<div class="mini-dot ${state.groundingCompleted[i] ? 'done' : i === active ? 'active' : ''}"></div>`).join('')}
            </div>
          </div>
        </div>
      `;
      controls = '<button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="back">Tillbaka</button><button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="restart">Börja om</button>';
    }

    if (state.currentStep === 'acute-4') {
      stepHtml = `
        <div class="completion">
          <div class="check-icon">🌿</div>
          <h2>Lite mer här och nu</h2>
          <p>Bra gjort. Du tog ett steg tillbaka till det som finns just nu.</p>
          <p style="font-size:13px; color: var(--text-muted)">Du kan komma tillbaka hit när tankarna drar iväg igen.</p>
        </div>
      `;
      controls = '<button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-return-action="complete">Klar</button><button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="restart-acute-flow">Gör om</button>';
    }

    container.innerHTML = `
      <article class="micro-card" data-dim="present">
        <div class="mode-label"><span class="mode-dot acute"></span> Akut läge</div>
        <div class="micro-tool-card return-to-now-card return-ref-shell" style="margin-top:8px;">
          <div class="tool-header">
            <div class="tool-badge">⏱ Tillbaka till nuet</div>
            <h1>${title}</h1>
            <p class="subtitle">${subtitle}</p>
          </div>
          <div class="progress-wrap">
            <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
          </div>
          ${stepHtml}
          <div class="thought-catcher-actions">${controls}</div>
        </div>
      </article>
    `;
    return;
  }

  const preventiveMenu = `
    <div class="grounding-step active" id="p-step-1">
      <div class="reflection-prompt">
        <h3>Vad vill du öva på?</h3>
        <p>Du väljer själv hur djupt du vill gå idag.</p>
        <ul class="pattern-list">
          <li class="pattern-item" data-return-preventive="body"><span class="pi-icon">🧘</span><div><strong>Kroppsskanning</strong><br><span style="color:var(--text-muted); font-size:13px">Känn efter var du bär spänning just nu</span></div></li>
          <li class="pattern-item" data-return-preventive="anchor"><span class="pi-icon">⚓</span><div><strong>Hitta ett ankare</strong><br><span style="color:var(--text-muted); font-size:13px">Välj en sak att komma tillbaka till när tankarna drar</span></div></li>
          <li class="pattern-item" data-return-preventive="pattern"><span class="pi-icon">🔍</span><div><strong>Förstå dina tankemönster</strong><br><span style="color:var(--text-muted); font-size:13px">När tenderar tankarna att dra iväg för dig?</span></div></li>
          <li class="pattern-item" data-return-preventive="defusion-learn"><span class="pi-icon">🌫</span><div><strong>Öva på att skapa avstånd</strong><br><span style="color:var(--text-muted); font-size:13px">Lär dig skilja på att ha en tanke och tro på den</span></div></li>
          <li class="pattern-item" data-return-preventive="worry-plan"><span class="pi-icon">⏰</span><div><strong>Schemalägg din oro</strong><br><span style="color:var(--text-muted); font-size:13px">Ge oron en tid – och låt resten av dagen vara fri</span></div></li>
        </ul>
      </div>
    </div>
  `;

  const prevSteps = {
    body: `<div class="step-content"><h3>Kroppsskanning</h3><p class="body-text">Vi börjar uppifrån. Stanna vid varje del tills du märkt om det finns spänning där.</p><div class="chips" style="flex-direction:column; gap:10px; margin-top:12px">${['😮‍💨 Axlar och nacke', '🫁 Bröstet – andningen', '🫃 Magen – en knut?', '🦵 Ben och fötter – mark'].map((label) => `<button class="chip ${state.preventiveBodySelections.includes(label) ? 'selected' : ''}" style="text-align:left; border-radius:10px; padding:12px 16px" type="button" data-return-body-chip="${label}">${label}</button>`).join('')}</div><p class="body-text" style="margin-top:16px">Det räcker att märka det. Du behöver inte ändra något.</p></div>`,
    anchor: '<div class="step-content"><h3>Hitta ditt ankare</h3><p class="body-text">Ett ankare är något konkret du kan komma tillbaka till när tankarna drar iväg. Det fungerar bäst om det är något fysiskt och nära – ett rum du trivs i, en person vars röst lugnar dig, känslan av att vara ute i naturen.</p><p class="body-text">Ankaret behöver inte vara storslaget. Det ska vara genuint ditt.</p><div class="defusion-box"><p class="defusion-label">Tänk efter:</p><p class="defusion-phrase" style="font-size:16px">Var befinner jag mig när jag känner mig mest lugn?</p></div><div class="insight-box"><p>Nästa gång tankarna drar – stanna en sekund och föreställ dig platsen, personen eller känslan. Det räcker.</p></div></div>',
    pattern: '<div class="step-content"><h3>Lär känna dina mönster</h3><p class="body-text">Hjärnan drar iväg av en anledning – inte slumpmässigt. För många händer det när det är tyst, när de ska sova, eller efter en konflikt. För andra utan synlig anledning alls.</p><p class="body-text">Att förstå sitt mönster förändrar inte tanken – men det gör det lättare att märka: <em>"Ah, det är det här igen."</em> Den insikten skapar lite avstånd i sig.</p><div class="defusion-box"><p class="defusion-label">Tänk efter:</p><p class="defusion-phrase" style="font-size:16px">När brukar mina tankar vara svårast att lämna?</p></div><div class="insight-box"><p>Du behöver inte ha svaret nu. Bara hålla frågan öppen – svaret brukar komma av sig självt.</p></div></div>',
    'defusion-learn': '<div class="step-content"><h3>Skapa avstånd till tanken</h3><p class="body-text">En negativ tanke behöver du varken argumentera bort eller lösa. Du kan bara notera att den finns.</p><div class="defusion-box"><p class="defusion-label">Tänk på en tanke som ofta stör dig. Säg sedan:</p><p class="defusion-phrase">"Jag märker att jag har tanken att&nbsp;…"</p></div><div class="insight-box"><p>Det är skillnad att <strong>ha</strong> en tanke och att <strong>tro på</strong> en tanke. Tanken kan finnas utan att den behöver styra.</p></div><p class="body-text" style="margin-top:14px">Öva det några gånger idag – varje gång en jobbig tanke dyker upp.</p></div>',
    'worry-plan': `<div class="step-content"><h3>Schemalägg din oro</h3><p class="body-text">Oro som skjuts undan tenderar att komma tillbaka starkare. Men oro som får en dedikerad tid – den lär sig vänta.</p><p class="body-text">Tekniken är enkel: bestäm en tid varje dag då du aktivt tillåter dig att oroa dig. När oron dyker upp annars, notera den och påminn dig: <em>"Det får komma då."</em></p><div class="insight-box"><p><strong>På orotiden:</strong> Skriv ner oron. Granska den. Fråga dig om den är lösbar just nu. Sedan avslutar du – oavsett om den är löst eller inte. Det handlar inte om att lösa, utan om att ge den plats.</p></div><p class="emphasis" style="margin: 16px 0 10px">Välj din orotid:</p><div class="time-picker-wrap">${['17:00', '18:00', '19:00', '20:00', '21:00'].map((time) => `<button class="time-slot ${state.selectedPrevTime === time ? 'selected' : ''}" type="button" data-return-time="prev" data-return-time-value="${time}">${time}</button>`).join('')}</div><button class="reminder-toggle" type="button" data-return-reminder="prev" style="margin-top:14px"><div><strong>Påminn mig kl <span>${state.selectedPrevTime}</span></strong><p>En daglig signal när orotiden börjar.</p></div><div class="toggle-switch ${state.prevReminderOn ? 'on' : ''}"><div class="toggle-knob"></div></div></button></div>`,
  };

  let inner = preventiveMenu;
  let controls = '';
  if (state.currentStep === 'preventive-exercise' && state.preventiveExercise) {
    inner = prevSteps[state.preventiveExercise] || preventiveMenu;
    const labels = {
      body: 'Jag har känt efter',
      anchor: 'Jag vet mitt ankare',
      pattern: 'Det känns igen',
      'defusion-learn': 'Jag förstår – jag provar',
      'worry-plan': 'Orotid satt',
    };
    controls = `<button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-return-action="next">${labels[state.preventiveExercise] || 'Klar'}</button><button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="back">Välj annan övning</button><button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="restart">Börja om</button>`;
  }

  if (state.currentStep === 'preventive-done') {
    inner = '<div class="completion"><div class="check-icon">🌱</div><h2>Bra jobbat</h2><p>Varje gång du övar blir det lite lättare att hitta tillbaka – även när det är svårt.</p></div>';
    controls = '<button class="neo-btn neo-btn--filled neo-btn--cta" type="button" data-return-action="complete">Klar</button><button class="neo-btn neo-btn--outline neo-btn--cta" type="button" data-return-action="back">Gör en till övning</button>';
  }

  container.innerHTML = `
    <article class="micro-card" data-dim="present">
      <div class="mode-label"><span class="mode-dot preventive"></span> Förebyggande</div>
      <div class="micro-tool-card return-to-now-card return-ref-shell" style="margin-top:8px;">
        <div class="tool-header">
          <div class="tool-badge">⏱ Tillbaka till nuet</div>
          <h1>Öva på nuet</h1>
          <p class="subtitle">Välj vad du vill utforska idag.</p>
        </div>
        ${inner}
        <div class="thought-catcher-actions">${controls}</div>
      </div>
    </article>
  `;
}

function canAdvanceReturnToNowStep() {
  const state = toolsState.returnToNow;
  if (state.currentStep === 'track-choice') return Boolean(state.selectedTrack);
  if (state.currentStep === 'acute-3') return state.groundingCompleted.every(Boolean);
  if (state.currentStep === 'preventive-menu') return false;
  if (state.currentStep === 'preventive-exercise') return Boolean(state.preventiveExercise);
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
    }

    const trackCard = target.closest('[data-return-track]');
    if (trackCard instanceof HTMLElement) {
      const selectedTrack = trackCard.dataset.returnTrack || '';
      toolsState.returnToNow.selectedTrack = selectedTrack;

      if (selectedTrack === 'acute') {
        goToReturnToNowStep('acute-1');
      } else if (selectedTrack === 'preventive') {
        goToReturnToNowStep('preventive-menu');
      }

      renderReturnToNowTool();
      return;
    }


    const worryToggle = target.closest('[data-return-toggle-worry]');
    if (worryToggle instanceof HTMLElement) {
      toolsState.returnToNow.worryMode = !toolsState.returnToNow.worryMode;
      renderReturnToNowTool();
      return;
    }

    const goWorry = target.closest('[data-return-go-worry]');
    if (goWorry instanceof HTMLElement) {
      goToReturnToNowStep('acute-worry');
      renderReturnToNowTool();
      return;
    }

    const timeButton = target.closest('[data-return-time]');
    if (timeButton instanceof HTMLElement) {
      const context = timeButton.dataset.returnTime;
      const value = timeButton.dataset.returnTimeValue || '20:00';
      if (context === 'acute') toolsState.returnToNow.selectedAcuteTime = value;
      if (context === 'prev') toolsState.returnToNow.selectedPrevTime = value;
      renderReturnToNowTool();
      return;
    }

    const reminderToggle = target.closest('[data-return-reminder]');
    if (reminderToggle instanceof HTMLElement) {
      const context = reminderToggle.dataset.returnReminder;
      if (context === 'acute') toolsState.returnToNow.acuteReminderOn = !toolsState.returnToNow.acuteReminderOn;
      if (context === 'prev') toolsState.returnToNow.prevReminderOn = !toolsState.returnToNow.prevReminderOn;
      renderReturnToNowTool();
      return;
    }

    const groundStepButton = target.closest('[data-return-ground-step]');
    if (groundStepButton instanceof HTMLElement) {
      const index = Number(groundStepButton.dataset.returnGroundStep);
      if (!Number.isNaN(index)) {
        toolsState.returnToNow.groundingCompleted[index] = true;
        if (toolsState.returnToNow.groundingCompleted.every(Boolean)) {
          goToReturnToNowStep('acute-4');
        }
      }
      renderReturnToNowTool();
      return;
    }

    const preventiveChoice = target.closest('[data-return-preventive]');
    if (preventiveChoice instanceof HTMLElement) {
      toolsState.returnToNow.preventiveExercise = preventiveChoice.dataset.returnPreventive || '';
      goToReturnToNowStep('preventive-exercise');
      renderReturnToNowTool();
      return;
    }

    const bodyChip = target.closest('[data-return-body-chip]');
    if (bodyChip instanceof HTMLElement) {
      const value = bodyChip.dataset.returnBodyChip || '';
      const list = toolsState.returnToNow.preventiveBodySelections;
      if (list.includes(value)) {
        toolsState.returnToNow.preventiveBodySelections = list.filter((item) => item !== value);
      } else {
        toolsState.returnToNow.preventiveBodySelections = [...list, value];
      }
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

    const state = toolsState.returnToNow;

    if (returnAction === 'complete') {
      resetReturnToNow();
      setToolsView('home');
      renderReturnToNowTool();
      return;
    }

    if (returnAction === 'restart-acute-flow') {
      state.currentStep = 'acute-1';
      state.stepHistory = ['track-choice', 'acute-1'];
      state.groundingCompleted = [false, false, false];
      renderReturnToNowTool();
      return;
    }

    if (!canAdvanceReturnToNowStep()) return;

    if (state.currentStep === 'track-choice') {
      if (state.selectedTrack === 'acute') {
        goToReturnToNowStep('acute-1');
      } else {
        goToReturnToNowStep('preventive-menu');
      }
    } else if (state.currentStep === 'acute-1') {
      goToReturnToNowStep('acute-2');
    } else if (state.currentStep === 'acute-2') {
      goToReturnToNowStep('acute-defusion');
    } else if (state.currentStep === 'acute-defusion') {
      goToReturnToNowStep('acute-3');
      state.groundingCompleted = [false, false, false];
    } else if (state.currentStep === 'acute-worry') {
      goToReturnToNowStep('acute-3');
      state.groundingCompleted = [false, false, false];
    } else if (state.currentStep === 'preventive-exercise') {
      goToReturnToNowStep('preventive-done');
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

    if (target.matches('[data-return-worry-text="acute"]')) {
      toolsState.returnToNow.acuteWorryText = target.value;
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
