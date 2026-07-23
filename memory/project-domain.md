# Домен: словарь визуализатора поиска пути

Каждый термин — как он существует в коде: тип, файл, инварианты.

## Ячейка (cell)

`src/modules/board/types/cell.types.ts`

```ts
export type CellSpecialType = 'start' | 'target' | 'bomb'          // :1
export type CellType = CellSpecialType | 'barrier' | 'route' | ''  // :2

export interface CoordsData { x: number; y: number }               // :4-7

export interface CellData {                                        // :9-17
    index: number
    coords: CoordsData
    type: CellType
    weight: number
    isVisited: boolean
    isExpansionProcess: boolean
}
```

- `''` — нейтральная (свободная) ячейка. Это не «нет типа», а полноправное значение union'а.
- Один `CellType` на ячейку: `barrier` и `route` взаимоисключающи, вес живёт отдельным полем `weight`.
- `index` всегда `y * cols + x`. Формула повторена в четырёх местах: `utils/generate-default-board.ts:16`, `stores/use-board-store.ts:21`, `algorithms/search.ts:30`, `utils/maze-generators.ts:19`.
- `IndexedCoords = CoordsData & { index: number }` (`stores/use-board-store.ts:10`) — координаты спец-ячеек в сторе хранятся уже с индексом.

| Термин | Значение в коде | Где |
|---|---|---|
| **start** | `CellType === 'start'`, координаты в `startCellCoords` | `use-board-store.ts:26` |
| **target** | `CellType === 'target'`, координаты в `targetCellCoords` | `use-board-store.ts:27` |
| **bomb** | опциональная промежуточная точка, `bombCellCoords: IndexedCoords \| null` | `use-board-store.ts:28` |
| **barrier** | стена; непроходима — единственный критерий проходимости | `search.ts:39` |
| **weight** | `cell.weight > 0`; тип при этом `''` | `use-board-store.ts:153-157` |
| **route** | ячейка найденного маршрута, ставится анимацией | `use-expansion-store.ts:56` |
| **visited / expansion** | `isVisited` + `isExpansionProcess` — фронт волны поиска | `use-expansion-store.ts:46-47` |

**Защищённая ячейка (protected).** `isProtectedCell(cell)` = тип `start`, `target` или `bomb` (`use-board-store.ts:12-13`). Гейтит `setCellSetting`, `eraseCell`, `clearWallsAndWeights`, `clearWeights`, `setBarrier`, `setWeight` — на такие ячейки нельзя поставить стену или вес.

**Проходимость.** `isTraversable = cell.type !== 'barrier'` (`search.ts:39`). Соседи — четырёхнаправленные (вверх/вправо/вниз/влево), диагоналей нет (`search.ts:53-58`).

**Стоимость перехода.** `movementCost(cell, weighted)`: `1` для невзвешенных, иначе `cell.weight > 0 ? cell.weight : 1` (`search.ts:66-69`). Взвешенные поиски всегда зовут её с `weighted: true`.

`CELL_WEIGHT = 15` (`src/modules/board/constants.ts:7`) — единственная константа из этого файла, которая реально импортируется (`use-board-store.ts:4`, применяется в `:83` и `:156`).

## Доска (board)

- Хранится как `CellData[][]` в row-major порядке (`cells[y][x]`), ref `boardCellsState` (`use-board-store.ts:30-32`). Алгоритмы работают на плоских индексах, конвертируя локальными `coordsToIndex` / `indexToCoords` (`search.ts:30-35`).
- Генерация: `generateDefaultBoard(cols, rows, startCoords, targetCoords)` (`utils/generate-default-board.ts:9-26`).
- Дефолтные позиции точек: `getDefaultCoords(cols, rows)` (`utils/generate-default-board.ts:28-38`) — start в `(floor(cols/4), floor(rows/2))`, target в `(max(1, min(cols-1, floor(3*cols/4))), floor(rows/2))`. При дефолтных 50×28 это start `(12, 14)` и target `(37, 14)`.

### Размеры и границы

