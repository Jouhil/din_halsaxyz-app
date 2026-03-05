---
# Hälsa App — Master Prompt (Project Context)

Du arbetar i ett modulärt webbrepo för en mental wellbeing / check-in app.

## Syfte
Appen guidar användaren genom korta sessioner (t.ex. 3 eller 8 minuter) med reflektion, verktyg och avslutande meddelande.

## Arkitektur (översikt)
- `index.html` = appens UI-skal (layout, tabs, containers)
- `js/app.js` = init/orchestrering (startar moduler, router, laddar bibliotek, initierar check-in)
- `js/router.js` = tab-routing (aktiverar rätt vy och knappar)
- `js/state.js` = delad runtime state i minnet
- `js/storage.js` = localStorage helpers
- `js/data/dataLoader.js` = laddar JSON (network + cache fallback)
- `js/flows/checkinFlow.js` = check-in flöde (steg, UI, timer, loggar, avslut)
- `js/engines/*` = beslutslogik (matching/rotation)
- `js/modules/*` = featureområden (tools, stats, settings, help, perspective)
- `js/ui/*` = UI helpers (DOM utilities, overlays, etc.)
- `data/*` = innehållsbibliotek (library + closing)

## Datafiler
- `data/library.v1.json` = innehåll (tacksamhet, pepp, micro tools, breathing, etc.)
- `data/closing.v1.json` = avslutsmeddelanden

## Persistens
All persistens är i `localStorage`:
- `dailyFlowLogs` = historik/loggar
- `flowRotationHistory` = rotation för att undvika repetition
- inställningar (theme/lock/etc.)

## Kodprinciper
- Lägg ny logik i `js/flows/`, `js/engines/` eller `js/modules/` — håll `app.js` som orchestrator.
- Skriv små, läsbara funktioner.
- Undvik att blanda DOM-rendering med beslutslogik.
- Ändra minimalt och bryt inte existerande flöden.

---
