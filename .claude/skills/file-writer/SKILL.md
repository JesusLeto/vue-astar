---
name: file-writer
description: Conventions for creating or editing any source file in the vue-astar project — Vue 3 SFCs, composables, Pinia stores, TypeScript types, utils and module barrels. Covers kebab-case file naming, where files belong (src/modules/<feature>/ vs src/core/), the type-only defineProps/withDefaults/defineModel prop patterns used here, Tailwind v4 CSS-first theming with @theme tokens, when <style scoped> is allowed, barrel re-export syntax, and the oxfmt/oxlint formatting contract. Use whenever adding or modifying a component, composable, store, type file, utility, or index.ts barrel under src/, or when unsure where a new file should live or how it must be named.
---

# file-writer — соглашения по файлам vue-astar

Стек: Vue 3.5 (`<script setup lang="ts">`), Pinia 3, vue-router 4, vue-i18n 9,
Tailwind CSS v4 (`@tailwindcss/vite`), Vite 8, TypeScript 6.
Линтер/форматтер — **oxlint + oxfmt** (не eslint/prettier).

---

## Именование файлов

**Всегда kebab-case**, без исключений — включая SFC.

| Вид | Шаблон | Реальный пример |
|-----|--------|-----------------|
| Компонент | `kebab-name.vue` | `src/modules/board/components/cell-view.vue` |
| Вью/страница | `kebab-name-view.vue` | `src/core/views/home-view.vue` |
| Синглтон-компонент | `the-kebab-name.vue` | `src/core/components/the-header.vue` |
| UI-примитив | `ui-kebab-name.vue` | `src/core/components/ui/ui-select.vue` |
| Composable | `use-kebab-name.ts` | `src/modules/board/composables/use-mouse-action.ts` |
| Pinia-стор | `use-kebab-name-store.ts` | `src/modules/board/stores/use-eraser-store.ts` |
| Типы | `kebab-name.types.ts` | `src/modules/board/types/cell.types.ts` |
| Утилита | `kebab-name.ts` | `src/modules/board/utils/generate-default-board.ts` |

Имя экспорта повторяет имя файла: `use-mouse-action.ts` → `useMouseAction`,
`use-eraser-store.ts` → `useEraserStore` с id `'eraser:store'`.

> В проекте есть пустая директория `src/modules/board/services/`, но ни одного
> `*.service.ts` не существует. Живого примера соглашения нет — не создавай
> сервисы «по образцу», пока задача явно этого не требует.

---

## Куда класть файлы

### Код фичи

```
src/modules/<feature>/
  algorithms/    ← алгоритмы + их типы (только у board)
  components/    ← компоненты фичи
  composables/   ← composables фичи
  stores/        ← Pinia-сторы фичи
  types/         ← *.types.ts + types/index.ts
  utils/         ← чистые утилиты фичи
  index.ts       ← barrel: публичное API модуля
```

### Переиспользуемый код

```
src/core/
  components/          ← the-header.vue
    ui/                ← UI kit: ui-button.vue, ui-select.vue, ui-svg.vue
  i18n/                ← index.ts + locales/{ru,en}.ts
  lib/                 ← is-equal.ts, utils.ts (cn)
  router/              ← index.ts
  views/               ← home-view.vue
```

Директории `src/core/components/shared/` **не существует** — примитивы живут
в `src/core/components/ui/`.

**Правило:** если сущность нужна больше чем одному модулю — она в `src/core/`.

### Импорты

- Между модулями и в `src/core/` — через алиас `@/`:
  `import UiSvg from '@/core/components/ui/ui-svg.vue'` (`cell-view.vue:5`).
- Внутри своего модуля — относительные пути: `import type { CellData } from '../types'`
  (`cell-view.vue:6`).
- `board-view.vue` местами импортирует собственный модуль через barrel
  (`@/modules/board`) — это отклонение, не копируй его.

---

## Компонент