| Что | Значение | Где |
|---|---|---|
| живые `cols` / `rows` | `ref(50)` / `ref(28)` | `stores/use-board-settings-store.ts:10-11` |
| `COLS_MIN` / `COLS_MAX` | 10 / 80 | `stores/use-board-settings-store.ts:4-5` |
| `ROWS_MIN` / `ROWS_MAX` | 5 / 40 | `stores/use-board-settings-store.ts:6-7` |

Стор границы **не** применяет — он возвращает только `{ cols, rows }` (`:13`). Кламп делает UI: `clamp()` (`the-header.vue:104`) и `applyGridSize()` (`the-header.vue:108`), границы реэкспортируются через barrel (`src/modules/board/index.ts:5`).

Визуальный размер ячейки — 32px, зашит в `gridStyle` в `board-view.vue:30-33` (`repeat(${cols}, 32px)`) и в утилиты `w-8 h-8` в `cell-view.vue:63`.

### constants.ts

`src/modules/board/constants.ts` экспортирует ровно один символ — `CELL_WEIGHT = 15`. Дефолтов доски там нет: размер живёт в `use-board-settings-store.ts`, координаты старта/цели вычисляет `getDefaultCoords()` (реальные дефолты при 50x28 — `(12,14)` / `(37,14)`). Ранее файл нёс мёртвые `BOARD_COLS`/`BOARD_ROWS`/`START_CELL_COORDS`/`TARGET_CELL_COORDS` без импортёров — они удалены, не возвращать.

## Алгоритмы

### Контракт

`src/modules/board/algorithms/algorithm.types.ts`

```ts
export interface PathfindingResult {                               // :13-17
    found: boolean
    visited: CoordsData[]
    route: CoordsData[]
}

export interface PathfindingAlgorithm {                            // :19-26
    id: PathfindingAlgorithmId
    label: string
    weighted: boolean
    guaranteesShortestPath: boolean
    supportsBomb: boolean
    run(cells: CellData[][], start: CoordsData, target: CoordsData): PathfindingResult
}
```

- `run` **синхронный**: не анимирует, не мутирует стор, только считает.
- `visited` — порядок раскрытия, **без стартовой ячейки** (`search.ts:136`, `:194`).
- `route` — путь **без start и без target**: `reconstructRoute` стартует с `previous[targetIndex]` и останавливается перед `startIndex` (`search.ts:71-86`); в двунаправленном варианте оба конца отфильтровываются явно (`search.ts:282`).
- `label` — захардкоженная английская строка, **не** i18n-ключ (`search.ts:375`, `:393`, `:411` …). В UI подставляется как есть (`the-header.vue:54-57`).

`PathfindingAlgorithmId` — закрытый union из 8 значений (`algorithm.types.ts:3-11`).

### Реестр

Все восемь объектов живут в **одном** файле `src/modules/board/algorithms/search.ts:373-443`. Массив реестра — `search.ts:445-454`:

```ts
export const pathfindingAlgorithms = [
    dijkstraAlgorithm, astarAlgorithm, greedyAlgorithm, swarmAlgorithm,
    convergentSwarmAlgorithm, bidirectionalSwarmAlgorithm, bfsAlgorithm, dfsAlgorithm,
] as const satisfies readonly PathfindingAlgorithm[]
```

`astar.algorithm.ts` и `bfs.algorithm.ts` — однострочные реэкспорт-шимы (`export { astarAlgorithm } from './search'`), реализации в них нет.

| id | label | weighted | shortestPath | supportsBomb | движок |
|---|---|---|---|---|---|
| `bfs` | `BFS` | ✗ | ✓ | ✓ | `runUnweightedSearch(..., false)` |
| `dfs` | `DFS` | ✗ | ✗ | ✓ | `runUnweightedSearch(..., true)` |
| `dijkstra` | `Dijkstra's` | ✓ | ✓ | ✓ | `runWeightedSearch(..., 'dijkstra')` |
| `astar` | `A*` | ✓ | ✓ | ✓ | `runWeightedSearch(..., 'astar')` |
| `greedy` | `Greedy Best-first` | ✓ | ✗ | ✓ | `runWeightedSearch(..., 'greedy')` |
| `swarm` | `Swarm` | ✓ | ✗ | ✓ | `runWeightedSearch(..., 'swarm')` |
| `convergentSwarm` | `Convergent Swarm` | ✓ | ✗ | ✓ | `runWeightedSearch(..., 'convergentSwarm')` |
| `bidirectionalSwarm` | `Bidirectional Swarm` | ✓ | ✗ | **✗** | `runBidirectionalSwarm` |

