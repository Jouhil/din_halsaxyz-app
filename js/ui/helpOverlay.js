import { getGuideItems } from '../modules/helpModule.js';

let overlayEl;
let panelEl;
let titleEl;
let bodyEl;
let ctaToolsEl;
let boundRouter;
let lastFocusedEl = null;

function stripToSentences(text = '', maxSentences = 2) {
  const cleaned = String(text).replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned.split(/(?<=[.!?])\s+/).slice(0, maxSentences).join(' ');
}

function cardTemplate(title, text) {
  return `<article class="ovl-card"><h3>${title}</h3><p>${text}</p></article>`;
}

function renderGuideContent(params = {}) {
  const items = getGuideItems({
    need: params.need,
    tag: params.tag,
    topic: params.topic,
    limit: 3,
  });

  if (!items.length) {
    bodyEl.innerHTML = cardTemplate('Tips', 'Du kan hitta fler verktyg i Verktyg-fliken.');
    return;
  }

  const cards = [];
  const first = items[0];
  cards.push(cardTemplate('Varför?', stripToSentences(first.text || first.detailText, 2) || 'Det här kan ge snabb lättnad just nu.'));
  cards.push(cardTemplate('Testa nu', stripToSentences(first.ctaAction || first.detailText, 2) || 'Ta ett långsamt andetag in i 4 sekunder och ut i 6 sekunder i en minut.'));

  const trapItem = items.find((item) => item.kind === 'trap' || item.title.toLowerCase().includes('tankefälla'));
  if (trapItem) {
    cards.push(cardTemplate('Vanlig tankefälla', stripToSentences(`${trapItem.title}. ${trapItem.text || trapItem.detailText}`, 2)));
  }

  bodyEl.innerHTML = cards.join('');
}

function trapFocus(event) {
  if (event.key !== 'Tab' || !panelEl) return;
  const focusables = panelEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) {
    event.preventDefault();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function onKeydown(event) {
  if (overlayEl?.classList.contains('hidden')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeGuide();
    return;
  }
  trapFocus(event);
}

export function openGuide(params = {}) {
  if (!overlayEl || !panelEl) return;

  lastFocusedEl = document.activeElement;
  titleEl.textContent = params.title || 'Guide';
  renderGuideContent(params);

  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('guide-open');

  requestAnimationFrame(() => {
    panelEl.focus();
  });
}

export function closeGuide() {
  if (!overlayEl) return;
  overlayEl.classList.add('hidden');
  overlayEl.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('guide-open');

  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
    lastFocusedEl.focus();
  }
}

export function initGuideOverlay({ router } = {}) {
  overlayEl = document.getElementById('guideOverlay');
  if (!overlayEl) return;

  panelEl = overlayEl.querySelector('.ovl-panel');
  titleEl = document.getElementById('ovlTitle');
  bodyEl = document.getElementById('ovlBody');
  ctaToolsEl = document.getElementById('ovlCtaTools');
  boundRouter = router;

  overlayEl.querySelectorAll('[data-ovl-close]').forEach((closeEl) => {
    closeEl.addEventListener('click', () => closeGuide());
  });

  if (ctaToolsEl) {
    ctaToolsEl.addEventListener('click', () => {
      closeGuide();
      boundRouter?.goToTab('tools');
    });
  }

  document.addEventListener('keydown', onKeydown);
}
