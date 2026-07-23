# project-reviewer — project memory

> Персистентная память роли. Читать перед работой, дополнять после.

## Владение

- Ничего не редактирует по умолчанию — роль читающая. Пишет только отчёт/замечания.
- Зона внимания: весь `src/`, корневые конфиги (`package.json`, `vite.config.ts`, `tsconfig*.json`, `.oxlintrc.json`, `.oxfmtrc.json`, `tailwind.config.ts`), `AGENTS.md`/`CLAUDE.md`, `memory/`.
- Правки вносит только по явной просьбе и точечно (fix-по-замечанию), не рефакторит соседний код.

## Инварианты

- Проверочный конвейер — ровно четыре команды из `package.json:6-16`:
  `npm run type-check` → `vue-tsc --noEmit -p tsconfig.app.json --composite false`;
  `npm run lint` → `oxlint src`;
  `npm run format:check` → `oxfmt --check "src/"`;
  `npm run build` → `run-p type-check build-only`.
  Никогда не утверждать «работает», не прогнав их.
- Линтер и форматтер — oxlint + oxfmt, НЕ eslint/prettier (`package.json:36-37`). Замечания в терминах eslint/prettier невалидны.
- Тестового фреймворка нет (в `package.json` нет vitest/jest/playwright/cypress). Не требовать тестов и не заводить их — правило AGENTS.md.
- `any` запрещён. Валидный обход — `unknown` + сужение (`src/core/lib/is-equal.ts`) или non-null assertion после явной проверки границ (`src/modules/board/algorithms/search.ts:62`).
- Тип-импорты обязаны быть помечены: `typescript/consistent-type-imports: "error"` (`.oxlintrc.json`).
- Пакетный менеджер — npm, лок-файл `package-lock.json`. Появление `pnpm-lock.yaml`/`yarn.lock`/`bun.lockb` — блокирующее замечание.
- Форматирование: `semi: false`, `singleQuote: true`, `trailingComma: "es5"`, `arrowParens: "avoid"`, `singleAttributePerLine: true`, `printWidth: 120`, `tabWidth: 4`, `useTabs: false` (`.oxfmtrc.json`).
- Новая строка UI = ключ В ОБА файла `src/core/i18n/locales/ru.ts` и `en.ts`; тип-чек этого не ловит (файлы нетипизированы, общей схемы нет).

## Карта кода

- `package.json` — 9 скриптов (`dev`, `build`, `preview`, `build-only`, `type-check`, `lint`, `lint:fix`, `format`, `format:check`, `package.json:6-16`); все девять перечислены в таблице команд `AGENTS.md:9-21`.
- `.oxlintrc.json` — плагины `typescript/unicorn/oxc/vue`, `correctness: error`, `suspicious: warn`, две переопределённые рулы (`consistent-type-imports: error`, `unicorn/no-array-reverse: off`). Стилистических правил НЕТ — стиль это работа oxfmt.
- `.oxfmtrc.json` — контракт форматирования; `ignorePatterns: []`.
- `vite.config.ts` — плагины `vue()`, `svgLoader()`, `tailwindcss()`; алиас `@` → `./src`; `optimizeDeps.esbuildOptions.tsconfig: "./tsconfig.app.json"`.
- `tsconfig.app.json` / `tsconfig.json` — почти дубликаты (оба расширяют `@vue/tsconfig/tsconfig.dom.json`, оба задают `paths { "@/*": ["./src/*"] }`); `tsconfig.json` дополнительно ставит `verbatimModuleSyntax: false`. `references` нет.
- `tailwind.config.ts` — только `{ content, plugins }`.
- `src/assets/styles/tailwind.css` — `@import 'tailwindcss'` + `@theme` с 9 токенами (`:4-14`).
- `AGENTS.md` — источник правды для агентов; `CLAUDE.md` — симлинк на него.

## Решённые вопросы

- `CLAUDE.md` намеренно является симлинком на `AGENTS.md` — один источник правды для всех агентов. НЕ предлагать заменить его обычным файлом и не дублировать содержимое.
- Tailwind v4 подключён плагином `@tailwindcss/vite`, конфигурация CSS-first. Корневой `tailwind.config.ts` под v4 не загружается: в `tailwind.css` нет директивы `@config`, поэтому его `content`/`plugins` инертны. Замечание «добавь в safelist / в theme конфига» — невалидно.
- Алиас `@` объявлен ДВАЖДЫ и должен оставаться синхронным: `resolve.alias` в `vite.config.ts` и блок `paths` в обоих `tsconfig.app.json` и `tsconfig.json`.
- oxfmt форматирует только `src/`. Корневые конфиги (`vite.config.ts` с табами и двойными кавычками) намеренно вне его зоны — это НЕ дефект стиля.
- Реализации алгоритмов централизованы в `src/modules/board/algorithms/search.ts`; `astar.algorithm.ts` и `bfs.algorithm.ts` — однострочные реэкспорт-шимы. Это осознанное решение, а не дубликаты для удаления.
- Анимация поиска построена на последовательном `await delay(...)` в `src/modules/board/stores/use-expansion-store.ts:42-59`. Предложение «сбатчить мутации» или «Promise.all для ускорения» ломает продукт — это не оптимизация.
- `defineEmits` в проекте не используется вообще; связь ребёнок→родитель идёт через нативные DOM-события (`board-view.vue:88-89`), двусторонняя привязка — через `defineModel` (`ui-select.vue:17`). Не требовать типизированных emits «по канону Vue».
- Наивная `PriorityQueue` с пересортировкой на каждом `add` (`search.ts:12-28`) принята сознательно: доска максимум 80x40 = 3200 клеток.
- Клампинг размеров сетки живёт в UI (`the-header.vue:104-118`), а не в сторе — `use-board-settings-store.ts` отдаёт голые рефы.