Порядок блоков: `<script setup lang="ts">` → `<template>` → опционально `<style scoped>`.

Props — **только type-only generic**. Инлайн-литерал, когда дефолтов нет:

```vue
<script setup lang="ts">
import type { CellData } from '../types'

const props = defineProps<{
    data: CellData
    isExpansion: boolean
    isDragging?: boolean
}>()
</script>
```

Отдельный `interface Props` + `withDefaults`, когда дефолты нужны
(как в `src/core/components/ui/ui-button.vue:34-43`):

```ts
interface Props {
    variant?: ButtonVariants['variant']
    as?: string
}

const props = withDefaults(defineProps<Props>(), {
    as: 'button',
})
```

### Emits: их здесь нет

`defineEmits` не встречается в `src/` ни разу. Два живых паттерна:

1. **Двусторонняя привязка** — `defineModel` (`ui-select.vue:15-18`):

```ts
defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })
const props = defineProps<Props>()
```

2. **Событие вверх** — нативный DOM-слушатель на корне ребёнка, а родитель
   оборачивает payload стрелкой (`board-view.vue:88-89`):

```vue
<cell-view
    :data="data"
    @mousedown="() => onCellMousedown(data)"
/>
```

Не вводи `defineEmits`, если задача не требует этого явно — в кодовой базе нет
примера для подражания.

### Регистрация и использование

Импорт — PascalCase, тег в шаблоне — kebab-case. Это касается и lucide-иконок:

```vue
<script setup lang="ts">
import { BrickWall } from 'lucide-vue-next'
</script>

<template>
    <brick-wall class="h-4 w-4" />
</template>
```

Единственный PascalCase-тег в проекте — `<RouterView />` в `src/App.vue`.

---

## Tailwind v4 — как здесь на самом деле

**Tailwind v4 работает CSS-first.** Все токены объявлены в `@theme` внутри
`src/assets/styles/tailwind.css`:

```css
@import 'tailwindcss';

/* Project custom theme */
@theme {
    --color-table: #aed6dc;
    --color-cell-barrier: #00154f;
    --color-cell-route: #fdfe6a;
    --color-cell-expansion-0: #414974;
    --color-cell-expansion-60: #4884d6;
    --color-cell-expansion-80: #42ddcb;
    --color-cell-expansion-100: #41c9e0;
    --grid-template-columns-board: repeat(50, 32px);
    --grid-template-rows-board: repeat(28, 32px);
}
```

Правила:

- **`tailwind.config.ts` в корне не влияет на стилизацию.** В нём только
  `{ content, plugins }`, а в `tailwind.css` нет директивы `@config`, поэтому
  под v4 + `@tailwindcss/vite` файл инертен. Новые токены добавляй **только**
  в блок `@theme`.
- **`safelist` не существует** — ни ключа в конфиге, ни механизма в v4-проекте.
  Забудь про совет «добавь динамический класс в safelist».
- Токен `--color-<role>` автоматически даёт утилиты: `bg-cell-barrier`,
  `bg-cell-route`, `border-table` (`cell-view.vue:19-21`, `:63`).
- Внутри `<style scoped>` тот же токен доступен как обычная CSS-переменная:
  `background-color: var(--color-cell-expansion-60)` (`cell-view.vue:132`).
- `--grid-template-columns-board` / `--grid-template-rows-board` — мёртвые:
  сетка строится инлайновым `:style`, см. ниже.

### Динамические классы — записывай целыми строковыми литералами

Сканер контента v4 видит только полные строки. Правильный приём — таблица
`Record<Union, string>` на уровне модуля (`BASE_CLASSES` — `cell-view.vue:18-22`,
`ANIMATION_CLASSES` — `:24-28`):

```ts
type CellVisualType = 'barrier' | 'expansion' | 'route'

const BASE_CLASSES: Record<CellVisualType, string> = {
    barrier: 'absolute z-100 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-cell-barrier',
    expansion: 'bg-cell-expansion-100',
    route: 'bg-cell-route',
}
```

