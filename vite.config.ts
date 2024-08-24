import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"
import {createSvgIconsPlugin} from "vite-plugin-svg-icons"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		createSvgIconsPlugin({
			// Specify the icon folder to be cached
			iconDirs: [
				path.resolve(process.cwd(), "src/assets/icon")
			],
			// Specify symbolId format
			symbolId: "icon-[dir]-[name]",

			/**
			 * custom dom snippets
			 * @default: __svg__icons__dom__
			 */
			customDomId: "__svg__icons__dom__"
		})
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			"@a": fileURLToPath(new URL("./src/assets", import.meta.url))
		}
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: "@use \"@/assets/styles\" as *;"
			}
		}
	}
})
