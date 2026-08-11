# Diaspro Viboard Guidelines & Rules

## UI & Design System Rules
- Always strictly follow the official color palette in `src/index.css`:
  - Canvas Background: `#1e1333`
  - Card Background: `#2b1c47`
  - Sidebar Purple: `#6B5887`
  - Lavender Accent: `#9D85C6`
  - Plum Accent: `#7A3F67`
  - Terracotta Accent: `#8F5A5A`
  - Warm Sand Accent: `#BC957D`
  - Sand Accent: `#E8D19E`
  - Blue Accent: `#A5C4DC`
  - Sage Accent: `#98A78A`
- Do NOT use generic indigo, dark blackish purples, or random gradients outside this palette.
- Do NOT use emojis anywhere in the UI or codebase. Always use clean Lucide React icons or official brand SVG components (`BrandIcons.jsx`).

## Official Icon Assets & Collection Link
- **Collection Source**: [SVGRepo - Responsive Flat Icons](https://www.svgrepo.com/collection/responsive-flat-icons/2)
- **Local Storage Path**: `src/assets/icons/` (e cartella di backup `aesteticvibe/`)
- All app icons should be sourced from this collection or rendered via `AestheticIcons.jsx`.

## Component & Hook Refactoring Rules
- **Guardia `window.electronAPI` Obbligatoria per Hook IPC**: Tutti i custom hook che interagiscono con il backend Electron devono racchiudere le chiamate IPC in guardie `if (window.electronAPI)` per garantire il funzionamento senza eccezioni in ambiente Web/Demo. Ogni custom hook IPC deve avere una suite di unit test Vitest dedicata (`// @vitest-environment jsdom` con mock di `window.electronAPI`).
- **Verifica Duale (`npm test` + `npm run build`)**: Dopo qualsiasi estrazione o refactoring di componenti e hook, eseguire sempre sia i test unitari (`npm test`) sia la build di produzione (`npm run build`). I test unitari isolati sugli hook non catturano errori di riferimento o import mancanti nel componente padre reale che non viene montato dai test unitari.

