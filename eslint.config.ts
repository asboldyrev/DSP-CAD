// eslint.config.ts
import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
    // Что линтим
    {
        name: 'app/files-to-lint',
        files: ['**/*.{ts,mts,tsx,vue}'],
    },

    // Игнор
    globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/creating-models/**']),

    // Базовые пресеты
    pluginVue.configs['flat/essential'],
    vueTsConfigs.recommended,
    ...pluginOxlint.configs['flat/recommended'],

    // Отключаем конфликты с Prettier (в т.ч. выключит vue/max-attributes-per-line)
    skipFormatting,

    // ⬇️ Переопределяем ровно то, что нам нужно ПОСЛЕ skipFormatting
    {
        name: 'app/vue-attrs-per-line',
        files: ['**/*.vue'],
        rules: {
            // «умное» поведение:
            // - в одну строку можно до 3 атрибутов
            // - если перенос, то дальше — по одному на строку
            'vue/max-attributes-per-line': [
                'error',
                {
                    singleline: 3,
                    multiline: { max: 1, allowFirstLine: false },
                },
            ],
        },
    },
)
