---
name: verify-gates
description: The vue-astar verification protocol — the exact commands to run before reporting any code change complete (npm run type-check, npm run lint, npm run format:check, npm run build), what each gate catches and what it cannot catch, how to fix failures (lint:fix, format), which warnings are known pre-existing noise, and the hard rule that no work may be called done, fixed or passing without pasting the real command output. Use before claiming a task finished, before committing, when a gate fails and you need to know which one to fix first, or whenever you are about to say "should work" without having run anything.
---

# verify-gates — протокол проверки

Тестового фреймворка в проекте нет (в `package.json` отсутствуют vitest, jest,
playwright, cypress), и добавлять его без явной просьбы запрещено. Поэтому
качество держится на четырёх командах ниже. Запускай их **из корня репозитория,
именно в этом порядке** — каждая следующая дороже предыдущей.

---

## 1. `npm run type-check`

```
vue-tsc --noEmit -p tsconfig.app.json --composite false
```

**Ловит:** ошибки типов в `.ts` и в `<script setup>` SFC, несоответствие пропсов
в шаблонах, нарушение интерфейсов (`PathfindingAlgorithm` и т.п.), сломанные
пути алиаса `@/`, забытые ре-экспорты в barrel'ах.

**Не ловит:** отсутствующие ключи i18n (`t()` не типизирован именами ключей —
см. скилл `i18n-sync`), мёртвые экспорты, ошибки времени выполнения.

Успешный прогон печатает только заголовок npm и ничего больше.

**При падении:** правь типы. Никогда не глуши ошибку через `any` (запрещено) и
через `@ts-ignore`. Для неизвестных значений — `unknown` + сужение; для доступа
в решётку после явной проверки границ в проекте принят `cells[y]![x]!`.

---

## 2. `npm run lint`

```
oxlint src
```

Конфигурация — `.oxlintrc.json`: плагины `typescript`, `unicorn`, `oxc`, `vue`;
категории `correctness: error`, `suspicious: warn`; правило
`typescript/consistent-type-imports: error` (импорт типа обязан быть `import type`
или инлайн-`type`); `unicorn/no-array-reverse` выключено.

**Ловит:** типовые баги-паттерны, неотмеченные type-only импорты, vue-специфичные
проблемы. Линтится **только `src/`**.

**При падении:** сначала `npm run lint:fix`, затем перепрогнать `npm run lint`.
Остаток чини руками. Не отключай правила ради прохождения гейта.

---

## 3. `npm run format:check`

```
oxfmt --check "src/"
```

Контракт из `.oxfmtrc.json`: без точек с запятой, одинарные кавычки, отступ
4 пробела, `printWidth: 120`, `trailingComma: "es5"`, `arrowParens: "avoid"`,
`singleAttributePerLine: true`.

**Ловит:** любое отклонение форматирования в `src/`.

**Область — только `src/`.** Корневые `vite.config.ts`, `tsconfig*.json`
намеренно вне зоны форматтера и используют табы с двойными кавычками. Не «чини»
их — это создаст шум в диффе и ничего не улучшит.

**При падении:** `npm run format` (перезапишет файлы), затем перепрогнать
`npm run format:check`. Не выравнивай код руками.

---

## 4. `npm run build`

```
run-p type-check build-only     # build-only = vite build
```

Запускает type-check и `vite build` параллельно через `npm-run-all`.

**Ловит:** ошибки, которых не видят предыдущие гейты — неразрешённые импорты,
проблемы плагинов (`@vitejs/plugin-vue`, `vite-svg-loader`, `@tailwindcss/vite`),
падение сборки CSS. Обязателен, если ты трогал `vite.config.ts`, `tsconfig*`,
`src/assets/styles/tailwind.css`, SVG-иконки или структуру импортов.

Пишет результат в `dist/` — директория в `.gitignore` (строка 12), коммитить
её не нужно.

### Известный шум (не считать регрессией)

```
You or a plugin you are using have set `optimizeDeps.esbuildOptions` but this option is now deprecated.
Vite now uses Rolldown to optimize the dependencies. Please use `optimizeDeps.rolldownOptions` instead.
```

Предупреждение существует до твоих правок (`vite.config.ts:19-23`). Молча его
не «исправляй» — это отдельная задача.

---

## Эталонный вывод чистого дерева

Так выглядит успешный прогон (снято на текущем `master`):

```
> vue-astar@0.0.0 type-check
> vue-tsc --noEmit -p tsconfig.app.json --composite false

---LINT---

> vue-astar@0.0.0 lint
> oxlint src

Found 0 warnings and 0 errors.
Finished in 9ms on 34 files with 129 rules using 11 threads.
---FMT---

> vue-astar@0.0.0 format:check
> oxfmt --check "src/"

Checking formatting...

All matched files use the correct format.
Finished in 147ms on 35 files using 11 threads.
```

```
> vue-astar@0.0.0 build
> run-p type-check build-only

> vue-astar@0.0.0 build-only
> vite build

vite v8.0.8 building client environment for production...
✓ 1805 modules transformed.
dist/index.html                   0.43 kB │ gzip:  0.29 kB
dist/assets/index-zrHC5l4h.css   13.59 kB │ gzip:  3.61 kB
dist/assets/index-BRXUohGW.js   216.55 kB │ gzip: 75.67 kB

✓ built in 408ms
```

Хеши в именах файлов и тайминги будут другими — сравнивать нужно факт успеха,
а не числа.

Прогнать всё одной командой:

```bash
npm run type-check && npm run lint && npm run format:check && npm run build
```

---

## Что гейты не проверяют — проверь руками

Ни один гейт не запускает приложение. Если правка касается поведения,
подними `npm run dev` и проверь глазами:

- **Изменения в алгоритмах / анимации:** «Старт» на скорости `slow` — раскрытие
  идёт клетка за клеткой, затем прорисовывается маршрут; перетаскивание
  старта/цели после завершения поиска перестраивает картинку мгновенно.
- **Изменения в i18n:** обе локали — `/ru` и `/en` — плюс проверка паритета
  ключей из скилла `i18n-sync` (type-check пропущенный ключ не поймает).
- **Изменения в Tailwind-токенах:** цвета клеток и границы доски на месте;
  новые токены объявлены в `@theme` в `src/assets/styles/tailwind.css`
  (корневой `tailwind.config.ts` на стилизацию не влияет).
- **Изменения размеров доски:** значения на границах — 10/80 колонок,
  5/40 строк (`COLS_MIN`/`COLS_MAX`/`ROWS_MIN`/`ROWS_MAX`).

---

## Главное правило

**Работа не считается выполненной, пока в ответ не вставлен реальный вывод
команд.**

- Запрещено писать «должно работать», «изменения корректны», «типы сходятся»,
  не запустив гейты.
- Запрещено пересказывать результат по памяти или придумывать вывод — вставляй
  то, что действительно напечатал терминал.
- Если гейт упал и починить его в рамках задачи нельзя — скажи об этом прямо,
  приведи вывод ошибки и не называй задачу завершённой.
- Если гейт падал **до** твоих правок, покажи это (например, прогоном на чистом
  дереве) и отдели чужую поломку от своей.

## Checklist

- [ ] `npm run type-check` — чисто
- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run format:check` — all matched files use the correct format
- [ ] `npm run build` — сборка успешна
- [ ] Поведенческая проверка в `npm run dev`, если правка меняет поведение
- [ ] Реальный вывод команд вставлен в итоговый ответ
