---
name: add-algorithm
description: End-to-end recipe for adding a new pathfinding algorithm to the vue-astar board module — implementing the PathfindingAlgorithm contract in algorithms/search.ts, extending the PathfindingAlgorithmId union, registering it in the pathfindingAlgorithms array and both barrels, setting the weighted/guaranteesShortestPath/supportsBomb capability flags that drive UI enablement and bomb waypointing, and keeping run() synchronous so the delay()-driven expansion animation in use-expansion-store.ts is preserved. Use whenever adding, renaming, removing or debugging a search algorithm (BFS, DFS, Dijkstra, A*, Greedy, Swarm and variants), or when a new algorithm does not appear in the header selector.
---

# add-algorithm — добавление алгоритма поиска пути

Всё, что относится к алгоритмам, лежит в `src/modules/board/algorithms/`.
Реализации восьми существующих алгоритмов находятся в **одном** файле
`search.ts`; `astar.algorithm.ts` и `bfs.algorithm.ts` — однострочные
ре-экспорт-шимы и логики не содержат.

---

## Контракт

`src/modules/board/algorithms/algorithm.types.ts` целиком:

```ts
import type { CellData, CoordsData } from '../types'

export type PathfindingAlgorithmId =
    | 'bfs'
    | 'dfs'
    | 'dijkstra'
    | 'astar'
    | 'greedy'
    | 'swarm'
    | 'convergentSwarm'
    | 'bidirectionalSwarm'

export interface PathfindingResult {
    found: boolean
    visited: CoordsData[]
    route: CoordsData[]
}

export interface PathfindingAlgorithm {
    id: PathfindingAlgorithmId
    label: string
    weighted: boolean
    guaranteesShortestPath: boolean
    supportsBomb: boolean
    run(cells: CellData[][], start: CoordsData, target: CoordsData): PathfindingResult
}
```

Семантика, которую обязан соблюдать `run`:

| Аспект | Требование |
|--------|-----------|
| Синхронность | `run` **синхронный** и чистый: никаких `async`, `await`, `setTimeout`, обращений к сторам и мутаций `cells`. Он только считает. |
| `visited` | Порядок раскрытия клеток, **без стартовой** (`search.ts:136`, `:194` — `if (currentIndex !== startIndex) visitedCoords.push(...)`). |
| `route` | Путь **без старта и без цели** (`reconstructRoute`, `search.ts:71-86`). |
| Провал | При отсутствии пути вернуть накопленный `visited` и пустой `route`: `return { ...createEmptyResult(), visited: visitedCoords }` (`search.ts:153`). |
| Проходимость | Клетка проходима, если `cell.type !== 'barrier'` (`isTraversable`, `search.ts:39`). |
| Соседи | 4 направления, без диагоналей (`getNeighbors`, `search.ts:49-64`). |
| Индексация | Плоский индекс `y * cols + x`; `cols = cells[0]?.length ?? 0` (`coordsToIndex`, `search.ts:30`). |
| Стоимость шага | `movementCost(cell, weighted)` — `1` для невзвешенных, иначе `cell.weight > 0 ? cell.weight : 1` (`search.ts:66-69`). |
| Типы | Никакого `any`. Доступ в решётку после явной фильтрации границ — `cells[coords.y]![coords.x]!` (`search.ts:62`). |

---

## Готовые кирпичи в `search.ts`

Переиспользуй их, а не пиши цикл заново:

- `coordsToIndex` / `indexToCoords` (`:30`, `:32`)
- `manhattanDistance` (`:37`) — эвристика
- `isTraversable` (`:39`), `getCellByIndex` (`:41`), `getNeighbors` (`:49`)
- `movementCost` (`:66`), `reconstructRoute` (`:71`), `createEmptyResult` (`:105`)
- `createNullableNumberArray` (`:111`), `createNumberArray` (`:114`)
- `class PriorityQueue` (`:12-28`) — сортируемый массив с тай-брейком по `order`
- Движки: `runUnweightedSearch(cells, start, target, depthFirst)` (`:116`),
  `runWeightedSearch(cells, start, target, strategy)` (`:167`),
  `runBidirectionalSwarm` (`:286`)

**Ключевое соглашение:** вариации взвешенного поиска выражаются не копией цикла,
а дискриминантом стратегии. `WeightedStrategy` (`search.ts:4`) выбирает формулу
приоритета в `getWeightedPriority` (`search.ts:156-162`):

```ts
const getWeightedPriority = (strategy: WeightedStrategy, distance: number, cost: number, heuristic: number): number => {
    if (strategy === 'dijkstra') return distance
    if (strategy === 'astar') return distance + heuristic
    if (strategy === 'greedy') return heuristic + cost
    if (strategy === 'convergentSwarm') return distance + Math.pow(heuristic, 2) + cost
    return distance + cost * Math.max(1, heuristic)
}
```

