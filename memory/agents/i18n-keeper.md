# i18n-keeper — project memory

> Персистентная память роли. Читать перед работой, дополнять после.

## Владение

- `src/core/i18n/index.ts` — фабрика i18n, `Locale`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`
- `src/core/i18n/locales/ru.ts`, `src/core/i18n/locales/en.ts`
- `src/core/router/index.ts` — локаль-префиксный роутинг и `beforeEach`
- Читать / править только строки: `src/core/components/the-header.vue` (единственный потребитель `t()`)

## Инварианты

- Ключи добавляются СРАЗУ в оба файла — `ru.ts` и `en.ts` — в одном и том же порядке. Ничто это не проверяет: оба файла — нетипизированные `export default { ... }` (`locales/en.ts:1-28`, `locales/ru.ts:1-28`), общей схемы `MessageSchema` нет, `declare module 'vue-i18n'` нет. `npm run type-check` пропущенный ключ НЕ поймает.
- Ключи плоские (без вложенности) и в camelCase: `columns`, `clearWalls`, `stairPattern`, `doesNotGuaranteeShortestPath` (`locales/en.ts:2-27`).
- vue-i18n работает в Composition-режиме: `createI18n({ legacy: false, ... })` (`i18n/index.ts:9-14`). В компонентах — только `const { t, locale } = useI18n()` (`the-header.vue:26`).
- Смена локали ТОЛЬКО через роутер. Писать в `i18n.global.locale` из компонента запрещено: сеттер writable-computed делает `router.push(`/${value}`)` (`the-header.vue:76-79`), а глобальный `beforeEach` уже проставляет `i18n.global.locale.value` и `document.documentElement.lang` (`router/index.ts:26-32`).
- Список локалей — единственный источник правды. Из `SUPPORTED_LOCALES` выводятся: паттерн маршрута (`router/index.ts:5`, `:12`) и опции селекта локали (`the-header.vue:74`). Не хардкодить `'ru'`/`'en'` где-либо ещё.
- Все пользовательские строки в шаблонах идут через `t()`. Исключение по факту: `algorithm.label` (`the-header.vue:54-57`, `:87`) — техническое имя алгоритма из `search.ts`, не переводится.
- Форматирование oxfmt: без `;`, одинарные кавычки, отступ 4 пробела, `trailingComma: "es5"` (запятая после последнего свойства объекта — есть, см. `locales/ru.ts:27`).
- `import type` для тип-импортов обязателен (`typescript/consistent-type-imports: "error"`), в т.ч. инлайн-форма `import { i18n, SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from '@/core/i18n'` (`router/index.ts:2`).

## Карта кода

- `src/core/i18n/index.ts` — `export type Locale = 'ru' | 'en'` (`:5`), `SUPPORTED_LOCALES: Locale[] = ['ru','en']` (`:6`), `DEFAULT_LOCALE: Locale = 'ru'` (`:7`), `createI18n` с `messages: { ru, en }` (`:13`).
- `src/core/i18n/locales/en.ts` — 26 ключей (строки `:2-27`), `export default`.
- `src/core/i18n/locales/ru.ts` — те же 26 ключей в том же порядке (проверено `diff` по списку ключей).
- `src/core/router/index.ts` — единственный реальный маршрут `name: 'home'`, `path: '/:locale(ru|en)'` (`:10-14`); редирект `/` → `/ru` (`:15-18`); catch-all `/:pathMatch(.*)*` → `/ru` (`:19-22`); `beforeEach` (`:26-32`).
- `src/core/components/the-header.vue` — единственный файл с `useI18n()`; локализованные опции строятся в computed'ах `patternOptions` (`:59-66`) и `speedOptions` (`:68-72`), описание алгоритма собирается в `algorithmDescriptor` (`:81-88`).
- `src/main.ts` — подключение `app.use(i18n)`.

## Решённые вопросы

- Локаль — сегмент URL, а не localStorage и не `navigator.language`. Локаль-независимого маршрута не существует: любой неизвестный путь редиректится на `/ru`.
- Язык по умолчанию — русский (`i18n/index.ts:7`), он же `fallbackLocale` (`:12`).
- `router.beforeEach` — гард с побочным эффектом, он ничего не возвращает и не редиректит (`router/index.ts:26-32`); невалидные локали отсекаются раньше — регэкспом в самом `path`.
- Переключатель языка — обычный `<ui-select>` с опциями `RU`/`EN` (`the-header.vue:74`, `:280-283`), метки берутся из `toUpperCase()`, а не из словаря.
- Добавление новой локали — ровно 3 согласованные правки: расширить union `Locale` и массив `SUPPORTED_LOCALES` (`i18n/index.ts:5-6`), добавить файл в `messages` (`:13`), создать `src/core/i18n/locales/<code>.ts`. Паттерн маршрута и опции селекта подстроятся сами.
- Ключи описания алгоритма умышленно строчные: `weighted: 'weighted'`, `guaranteesShortestPath: 'guarantees the shortest path'` — они склеиваются в предложение `${algorithm.label}: ${weightText}, ${guaranteeText}` (`the-header.vue:87`). Не капитализировать значения.

## Грабли

- ДОЛГ: в `ru.ts` три значения до сих пор английские — `recursiveDivision`, `verticalDivision`, `horizontalDivision` (`locales/ru.ts:17-19`). Остальные 23 ключа переведены.
- Паритет ключей ничем не защищён. Единственный способ проверить — сравнить оба файла глазами/скриптом. Забытый ключ в рантайме упадёт в fallback ('ru') и на английской странице покажет русский текст.
- `SUPPORTED_LOCALES` объявлен как изменяемый `Locale[]`, из-за чего в гарде приходится кастовать: `(SUPPORTED_LOCALES as readonly string[]).includes(rawLocale)` (`router/index.ts:28`). Если сделаешь массив `as const`, этот каст надо убрать.
- Названия алгоритмов НЕ локализуются: они приходят из `label` в `src/modules/board/algorithms/search.ts:373-443`. Не заводить под них i18n-ключи, не согласовав — селект алгоритмов строится итерацией по реестру (`the-header.vue:54-57`).
- В `patternOptions` ключ для лестницы называется `stairPattern`, хотя значение `MazePattern` — `'stair'` (`the-header.vue:65`). Имя ключа ≠ имя паттерна.
- Ключей 26, и ровно столько же уникальных вызовов `t('...')` в `src/` — мёртвых ключей нет. Но элементов UI больше: часть подписей — иконки lucide без текста. При аудите не считать «ключ на кнопку».
- vue-i18n здесь версии 9.14.5 (`package.json:26`). Рецепты из документации v10/v11 (в т.ч. по типизации сообщений) могут не подойти.
- Форматтер/линтер — oxfmt/oxlint, не prettier/eslint. После правки словарей гнать `npm run format:check` и `npm run lint`.