## Грабли

- РАСХОЖДЕНИЕ ИНДЕКСА GIT: `git ls-files -s CLAUDE.md` возвращает `100644 ...` — в индексе он всё ещё обычный ФАЙЛ, а `AGENTS.md` не отслеживается вовсе. Значит свежий clone получит СТАРЫЙ закоммиченный `CLAUDE.md`, а не `AGENTS.md`. Проверять это при ревью до мержа.
- Закоммиченный blob `CLAUDE.md` (`git show HEAD:CLAUDE.md`) сильно устарел: «Tailwind CSS v3», «PrimeVue 4 с темой Aura», «npm run lint # ESLint fix», «сетка всегда 50x28 — не параметризовать», `src/components/shared/`, `useXxxStore.ts`, `services/queue.service.ts`. Реальность: Tailwind v4, PrimeVue вообще не зависимость, линтер oxlint, сетка параметризуема (10-80 колонок, 5-40 строк), общие UI-примитивы в `src/core/components/ui/`, файлы kebab-case.
- `constants.ts` вводит в заблуждение: из пяти констант импортируется только `CELL_WEIGHT` (`use-board-store.ts:4`). `BOARD_COLS`/`BOARD_ROWS`/`START_CELL_COORDS`/`TARGET_CELL_COORDS` — мёртвые (ноль импортёров). Живой размер: `ref(50)`/`ref(28)` в `use-board-settings-store.ts:10-11`; живые старт/цель: `getDefaultCoords()` (`generate-default-board.ts:28-38`) — при 50x28 это (12,14) и (37,14), а не значения из `constants.ts`. AGENTS.md это уже фиксирует (`AGENTS.md:64`) — не заводить повторное замечание.
- Бочонок модуля неполон: `VisualizationSpeed` и `BoardTool` не реэкспортированы, `the-header.vue:22-23` тянет их глубокими путями (`@/modules/board/stores/use-expansion-store`, `.../use-eraser-store`); `CellView` в бочонке отсутствует (есть только `BoardView`, `src/modules/board/index.ts:21`). Фиксировать как долг — правило AGENTS.md:48 («cross-module imports go through the module barrel») формально нарушено самим хедером.
- Мёртвый код (фиксировать, но НЕ удалять по своей инициативе): `src/modules/board/composables/use-eraser-mode.ts` (ноль импортёров); токены `--grid-template-columns-board` / `--grid-template-rows-board` в `tailwind.css:12-13`; класс `cell` в `cell-view.vue:79` без CSS-правила; `src/modules/board/types/graph.types.ts` (реэкспортируется, но не используется); пустая директория `src/modules/board/services/`.
- ДОЛГ ЛОКАЛИЗАЦИИ: `src/core/i18n/locales/ru.ts:17-19` — `recursiveDivision`, `verticalDivision`, `horizontalDivision` остались на английском.
- Скилл считается рабочим, только если лежит как `.claude/skills/<name>/SKILL.md` с YAML-фронтматтером (`name`, совпадающий с именем директории, и `description`). Плоский `.claude/skills/<name>.md` Claude Code НЕ загружает. Сейчас в репозитории четыре валидных скилла: `add-algorithm`, `file-writer`, `i18n-sync`, `verify-gates`.
- Агенты — `.claude/agents/<name>.md` с фронтматтером `name` (= имя файла), `description`, `tools`, `model`. Сейчас их четыре: `vue-builder`, `algorithm-engineer`, `i18n-keeper`, `project-reviewer`; у всех `model: inherit`, у `project-reviewer` инструменты только на чтение (`Read, Grep, Glob, Bash`).
- Пермишены разнесены: общий `.claude/settings.json` (закоммичен, в allow-листе `npm install`, `npm run type-check`, `lint`, `format`, `format:check`, `build`, `build-only`, `git status`/`diff`/`log`) и локальный `.claude/settings.local.json` (игнорируется git'ом, только `Bash(npm install:*)`). Проверочные команды подтверждения не требуют — если требуют, смотри `.claude/settings.json`.
- `.gitignore:30-35` намеренно шарит скаффолдинг и прячет локальное состояние: `.claude/*` + исключения `!.claude/settings.json`, `!.claude/skills/`, `!.claude/agents/`, затем снова `.claude/settings.local.json`. Не заменять этот блок на голую строку `.claude` — это выкинет из репозитория скиллы и агентов.
- `board-view.vue` импортирует часть зависимостей через собственный бочонок `@/modules/board` (`:4`, `:7`, `:8`) и часть относительными путями (`:6`, `:9`) — нарушение правила «внутри модуля относительные пути, наружу бочонок». Известно, фиксировать как долг.
- Название проекта `vue-astar` вводит в заблуждение: алгоритмов восемь (bfs, dfs, dijkstra, astar, greedy, swarm, convergentSwarm, bidirectionalSwarm), плюс бомба-вейпоинт и 6 паттернов лабиринта.
- vue-i18n здесь 9.14.5 — рецепты из документации v10/v11 могут не применяться.
