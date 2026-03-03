import { getGuideItems } from '../modules/helpModule.js';

let overlayEl;
let panelEl;
let titleEl;
let bodyEl;
let ctaToolsEl;
let handleEl;
let headerEl;
let boundRouter;
let lastFocusedEl = null;
let isOpen = false;
let currentSnap = 'collapsed';
let collapsedHeight = 0;
let expandedHeight = 0;
let currentHeight = 0;

const dragState = {
  active: false,
  pointerId: null,
  startY: 0,
  startHeight: 0,
  lastY: 0,
  lastTime: 0,
  velocity: 0,
};

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
  if (!isOpen || overlayEl?.classList.contains('hidden')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeGuide();
    return;
  }
  trapFocus(event);
}

function computeSnapHeights() {
  const vh = window.innerHeight || document.documentElement.clientHeight || 800;
  collapsedHeight = Math.round(vh * 0.4);
  expandedHeight = Math.round(vh * 0.85);
}

function updateBackdropForHeight(heightPx) {
  const openness = (heightPx - collapsedHeight * 0.7) / (expandedHeight - collapsedHeight * 0.7);
  const alpha = Math.max(0, Math.min(1, openness));
  overlayEl.style.setProperty('--ovl-backdrop-alpha', `${0.28 + alpha * 0.14}`);
}

function setSheetHeight(heightPx, { allowBelowCollapsed = false } = {}) {
  const minHeight = allowBelowCollapsed ? collapsedHeight * 0.7 : collapsedHeight;
  currentHeight = Math.max(minHeight, Math.min(expandedHeight, Math.round(heightPx)));
  panelEl.style.height = `${currentHeight}px`;
  updateBackdropForHeight(currentHeight);
}

function snapTo(snapName) {
  currentSnap = snapName === 'expanded' ? 'expanded' : 'collapsed';
  const target = currentSnap === 'expanded' ? expandedHeight : collapsedHeight;
  setSheetHeight(target);
}

function shouldStartHeaderDrag() {
  return bodyEl?.scrollTop === 0;
}

function onDragStart(event) {
  if (!isOpen || !panelEl) return;
  if (event.target.closest('button, a, input, select, textarea')) return;

  const fromHandle = !!event.target.closest('.ovl-handle');
  const fromHeader = !!event.target.closest('.ovl-head');
  if (!fromHandle && !(fromHeader && shouldStartHeaderDrag())) return;

  dragState.active = true;
  dragState.pointerId = event.pointerId;
  dragState.startY = event.clientY;
  dragState.startHeight = currentHeight;
  dragState.lastY = event.clientY;
  dragState.lastTime = event.timeStamp;
  dragState.velocity = 0;

  panelEl.classList.add('dragging');
  panelEl.setPointerCapture?.(event.pointerId);
}

function onDragMove(event) {
  if (!dragState.active || dragState.pointerId !== event.pointerId) return;

  const deltaY = event.clientY - dragState.startY;
  const nextHeight = dragState.startHeight - deltaY;

  const dt = Math.max(1, event.timeStamp - dragState.lastTime);
  dragState.velocity = (event.clientY - dragState.lastY) / dt;
  dragState.lastY = event.clientY;
  dragState.lastTime = event.timeStamp;

  setSheetHeight(nextHeight, { allowBelowCollapsed: true });
  event.preventDefault();
}

function finishDrag(event) {
  if (!dragState.active || dragState.pointerId !== event.pointerId) return;

  panelEl.classList.remove('dragging');
  panelEl.releasePointerCapture?.(event.pointerId);

  const heightRatio = currentHeight / collapsedHeight;
  const pulledDown = dragState.startHeight - currentHeight > collapsedHeight * 0.08;
  const flingDown = dragState.velocity > 0.9;

  if (heightRatio < 0.85 || (pulledDown && currentHeight <= collapsedHeight * 0.95) || flingDown) {
    closeGuide();
  } else {
    const midpoint = (collapsedHeight + expandedHeight) / 2;
    snapTo(currentHeight >= midpoint ? 'expanded' : 'collapsed');
  }

  dragState.active = false;
  dragState.pointerId = null;
}

function onResize() {
  computeSnapHeights();
  if (!isOpen || !panelEl) return;
  snapTo(currentSnap);
}

export function openGuide(params = {}) {
  if (!overlayEl || !panelEl) return;

  computeSnapHeights();
  panelEl.classList.remove('dragging');
  snapTo('collapsed');

  lastFocusedEl = document.activeElement;
  titleEl.textContent = params.title || 'Guide';
  renderGuideContent(params);

  isOpen = true;
  overlayEl.classList.remove('hidden');
  overlayEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('guide-open');

  requestAnimationFrame(() => {
    panelEl.focus();
  });
}

export function closeGuide() {
  if (!overlayEl) return;
  isOpen = false;
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
  handleEl = overlayEl.querySelector('.ovl-handle');
  headerEl = overlayEl.querySelector('.ovl-head');
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

  handleEl?.addEventListener('pointerdown', onDragStart);
  headerEl?.addEventListener('pointerdown', onDragStart);
  panelEl?.addEventListener('pointermove', onDragMove);
  panelEl?.addEventListener('pointerup', finishDrag);
  panelEl?.addEventListener('pointercancel', finishDrag);

  document.addEventListener('keydown', onKeydown);
  window.addEventListener('resize', onResize);
}
