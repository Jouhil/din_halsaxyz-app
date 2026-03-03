import { qs, qsa } from './ui/dom.js';

const PRIMARY_TABS = ['checkin', 'tools', 'perspective', 'stats', 'settings'];
const TAB_ALIASES = {
  flow: 'checkin',
  dags: 'checkin',
  calm: 'tools',
  gratitude: 'perspective',
  pepp: 'perspective',
  inspire: 'perspective',
  help: 'tools',
};

function resolveTabName(name) {
  if (!name) return 'checkin';
  const normalized = String(name).toLowerCase();
  return TAB_ALIASES[normalized] || (PRIMARY_TABS.includes(normalized) ? normalized : 'checkin');
}

export function showTab(name, hooks = {}) {
  const resolvedName = resolveTabName(name);

  qsa('.tab').forEach((t) => t.classList.remove('active'));
  const activeTab = qs(`#tab-${resolvedName}`);
  if (activeTab) activeTab.classList.add('active');

  qsa('.side-btn').forEach((b) => b.classList.remove('active'));
  const sideButton = qs(`#sb-${resolvedName}`);
  if (sideButton) sideButton.classList.add('active');

  qsa('.bnav-btn').forEach((b) => b.classList.remove('active'));
  const navButtons = qsa(`[data-tab="${resolvedName}"]`);
  navButtons.forEach((button) => button.classList.add('active'));

  if (hooks.onTabChange) hooks.onTabChange(resolvedName, name);
  return resolvedName;
}

export function initRouter(hooks = {}) {
  return {
    goToTab(name) {
      return showTab(name, hooks);
    },
  };
}