Никогда не собирай класс конкатенацией (`` `bg-cell-${type}` ``).

### `<style scoped>` — только keyframes

Единственный файл со `<style scoped>` — `cell-view.vue:91-150`, и там лежат
только `@keyframes` и три класса `.animate-bounce-in` / `.animate-route` /
`.animate-expansion`. Всё остальное — утилиты.

### Инлайн-стили

Разрешены там, где значение вычисляется в рантайме и не выражается статической
утилитой. Живой пример — размер сетки доски (`board-view.vue:30-33`):

```ts
const gridStyle = computed(() => ({
    gridTemplateColumns: `repeat(${settingsStore.cols}, 32px)`,
    gridTemplateRows: `repeat(${settingsStore.rows}, 32px)`,
}))
```

### `cn()` и cva

`cn()` (`src/core/lib/utils.ts`) — единственный способ слить cva-вывод
с пришедшим `$attrs.class`, применяется только в UI-примитивах:

```vue
:class="cn(selectVariants(), ($attrs.class as string) ?? '')"
```

cva-варианты объявляются прямо в `<script setup>` примитива, тип пропа
выводится через `VariantProps<typeof buttonVariants>`, а не пишется руками.

---

## Composable

```ts
import { ref } from 'vue'
import { useEventListener, useMousePressed } from '@vueuse/core'
import type { CellData, CellSpecialType } from '../types'

// именованный export const + стрелка; имя совпадает с именем файла
export const useMouseAction = () => {
    const { pressed: isPressMouseButton } = useMousePressed()
    const isStartCellMove = ref(false)

    function getMovedCellType(): CellSpecialType | null {
        if (isStartCellMove.value) return 'start'
        return null
    }

    useEventListener(document, 'mouseup', () => {
        isStartCellMove.value = false
    })

    return {
        isPressMouseButton,
        isStartCellMove,
        getMovedCellType,
    }
}
```

DOM/глобальные подписки — через VueUse (`useEventListener`, `useMousePressed`),
не через ручной `addEventListener`.

---

## Pinia-стор

Только setup-сторы. Id — `'<feature>:store'`. Никаких lifecycle-хуков:
`onMounted` не встречается в `src/` ни разу, сброс — обычный метод.

```ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type BoardTool = 'wall' | 'weight' | 'eraser'

export const useEraserStore = defineStore('eraser:store', () => {
    const activeTool = ref<BoardTool>('wall')

    const isEraserMode = computed(() => activeTool.value === 'eraser')

    function setTool(tool: BoardTool) {
        activeTool.value = tool
    }

    return {
        activeTool,
        isEraserMode,
        setTool,
    }
})
```

Живые id: `'board:store'`, `'board-settings:store'`, `'expansion:store'`,
`'eraser:store'`.

Потребление в компоненте: состояние — через `storeToRefs`, экшены — с объекта стора.

```ts
const expansionStore = useExpansionStore()
const { isExpansionInProcess, currentAlgorithm } = storeToRefs(expansionStore)
expansionStore.setSpeed('fast')
```

Композиция сторов — вызовом другого `use*` внутри setup-тела
(`use-expansion-store.ts:20-21`). `$reset()` не используется: сброс пишется руками.

---

## Типы

Union — через `type`, объектные формы — через `interface`. Enum не используем.

```ts
// src/modules/board/types/cell.types.ts
export type CellSpecialType = 'start' | 'target' | 'bomb'
export type CellType = CellSpecialType | 'barrier' | 'route' | ''

export interface CoordsData {
    x: number
    y: number
}

export interface CellData {
    index: number
    coords: CoordsData
    type: CellType
    weight: number
    isVisited: boolean
    isExpansionProcess: boolean
}
```

