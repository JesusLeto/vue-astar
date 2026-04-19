# CLAUDE.md — vue-astar

## Project Purpose
A* pathfinding algorithm visualizer on a 50×28 grid. Users place barriers by clicking/dragging, then click "Старт" to watch the BFS expansion animate cell-by-cell until the shortest route is highlighted. After completion, "Сбросить" resets the board.

## Tech Stack
- **Vue 3** + Composition API (`<script setup lang="ts">`)
- **TypeScript** — strict, no `any`
- **Pinia** — state management
- **Tailwind CSS v3** — all layout, color, spacing
- **PrimeVue 4** with Aura theme (`cssLayer: false` to avoid Tailwind conflicts)
- **vite-svg-loader** — SVG files imported as Vue components via `?component`
- **Vite** — build tool

## Architecture
Modular structure under `src/modules/<feature>/`:

```
src/
  modules/
    board/
      components/     ← BoardView.vue, CellView.vue
      composables/    ← useMouseAction.ts
      stores/         ← useBoardStore.ts, useExpansionStore.ts
      services/       ← queue.service.ts
      types/          ← cell.types.ts, graph.types.ts, index.ts
      utils/          ← generateDefaultBoard.ts, delay.ts
      index.ts        ← barrel export (public API of the module)
  components/
    shared/           ← UiSvg.vue (shared UI)
    TheHeader.vue
  App.vue
  main.ts
  assets/
    icon/             ← start.svg, target.svg
    styles/           ← tailwind.css
```

External consumers import from the barrel: `import { BoardView, useExpansionStore } from "@/modules/board"`.

## Naming Conventions
- `useXxxStore.ts` — Pinia stores (`defineStore`)
- `useXxx.ts` — composables (`ref`, `computed`, no `defineStore`)
- `xxx.service.ts` — plain TypeScript classes/factories (e.g. `queue.service.ts`)

## Tailwind Guidelines
- Use Tailwind utilities for all layout, color, and spacing.
- `<style scoped>` blocks only for `@keyframes` and animation classes that can't be expressed as utilities (`barrier`, `expansion`, `route`, `with-animation`).
- Custom colors and grid sizes are defined in `tailwind.config.js`:
  - `border-table`, `grid-cols-board` (`repeat(50, 32px)`), `grid-rows-board` (`repeat(28, 32px)`)
- Dynamic cell type classes (`barrier`, `expansion`, `route`, `with-animation`) must be in the Tailwind safelist — they are set at runtime from TypeScript strings, not detectable by the content scanner.

## Domain Rules
- Grid is always **50 columns × 28 rows** — hardcoded, do not parameterize.
- `CellType = 'start' | 'target' | 'barrier' | 'route' | ''`
- `delay()` in `useExpansionStore` drives the step-by-step animation — do not remove.
- SVGs (`start`, `target`) are imported as Vue components via `?component` query in `UiSvg.vue`.
- Start cell default: `(0, 0)`, target cell default: `(40, 20)`.

## Commands
```bash
npm run dev          # dev server
npm run build        # type-check + production build
npm run build-only   # production build only
npm run type-check   # vue-tsc type check
npm run lint         # ESLint fix
```
