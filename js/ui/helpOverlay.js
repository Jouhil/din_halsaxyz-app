import { getGuideItems } from '../modules/helpModule.js';

const SNAP_RATIOS = {
  collapsed: 0.4,
  expanded: 0.85,
};

let overlayEl;
let panelEl;
let titleEl;
let bodyEl;
let headEl;
let handleEl;
let backdropEl;
let ctaToolsEl;
let boundRouter;
let lastFocusedEl = null;
let currentSource = '';

let isOpen = false;
let currentSnap = 'collapsed';
let currentHeight = 0;
let snapHeights = { collapsed: 0, expanded: 0 };
let dragState = null;
let bodyLockState = null;

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
  if (!isOpen) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeGuide();
    return;
  }
  trapFocus(event);
}

function updateSnapHeights() {
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  const expanded = Math.max(Math.round(vh * SNAP_RATIOS.expanded), 280);
  const collapsed = Math.max(Math.round(vh * SNAP_RATIOS.collapsed), 220);
  snapHeights = {
    collapsed: Math.min(collapsed, expanded),
    expanded,
  };
}

function setPanelHeight(nextHeight) {
  if (!panelEl) return;
  const clamped = Math.max(snapHeights.collapsed * 0.7, Math.min(nextHeight, snapHeights.expanded));
  currentHeight = clamped;
  panelEl.style.height = `${Math.round(clamped)}px`;
}

function setBackdropOpacityByHeight(height) {
  if (!backdropEl) return;
  const ratio = (height - snapHeights.collapsed) / Math.max(1, snapHeights.expanded - snapHeights.collapsed);
  const opacity = 0.75 + Math.max(0, Math.min(ratio, 1)) * 0.25;
  backdropEl.style.opacity = String(opacity);
}

function animateToSnap(targetSnap) {
  if (!panelEl) return;
  currentSnap = targetSnap;
  panelEl.style.transition = '';
  setPanelHeight(snapHeights[targetSnap]);
  setBackdropOpacityByHeight(snapHeights[targetSnap]);
}

function lockBodyScroll() {
  if (bodyLockState) return;
  const y = window.scrollY || window.pageYOffset || 0;
  bodyLockState = {
    scrollY: y,
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
    overflow: document.body.style.overflow,
  };
  document.body.style.position = 'fixed';
  document.body.style.top = `-${y}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  if (!bodyLockState) return;
  const { scrollY, position, top, width, overflow } = bodyLockState;
  document.body.style.position = position;
  document.body.style.top = top;
  document.body.style.width = width;
  document.body.style.overflow = overflow;
  window.scrollTo(0, scrollY);
  bodyLockState = null;
}

function canStartHeaderDrag() {
  return bodyEl?.scrollTop === 0;
}

function onDragStart(event) {
  if (!isOpen || !panelEl) return;

  const isHandle = handleEl?.contains(event.target);
  const isHead = headEl?.contains(event.target);
  const interactiveTarget = event.target.closest('button, a, input, select, textarea');
  if (interactiveTarget && !isHandle) return;
  if (!isHandle && !(isHead && canStartHeaderDrag())) return;

  dragState = {
    pointerId: event.pointerId,
    startY: event.clientY,
    startHeight: currentHeight,
    lastY: event.clientY,
    lastTime: event.timeStamp,
    velocityY: 0,
  };

  panelEl.style.transition = 'none';
  panelEl.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function onDragMove(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;

  const deltaY = event.clientY - dragState.startY;
  const rawHeight = dragState.startHeight - deltaY;
  const minDragHeight = snapHeights.collapsed * 0.7;
  const nextHeight = Math.max(minDragHeight, Math.min(rawHeight, snapHeights.expanded));
  setPanelHeight(nextHeight);
  setBackdropOpacityByHeight(nextHeight);

  const dt = Math.max(1, event.timeStamp - dragState.lastTime);
  dragState.velocityY = (event.clientY - dragState.lastY) / dt;
  dragState.lastY = event.clientY;
  dragState.lastTime = event.timeStamp;

  event.preventDefault();
}

function onDragEnd(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;

  const wasDraggedDown = dragState.startHeight - currentHeight > 0;
  const closeByHeight = currentHeight < snapHeights.collapsed * 0.85;
  const closeByVelocity = dragState.velocityY > 1.2 && wasDraggedDown;
  const midpoint = (snapHeights.collapsed + snapHeights.expanded) / 2;

  panelEl.style.transition = '';

  if (closeByHeight || closeByVelocity) {
    closeGuide();
  } else if (currentHeight >= midpoint) {
    animateToSnap('expanded');
  } else {
    animateToSnap('collapsed');
  }

  dragState = null;
}

function onViewportChange() {
  if (!isOpen) return;
  updateSnapHeights();
  const target = currentSnap === 'expanded' ? snapHeights.expanded : snapHeights.collapsed;
  setPanelHeight(target);
}

export function openGuide(params = {}) {
  if (!overlayEl || !panelEl) return;
  if (isOpen) {
    titleEl.textContent = params.title || 'Guide';
    currentSource = params.source || '';
    if (ctaToolsEl) {
      ctaToolsEl.textContent = currentSource === 'checkin' ? 'Stäng' : 'Gå till Verktyg';
      ctaToolsEl.classList.toggle('hidden', false);
    }
    renderGuideContent(params);
    animateToSnap('collapsed');
    return;
  }

  lastFocusedEl = document.activeElement;
  titleEl.textContent = params.title || 'Guide';
  currentSource = params.source || '';
  if (ctaToolsEl) {
    ctaToolsEl.textContent = currentSource === 'checkin' ? 'Stäng' : 'Gå till Verktyg';
    ctaToolsEl.classList.toggle('hidden', false);
  }
  renderGuideContent(params);
  bodyEl.scrollTop = 0;

  updateSnapHeights();
  currentSnap = 'collapsed';
  setPanelHeight(snapHeights.collapsed);

  overlayEl.classList.remove('hidden');
  overlayEl.classList.add('is-open');
  overlayEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('guide-open');
  lockBodyScroll();
  isOpen = true;

  requestAnimationFrame(() => {
    panelEl.focus();
  });
}

export function closeGuide() {
  if (!overlayEl || !isOpen) return;

  overlayEl.classList.remove('is-open');
  overlayEl.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('guide-open');
  isOpen = false;
  dragState = null;
  currentSource = '';

  window.setTimeout(() => {
    if (!isOpen) {
      overlayEl.classList.add('hidden');
      backdropEl.style.opacity = '';
    }
  }, 280);

  unlockBodyScroll();

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
  headEl = overlayEl.querySelector('.ovl-head');
  handleEl = overlayEl.querySelector('.ovl-handle');
  backdropEl = overlayEl.querySelector('.ovl-backdrop');
  ctaToolsEl = document.getElementById('ovlCtaTools');
  boundRouter = router;

  overlayEl.querySelectorAll('[data-ovl-close]').forEach((closeEl) => {
    closeEl.addEventListener('click', () => closeGuide());
  });

  panelEl.addEventListener('pointerdown', onDragStart);
  panelEl.addEventListener('pointermove', onDragMove);
  panelEl.addEventListener('pointerup', onDragEnd);
  panelEl.addEventListener('pointercancel', onDragEnd);

  if (ctaToolsEl) {
    ctaToolsEl.addEventListener('click', () => {
      if (currentSource === 'checkin') {
        closeGuide();
        return;
      }
      closeGuide();
      boundRouter?.goToTab('tools');
    });
  }

  window.addEventListener('resize', onViewportChange);
  document.addEventListener('keydown', onKeydown);
}
