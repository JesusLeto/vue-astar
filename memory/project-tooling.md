# Тулинг: сборка, линт, формат, типы

Инструменты нестандартные для Vue-стартера. Главное, что нужно запомнить: **это oxlint + oxfmt, а не ESLint и не Prettier.** Файлов `.eslintrc*` и `.prettierrc*` в репозитории нет.

## Пакетный менеджер

Только **npm**, лок-файл `package-lock.json`. Не добавлять `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`.

## Скрипты (`package.json`, дословно)

| Скрипт | Команда | Что делает |
|---|---|---|
| `dev` | `vite` | дев-сервер |
| `build` | `run-p type-check build-only` | параллельно тайп-чек и сборка (`npm-run-all`) |
| `build-only` | `vite build` | продакшен-бандл без проверки типов |
| `preview` | `vite preview` | локальный просмотр собранного бандла |
| `type-check` | `vue-tsc --noEmit -p tsconfig.app.json --composite false` | проверка типов, включая `<script setup>` в SFC |
| `lint` | `oxlint src` | линт (только `src/`) |
| `lint:fix` | `oxlint --fix src` | линт с автофиксом |
| `format` | `oxfmt --write "src/"` | форматирование (только `src/`) |
| `format:check` | `oxfmt --check "src/"` | проверка форматирования без записи |

`build` падает, если падает `type-check` — это единственное место, где тайп-чек связан со сборкой.

## Что ловит каждый гейт

| Гейт | Ловит | НЕ ловит |
|---|---|---|
| `npm run type-check` | ошибки типов в `.ts` и в `<script setup>` SFC; несуществующие пути через алиас `@/` | рассинхрон ключей i18n между `ru.ts` и `en.ts` — файлы локалей нетипизированы и не связаны общей схемой |
| `npm run lint` | `correctness` = error, `suspicious` = warn; `typescript/consistent-type-imports` = error | стилистику — стилистических правил в `.oxlintrc.json` нет вовсе |
| `npm run format:check` | отступы, кавычки, точки с запятой, ширину строки, по атрибуту на строку | что угодно вне `src/` |
| `npm run build` | всё, что ловит `type-check`, плюс ошибки резолва/сборки Vite | рантайм-регрессии — тестов в проекте нет |

## oxlint

`.oxlintrc.json`:

```json
{
  "plugins": ["typescript", "unicorn", "oxc", "vue"],
  "categories": { "correctness": "error", "suspicious": "warn" },
  "rules": {
    "typescript/consistent-type-imports": "error",
    "unicorn/no-array-reverse": "off"
  },
  "env": { "builtin": true }
}
```

- `typescript/consistent-type-imports` — причина, по которой типы **всегда** импортируются как `import type { ... }` или инлайн-спецификатором `type` (например `src/core/router/index.ts:2` — `{ i18n, SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale }`).
- `unicorn/no-array-reverse` отключено намеренно: `search.ts:85` и `:98` используют `Array.prototype.reverse()` при восстановлении маршрута.
- Правило «никакого `any`» линтером **не** обеспечивается — это дисциплина, зафиксированная в `AGENTS.md`/`CLAUDE.md` и соблюдаемая в коде (`src/core/lib/is-equal.ts` типизирует всё через `unknown` + сужение).

## oxfmt

`.oxfmtrc.json`:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "arrowParens": "avoid",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "singleAttributePerLine": true,
  "printWidth": 120,
  "tabWidth": 4,
  "useTabs": false,
  "sortPackageJson": false,
  "ignorePatterns": []
}
```

**Область — только `src/`.** Корневые конфиги форматтер не трогает, поэтому `vite.config.ts` использует табы и двойные кавычки, а `tsconfig*.json` — двухпробельный отступ. Это не рассинхрон, это вне зоны oxfmt; не приводите их к стилю `src/`.

## TypeScript

- Три конфига: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`. Все расширяют `@vue/tsconfig/tsconfig.dom.json`, кроме `tsconfig.node.json` (`@tsconfig/node24/tsconfig.json`).
- `tsconfig.json` и `tsconfig.app.json` — почти дубликаты: одинаковые `include` (`env.d.ts`, `src/**/*`, `src/**/*.vue`), `exclude` (`src/**/__tests__/*`), `composite: true`, `ignoreDeprecations: "6.0"`, `baseUrl`, `paths`. Единственное отличие — `verbatimModuleSyntax: false` в `tsconfig.json`.
- `tsconfig.json` **не** solution-style: секции `references` в нём нет, поэтому `tsconfig.node.json` (покрывающий `vite.config.*`) ни во что не подключён.
- `npm run type-check` работает **только** по `tsconfig.app.json`, значит `verbatimModuleSyntax: false` из `tsconfig.json` на проверку не влияет.
- `env.d.ts` содержит ровно две ссылки: `/// <reference types="vite/client" />` и `/// <reference types="vite-svg-loader" />`.