Если новый алгоритм — это ещё одна взвешенная эвристика, **не пиши новый движок**:
добавь значение в `WeightedStrategy`, ветку в `getWeightedPriority` и при
необходимости в `shouldCompareByPriority` (`search.ts:164-165`).

---

## Флаги возможностей — что они реально включают

| Флаг | Последствия |
|------|-------------|
| `weighted: false` | При выборе алгоритма `setAlgorithm` вызывает `boardStore.clearWeights()` (`use-expansion-store.ts:31`), а кнопка «Вес» в шапке блокируется (`the-header.vue:218`) и активный инструмент сбрасывается на `'wall'` (`the-header.vue:93`). |
| `supportsBomb: false` | `setAlgorithm` вызывает `boardStore.removeBomb()` (`use-expansion-store.ts:30`), кнопка бомбы блокируется (`the-header.vue:234`), а `onStart` не строит маршрут через бомбу. Единственный такой алгоритм сейчас — `bidirectionalSwarmAlgorithm`. |
| `guaranteesShortestPath` | Влияет только на подпись под шапкой: `algorithmDescriptor` (`the-header.vue:81-88`) собирает `${algorithm.label}: ${weightText}, ${guaranteeText}`. |

Ставь флаги честно: они не декоративны.

---

## Пошагово

### 1. Расширить union id

`src/modules/board/algorithms/algorithm.types.ts` — добавить литерал в
`PathfindingAlgorithmId`. Без этого объект алгоритма не пройдёт типизацию.

### 2. Реализовать в `search.ts`

Объект-литерал, типизированный `PathfindingAlgorithm`, `run` делегирует движку.
Реально существующие примеры:

```ts
export const astarAlgorithm: PathfindingAlgorithm = {
    id: 'astar',
    label: 'A*',
    weighted: true,
    guaranteesShortestPath: true,
    supportsBomb: true,
    run: (cells, start, target) => runWeightedSearch(cells, start, target, 'astar'),
}

export const bidirectionalSwarmAlgorithm: PathfindingAlgorithm = {
    id: 'bidirectionalSwarm',
    label: 'Bidirectional Swarm',
    weighted: true,
    guaranteesShortestPath: false,
    supportsBomb: false,
    run: runBidirectionalSwarm,
}
```

Никаких классов. Маленькие чистые хелперы — `const`-стрелки с явным типом
возврата; многоветвевой движок — `function`-декларация.

### 3. Зарегистрировать в реестре

Массив в конце `search.ts` — **порядок в нём определяет порядок опций
в селекторе шапки**:

```ts
export const pathfindingAlgorithms = [
    dijkstraAlgorithm,
    astarAlgorithm,
    greedyAlgorithm,
    swarmAlgorithm,
    convergentSwarmAlgorithm,
    bidirectionalSwarmAlgorithm,
    bfsAlgorithm,
    dfsAlgorithm,
] as const satisfies readonly PathfindingAlgorithm[]
```

Сохрани `as const satisfies readonly PathfindingAlgorithm[]` — литерал остаётся
узким и одновременно проверяется по контракту.

### 4. Ре-экспорт из двух barrel'ов

`src/modules/board/algorithms/index.ts`:

```ts
export type { PathfindingAlgorithm, PathfindingAlgorithmId, PathfindingResult } from './algorithm.types'
export {
    astarAlgorithm,
    bfsAlgorithm,
    bidirectionalSwarmAlgorithm,
    convergentSwarmAlgorithm,
    dfsAlgorithm,
    dijkstraAlgorithm,
    greedyAlgorithm,
    pathfindingAlgorithms,
    swarmAlgorithm,
} from './search'
```

и такой же блок в `src/modules/board/index.ts:9-19`. Списки отсортированы
по алфавиту — вставляй на своё место.

> Отдельный файл `<name>.algorithm.ts` создавать **не нужно**. Существующие
> `astar.algorithm.ts` / `bfs.algorithm.ts` — легаси-шимы вида
> `export { astarAlgorithm } from './search'`.

### 5. UI: править нечего

`the-header.vue:46-57` строит и карту, и опции селектора итерацией по
`pathfindingAlgorithms`:

```ts
const algorithmOptions = pathfindingAlgorithms.map(algorithm => ({
    value: algorithm.id,
    label: algorithm.label,
})) satisfies SelectOption[]
```

Новый алгоритм появится в выпадающем списке сам.

### 6. Лейбл и i18n — честная картина

**`label` не локализуется.** Это захардкоженная английская строка в `search.ts`
(`'A*'`, `"Dijkstra's"`, `'Greedy Best-first'`), она попадает и в опцию селектора,
и в подпись `algorithmDescriptor` как есть. Ключа в `ru.ts` / `en.ts` для неё нет,
и добавлять его при добавлении алгоритма **не требуется**.

