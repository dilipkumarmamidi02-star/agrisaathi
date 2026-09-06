import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.migration-backup-*/**',
      '.cleanup-backup-*/**',
    ],
  },

  {
    files: ['**/*.{js,jsx}'],

    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],

    plugins: {
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      /*
       * React 17+ / Vite JSX transform does not require
       * `import React from "react"`.
       */
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^React$',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      /*
       * These are valid patterns for data-fetching effects.
       * React's compiler lint can be overly strict here.
       */
      'react-hooks/set-state-in-effect': 'off',

      /*
       * Existing project contains effects that intentionally
       * use stable translation/API helpers.
       */
      'react-hooks/exhaustive-deps': 'warn',

      /*
       * Do not make Fast Refresh block production builds.
       */
      'react-refresh/only-export-components': 'warn',
    },
  },
])
