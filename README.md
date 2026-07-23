# vue-astar

Interactive pathfinding visualizer built with Vue 3, TypeScript and Tailwind CSS v4. Draw walls and weights on a grid, drop a bomb waypoint, generate a maze, then watch eight different search algorithms explore the board cell by cell.

**Demo:** https://vue-path-searching.vercel.app/

---

## Contents

- [Features](#features)
- [Algorithms](#algorithms)
- [Maze patterns](#maze-patterns)
- [Controls](#controls)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Adding a new algorithm](#adding-a-new-algorithm)
- [Internationalization](#internationalization)
- [Styling](#styling)
- [AI agent scaffolding](#ai-agent-scaffolding)

---

## Features

- **Eight search algorithms** — weighted and unweighted, with and without a shortest-path guarantee.
- **Weighted cells** — paint cells with a traversal cost of `15` (`CELL_WEIGHT` in `src/modules/board/constants.ts`); weighted algorithms route around them, unweighted ones ignore weights entirely.
- **Bomb waypoint** — an optional intermediate target. The search runs as two consecutive segments (`start → bomb`, then `bomb → target`) and both are animated in sequence.
- **Six maze generators** — from random scatter to recursive division.
- **Live re-run** — drag the start, target or bomb cell after a search has finished and the path is recomputed instantly, without replaying the animation.
- **Adjustable board** — 10–80 columns and 5–40 rows (default 50 × 28).
- **Three visualization speeds** — fast (no delay), average (100 ms per visited cell), slow (500 ms). The final route always draws at 40 ms per cell.
- **Two languages** — Russian and English, selected by URL.

## Algorithms

All eight are defined in `src/modules/board/algorithms/search.ts` and registered in the `pathfindingAlgorithms` array. Each declares capability flags that drive the UI: selecting an unweighted algorithm clears any weights on the board, and selecting one that does not support the bomb removes it.

| Algorithm | Weighted | Guarantees shortest path | Bomb waypoint |
|---|:--:|:--:|:--:|
| Dijkstra's | ✅ | ✅ | ✅ |
| A* | ✅ | ✅ | ✅ |
| Greedy Best-first | ✅ | ❌ | ✅ |
| Swarm | ✅ | ❌ | ✅ |
| Convergent Swarm | ✅ | ❌ | ✅ |
| Bidirectional Swarm | ✅ | ❌ | ❌ |
| BFS | ❌ | ✅ | ✅ |
| DFS | ❌ | ❌ | ✅ |

BFS is the algorithm selected on load.

## Maze patterns

Pure generators in `src/modules/board/utils/maze-generators.ts`. Each returns a list of cells to fill, never touching the start, target or bomb. Applying a pattern clears any existing walls and weights first.

| Pattern | Produces |
|---|---|
| `randomWalls` | Randomly scattered walls |
| `randomWeights` | Randomly scattered weighted cells |
| `recursiveDivision` | Classic recursive-division maze |
| `verticalDivision` | Recursive division biased to vertical walls |
| `horizontalDivision` | Recursive division biased to horizontal walls |
| `stair` | Diagonal staircase pattern |

## Controls

| Action | How |
|---|---|
| Draw walls | Select the **Wall** tool, then press and drag across the grid |
| Draw weights | Select the **Weight** tool, or hold <kbd>W</kbd> while dragging |
| Erase cells | Select the **Eraser** tool, then drag |
| Move start / target / bomb | Press the cell and drag it to a new position |
| Add or remove the bomb | **Add bomb** / **Remove bomb** in the header |
| Clear the path only | **Clear path** — keeps walls and weights |
| Clear walls and weights | **Clear walls/weights** — keeps the path state |
| Reset everything | **Reset** — rebuilds the default board |
| Resize the board | The **Columns** and **Rows** inputs in the header |

Dragging a special cell after a completed search re-runs the search instantly, so you can explore how the route reacts to a moved endpoint.

## Getting started

Developed on Node.js 24 with npm 11. **npm is the only supported package manager** — the lockfile is `package-lock.json`; do not add `pnpm-lock.yaml`, `yarn.lock` or `bun.lockb`.

```bash
npm install
```

```bash
npm run dev
```

The dev server prints a local URL; the app redirects `/` to `/ru`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Runs `type-check` and `build-only` in parallel |
| `npm run build-only` | Production bundle into `dist/` |
| `npm run preview` | Serves the built bundle |
| `npm run type-check` | `vue-tsc --noEmit` over `tsconfig.app.json` |
| `npm run lint` | `oxlint src` |
| `npm run lint:fix` | `oxlint --fix src` |
| `npm run format` | `oxfmt --write "src/"` |
| `npm run format:check` | `oxfmt --check "src/"` |

The linter is **oxlint** and the formatter is **oxfmt** — there is no ESLint and no Prettier in this project. The formatting contract lives in `.oxfmtrc.json`: 4-space indent, single quotes, no semicolons, 120-column width, one HTML attribute per line. Both tools only cover `src/`.

Before considering a change done, run all four gates:

```bash
npm run type-check && npm run lint && npm run format:check && npm run build
```

## Project structure

```
src/
├── App.vue
├── main.ts
├── assets/
│   ├── icon/                    start.svg, target.svg — imported with ?component
│   └── styles/tailwind.css      @theme tokens (Tailwind v4 is CSS-first)
├── core/                        app shell, shared across modules
│   ├── components/
│   │   ├── the-header.vue       all board controls
│   │   └── ui/                  ui-button, ui-select, ui-svg
│   ├── i18n/                    index.ts + locales/{ru,en}.ts
│   ├── lib/                     is-equal.ts, utils.ts (cn helper)
│   ├── router/                  locale-prefixed routes
│   └── views/home-view.vue
└── modules/
    └── board/                   the feature module
        ├── algorithms/
        │   ├── algorithm.types.ts   PathfindingAlgorithm contract
        │   ├── search.ts            all eight implementations + registry
        │   ├── astar.algorithm.ts   re-export shim
        │   ├── bfs.algorithm.ts     re-export shim
        │   └── index.ts
        ├── components/          board-view.vue, cell-view.vue
        ├── composables/         use-mouse-action.ts, use-eraser-mode.ts
        ├── stores/              Pinia setup stores
        ├── types/               *.types.ts
        ├── utils/               delay.ts, generate-default-board.ts, maze-generators.ts
        └── index.ts             public API of the module
```

**Conventions:**

- Feature code lives under `src/modules/<feature>/`; anything reused by more than one module moves to `src/core/`.
- Every module exposes its public API through its `index.ts` barrel — external consumers import from `@/modules/board`, never from a deep path.
- File names are kebab-case: components `*.vue`, composables `use-*.ts`, stores `use-*-store.ts`, types `*.types.ts`.
- Pinia store ids are namespaced: `board:store`, `expansion:store`, `eraser:store`, `board-settings:store`.
- Local imports go through the `@/` alias, defined in `vite.config.ts` and mirrored in `tsconfig.app.json` and `tsconfig.json`.
- TypeScript `any` is not used anywhere.

## How it works

### The algorithm contract

Every algorithm implements one interface (`src/modules/board/algorithms/algorithm.types.ts`):

```ts
export interface PathfindingAlgorithm {
    id: PathfindingAlgorithmId
    label: string
    weighted: boolean
    guaranteesShortestPath: boolean
    supportsBomb: boolean
    run(cells: CellData[][], start: CoordsData, target: CoordsData): PathfindingResult
}

export interface PathfindingResult {
    found: boolean
    visited: CoordsData[]
    route: CoordsData[]
}
```

`run()` is **synchronous and pure with respect to the board** — it computes the whole search up front and returns the visit order and the resulting route. It never mutates cells and never awaits.

### The animation pipeline

Rendering is separated from searching. `use-expansion-store.ts` takes the result and walks it one cell at a time:

```ts
for (const coords of visited) {
    cell.isVisited = true
    cell.isExpansionProcess = true
    if (!instant) await delay(VISIT_DELAYS[speed.value])
}
```

That sequential `mutate → await delay()` loop **is** the animation. Batching the mutations, or replacing the loop with `Promise.all`, makes the board update in a single frame and the visualization disappears. The `instant` flag deliberately skips every delay — it is what makes the drag-to-re-run watcher feel immediate.

### State

| Store | Responsibility |
|---|---|
| `use-board-store` | The cell grid, walls, weights, special cells (start / target / bomb), maze application, reset |
| `use-expansion-store` | Selected algorithm, speed, running the search and animating it |
| `use-eraser-store` | The active tool: `wall`, `weight` or `eraser` |
| `use-board-settings-store` | Column and row counts, with `COLS_MIN`/`COLS_MAX`/`ROWS_MIN`/`ROWS_MAX` bounds |

## Adding a new algorithm

1. Implement the search in `src/modules/board/algorithms/search.ts` and export a `PathfindingAlgorithm` object with its capability flags.
2. Add its id to the `PathfindingAlgorithmId` union in `algorithm.types.ts`.
3. Append it to the `pathfindingAlgorithms` array — the header selector is built from that array, so an algorithm missing from it will not appear in the UI.
4. Re-export it from `algorithms/index.ts` and from the module barrel `src/modules/board/index.ts`.
5. Keep `run()` synchronous so the animation pipeline stays intact.

A step-by-step version of this recipe lives in `.claude/skills/add-algorithm/SKILL.md`.

## Internationalization

Routing is locale-prefixed. The only real route is `/:locale(ru|en)`; `/` and every unmatched path redirect to `/ru`. A `router.beforeEach` guard sets `i18n.global.locale` and `document.documentElement.lang` from the URL segment — so **switch languages with `router.push('/en')`, never by assigning the locale directly**.

`src/core/i18n/locales/ru.ts` and `en.ts` are plain sibling objects with no shared type, which means **a key missing from one file is not caught by `npm run type-check`**. Every new key must be added to both files manually, in the same position. Adding a third language requires three edits: extend the `Locale` union and `SUPPORTED_LOCALES` in `src/core/i18n/index.ts`, register the messages object there, and create `locales/<code>.ts`. The route pattern and the header's language selector derive from `SUPPORTED_LOCALES` automatically.

## Styling

Tailwind CSS v4 through `@tailwindcss/vite`, configured **CSS-first**. All theme tokens are declared in the `@theme` block of `src/assets/styles/tailwind.css`:

`--color-table`, `--color-cell-barrier`, `--color-cell-route`, `--color-cell-expansion-0`, `--color-cell-expansion-60`, `--color-cell-expansion-80`, `--color-cell-expansion-100`.

The root `tailwind.config.ts` holds only `{ content, plugins }` and, since the stylesheet has no `@config` directive, does not affect styling at all. There is no `safelist` — dynamic class names are stored as complete string literals in module-level `Record` tables (see `BASE_CLASSES` and `ANIMATION_CLASSES` in `cell-view.vue`) so Tailwind's scanner can find them. `<style scoped>` is reserved for `@keyframes` and their animation classes.

## AI agent scaffolding

The repository ships a Claude Code setup so coding agents work with the project's real conventions instead of guessing.

| Path | Purpose |
|---|---|
| `AGENTS.md` | Project rules. `CLAUDE.md` is a symlink to it, so every agent reads one source |
| `.claude/skills/` | `file-writer`, `add-algorithm`, `i18n-sync`, `verify-gates` |
| `.claude/agents/` | `vue-builder`, `algorithm-engineer`, `i18n-keeper`, `project-reviewer` |
| `.claude/settings.json` | Shared permissions; `settings.local.json` stays local and gitignored |
| `memory/` | Project knowledge base — architecture, conventions, domain and tooling notes, plus one memory file per subagent. Start at `memory/README.md` |
