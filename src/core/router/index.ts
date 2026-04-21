import { createRouter, createWebHistory } from 'vue-router'
import { i18n, SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from '@/core/i18n'
import HomeView from '@/core/views/home-view.vue'

const localePattern = SUPPORTED_LOCALES.join('|')

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            name: 'home',
            path: `/:locale(${localePattern})`,
            component: HomeView,
        },
        {
            path: '/',
            redirect: `/${DEFAULT_LOCALE}`,
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: `/${DEFAULT_LOCALE}`,
        },
    ],
})

router.beforeEach((to) => {
    const rawLocale = to.params.locale
    if (typeof rawLocale === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(rawLocale)) {
        i18n.global.locale.value = rawLocale as Locale
        document.documentElement.lang = rawLocale
    }
})
