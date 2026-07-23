# vue-builder — project memory

> Персистентная память роли. Читать перед работой, дополнять после.

## Владение

- `src/core/components/` — `the-header.vue` и примитивы `ui/` (`ui-button.vue`, `ui-select.vue`, `ui-svg.vue`)
- `src/core/views/home-view.vue`, `src/App.vue`
- `src/modules/board/components/` — `board-view.vue`, `cell-view.vue`
- `src/modules/board/composables/` — `use-mouse-action.ts`, `use-eraser-mode.ts`
- `src/assets/styles/tailwind.css`, `src/assets/icon/`
- Читать (не менять без согласования): `src/modules/board/stores/`, `src/modules/board/algorithms/`

## Инварианты

- Только `<script setup lang="ts">`, порядок блоков: script → template → опциональный `<style scoped>`. Пример: `src/modules/board/components/cell-view.vue:1`, `:61`, `:91`. Единственное отклонение по порядку атрибутов — `<script lang="ts" setup>` в `src/core/components/ui/ui-svg.vue:1`.
- Пропсы объявляются ТОЛЬКО через type-only дженерик: инлайн `defineProps<{...}>()` (`cell-view.vue:8-14`) или `interface Props` + `withDefaults` (`ui-button.vue:34-43`, `ui-svg.vue:6-15`). Runtime-объектного синтаксиса пропсов в репозитории нет.
- `defineEmits` в проекте НЕ используется ни разу (проверено grep по `src/`). Связь ребёнок→родитель — нативное DOM-событие на корне ребёнка + стрелка-обёртка в родителе: `board-view.vue:88-89` (`@mousedown="() => onCellMousedown(data)"`). Не вводить `defineEmits`, не спросив.
- Двусторонняя привязка — `defineModel<T>({ required: true })`, а не пара `modelValue`/`update:modelValue`: `ui-select.vue:17`, запись обратно в `@change` на `:30`.
- Компоненты импортируются PascalCase, а в шаблоне пишутся kebab-case — включая иконки lucide: `the-header.vue:17` импортирует `BrickWall`, рендерит `<brick-wall class="h-4 w-4" />` на `:205`. Единственный PascalCase-тег во всём проекте — `<RouterView />` в `src/App.vue:2`.
- Имена файлов — kebab-case без исключений: `board-view.vue`, `the-header.vue`, `ui-select.vue`, `use-mouse-action.ts`.
- Стор читается через `storeToRefs` для состояния (`board-view.vue:11-15`, `:27`, `the-header.vue:29-38`), а экшены зовутся с самого объекта стора (`board-view.vue:41`, `:47`, `the-header.vue:92`, `:117`).
- Классы через `cn()` (`src/core/lib/utils.ts:4-6`) только там, где надо смешать вывод `cva` с `$attrs.class`: `ui-button.vue:49`, `ui-select.vue:28`. В компонентах доски `cn()` не применяется — там массивы классов/тернарники (`cell-view.vue:80`, `board-view.vue:70`).
- `cva`-варианты живут внутри `<script setup>` самого примитива, тип варианта выводится через `VariantProps<typeof x>`, а не пишется руками: `ui-button.vue:5-32`.
- Никогда `any`. При работе с `$attrs.class` используется явное сужение `($attrs.class as string) ?? ''` (`ui-button.vue:49`).
- Все пользовательские строки — только через `t('key')` из `useI18n()` (`the-header.vue:26`). Хардкод текста в шаблоне запрещён. Исключение по факту: `algorithm.label` (`the-header.vue:54-57`) — это техническое имя алгоритма, не переводится.
- Форматирование задаёт oxfmt (`.oxfmtrc.json`): без точек с запятой, одинарные кавычки, отступ 4 пробела, printWidth 120, `singleAttributePerLine: true` (каждый атрибут шаблона на своей строке — см. `the-header.vue:163-171`), `arrowParens: "avoid"`.
- Тип-импорты всегда помечаются `import type` — правило `typescript/consistent-type-imports: "error"` в `.oxlintrc.json`.

## Карта кода

- `src/App.vue` — 3 строки, только `<RouterView />`; лэйаута тут нет.
- `src/core/views/home-view.vue` — оболочка страницы: `<the-header />` + `<board-view />` (`:6-13`).
- `src/core/components/the-header.vue` — вся панель управления (289 строк): инпуты размера сетки, 4 `<ui-select>` (алгоритм / скорость / паттерн / локаль), кнопки инструментов, бомбы, очистки, старта. Здесь же `clamp` + `applyGridSize` (`:104-118`).
- `src/core/components/ui/ui-button.vue` — cva-кнопка, 7 вариантов (`default|destructive|outline|secondary|ghost|link|success`) и 4 размера; полиморфный корень `<component :is="props.as">` с `as` по умолчанию `'button'` (`:37`, `:42`, `:48`).
- `src/core/components/ui/ui-select.vue` — нативный `<select>`; экспортирует `interface SelectOption { value: string; label: string }` (`:5-8`), которую импортируют потребители (`the-header.vue:20`). `cva` без блока `variants` (`:20-22`).
- `src/core/components/ui/ui-svg.vue` — резолвер локальных SVG по имени через `Record<string, Component>` (`:17-20`) и размерный пропс `size` (`:22-30`).
- `src/modules/board/components/board-view.vue` — сетка: `gridStyle` computed (`:30-33`) даёт inline `grid-template-*`, рендер `v-for` по `boardCellsState`, mousedown/mousemove роутятся в ластик или в `useMouseAction` (`:50-64`).
- `src/modules/board/components/cell-view.vue` — одна клетка: `BASE_CLASSES`/`ANIMATION_CLASSES` (`:18-28`), computed `cellStatusStyle` (`:30-43`), `<style scoped>` с тремя keyframes (`:91-150`).
- `src/modules/board/composables/use-mouse-action.ts` — состояние перетаскивания start/target/bomb, флаг клавиши `W` (`:41-46`), глобальные слушатели через `useEventListener` (`:41-48`).
- `src/assets/styles/tailwind.css` — `@import 'tailwindcss'` + блок `@theme` с 9 токенами (`:4-14`).

