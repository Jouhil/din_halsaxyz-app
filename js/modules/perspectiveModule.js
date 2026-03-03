import { init as initGratitudeModule } from './gratitudeModule.js';
import { init as initPeppModule } from './peppModule.js';

let initialized = false;

function setSegment(segment = 'gratitude') {
  const gratitudeSection = document.getElementById('perspective-gratitude');
  const peppSection = document.getElementById('perspective-pepp');
  const gratitudeChip = document.querySelector('[data-perspective="gratitude"]');
  const peppChip = document.querySelector('[data-perspective="pepp"]');

  if (!gratitudeSection || !peppSection || !gratitudeChip || !peppChip) return;

  const showGratitude = segment !== 'pepp';
  gratitudeSection.style.display = showGratitude ? '' : 'none';
  peppSection.style.display = showGratitude ? 'none' : '';

  gratitudeChip.classList.toggle('sel', showGratitude);
  peppChip.classList.toggle('sel', !showGratitude);
}

export function init() {
  if (initialized) return;
  initialized = true;

  initGratitudeModule();
  initPeppModule();

  document.querySelectorAll('[data-perspective]').forEach((chip) => {
    chip.addEventListener('click', () => setSegment(chip.dataset.perspective));
  });

  setSegment('gratitude');
}

export function showGratitude() {
  setSegment('gratitude');
}

export function showPepp() {
  setSegment('pepp');
}
