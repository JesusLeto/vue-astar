# Agent Instructions

`CLAUDE.md` is a symlink to this file. Keep it a symlink — this file is the single source of truth for every agent.

## Package Manager
- Use **npm**; the lockfile is `package-lock.json`.
- Do not add `pnpm-lock.yaml`, `yarn.lock`, or `bun.lockb`.

## Commands
| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev server | `npm run dev` |
| Type check | `npm run type-check` |
| Lint `src/` | `npm run lint` |
| Lint + autofix | `npm run lint:fix` |
| Format `src/` | `npm run format` |
| Format check | `npm run format:check` |
| Production build | `npm run build` |
| Build only (no type check) | `npm run build-only` |
| Preview build | `npm run preview` |

## Verification gates
Run in this order after any change under `src/`. All four must pass before the work is considered done.

1. `npm run type-check` — `vue-tsc --noEmit -p tsconfig.app.json --composite false`
2. `npm run lint` — oxlint over `src/`
3. `npm run format:check` — oxfmt over `src/`
4. `npm run build` — runs `type-check` + `build-only` in parallel

## Toolchain
- Vue 3 + `<script setup lang="ts">`, Pinia 3, vue-router 4, vue-i18n 9, Vite 8, TypeScript 6.
- Linter is **oxlint** (`.oxlintrc.json`), formatter is **oxfmt** (`.oxfmtrc.json`). There is no ESLint and no Prettier — do not add them or their config files.
- oxlint config: plugins `typescript`, `unicorn`, `oxc`, `vue`; categories `correctness: error`, `suspicious: warn`; `typescript/consistent-type-imports: error`; `unicorn/no-array-reverse: off`.
- oxfmt config: no semicolons, single quotes, 4-space indent, 120-char width, `trailingComma: es5`, `arrowParens: avoid`, `singleAttributePerLine: true`.
- Both scripts only cover `src/`. Root config files (`vite.config.ts`, `tsconfig*.json`) are outside the formatter's path — leave their tabs/double quotes alone.
- No test framework is installed. Do not add one, and do not add tests unless explicitly requested.

## External References
| Need | File |
|------|------|
| Demo URL | `README.md` |

## Project Shape
- Feature code lives under `src/modules/<feature>/`; core shell, router, i18n, and UI primitives live under `src/core/`.
- Board module layout: `algorithms/`, `components/`, `composables/`, `stores/`, `types/`, `utils/`, `constants.ts`, `index.ts`.
- Import local app code through the `@/...` alias. The alias is declared in three places and must stay in sync: `resolve.alias` in `vite.config.ts`, and `paths` in both `tsconfig.app.json` and `tsconfig.json`.
- Cross-module imports go through the module barrel (`@/modules/board`); intra-module imports use relative paths.
- SVG icons in `src/assets/icon/` are loaded through `vite-svg-loader` with the `?component` suffix and must be registered in the `icons` map inside `src/core/components/ui/ui-svg.vue`. Only `start.svg` and `target.svg` exist; all other iconography comes from `lucide-vue-next`.

## Naming and Structure Rules
- Every file is kebab-case, including SFCs: `board-view.vue`, `the-header.vue`, `use-board-store.ts`, `cell.types.ts`.
- Role suffixes: `*-view.vue` for views, `the-*.vue` for singletons, `ui-*.vue` for primitives in `src/core/components/ui/`, `use-*-store.ts` for Pinia stores, `use-*.ts` for composables, `*.types.ts` for type modules.
- Components are imported PascalCase and used kebab-case in templates (lucide icons included).
- Barrels use explicit named re-exports, never `export *`. Types use `export type { ... } from`. SFCs use `export { default as X } from './x.vue'` — an SFC has no named export.
- Props are type-only: `defineProps<Props>()`, defaults only via `withDefaults`. There is no `defineEmits` anywhere in the codebase — two-way binding uses `defineModel<T>({ required: true })`, and child→parent events are native DOM events wrapped in an arrow handler on the parent.
- Pinia stores are setup stores with a `'<feature>:store'` id: `board:store`, `board-settings:store`, `expansion:store`, `eraser:store`. There is no `$reset()` and no lifecycle hook in any store — reset is a hand-written action.
- Consume store state with `storeToRefs`; call actions on the store instance.
- Domain unions are string-literal `type` aliases, never enums. Lookup tables are `Record<Union, T>`.
- Never use TypeScript `any`; use explicit types, generics, or `unknown` with narrowing.
- Type-only imports must be marked `import type` (enforced by oxlint).

## Board Rules
- `CELL_WEIGHT` in `src/modules/board/constants.ts` is the only live constant there. `BOARD_COLS`, `BOARD_ROWS`, `START_CELL_COORDS`, `TARGET_CELL_COORDS` are unreferenced — editing them changes nothing.
- Live grid size is `cols = ref(50)` / `rows = ref(28)` in `src/modules/board/stores/use-board-settings-store.ts`; size bounds `COLS_MIN=10`, `COLS_MAX=80`, `ROWS_MIN=5`, `ROWS_MAX=40` are exported from the same file.
- Live start/target positions are computed by `getDefaultCoords(cols, rows)` in `src/modules/board/utils/generate-default-board.ts`.
- The grid is stored as `CellData[][]` (`cells[y][x]`); algorithms work on flat indices `y * cols + x`.
- Pathfinding algorithms implement `PathfindingAlgorithm` from `src/modules/board/algorithms/algorithm.types.ts`:
  `{ id, label, weighted, guaranteesShortestPath, supportsBomb, run(cells, start, target): PathfindingResult }`.
  `run` is synchronous, pure, and must not mutate stores.
