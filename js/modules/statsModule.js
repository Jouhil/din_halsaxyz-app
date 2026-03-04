import { loadJSON } from '../storage.js';

export function init() {
  return true;
}

export function render() {
  const logs = loadJSON('dailyFlowLogs', []);
  const latest = logs.slice(-7);
  const deltaEl = document.getElementById('st-delta');
  if (!deltaEl) return;
  const deltas = latest.map((log) => {
    if (Number(log.flowMinutes || log.sessionLengthMin) === 8 && Number.isFinite(log?.after?.intensityBefore) && Number.isFinite(log?.after?.intensityAfter)) {
      return `8m ${log.after.intensityBefore}→${log.after.intensityAfter}`;
    }
    if (Number(log.flowMinutes || log.sessionLengthMin) === 3 && log.focusNeed) {
      return `3m ${log.focusNeed} · ★${Number(log.stars || 0)}`;
    }
    if (log.focusNeed && Number.isFinite(log?.pre?.[log.focusNeed]) && Number.isFinite(log?.after?.afterSliderNeedVal)) {
      return `3m ${log.focusNeed}: ${log.pre[log.focusNeed]}→${log.after.afterSliderNeedVal}`;
    }
    return null;
  }).filter(Boolean);
  deltaEl.textContent = deltas.join(' · ') || '–';
}
