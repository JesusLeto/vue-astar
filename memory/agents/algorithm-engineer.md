# algorithm-engineer — project memory

> Персистентная память роли. Читать перед работой, дополнять после.

## Владение

- `src/modules/board/algorithms/` — `algorithm.types.ts`, `search.ts`, `astar.algorithm.ts`, `bfs.algorithm.ts`, `index.ts`
- `src/modules/board/utils/` — `maze-generators.ts`, `generate-default-board.ts`, `delay.ts`
- `src/modules/board/stores/` — `use-board-store.ts`, `use-expansion-store.ts`, `use-board-settings-store.ts`, `use-eraser-store.ts`
- `src/modules/board/types/` — `cell.types.ts`, `graph.types.ts`, `index.ts`
- `src/modules/board/constants.ts`, `src/modules/board/index.ts`
- Читать (не менять без согласования): `src/modules/board/components/`, `src/core/components/the-header.vue`

## Инварианты

- Алгоритм — это простой объект-литерал, типизированный `PathfindingAlgorithm`, а не класс. Контракт: `src/modules/board/algorithms/algorithm.types.ts:19-26` — `{ id, label, weighted, guaranteesShortestPath, supportsBomb, run(cells, start, target): PathfindingResult }`.
- `run` СИНХРОННЫЙ и чистый: он только считает, не мутирует стор и не анимирует. Вся анимация — в `use-expansion-store.ts`. Пример: `search.ts:400-407`.
- `PathfindingResult` (`algorithm.types.ts:13-17`): `visited` — порядок раскрытия БЕЗ стартовой клетки (`search.ts:136`, `:194`), `route` — путь БЕЗ старта и цели (`search.ts:80-85`, `:282`).
- Проходимость определяется единственным условием `cell.type !== 'barrier'` (`search.ts:39`). Соседи только 4-направленные, диагоналей нет (`search.ts:53-58`).
- Стоимость шага: `movementCost` возвращает 1 для невзвешенного, иначе `cell.weight > 0 ? cell.weight : 1` (`search.ts:66-69`).
- Индекс клетки везде считается как `y * cols + x` — идентично в `generate-default-board.ts:16`, `use-board-store.ts:21`, `search.ts:30`, `maze-generators.ts:19`. Не вводить другую формулу.
- Генераторы лабиринтов ЧИСТЫЕ: `generateMazePattern` возвращает `PatternCell[]` и не трогает стор (`maze-generators.ts:228-257`). Применение — только через `useBoardStore.applyMazePattern` (`use-board-store.ts:165-173`).
- Мутируют клетки только сторы. Каждый мутатор начинается с раннего выхода по `isProtectedCell` (`use-board-store.ts:12-13`, применяется на `:81`, `:89`, `:131`, `:142`, `:148`, `:154`).
- Никогда `any`. Доступ в сетку после явной фильтрации границ — `cells[coords.y]![coords.x]!` (`search.ts:62`); `previous` типизируется `readonly (number | null)[]` (`search.ts:72`), `protectedIndexes` — `ReadonlySet<number>` (`maze-generators.ts:231`).
- Доменные значения — строковые union-типы, не enum: `CellType` (`types/cell.types.ts:2`), `MazePattern` (`maze-generators.ts:4-10`), `VisualizationSpeed` (`use-expansion-store.ts:9`), `BoardTool` (`use-eraser-store.ts:4`).
- Реестр объявляется `as const satisfies readonly PathfindingAlgorithm[]` (`search.ts:445-454`) — так литерал остаётся узким и одновременно проверяется типом.
- Форматирование oxfmt: без `;`, одинарные кавычки, 4 пробела, printWidth 120, `arrowParens: "avoid"`.

## Карта кода

