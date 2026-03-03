export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
export function setText(selectorOrEl, text) {
  const el = typeof selectorOrEl === 'string' ? qs(selectorOrEl) : selectorOrEl;
  if (el) el.textContent = text;
}
export function setHTML(selectorOrEl, html) {
  const el = typeof selectorOrEl === 'string' ? qs(selectorOrEl) : selectorOrEl;
  if (el) el.innerHTML = html;
}
export function show(selectorOrEl, display = '') {
  const el = typeof selectorOrEl === 'string' ? qs(selectorOrEl) : selectorOrEl;
  if (el) el.style.display = display;
}
export function hide(selectorOrEl) {
  const el = typeof selectorOrEl === 'string' ? qs(selectorOrEl) : selectorOrEl;
  if (el) el.style.display = 'none';
}
