---
name: i18n-sync
description: How to add, rename or change a user-facing string in the vue-astar app without breaking locale parity. Covers the route-based vue-i18n setup (/:locale(ru|en), the router.beforeEach guard, DEFAULT_LOCALE and the Locale type in src/core/i18n/index.ts), the strict rule that every key must exist in BOTH src/core/i18n/locales/ru.ts and en.ts in the same order, why npm run type-check does NOT catch a missing key, a runnable key-parity diff command, how to switch locale correctly via router.push, and what it takes to add a third locale. Use whenever adding or editing any visible text, a t() call, a select option label, or a locale file.
---

# i18n-sync — работа со строками интерфейса

## Как устроено

`src/core/i18n/index.ts` целиком:

```ts
import { createI18n } from 'vue-i18n'
import ru from './locales/ru'
import en from './locales/en'

export type Locale = 'ru' | 'en'
export const SUPPORTED_LOCALES: Locale[] = ['ru', 'en']
export const DEFAULT_LOCALE: Locale = 'ru'

export const i18n = createI18n({
    legacy: false,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    messages: { ru, en },
})
```

- `legacy: false` — Composition API режим, vue-i18n 9.
- Тип `Locale`, список `SUPPORTED_LOCALES` и дефолт `DEFAULT_LOCALE` живут
  **только здесь** — это единственный источник правды.

Локаль — сегмент URL. `src/core/router/index.ts`:

```ts
const localePattern = SUPPORTED_LOCALES.join('|')
// ...
{ name: 'home', path: `/:locale(${localePattern})`, component: HomeView },
{ path: '/', redirect: `/${DEFAULT_LOCALE}` },
{ path: '/:pathMatch(.*)*', redirect: `/${DEFAULT_LOCALE}` },
```

```ts
router.beforeEach(to => {
    const rawLocale = to.params.locale
    if (typeof rawLocale === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(rawLocale)) {
        i18n.global.locale.value = rawLocale as Locale
        document.documentElement.lang = rawLocale
    }
})
```

Маршрута без локали не существует: `/` и всё несопоставленное редиректят на `/ru`.
Любой новый маршрут обязан нести сегмент локали.

---

## Использование в компоненте

```ts
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
```

Единственный вызов `useI18n()` в проекте — `src/core/components/the-header.vue:26`.

Статический текст — прямо в шаблоне: `{{ t('columns') }}`.
Списки опций, зависящие от локали, — в `computed`, иначе они не перерисуются
при смене языка (`the-header.vue:59-72`):

```ts
const speedOptions = computed<readonly SelectOption[]>(() => [
    { value: 'fast', label: t('fast') },
    { value: 'average', label: t('average') },
    { value: 'slow', label: t('slow') },
])
```

Сравни: `algorithmOptions` и `localeOptions` — не computed, потому что их
подписи не локализуются.

---

## Переключение локали

**Никогда не присваивай `i18n.global.locale` из компонента.** Переключение —
это навигация; локаль выставит guard роутера. Реальный паттерн
(`the-header.vue:76-79`):

```ts
const selectedLocale = computed<Locale>({
    get: () => locale.value as Locale,
    set: value => router.push(`/${value}`),
})
```

---

## Правило паритета ключей

`src/core/i18n/locales/ru.ts` и `en.ts` — два независимых
`export default { ... }` с плоскими camelCase-ключами:

```ts
export default {
    columns: 'Columns',
    rows: 'Rows',
    reset: 'Reset',
    // ...
}
```

Требования:

1. Каждый ключ есть в **обоих** файлах.
2. Порядок ключей в файлах совпадает (сейчас совпадает — держи так, иначе
   диффы становятся нечитаемыми).
3. Вложенности нет: ключи одноуровневые. Не вводи `board.cell.title`.
4. Ключи — camelCase и описывают смысл, а не язык (`clearWalls`, `stairPattern`).

### Почему это правило приходится соблюдать вручную

Проверено в этом репозитории:

- В `ru.ts` / `en.ts` нет ни общего типа схемы, ни `satisfies`.
- Нигде в `src/` и в `env.d.ts` нет `declare module 'vue-i18n'` /
  `DefineLocaleMessage` (grep — 0 совпадений).
- `useI18n()` вызывается без generic-параметров.

Следствие: **`npm run type-check` не поймает ни отсутствующий ключ в одной
из локалей, ни опечатку в `t('...')`** — аргумент `t` не типизирован именами
ключей. Гейты пройдут, а в интерфейсе появится дыра.