- `algorithms/algorithm.types.ts` — union `PathfindingAlgorithmId` (8 id), `PathfindingResult`, `PathfindingAlgorithm`.
- `algorithms/search.ts` — ВСЯ реализация: `PriorityQueue` (`:12-28`), хелперы координат (`:30-47`), `getNeighbors` (`:49-64`), `reconstructRoute` (`:71-86`), три движка (`runUnweightedSearch:116`, `runWeightedSearch:167`, `runBidirectionalSwarm:286`), 8 объектов алгоритмов (`:373-443`), реестр `pathfindingAlgorithms` (`:445-454`).
- `algorithms/astar.algorithm.ts`, `algorithms/bfs.algorithm.ts` — однострочные реэкспорт-шимы из `./search`, логики внутри НЕТ.
- `algorithms/index.ts` — реэкспорт типов и всех 8 алгоритмов + реестра.
- `stores/use-expansion-store.ts` — движок визуализации: `VISIT_DELAYS`/`ROUTE_DELAY` (`:11-17`), `setAlgorithm` (`:28-36`), `animateVisited`/`animateRoute` (`:42-59`), `runSegment` (`:61-66`), `onStart` (`:68-91`), watcher мгновенного пересчёта (`:93-99`), `clearPath`/`onReset` (`:101-109`).
- `stores/use-board-store.ts` — состояние клеток и координат: `moveSpecialCell` (`:58-69`), `setCellSetting` (`:71-86`), `addBomb`/`removeBomb`/`toggleBomb` (`:96-125`), `clearWallsAndWeights`/`clearWeights` (`:127-145`), `applyMazePattern` (`:165-173`), `reset` (`:175-181`).
- `stores/use-board-settings-store.ts` — `cols = ref(50)`, `rows = ref(28)` (`:10-11`) и границы `COLS_MIN=10 / COLS_MAX=80 / ROWS_MIN=5 / ROWS_MAX=40` (`:4-7`).
- `stores/use-eraser-store.ts` — активный инструмент `BoardTool`, computed `isEraserMode`/`isWeightMode`.
- `utils/maze-generators.ts` — 6 паттернов, `generateMazePattern` (`:228`), `addPatternCell` со щитом от protected/дублей (`:23-35`).
- `utils/generate-default-board.ts` — `generateDefaultBoard` (`:9-26`) и `getDefaultCoords` (`:28-38`).
- `utils/delay.ts` — однострочный `delay(time)`.
- `constants.ts` — `BOARD_COLS`, `BOARD_ROWS`, `START_CELL_COORDS`, `TARGET_CELL_COORDS`, `CELL_WEIGHT = 15`.

## Решённые вопросы

- Вариативность алгоритмов выражена дискриминантом стратегии, а не копированием цикла поиска. `WeightedStrategy` (`search.ts:4`) выбирает формулу приоритета в `getWeightedPriority` (`search.ts:156-162`): dijkstra=`distance`; astar=`distance + heuristic`; greedy=`heuristic + cost`; convergentSwarm=`distance + heuristic² + cost`; swarm=`distance + cost * max(1, heuristic)`. Эвристика — манхэттенское расстояние (`search.ts:37`).
- BFS и DFS — один движок `runUnweightedSearch` с флагом `depthFirst`: `pending.pop()` против `pending.shift()` (`search.ts:132`).
- `PriorityQueue` намеренно наивная — массив, пересортировываемый на каждом `add` (`search.ts:18`), с полем `order` как tiebreaker для FIFO-стабильности при равных приоритетах. Куча не нужна на текущих размерах доски (макс. 80x40 = 3200 клеток).
- Регистрация нового алгоритма — 4 шага: (1) добавить id в union `PathfindingAlgorithmId` (`algorithm.types.ts:3-11`); (2) экспортировать объект из `search.ts`; (3) внести его в массив `pathfindingAlgorithms` (`search.ts:445-454`); (4) реэкспортировать в `algorithms/index.ts` и в `src/modules/board/index.ts:9-19`. UI править НЕ нужно: `the-header.vue:46-57` строит и карту, и опции селекта итерацией по реестру.
- `label` алгоритма — захардкоженная английская строка в `search.ts` (`'A*'`, `"Dijkstra's"`, `'Greedy Best-first'`), НЕ ключ i18n. Локализуются только описательные суффиксы (`weighted`/`unweighted`/`guaranteesShortestPath`) в `the-header.vue:81-88`.
- Бомба как промежуточная точка: `onStart` строит список чекпоинтов `[bomb, target]` и последовательно гоняет `runSegment` (`use-expansion-store.ts:74-87`). Если сегмент вернул `found: false` — прогон обрывается и `isExpansionFinished` остаётся false.
- Инварианты возможностей централизованы в `setAlgorithm` (`use-expansion-store.ts:28-36`): при `!supportsBomb` бомба удаляется, при `!weighted` веса стираются. `bidirectionalSwarmAlgorithm` — единственный с `supportsBomb: false` (`search.ts:441`).
- Дефолты: алгоритм — `bfsAlgorithm` (`use-expansion-store.ts:25`), скорость — `'fast'` (`:26`), `VISIT_DELAYS.fast = 0` (`:12`).
- Веса: единственное значение `CELL_WEIGHT = 15` (`constants.ts:7`), ставится в `setCellSetting` (`use-board-store.ts:83`) и `setWeight` (`:156`). Градаций веса нет.
- Вероятности заливки паттернов: `randomWalls` 0.25, `randomWeights` 0.35 (`maze-generators.ts:234-235`). Три «division»-паттерна используют один `recursiveDivision` с границами `(2, rows-3, 2, cols-3)` и `surroundingWalls: false` (`:241-255`).

