# ARCHITECTURE

This document explains how the app is organized and how data moves through the system.

> Beginner note: this project is a **vanilla JavaScript single-page app** (no React/Vue build step). `index.html` loads `js/app.js`, and the app updates the DOM directly.

## 1) Folder structure

```text
/
├── data/
│   ├── library.v1.json
│   └── closing.v1.json
├── js/
│   ├── app.js
│   ├── router.js
│   ├── state.js
│   ├── storage.js
│   ├── data/
│   │   └── dataLoader.js
│   ├── engines/
│   │   ├── matchingEngine.js
│   │   └── rotationEngine.js
│   ├── flows/
│   │   └── checkinFlow.js
│   ├── modules/
│   │   ├── calmModule.js
│   │   ├── gratitudeModule.js
│   │   ├── helpModule.js
│   │   ├── peppModule.js
│   │   ├── perspectiveModule.js
│   │   ├── settingsModule.js
│   │   ├── statsModule.js
│   │   └── toolsModule.js
│   └── ui/
│       ├── animations.js
│       ├── components.js
│       ├── dom.js
│       └── helpOverlay.js
├── index.html
├── README.md
└── ARCHITECTURE.md
```

## 2) Short explanation of every folder

- `data/`  
  Static JSON libraries used by the app (content for gratitude, affirmations, micro tools, breathing sessions, closing messages, etc.).

- `js/`  
  All JavaScript source code.

- `js/data/`  
  Data-loading layer (fetch JSON + cache fallback in localStorage).

- `js/engines/`  
  Selection logic (“engines”), such as choosing primary need and rotating items to avoid repetition.

- `js/flows/`  
  End-to-end guided user flows. Right now, this contains the check-in flow controller.

- `js/modules/`  
  Feature modules for tabs/areas (tools, perspective, stats, settings, help). Some are currently placeholders that expose stable `init()`/`render()` APIs.

- `js/ui/`  
  UI helpers and overlay behavior (DOM utilities, help drawer/panel logic).

## 3) Short explanation of every main file

### Root files
- `index.html`  
  Main HTML shell, base CSS, all tab containers and buttons. It defines the app layout (sidebar, bottom nav, tab sections) and loads the JS modules.

- `README.md`  
  Minimal repository readme.

- `ARCHITECTURE.md`  
  This architecture guide.

### Data files
- `data/library.v1.json`  
  Main content library for gratitude prompts, affirmations, breathing sessions, micro tools, and CBT mini content.

- `data/closing.v1.json`  
  Closing-message library used at the end of sessions.

### Core app files
- `js/app.js`  
  Main orchestrator. Handles app initialization, theme/lock setup, module initialization, tab lifecycle behavior, library loading, and also contains legacy/global UI functions for breathing, help, history/export/import, etc.

- `js/router.js`  
  Tab router: resolves aliases and toggles active tab/button classes in desktop and mobile navigation.

- `js/state.js`  
  Shared in-memory state object (`state`) used across modules (theme, loaded libraries, help filters, check-in flow reference, etc.).

- `js/storage.js`  
  Small localStorage wrapper helpers for plain and JSON values.

### Data-loading and decision engines
- `js/data/dataLoader.js`  
  Fetches `library.v1.json` and `closing.v1.json`, caches successful responses to localStorage, and falls back to cached values when offline/fetch fails.

- `js/engines/matchingEngine.js`  
  Matching logic: choose a primary need from check-in values and pick mode-compatible entries.

- `js/engines/rotationEngine.js`  
  Rotation/history logic to avoid showing the same item repeatedly.

### Flow controller
- `js/flows/checkinFlow.js`  
  The modern check-in flow implementation. Builds multi-step UI, chooses focus/tool/closing text, handles timer behavior, writes completed logs to localStorage, and exposes `initCheckinFlow()` API.

### Feature modules
- `js/modules/toolsModule.js`  
  Initializes tools-related modules (calm + help).

- `js/modules/perspectiveModule.js`  
  Controls perspective segment switching between gratitude and pepp areas.

- `js/modules/helpModule.js`  
  Builds/queries searchable guide items (from help DOM + contextual generated entries).

- `js/modules/statsModule.js`  
  Reads `dailyFlowLogs` and renders short “latest deltas” stats in the stats view.

- `js/modules/settingsModule.js`  
  Placeholder module API for settings.

- `js/modules/calmModule.js`  
  Placeholder module API for calm tools.

- `js/modules/gratitudeModule.js`  
  Placeholder module API for gratitude.

- `js/modules/peppModule.js`  
  Placeholder module API for pepp.

### UI utility files
- `js/ui/dom.js`  
  Tiny DOM helper utilities (`qs`, `qsa`, set text/html, show/hide).

