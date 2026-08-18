import { defineConfigWithVueTs, vueTsConfigs, configureVueProject } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import eslintConfigPrettier from 'eslint-config-prettier'

configureVueProject({ scriptLangs: ['ts'] })

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['src/**/*.{ts,vue}'],
  },
  {
    name: 'app/ignores',
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/*.d.ts'],
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    name: 'app/rules',
    rules: {
      // Regole allentate deliberatamente per la prima passata di CI: il
      // dominio (Model/View/Controller, pattern MVC pull-model, Sezione 3.3
      // Specifica Tecnica) usa spesso `any` per bridge intenzionali (es.
      // accesso a proprietà private via cast, vedi AIController) e i
      // component Vue single-root non hanno bisogno di un nome esplicito
      // per i test. Si può stringere gradualmente durante la revisione.
      '@typescript-eslint/no-explicit-any': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off', // usato solo per l'anteprima Markdown, già sanificata con DOMPurify
    },
  },
  ...pluginOxlint.configs['flat/recommended'],
  eslintConfigPrettier,
)