Локализованы только слова вокруг лейбла — `weighted`, `unweighted`,
`guaranteesShortestPath`, `doesNotGuaranteeShortestPath` (уже есть в обеих локалях).
Новые ключи нужны только если ты добавляешь новый пользовательский текст;
тогда — скилл `i18n-sync`, оба файла локалей.

Если требуется именно локализованный лейбл, это отдельная задача: `label` придётся
превратить в i18n-ключ и переписать `algorithmOptions` / `algorithmDescriptor` через
`t(...)` в computed. Текущий механизм этого не делает — не выдавай желаемое за факт.

### 7. Не сломать анимацию

Анимация живёт **только** в `use-expansion-store.ts` и держится на
последовательных `await delay(...)` внутри `for...of`:

```ts
const animateVisited = async (visited: CoordsData[], instant: boolean) => {
    for (const coords of visited) {
        const cell = boardCellsState.value[coords.y]?.[coords.x]
        if (!cell || cell.type === 'start' || cell.type === 'target' || cell.type === 'bomb') continue
        cell.isVisited = true
        cell.isExpansionProcess = true
        if (!instant) await delay(VISIT_DELAYS[speed.value])
    }
}
```

Что это значит для автора алгоритма:

- `run` вызывается один раз синхронно в `runSegment` (`use-expansion-store.ts:62`),
  после чего стор сам проигрывает `result.visited`, а затем `result.route`.
- Порядок в `visited` — это и есть визуальный порядок раскрытия. Не сортируй его
  и не дедуплицируй «для красоты».
- **Нельзя** батчить мутации, заменять цикл на `Promise.all`, мутировать клетки
  из `run` или добавлять свои задержки — это ломает и обычный прогон, и мгновенный
  перерасчёт при перетаскивании (watcher на индексы start/target/bomb вызывает
  `onStart(true)`, где флаг `instant` пропускает все задержки:
  `use-expansion-store.ts:93-99`).
- Тайминги централизованы: `VISIT_DELAYS = { fast: 0, average: 100, slow: 500 }`
  и `ROUTE_DELAY = 40` (`use-expansion-store.ts:11-17`). Не заводи собственные
  константы задержек в алгоритме.

### 8. Бомба

При наличии бомбы и `supportsBomb: true` `onStart` разбивает прогон на два
последовательных сегмента: start → bomb, затем bomb → target
(`use-expansion-store.ts:74-87`). Если сегмент вернул `found: false`, прогон
прерывается и `isExpansionFinished` остаётся `false`. Алгоритму об этом знать
не нужно — просто корректно возвращай `found`.

---

## Checklist

- [ ] Id добавлен в `PathfindingAlgorithmId` (`algorithms/algorithm.types.ts`)
- [ ] Реализация в `algorithms/search.ts`; при возможности переиспользован существующий движок / добавлена ветка в `getWeightedPriority`
- [ ] Экспортирован объект-литерал `export const xAlgorithm: PathfindingAlgorithm = { ... }`
- [ ] `run` синхронный, чистый, не мутирует `cells` и не трогает сторы
- [ ] `visited` без старта, `route` без старта и цели, при провале — `{ ...createEmptyResult(), visited: visitedCoords }`
- [ ] Флаги `weighted` / `guaranteesShortestPath` / `supportsBomb` проставлены честно
- [ ] Добавлен в массив `pathfindingAlgorithms` (`as const satisfies readonly PathfindingAlgorithm[]`)
- [ ] Ре-экспортирован из `algorithms/index.ts` и `src/modules/board/index.ts`
- [ ] Нигде нет `any`; типы импортированы через `import type`
- [ ] Анимационный поток в `use-expansion-store.ts` не изменён
- [ ] Новые i18n-ключи (если появились) добавлены в `ru.ts` **и** `en.ts`
- [ ] Прогнаны гейты, вывод вставлен в ответ

---

## Проверка

```bash
npm run type-check
npm run lint
npm run format:check
npm run build
```

Подробности и правило «без вставленного вывода работа не считается сделанной» —
в скилле `verify-gates`.

Ручная проверка в браузере (`npm run dev`):

1. Новый алгоритм есть в первом селекторе шапки, лейбл верный.
2. Подпись под шапкой показывает `<label>: взвешенный|невзвешенный, гарантирует|не гарантирует кратчайший путь`.
3. При `weighted: false` кнопка «Вес» заблокирована, ранее расставленные веса очищены.
4. При `supportsBomb: false` кнопка бомбы заблокирована, бомба снята с доски.
5. «Старт» на скорости `slow` — раскрытие идёт клетка за клеткой, затем прорисовывается маршрут.
6. Перетаскивание старта/цели после завершения поиска мгновенно перестраивает картинку без анимации.
