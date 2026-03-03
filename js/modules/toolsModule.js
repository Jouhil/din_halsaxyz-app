import { init as initCalmModule } from './calmModule.js';
import { init as initHelpModule } from './helpModule.js';

let initialized = false;

export function init() {
  if (initialized) return;
  initialized = true;
  initCalmModule();
  initHelpModule();
}