Импорт типов — всегда `import type` (или инлайн-спецификатор `type`); правило
`typescript/consistent-type-imports` включено как `error` в `.oxlintrc.json`.

`any` запрещён. Для неизвестных значений — `unknown` + сужение (см.
`src/core/lib/is-equal.ts`). Для доступа в решётку после явной проверки границ
используется `cells[coords.y]![coords.x]!` (`algorithms/search.ts:62`), а не `any`.

---

## Barrel (`index.ts`)

Только явные именованные ре-экспорты, `export *` не применяется.
**SFC ре-экспортируется через `default as`** — у `.vue` есть только default-экспорт.
Реальный `src/modules/board/index.ts`:

```ts
export { useBoardStore } from './stores/use-board-store'
export { useExpansionStore } from './stores/use-expansion-store'
export { useMouseAction } from './composables/use-mouse-action'
export { useEraserStore } from './stores/use-eraser-store'
export { useBoardSettingsStore, COLS_MIN, COLS_MAX, ROWS_MIN, ROWS_MAX } from './stores/use-board-settings-store'
export type { CellData, CellSpecialType, CellType, CoordsData, GraphRouteData, GraphTreeData } from './types'
export type { MazePattern } from './utils/maze-generators'
export type { PathfindingAlgorithm, PathfindingAlgorithmId, PathfindingResult } from './algorithms'
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
} from './algorithms'

export { default as BoardView } from './components/board-view.vue'
```

Форма `export { BoardView } from './components/board-view.vue'` **не скомпилируется**.

Внешние потребители импортируют из barrel: `import { BoardView } from '@/modules/board'`.
Barrel не полон: `VisualizationSpeed` и `BoardTool` в него не попали, поэтому
`the-header.vue:22-23` тянет их глубокими путями. Добавляя публичный тип —
экспортируй его из barrel, чтобы не плодить такие импорты.

---

## Форматирование (`.oxfmtrc.json`)

`semi: false`, `singleQuote: true`, `tabWidth: 4`, `useTabs: false`,
`printWidth: 120`, `trailingComma: "es5"`, `arrowParens: "avoid"`,
`singleAttributePerLine: true`, `bracketSpacing: true`.

Отсюда: без точек с запятой, одинарные кавычки, отступ 4 пробела, один
атрибут шаблона на строку, стрелка с одним параметром без скобок (`value => ...`).

Форматирование покрывает **только `src/`**. Корневые `vite.config.ts`,
`tsconfig*.json` намеренно вне зоны oxfmt — не «чини» в них табы и двойные кавычки.

Не форматируй руками — запусти `npm run format`.

---

## Checklist перед завершением

- [ ] Имя файла в kebab-case, экспорт совпадает с именем файла
- [ ] Файл в правильной директории (модуль фичи или `src/core/`, если переиспользуется)
- [ ] Нигде нет `any`
- [ ] Props объявлены type-only (`defineProps<T>()`), дефолты — только через `withDefaults`
- [ ] `defineEmits` не введён без явной необходимости; двусторонняя привязка — `defineModel`
- [ ] Типы импортированы через `import type`
- [ ] Стилизация утилитами Tailwind; новые токены — в `@theme` в `src/assets/styles/tailwind.css`
- [ ] Динамические классы записаны целыми литералами в `Record<Union, string>`
- [ ] `<style scoped>` добавлен только ради `@keyframes`
- [ ] Типы лежат в `types/*.types.ts` и ре-экспортированы из `types/index.ts`
- [ ] Barrel `index.ts` обновлён (SFC — через `export { default as X }`)
- [ ] Новые пользовательские строки добавлены в **оба** файла локалей (см. скилл `i18n-sync`)
- [ ] Прогнаны все гейты и вывод вставлен в ответ (см. скилл `verify-gates`)

---

## Args

Пользователь может передать описание: `/file-writer "стор для управления настройками"` —
используй его, чтобы определить тип сущности, её размещение и публичное API.