`bidirectionalSwarm` — единственный без поддержки бомбы (`search.ts:441`).

### Три движка

- `runUnweightedSearch(cells, start, target, depthFirst)` (`search.ts:116`) — BFS/DFS на одном массиве `pending`: `pop()` для DFS, `shift()` для BFS (`:132`).
- `runWeightedSearch(cells, start, target, strategy)` (`search.ts:167`) — Dijkstra / A* / Greedy / Swarm / ConvergentSwarm. Стратегии отличаются **только** формулой приоритета в `getWeightedPriority` (`:156-162`):

  | стратегия | приоритет |
  |---|---|
  | `dijkstra` | `distance` |
  | `astar` | `distance + heuristic` |
  | `greedy` | `heuristic + cost` |
  | `convergentSwarm` | `distance + heuristic² + cost` |
  | `swarm` (default) | `distance + cost * max(1, heuristic)` |

  Эвристика — манхэттенское расстояние (`search.ts:37`). `shouldCompareByPriority` (`:164-165`) определяет, сравнивать ли по приоритету (greedy/swarm/convergentSwarm) или по дистанции (dijkstra/astar).
- `runBidirectionalSwarm(cells, start, target)` (`search.ts:286`) — две встречные волны со swarm-приоритетом, склейка через `buildBidirectionalRoute` (`:261`).

`PriorityQueue` (`search.ts:12-28`) — наивная сортируемая очередь: пересортировка массива на каждом `add` (`:18`), поле `order` как tiebreaker для FIFO-стабильности при равных приоритетах.

### Добавление алгоритма — четыре правки

1. Добавить id в union `PathfindingAlgorithmId` (`algorithms/algorithm.types.ts:3-11`).
2. Экспортировать объект `PathfindingAlgorithm` из `algorithms/search.ts`.
3. Добавить его в массив `pathfindingAlgorithms` (`search.ts:445-454`).
4. Реэкспортировать из `algorithms/index.ts:2-12` и из `src/modules/board/index.ts:9-19`.

UI отдельной правки **не** требует: `the-header.vue:46-57` строит и карту `id → algorithm`, и опции `<UiSelect>` итерацией по `pathfindingAlgorithms`.

## Прогон и анимация

`src/modules/board/stores/use-expansion-store.ts`

- Состояние: `isExpansionInProcess`, `isExpansionFinished`, `currentAlgorithm` (дефолт `bfsAlgorithm`, `:25`), `speed` (дефолт `'fast'`, `:26`).
- `VisualizationSpeed = 'fast' | 'average' | 'slow'` (`:9`); задержки `VISIT_DELAYS = { fast: 0, average: 100, slow: 500 }` (`:11-15`), `ROUTE_DELAY = 40` (`:17`).
- `delay = (time: number) => new Promise(res => setTimeout(res, time))` (`utils/delay.ts:1`).
- `onStart(instant = false)` (`:68`): защита от повторного входа, очистка состояния поиска, список чекпоинтов, `await runSegment` по каждому. `runSegment` (`:61`) синхронно зовёт `run`, затем `animateVisited`, затем `animateRoute` — только если `result.found`.
- `animateVisited` (`:42-50`) ставит `isVisited` + `isExpansionProcess`; `animateRoute` (`:52-59`) ставит `type = 'route'`. Обе пропускают start/target/bomb и **полностью** пропускают `delay` при `instant`.
- **Последовательный `for...of` + `await delay(...)` — это и есть анимация.** Vue перерисовывает между await'ами. Батч-мутация или `Promise.all` её сломают.