- All eight implementations live in `src/modules/board/algorithms/search.ts`. `astar.algorithm.ts` and `bfs.algorithm.ts` are one-line re-export shims — do not put logic there.
- Adding an algorithm requires four edits: the id in the `PathfindingAlgorithmId` union (`algorithm.types.ts`), the object in `search.ts`, the entry in the `pathfindingAlgorithms` array (`as const satisfies readonly PathfindingAlgorithm[]`) at the tail of `search.ts`, and re-exports in `algorithms/index.ts` plus `src/modules/board/index.ts`. The header UI needs no per-algorithm code — it iterates the registry.
- `label` is a hardcoded English string, not an i18n key.
- `weighted` and `supportsBomb` are capability flags enforced in `setAlgorithm` (`use-expansion-store.ts`): switching to a non-weighted algorithm clears weights, switching to one without bomb support removes the bomb.
- **Animation invariant:** the sequential `for ... { mutate cell; await delay(...) }` loops in `src/modules/board/stores/use-expansion-store.ts` *are* the visualization. Do not batch mutations or use `Promise.all`. Keep the `instant` flag that skips every delay — it powers the drag-to-recompute watcher.
- Timing lives in module-level maps at the top of `use-expansion-store.ts` (`VISIT_DELAYS`, `ROUTE_DELAY`), not as scattered magic numbers.
- Maze generators in `src/modules/board/utils/maze-generators.ts` are pure: they return `PatternCell[]` and never touch the store. Application happens in `useBoardStore.applyMazePattern`.

## i18n Rules
- Routing is locale-prefixed: the only route is `/:locale(ru|en)`; `/` and every unmatched path redirect to `/ru`. Any new route must carry the locale segment.
- Never assign `i18n.global.locale` from a component. Switch locale by `router.push('/en')` — the `router.beforeEach` guard in `src/core/router/index.ts` sets the locale and `document.documentElement.lang`.
- `src/core/i18n/locales/ru.ts` and `en.ts` are untyped sibling object literals with no shared schema. **Key parity is not type-checked** — every new key must be added to both files, in the same order. Keys are flat camelCase.
- Adding a locale takes three edits in `src/core/i18n/index.ts` (`Locale` union, `SUPPORTED_LOCALES`, `messages`) plus a new file in `locales/`. The route pattern and the header's locale select derive from `SUPPORTED_LOCALES` automatically.

## Style Rules
- Tailwind CSS **v4** is CSS-first via `@tailwindcss/vite`. All design tokens live in the `@theme` block in `src/assets/styles/tailwind.css`: `--color-table`, `--color-cell-barrier`, `--color-cell-route`, `--color-cell-expansion-{0,60,80,100}`, plus two currently unused grid-template tokens.
- Root `tailwind.config.ts` holds only `{ content, plugins }`. There is **no `safelist` and no `theme` key**, and the stylesheet has no `@config` directive — so that file does not affect styling. Never add a safelist.
- Dynamic classes are kept as complete literal strings in module-level `Record<Union, string>` maps (see `cell-view.vue`) so the v4 content scanner finds them. Never build class names by concatenation.
- Utility-first Tailwind. `<style scoped>` is reserved for `@keyframes` and their `.animate-*` classes, which may reference `var(--color-...)` tokens directly.
- Inline `:style` is allowed only for genuinely dynamic values that cannot be static utilities — e.g. the board's computed `gridTemplateColumns`/`gridTemplateRows` in `board-view.vue`.
- UI primitives use `class-variance-authority` with variants defined inline in `<script setup>`, variant prop types derived via `VariantProps<typeof x>`, and `cn()` from `src/core/lib/utils.ts` to merge cva output with `$attrs.class`.

## Claude Code specifics
Shared scaffolding is committed — `.claude/settings.json`, `.claude/skills/`, `.claude/agents/`. Local state (`.claude/settings.local.json`) stays ignored.

| Skill (`.claude/skills/<name>/SKILL.md`) | Purpose |
|------|---------|
| `file-writer` | Create new files following this repo's naming, barrel, and style conventions |
| `add-algorithm` | Add a pathfinding algorithm across all four required registration points |
| `i18n-sync` | Add/verify message keys with `ru.ts` / `en.ts` parity |
| `verify-gates` | Run the four verification gates in order and report failures |

| Agent (`.claude/agents/<name>.md`) | Purpose |
|------|---------|
| `vue-builder` | Build and edit Vue SFCs, composables, and Pinia stores |
| `algorithm-engineer` | Implement and tune pathfinding algorithms in `algorithms/search.ts` |
| `i18n-keeper` | Own locale files, routing locale segment, and key parity |
| `project-reviewer` | Review diffs against the rules in this file and the verification gates |

| Memory file | Purpose |
|------|---------|
| `memory/README.md` | Index of the memory tree — start here |
| `memory/project-architecture.md` | Module layout, data flow, store graph |
| `memory/project-conventions.md` | Code conventions with live examples from `src/` |
| `memory/project-domain.md` | Domain vocabulary: cells, coords, patterns, algorithms |
| `memory/project-tooling.md` | Build, lint, format and type-check toolchain |
| `memory/agents/<role>.md` | Per-role persistent memory (`algorithm-engineer`, `i18n-keeper`, `project-reviewer`, `vue-builder`) |
