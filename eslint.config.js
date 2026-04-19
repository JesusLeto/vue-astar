import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'
import prettierConfig from 'eslint-config-prettier'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default defineConfigWithVueTs(
    includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),

    pluginVue.configs['flat/essential'],
    vueTsConfigs.recommendedTypeChecked,
    prettierConfig,

    {
        files: ['**/*.ts', '**/*.vue'],
        rules: {
            'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
            '@typescript-eslint/no-floating-promises': 'off',
            'vue/component-name-in-template-casing': [
                'error',
                'kebab-case',
                {
                    registeredComponentsOnly: true,
                    ignores: [],
                },
            ],
        },
    }
)