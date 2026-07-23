# Конвенции кода

Как должен выглядеть код в этом репозитории. Каждое правило — с живым примером из `src/`. Если правило и код расходятся, побеждает код: сначала перечитайте пример.

## Именование файлов и компонентов

- **Все** файлы kebab-case, включая SFC: `board-view.vue`, `cell-view.vue`, `the-header.vue`, `ui-button.vue`, `use-board-store.ts`, `use-mouse-action.ts`, `cell.types.ts`, `astar.algorithm.ts`, `maze-generators.ts`.
- Суффиксы ролей: `*-view.vue` — вью/страницы и «экранные» компоненты, `the-*.vue` — синглтоны, `ui-*.vue` — примитивы в `src/core/components/ui/`, `use-*-store.ts` — Pinia-сторы, `use-*.ts` — composables, `*.types.ts` — типы.
- Компоненты импортируются PascalCase, а в шаблоне пишутся kebab-case. Это касается и lucide-иконок: `the-header.vue:17` импортирует `BrickWall`, а рендерит `<brick-wall class="h-4 w-4" />`. Единственный PascalCase-тег в проекте — `<RouterView />` в `src/App.vue:2`.

## Структура SFC

Порядок блоков: `<script setup lang="ts">` → `<template>` → опциональный `<style scoped>`. Эталон — `src/modules/board/components/cell-view.vue` (`:1`, `:61`, `:91`). Исключение по порядку атрибутов: `src/core/components/ui/ui-svg.vue:1` пишет `<script lang="ts" setup>` — не копируйте, но и не «чините» ради чистки.

## Props, emits, v-model

- Props только типом-дженериком. Инлайн-литерал, если дефолтов нет (`cell-view.vue:8-14`); отдельный `interface Props`, если props много (`ui-button.vue:34-39`, `ui-select.vue:10-13`). Runtime-объектного синтаксиса нет нигде.
- Дефолты только через `withDefaults`: `ui-button.vue:41-43` (`as: 'button'`), `ui-svg.vue:6-15` (`name: ''`, `size: 'big'`).
- **`defineEmits` не используется ни разу.** Ребёнок отдаёт наружу нативные DOM-события со своего корня, родитель оборачивает payload в стрелку:
  ```vue
  <!-- src/modules/board/components/board-view.vue:88-89 -->
  @mousedown="() => onCellMousedown(data)"
  @mousemove="() => onCellMousemove(data)"
  ```
  Не вводите `defineEmits` без явной просьбы — в кодовой базе нет ни одного примера для подражания.
- Двусторонняя привязка — `defineModel`, а не пара `modelValue` / `update:modelValue`: `ui-select.vue:17` `const model = defineModel<string>({ required: true })`, запись обратно в шаблонном `@change` (`:30`).
- `defineOptions({ inheritAttrs: false })` идёт в паре с ручным мержем `$attrs.class` (`ui-select.vue:15`, `:28`). `ui-button.vue:49` мержит `($attrs.class as string) ?? ''` через `cn()`, но `inheritAttrs` не отключает.

## Типизация

- `any` запрещён. Неизвестные значения — `unknown` + сужение утверждениями: `src/core/lib/is-equal.ts` типизирует параметры как `unknown` и сужает через `(first as object)?.constructor?.name`, `first as unknown[]`, `first as Record<string, unknown>`.
- `interface` для объектных форм, `type` для строковых union'ов: `src/modules/board/types/cell.types.ts:1-2` (`CellSpecialType`, `CellType`) против `:4-17` (`CoordsData`, `CellData`).
- Enum'ов нет. Домен всегда строковые union'ы: `PathfindingAlgorithmId` (`algorithms/algorithm.types.ts:3-11`), `MazePattern` (`utils/maze-generators.ts:4-10`), `BoardTool` (`stores/use-eraser-store.ts:4`), `VisualizationSpeed` (`stores/use-expansion-store.ts:9`), `DrawMode` (`stores/use-board-store.ts:9`).
- Типы всегда импортируются как `import type` или инлайн-спецификатором `type` — это `error` в `.oxlintrc.json` (`typescript/consistent-type-imports`). Примеры: `cell-view.vue:6`, `the-header.vue:21-23`, `src/core/router/index.ts:2` (`{ i18n, SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale }`).
- Табличные соответствия по union'у — `Record<Union, T>`: `VISIT_DELAYS: Record<VisualizationSpeed, number>` (`use-expansion-store.ts:11`), `BASE_CLASSES: Record<CellVisualType, string>` (`cell-view.vue:18`), `Record<PathfindingAlgorithmId, PathfindingAlgorithm>` (`the-header.vue:51`).
- `satisfies` предпочтительнее аннотации, чтобы сохранить литеральные типы: `algorithmOptions ... satisfies SelectOption[]` (`the-header.vue:54-57`), `pathfindingAlgorithms = [...] as const satisfies readonly PathfindingAlgorithm[]` (`algorithms/search.ts:445-454`), `tailwind.config.ts:3-6`.
- Входные данные чистых хелперов помечаются `readonly` / `ReadonlySet`: `previous: readonly (number | null)[]` (`search.ts:72`), `protectedIndexes: ReadonlySet<number>` (`maze-generators.ts:231`), `options: readonly SelectOption[]` (`ui-select.vue:11`).
- Доступ в сетку — optional chaining плюс non-null assertion после явной фильтрации границ, вместо `any`: `cells[coords.y]![coords.x]!` (`search.ts:62`).