## Решённые вопросы

- Сетка доски рисуется inline-стилем, а не Tailwind-классом: `board-view.vue:30-33` строит `repeat(${settingsStore.cols}, 32px)` и биндит `:style="gridStyle"` на `:71`. Это осознанное решение, т.к. размер сетки настраивается пользователем. Токены `--grid-template-columns-board` / `--grid-template-rows-board` (`tailwind.css:12-13`) — мёртвый остаток старой фиксированной доски 50x28, нигде не используются.
- Размер клетки зафиксирован 32px в двух местах: `board-view.vue:31-32` (`repeat(..., 32px)`) и `cell-view.vue:63` (`w-8 h-8`). Менять надо синхронно.
- Анимации клетки написаны руками в `<style scoped>` (`cell-view.vue:91-150`), а не Tailwind-утилитами: `bounce-in` 500ms (стена), `route-in` 200ms + `transform: scale(1.0666)` (маршрут), `expansion-in` 1200ms (волна). Keyframes читают токены темы напрямую: `var(--color-cell-expansion-0|60|80|100)` (`:124-141`).
- Динамические классы клетки хранятся ЦЕЛЫМИ строковыми литералами в `Record`-таблицах (`cell-view.vue:18-28`), чтобы сканер Tailwind v4 их видел. Не собирать классы конкатенацией.
- `<style scoped>` есть ровно в одном файле — `cell-view.vue`. Всё остальное — Tailwind-утилиты.
- Иконки: только две локальные SVG (`start.svg`, `target.svg`) через `?component`; вся остальная иконография — `lucide-vue-next` напрямую (`the-header.vue:17`, `cell-view.vue:3`).
- Панель управления не разбита на подкомпоненты — весь UI управления живёт в одном `the-header.vue`. Дробление не начинали.
- Дизайн-токены объявляются CSS-first в `@theme` (`tailwind.css:4-14`), а не в `tailwind.config.ts`.

## Грабли

- `tailwind.config.ts` в корне содержит только `{ content, plugins }` и под Tailwind v4 фактически не подключён: в `tailwind.css` нет директивы `@config`. Ни `safelist`, ни `theme` в нём нет. Любая правка цветов/токенов идёт в `@theme` внутри `src/assets/styles/tailwind.css`.
- Класс `cell` на `cell-view.vue:79` не имеет ни одного CSS-правила — ни в scoped-блоке, ни в `tailwind.css`. Не считать его рабочим хуком стилей.
- `src/modules/board/composables/use-eraser-mode.ts` — мёртвый код, ни одного импортёра. Режим инструмента живёт в `useEraserStore` (`src/modules/board/stores/use-eraser-store.ts`), где `BoardTool = 'wall' | 'weight' | 'eraser'`. Не подключать композабл заново.
- `board-view.vue` импортирует часть зависимостей через собственный бочонок `@/modules/board` (`:4`, `:7`, `:8`) и часть — относительными путями (`:6`, `:9`). Правило по факту: внутри модуля — относительные пути, наружу — бочонок; текущий файл его нарушает. Новый код внутри модуля пиши относительными путями.
- Два типа НЕ реэкспортированы из бочонка и требуют глубокого импорта: `VisualizationSpeed` (`@/modules/board/stores/use-expansion-store`) и `BoardTool` (`@/modules/board/stores/use-eraser-store`) — см. `the-header.vue:22-23`. `CellView` тоже не в бочонке (там только `BoardView`, `src/modules/board/index.ts:21`).
- `ui-select.vue` типизирован как `defineModel<string>()`, а `the-header.vue` биндит в него `ref<PathfindingAlgorithmId>`, `ref<MazePattern>`, `ref<VisualizationSpeed>`, `computed<Locale>` (`:186`, `:191`, `:196`, `:281`). Работает за счёт того, что все они — подтипы `string`; при ужесточении типа модели это сломается.
- Кнопки блокируются флагами возможностей алгоритма, а не списком id: `!currentAlgorithm.weighted` глушит «Вес» (`the-header.vue:218`), `!currentAlgorithm.supportsBomb` — «Бомбу» (`:234`). Добавляя UI-элемент, завязывайся на флаг из `PathfindingAlgorithm`, а не на `id`.
- `withDefaults` + `defineModel` в одном компоненте не встречается; `ui-select.vue` отключает наследование атрибутов (`defineOptions({ inheritAttrs: false })`, `:15`), а `ui-button.vue` — нет. Копируя примитив, проверь, какой из двух шаблонов берёшь.
- oxfmt форматирует только `src/`. Корневые `vite.config.ts` / `tsconfig*.json` намеренно вне форматтера (там табы и двойные кавычки) — не «чинить».
- Форматтер и линтер — oxfmt/oxlint, НЕ prettier/eslint. Команды: `npm run lint`, `npm run format:check`, `npm run type-check`.