- `js/ui/helpOverlay.js`  
  Bottom-sheet style guide overlay (open/close, drag behavior, snap points, body scroll lock, resize handling).

- `js/ui/components.js`  
  Placeholder for shared component initialization.

- `js/ui/animations.js`  
  Placeholder for animation initialization.

## 4) Which files control specific areas

### Check-in flow
Primary controllers:
- `js/flows/checkinFlow.js` (new guided flow engine and rendering)
- `js/app.js` (bootstraps flow via `initCheckinFlow`, plus legacy flow helpers still present)

Supporting logic:
- `js/engines/matchingEngine.js` (need detection)
- `js/engines/rotationEngine.js` (rotation history)
- `js/storage.js` (save/load logs)

### Micro-tools
- `js/flows/checkinFlow.js` (in-file micro-tool catalog + rendering + timer)
- `data/library.v1.json` (also contains micro tool entries used by legacy flow path)
- `js/app.js` (legacy block-building references `dailyLib.micro_tools`)

### Navigation
- `index.html` (tab button markup)
- `js/router.js` (tab resolution + active tab toggling)
- `js/app.js` (`showTab`, tab-change side effects)

### Data loading
- `js/data/dataLoader.js` (fetch + cache + fallback)
- `data/library.v1.json`, `data/closing.v1.json` (source content)
- `js/app.js` (`loadLibraries()` integration into startup)

### UI components
- `index.html` (layout and styling)
- `js/ui/dom.js` (DOM helper utilities)
- `js/ui/helpOverlay.js` (interactive guide overlay)
- `js/modules/*` and `js/flows/checkinFlow.js` (feature-specific rendering)

## 5) How the application initializes (entry point)

Initialization sequence (high-level):

1. Browser loads `index.html`.
2. `index.html` loads `js/app.js` as the main script.
3. `js/app.js` immediately runs an async IIFE `(async function init(){ ... })()`.
4. Inside init, the app:
   - Applies theme and user settings,
   - Initializes lock/PIN UI,
   - Initializes feature modules,
   - Initializes the check-in flow API,
   - Loads data libraries (`library` + `closing`) from network/cache,
   - Renders initial tab-specific content.
5. Router and help overlay are initialized so tab clicks and guide drawer interactions work.

Beginner tip: there is no separate server-side startup logic in this repo. Startup is browser-side and happens when `app.js` executes.

## 6) How state is stored during the check-in flow

There are **two layers of state** used by check-in behavior:

### A) In-memory runtime state (resets on page reload)
- `js/flows/checkinFlow.js` creates a `flow` object (step, selected need/tool, slider values, reflection values, timer fields, stars, etc.).
- This object drives rendering and interaction while the flow is active.
- The module stores a reference in shared global state as `state.flowState = flow` for cross-module visibility.

### B) Persistent localStorage state (survives reload)
- `dailyFlowLogs`: appended when user saves/completes a check-in.
- `flowRotationHistory`: remembers recent picks/need selection to rotate suggestions.
- Additional app-wide keys (theme, lock settings, user custom lists, etc.) are managed in `js/app.js` and `js/storage.js`.

So: **current session UI = in-memory `flow` object**, while **history/analytics/rotation = localStorage JSON**.

---

## Visual flow diagram (main app logic)

```mermaid
flowchart TD
    A[index.html loaded] --> B[js/app.js executes]
    B --> C[init() async IIFE]

    C --> D[Apply theme + user toggles]
    C --> E[Init lock/PIN]
    C --> F[Init feature modules]
    C --> G[Init checkin flow API]
    C --> H[Load JSON libraries via dataLoader]
    C --> I[Init router + help overlay]

    I --> J{User selects tab}
    J -->|checkin| K[checkinFlow.render()]
    J -->|tools| L[tools/help render]
    J -->|perspective| M[gratitude/pepp render]
    J -->|stats| N[read dailyFlowLogs + render]
    J -->|settings| O[settings/list render]

    K --> P[User picks 3m or 8m flow]
    P --> Q[Pre-check sliders]
    Q --> R[Need detection via matchingEngine]
    R --> S[Pick rotated tool/feedback/closing]
    S --> T[Run tool timer + reflection steps]
    T --> U[Save log to localStorage dailyFlowLogs]
    U --> V[Show completion + reset flow state]
```

---

## Beginner-oriented notes

- The app is currently a mix of:
  - a newer modular check-in flow (`js/flows/checkinFlow.js`), and
  - legacy global functions still in `js/app.js`.
- If you extend behavior, prefer adding logic to dedicated modules (`flows/`, `modules/`, `engines/`) and keep `app.js` as orchestration.
- LocalStorage is the main persistence mechanism; there is no backend API in this repository.