## Функции: стрелка или declaration

Оба стиля живут в проекте, но не вперемешку:

- Маленькие чистые хелперы — `const` со стрелкой и явным возвращаемым типом: `const manhattanDistance = (a: CoordsData, b: CoordsData): number => ...` (`search.ts:37`), `const delay = (time: number) => ...` (`utils/delay.ts:1`).
- Многоветочные алгоритмы — `function`-декларации: `function runWeightedSearch(...)` (`search.ts:167`), `function generateMazePattern(...)` (`maze-generators.ts:228`).
- Экшены сторов чаще стрелки-константы (`use-board-store.ts:34`, `:48`, `:88`, `:175`), но `use-eraser-store.ts:12-26` пишет их `function`-декларациями. Внутри одного файла держитесь стиля этого файла.
- Composables — всегда `export const useX = () => {...}`: `use-mouse-action.ts:5`, `use-eraser-mode.ts:5`. Внутренние хелперы composable — `function`-декларации (`use-mouse-action.ts:12`, `:28`, `:35`).

## Pinia

- Только setup-сторы: `defineStore('<name>:store', () => { ... return { ... } })`. Id всегда с суффиксом `:store` — `'board:store'`, `'expansion:store'`, `'eraser:store'`, `'board-settings:store'`.
- Возвращается явный объектный литерал со списком публичного API (`use-board-store.ts:183-200`).
- `$reset()` не вызывается нигде; сброс — рукописный экшен: `reset()` пересобирает доску (`use-board-store.ts:175-181`), `onReset()` сбрасывает флаг и делегирует в `boardStore.reset()` (`use-expansion-store.ts:106-109`).
- Lifecycle-хуков в сторах нет: `onMounted` не встречается в `src/` ни разу.
- Кросс-сторовые побочные эффекты — `watch` внутри setup-тела стора: `use-expansion-store.ts:93-99`.
- На месте использования: реактивное состояние — через `storeToRefs`, экшены — прямо с объекта стора. Пример: `board-view.vue:11-15` и `:27` против `boardStore.setCellSetting(...)` в `:41`; то же в `the-header.vue:29-38`.
- Fire-and-forget async-вызовы помечаются `void`: `void onStart(true)` (`use-expansion-store.ts:97`), `void expansionStore.onStart()` (`the-header.vue:154`).
- Инварианты живут в сторе, а не на месте вызова: каждый мутатор ячейки начинается с раннего выхода по `isProtectedCell` (`use-board-store.ts:81`, `:89`, `:148`, `:154`).

## Barrel-экспорты

- Только явные именованные реэкспорты, `export *` не используется.
- Типы — `export type { ... } from`: `src/modules/board/index.ts:6-8`, `src/modules/board/types/index.ts:1-2`, `src/modules/board/algorithms/index.ts:1`.
- SFC — `export { default as X } from './x.vue'`: `src/modules/board/index.ts:21`. У SFC нет именованного экспорта, `export { BoardView } from '...'` не скомпилируется.
- Внешние потребители импортируют из `@/modules/board`; внутримодульный код — относительными путями (`cell-view.vue:5` — `@/core/...`, `:6` — `../types`).

## Стилизация