## Vite

`vite.config.ts`:

- Плагины: `vue()`, `svgLoader()`, `tailwindcss()`.
- `resolve.alias`: `"@" → fileURLToPath(new URL("./src", import.meta.url))`.
- `optimizeDeps.esbuildOptions.tsconfig: "./tsconfig.app.json"`.

### Алиас `@/` объявлен в трёх местах

Меняете алиас — правьте все три синхронно:

1. `vite.config.ts` → `resolve.alias` (для бандлера);
2. `tsconfig.app.json` → `paths: { "@/*": ["./src/*"] }` (для `vue-tsc`);
3. `tsconfig.json` → тот же блок `paths`.

## Tailwind CSS v4

- Подключается **плагином Vite** `@tailwindcss/vite`, а не через PostCSS-пайплайн.
- CSS-first: `src/assets/styles/tailwind.css` — это `@import 'tailwindcss'` плюс блок `@theme` с девятью токенами (`:4-14`): `--color-table`, `--color-cell-barrier`, `--color-cell-route`, `--color-cell-expansion-{0,60,80,100}`, `--grid-template-columns-board`, `--grid-template-rows-board`. Последние два не используются нигде.
- Директив `@config`, `@source`, `@plugin` в файле нет.
- **`tailwind.config.ts` инертен.** Он содержит только `{ content, plugins } satisfies Config`; ни `theme`, ни `safelist` в нём нет, и без `@config` Tailwind v4 его не загружает. Любое утверждение вида «добавь класс в `safelist` в `tailwind.config.js`» — устаревшее.
- Приём вместо safelist: полные строки классов лежат литералами в `Record`-таблицах (`src/modules/board/components/cell-view.vue:18-28`), чтобы сканер контента их увидел. Анимационные классы (`animate-bounce-in`, `animate-route`, `animate-expansion`) вообще не утилиты Tailwind — они написаны руками в `<style scoped>` (`cell-view.vue:91-150`).
- Стилевой файл импортируется один раз, в `src/main.ts:7`.
- `postcss` и `autoprefixer` числятся в `devDependencies`, но `postcss.config.*` в корне нет — они не участвуют в конвейере.

## vite-svg-loader

- Плагин зарегистрирован в `vite.config.ts`, типы подключены в `env.d.ts:2`.
- Импорт обязательно с суффиксом `?component`: `src/core/components/ui/ui-svg.vue:3-4`.
- В `src/assets/icon/` всего два файла — `start.svg` и `target.svg`. Новая иконка требует не только файла, но и записи в карте `icons: Record<string, Component>` внутри `ui-svg.vue:17-20`. Вся остальная иконография берётся из `lucide-vue-next`.

## Тесты

Тест-фреймворка нет: в `package.json` отсутствуют vitest, jest, playwright, cypress. `tsconfig.app.json` исключает `src/**/__tests__/*` «на будущее», но самих тестов нет. Не добавляйте фреймворк и тесты без явной просьбы.

## Порядок проверки перед сдачей изменения

```
npm run lint && npm run format:check && npm run type-check
```

Если правили только `src/` — этого достаточно. `npm run build` дополнительно ловит ошибки резолва и сборки Vite (и сам прогоняет `type-check` внутри `run-p`).

Все они уже в allow-листе `.claude/settings.json` (`Bash(npm run type-check:*)`, `Bash(npm run lint:*)`, `Bash(npm run format:*)`, `Bash(npm run build:*)`, `Bash(npm run build-only:*)`, плюс `npm install` и read-only git), поэтому подтверждения не запрашивают. `.claude/settings.local.json` — локальный оверрайд, там только `Bash(npm install:*)`.

## Ключевые версии зависимостей (`package.json`)

`vue ^3.5.32` · `pinia ^3.0.4` · `vue-router ^4.6.4` · `vue-i18n ^9.14.5` · `@vueuse/core ^14.2.1` · `class-variance-authority ^0.7.1` · `clsx ^2.1.1` · `tailwind-merge ^3.5.0` · `lucide-vue-next ^1.0.0` · `tailwindcss ^4.2.2` + `@tailwindcss/vite ^4.2.2` · `vite ^8.0.8` · `typescript ^6.0.3` · `vue-tsc ^3.2.7` · `oxlint ^1.60.0` · `oxfmt ^0.45.0` · `vite-svg-loader ^5.1.1`.