## Грабли

- Анимация — это САМ последовательный цикл `for (const coords of ...) { мутация клетки; await delay(...) }` в `use-expansion-store.ts:42-50` и `:52-59`. Vue перерисовывает между await'ами. Замена на батч-мутацию или `Promise.all` уничтожит визуализацию. Это и есть правило AGENTS.md «сохранять поток `delay()`».
- Флаг `instant` пропускает ВСЕ задержки (`use-expansion-store.ts:48`, `:57`) и нужен watcher'у мгновенного пересчёта при перетаскивании start/target/bomb (`:93-99`). Ломая `instant`, ломаешь drag-to-recompute.
- `onStart` защищён от повторного входа через `isExpansionInProcess` (`:69`). Любая новая точка запуска должна уважать этот флаг.
- `constants.ts` вводит в заблуждение: реально импортируется ТОЛЬКО `CELL_WEIGHT` (`use-board-store.ts:4`). `BOARD_COLS`, `BOARD_ROWS`, `START_CELL_COORDS`, `TARGET_CELL_COORDS` — мёртвые (ноль импортёров). Живой размер сетки — `ref(50)`/`ref(28)` в `use-board-settings-store.ts:10-11`; живые старт/цель — `getDefaultCoords(cols, rows)` (`generate-default-board.ts:28-38`), что при 50x28 даёт старт (12,14) и цель (37,14), а вовсе не `START_CELL_COORDS`/`TARGET_CELL_COORDS`. Правка `constants.ts` не изменит отрисованную доску.
- `use-board-settings-store.ts` НЕ клампит `cols`/`rows` — он отдаёт голые рефы (`:13`). Клампинг живёт в UI: `clamp` + `applyGridSize` в `the-header.vue:104-118`. Меняя границы, правь `COLS_MIN`/`COLS_MAX`/`ROWS_MIN`/`ROWS_MAX` в сторе — хедер их импортирует через бочонок (`src/modules/board/index.ts:5`).
- `src/modules/board/types/graph.types.ts` (`GraphRouteData`, `GraphTreeData`) реэкспортируется, но НЕ используется ни одним алгоритмом: `search.ts` работает на плоских массивах `previous: Array<number | null>`. Не строить на нём новую логику, не спросив.
- `src/modules/board/composables/use-eraser-mode.ts` — мёртвый код (ноль импортёров), заменён `use-eraser-store.ts`.
- `src/modules/board/services/` — пустая директория-остаток; файлов `*.service.ts` в проекте нет.
- Стор с id `'eraser:store'` управляет ВСЕМИ тремя инструментами (`wall`/`weight`/`eraser`), а не только ластиком — имя историческое.
- `bidirectionalSwarm` использует `getWeightedPriority('swarm', ...)` для обеих сторон (`search.ts:250`) и собирает маршрут из двух половин в `buildBidirectionalRoute` (`:261-284`), отфильтровывая start и target. Его `visited` содержит клетки обеих волн вперемешку (`:313`, `:342`).
- Тестового фреймворка в проекте нет (ни vitest, ни jest). Не добавлять тесты без явной просьбы. Проверка — `npm run type-check`, `npm run lint`, ручной прогон `npm run dev`.
