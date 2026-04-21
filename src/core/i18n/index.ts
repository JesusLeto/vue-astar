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