**Бомба как waypoint.** При наличии бомбы и `supportsBomb` поиск идёт двумя сегментами start→bomb→target (`:74-87`). Если сегмент вернул `found: false`, прогон прерывается и `isExpansionFinished` остаётся `false`.

**Мгновенный перезапуск.** `watch` на `[startCellCoords.index, targetCellCoords.index, bombCellCoords?.index ?? -1]` (`:93-99`) вызывает `void onStart(true)`, если поиск уже завершался и сейчас не идёт — это пересчёт при перетаскивании точки.

**Инварианты при смене алгоритма.** `setAlgorithm` (`:28-36`): снять бомбу, если `!supportsBomb`; обнулить веса, если `!weighted`; сбросить результат прошлого поиска.

**Очистка.** `clearSearchState` (`use-board-store.ts:48-56`) снимает `isExpansionProcess`/`isVisited` и понижает `type === 'route'` обратно в `''`; стены и веса не трогает. `clearWallsAndWeights` (`:127`) и `clearWeights` (`:138`) сначала зовут её.

## Лабиринты

`src/modules/board/utils/maze-generators.ts`

```ts
export type PatternCellType = 'barrier' | 'weight'                 // :3
export type MazePattern =                                          // :4-10
    | 'randomWalls' | 'randomWeights' | 'recursiveDivision'
    | 'verticalDivision' | 'horizontalDivision' | 'stair'
export interface PatternCell { coords: CoordsData; type: PatternCellType }  // :12-15

export function generateMazePattern(
    rows: number, cols: number,
    protectedIndexes: ReadonlySet<number>, pattern: MazePattern
): PatternCell[]                                                   // :228
```

- Генераторы **чистые**: возвращают описание `PatternCell[]` и не трогают стор.
- Применение — `useBoardStore.applyMazePattern` (`use-board-store.ts:165-173`): сначала `clearWallsAndWeights()`, затем каждый `PatternCell` через `setBarrier` или `setWeight`.
- Вероятности заполнения: `randomWalls` — 0.25, `randomWeights` — 0.35 (`maze-generators.ts:234-235`).
- `recursiveDivision`, `verticalDivision`, `horizontalDivision` используют одну рекурсивную процедуру с границами `(2, rows-3, 2, cols-3)` и `surroundingWalls: false` (`:241-255`); отличается только начальная ориентация (`vertical` для `verticalDivision`, иначе `horizontal`).
- start/target/bomb защищены: `getProtectedIndexes()` (`use-board-store.ts:159-163`) передаётся внутрь, `addPatternCell` пропускает защищённые и уже встреченные индексы (`maze-generators.ts:31-34`).

## Инструменты рисования

`src/modules/board/stores/use-eraser-store.ts` (id `'eraser:store'`, покрывает все три инструмента):

- `BoardTool = 'wall' | 'weight' | 'eraser'` (`:4`), ref `activeTool` с дефолтом `'wall'` (`:7`), computed `isEraserMode` / `isWeightMode` (`:9-10`).
- `DrawMode = 'wall' | 'weight'` (`use-board-store.ts:9`) — что именно ставит `setCellSetting`.
- Удержание клавиши `w` временно включает режим веса: `isWeightKeyPressed` в `composables/use-mouse-action.ts:41-46`; `board-view.vue:40` объединяет его с `isWeightMode`.

## Мёртвый код домена

- `src/modules/board/composables/use-eraser-mode.ts` — `useEraserMode` не импортируется нигде; вытеснен `useEraserStore`.
- `src/modules/board/types/graph.types.ts` (`GraphRouteData`, `GraphTreeData`) — реэкспортируется по всей цепочке barrel'ов, но ни один алгоритм и ни один стор его не использует; `search.ts` работает на плоских `Array<number | null>`.
- Класс `cell` в `cell-view.vue:79` — CSS-правила `.cell` нет ни в scoped-блоке, ни в `tailwind.css`.
- `src/modules/board/services/` — пустая директория, файлов `*.service.ts` в проекте нет.
