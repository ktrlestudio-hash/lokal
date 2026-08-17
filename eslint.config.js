// eslint.config.js — arranque mínimo de la Fase 1 (plan de profesionalización):
// el proyecto no tenía NINGÚN linter configurado. Reglas de React/hooks
// activas a propósito — "rules-of-hooks" es exactamente lo que habría
// atrapado el problema real que ya encontramos en StoreApp.jsx (las
// screens se invocan como funciones planas, `Screen()`, no como
// componentes JSX `<Screen/>`, así que no pueden usar hooks propios).
// El resto queda deliberadamente laxo: no es el momento de imponer un
// estilo estricto sobre 30k+ líneas existentes, solo de tener una red que
// atrape errores reales (hooks mal usados, variables no declaradas,
// imports rotos) antes de un refactor grande.
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 18 + Vite: no hace falta import React en cada archivo
      'react/prop-types': 'off', // proyecto sin PropTypes ni TS — no empezar a exigirlo ahora
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }], // patrón ya usado a propósito en el código (catch silencioso documentado)
    },
    settings: {
      react: { version: '18.3' },
    },
  },
  {
    // Cloudflare Pages Functions: entorno Workers, no browser ni Node puro
    // (crypto.subtle/atob globales, sin process.env) — separado para no
    // arrastrar globals.browser/node donde no aplican.
    files: ['functions/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.worker,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // scripts/: CLIs de Node ejecutados a mano (seed de datos, etc.), no
    // código de browser — necesitan process/console globales.
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // netlify/**: functions viejas de Netlify, ya reemplazadas por
    // functions/.netlify/functions/**. .netlify/**: carpeta generada por
    // `netlify dev` (bundles minificados + telemetría de terceros, no
    // código propio — es la que generaba 14000+ "errores" fantasma la
    // primera vez que corrió este lint).
    ignores: ['dist/**', 'node_modules/**', 'netlify/**', '.netlify/**', '_ARCHIVO_NO_LOKAL/**'],
  },
];