- Utility-first Tailwind v4. `<style scoped>` есть ровно в одном файле — `cell-view.vue:91-150` — и содержит только `@keyframes` и три класса `.animate-bounce-in` (500ms), `.animate-route` (200ms + `transform: scale(1.0666)`), `.animate-expansion` (1200ms).
- Keyframes читают токены темы напрямую как CSS-переменные: `var(--color-cell-expansion-0|60|80|100)` (`cell-view.vue:124-141`).
- Токены объявляются CSS-first в `@theme` в `src/assets/styles/tailwind.css:4-14` и потребляются как сгенерированные утилиты (`bg-cell-barrier`, `bg-cell-route`, `border-table`). Хардкод hex в компонентах не используется.
- Динамические классы хранятся **целыми строковыми литералами** в `Record`-таблицах уровня модуля, чтобы сканер Tailwind их видел; конкатенацией классы не собираются: `BASE_CLASSES` / `ANIMATION_CLASSES` в `cell-view.vue:18-28`, склейка в computed `cellStatusStyle` (`:30-43`). `safelist` в проекте нет и не нужен.
- Инлайн-стиль допустим там, где значение динамическое и не выражается статической утилитой: `gridStyle` computed в `board-view.vue:30-33`, привязка `:style="gridStyle"` в `:71`.
- `cn()` (`src/core/lib/utils.ts:4-6`, `twMerge(clsx(inputs))`) применяется **только** для мержа вывода cva с входящим `$attrs.class`: `ui-button.vue:49`, `ui-select.vue:28`. В компонентах доски классы биндятся обычными массивами/тернарниками (`cell-view.vue:80`, `board-view.vue:70`).
- Варианты cva объявляются прямо в `<script setup>` примитива, отдельного файла вариантов нет: `buttonVariants` (`ui-button.vue:5-30`), `selectVariants` (`ui-select.vue:20-22` — только базовая строка, без объекта variants).
- Типы prop'ов вариантов выводятся из cva, а не пишутся руками: `type ButtonVariants = VariantProps<typeof buttonVariants>` (`ui-button.vue:32`), затем `variant?: ButtonVariants['variant']` (`:35`).
- Полиморфный корень — через `<component :is="props.as">` с prop `as?: string` и дефолтом `'button'` (`ui-button.vue:37`, `:42`, `:48`).

## Иконки

- Два локальных SVG подключаются с суффиксом `?component` (vite-svg-loader) и регистрируются в карте внутри примитива: `ui-svg.vue:3-4` и `icons: Record<string, Component>` (`:17-20`). **Новая иконка требует правки этой карты**, а не только файла в `src/assets/icon/`.
- Размер — через prop `size` (`'big' | 'medium' | 'small' | 'xsmall' | ''`, дефолт `'big'`), маппинг в computed `sizeClass` (`ui-svg.vue:22-30`). Вызов по имени: `<ui-svg :name="data.type" draggable="false" />` (`cell-view.vue:66-70`).
- Вся остальная иконография — прямые импорты из `lucide-vue-next` с Tailwind-размерами: `the-header.vue:17`, `cell-view.vue:3` (`<bomb class="h-5 w-5 text-red-600" :stroke-width="2.5" />`).

## Константы и «магические числа»

Настроечные значения выносятся в `const` уровня модуля рядом с потребителем, а не разбрасываются по коду: `VISIT_DELAYS` / `ROUTE_DELAY` (`use-expansion-store.ts:11-17`), `COLS_MIN`/`COLS_MAX`/`ROWS_MIN`/`ROWS_MAX` (`use-board-settings-store.ts:4-7`), `CELL_WEIGHT` (`constants.ts:7`), вероятности заполнения `0.25` / `0.35` в `maze-generators.ts:234-235`.

## i18n

- Плоские (без вложенности) объекты с camelCase-ключами, `export default`, по файлу на локаль: `src/core/i18n/locales/en.ts:1-28`, `ru.ts:1-28`.
- Composition-режим (`legacy: false`, `src/core/i18n/index.ts:9-14`), потребление — `const { t, locale } = useI18n()` (`the-header.vue:26`).
- **Общей схемы сообщений нет.** Оба файла — независимые нетипизированные литералы, аугментации `DefineLocaleMessage` нет. `npm run type-check` не поймает ключ, добавленный только в один файл. Каждый новый ключ добавляйте вручную в **оба** файла, в одном и том же порядке. Сейчас в обоих 26 ключей; в `ru.ts:17-19` три значения ещё не переведены (`recursiveDivision`, `verticalDivision`, `horizontalDivision`).
- Смена языка — только `router.push(`/${locale}`)` (`the-header.vue:76-79`). Не присваивайте `i18n.global.locale` из компонента — это делает гард роутера.
- Добавление локали — три согласованные правки: union `Locale` и массив `SUPPORTED_LOCALES` в `src/core/i18n/index.ts:5-6`, объект `messages` (`:13`) и новый файл в `locales/`. Паттерн маршрута и `<select>` языка выводятся из `SUPPORTED_LOCALES` автоматически.

## Форматирование

Задаётся `.oxfmtrc.json`, править вручную не нужно — `npm run format` приводит к норме:

`semi: false`, `singleQuote: true`, `trailingComma: "es5"`, `arrowParens: "avoid"`, `bracketSpacing: true`, `bracketSameLine: false`, `singleAttributePerLine: true`, `printWidth: 120`, `tabWidth: 4`, `useTabs: false`.

Отсюда: каждый атрибут шаблона на своей строке (`the-header.vue:163-171`) и стрелки без скобок вокруг одного параметра (`use-board-store.ts:49`, `the-header.vue:74`).

Форматтер ходит **только по `src/`**. `vite.config.ts` намеренно использует табы и двойные кавычки — это вне зоны oxfmt, не «чините».