Что произойдёт в рантайме: `fallbackLocale` равен `'ru'`, поэтому при
отсутствии ключа в `en.ts` vue-i18n подставит русский текст (и напишет
предупреждение в консоль в dev-режиме) — молчаливый баг, который легко
не заметить.

---

## Проверка паритета

Из корня репозитория:

```bash
node -e "
const fs=require('fs');
const keys=f=>[...fs.readFileSync(f,'utf8').matchAll(/^\s{4}(\w+):/gm)].map(m=>m[1]);
const ru=keys('src/core/i18n/locales/ru.ts'), en=keys('src/core/i18n/locales/en.ts');
const miss=(a,b)=>a.filter(k=>!b.includes(k));
console.log('only in ru:', miss(ru,en));
console.log('only in en:', miss(en,ru));
console.log('order equal:', JSON.stringify(ru)===JSON.stringify(en));
"
```

Ожидаемый вывод на здоровом дереве:

```
only in ru: []
only in en: []
order equal: true
```

Регулярка опирается на форматирование oxfmt (отступ ровно 4 пробела,
один ключ на строку). Сначала `npm run format`, потом эта проверка.

Быстрая грубая сверка количества ключей:

```bash
grep -c ":" src/core/i18n/locales/ru.ts src/core/i18n/locales/en.ts
```

---

## Рецепт: добавить строку

1. Придумать camelCase-ключ по смыслу.
2. Добавить его в `src/core/i18n/locales/en.ts` и `src/core/i18n/locales/ru.ts`
   в одинаковую позицию.
3. Использовать `t('ключ')` в шаблоне; если строка попадает в массив опций —
   завернуть массив в `computed`.
4. `npm run format` → прогнать проверку паритета выше.
5. Прогнать гейты (скилл `verify-gates`).
6. Глазами проверить обе локали: `/ru` и `/en`.

## Рецепт: переименовать/удалить ключ

`grep -rn "'староеИмя'" src/` — найти все `t(...)`, затем править обе локали
и все места использования. Ни type-check, ни oxlint осиротевший ключ не найдут.

## Рецепт: добавить локаль

Три согласованных правки, всё остальное выведется само:

1. Создать `src/core/i18n/locales/<code>.ts` со **всеми** ключами.
2. В `src/core/i18n/index.ts`: расширить union `Locale`, добавить код
   в `SUPPORTED_LOCALES`, добавить импорт и запись в `messages`.
3. Ничего больше: паттерн маршрута `/:locale(...)` и опции селектора языка
   строятся из `SUPPORTED_LOCALES` (`router/index.ts:5`, `the-header.vue:74`).

---

## Что НЕ локализуется

- **Лейблы алгоритмов.** `algorithm.label` — захардкоженная английская строка
  в `src/modules/board/algorithms/search.ts` (`'A*'`, `"Dijkstra's"`,
  `'Bidirectional Swarm'`). Селектор алгоритмов берёт её напрямую
  (`the-header.vue:54-57`). Ключей для них в локалях нет.
- **Коды локалей в переключателе языка** — `l.toUpperCase()` (`RU` / `EN`).

Локализованы, в частности: подписи режимов (`fast`/`average`/`slow`), названия
паттернов лабиринта, кнопки и слова описания алгоритма (`weighted`, `unweighted`,
`guaranteesShortestPath`, `doesNotGuaranteeShortestPath`).

---

## Известный долг

В `src/core/i18n/locales/ru.ts` три значения остались непереведёнными:
`recursiveDivision`, `verticalDivision`, `horizontalDivision` (строки 17-19) —
там лежит английский текст. Ключи присутствуют, паритет не нарушен; это вопрос
перевода, а не структуры.

---

## Checklist

- [ ] Ключ camelCase, плоский, по смыслу
- [ ] Ключ добавлен в `ru.ts` **и** `en.ts`, в одинаковую позицию
- [ ] Значение переведено на оба языка (не скопирован английский в `ru.ts`)
- [ ] Локализованные списки опций обёрнуты в `computed`
- [ ] Локаль нигде не присваивается напрямую — только через `router.push`
- [ ] Проверка паритета выполнена, вывод чистый
- [ ] Прогнаны гейты, вывод вставлен в ответ
- [ ] Обе локали проверены визуально на `/ru` и `/en`
