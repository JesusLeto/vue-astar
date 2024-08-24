import { createApp } from "vue"
import { createPinia } from "pinia"
// @ts-ignore
import App from "./App.vue"

import PrimeVue from "primevue/config"
import Aura from "@primevue/themes/aura"
import Button from "primevue/button"

import "virtual:svg-icons-register"
import "normalize.css"
import '@/assets/styles/anim.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(PrimeVue, {
	theme: {
		preset: Aura,
		options: {
			darkModeSelector: ".my-app-dark",
		}
	}
})

app.component("UiButton", Button)

app.mount("#app")
