import { qs, qsa } from './ui/dom.js';

export function showTab(name, btn, hooks = {}) {
  qsa('.tab').forEach((t) => t.classList.remove('active'));
  const activeTab = qs(`#tab-${name}`);
  if (activeTab) activeTab.classList.add('active');

  qsa('.side-btn').forEach((b) => b.classList.remove('active'));
  const sideButton = qs(`#sb-${name}`);
  if (sideButton) sideButton.classList.add('active');

  qsa('.bnav-btn').forEach((b) => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (hooks.onTabChange) hooks.onTabChange(name);
}

export function initRouter(hooks = {}) {
  return {
    goToTab(name, btn) {
      showTab(name, btn, hooks);
    },
  };
}
