import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,ts,mjs}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        EventTarget: 'readonly',
        MouseEvent: 'readonly',
        CustomEvent: 'readonly',
        MessageEvent: 'readonly',
        Worker: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        DOMRect: 'readonly',
        // Timer globals
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        // Performance globals
        performance: 'readonly',
        navigator: 'readonly',
        // WebGL globals
        WebGLRenderingContext: 'readonly',
        // Svelte globals
        $state: 'readonly',
        $derived: 'readonly',
        $effect: 'readonly',
        $props: 'readonly',
        $bindable: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off', // Use TypeScript version instead

      // Code style enforcement
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 2022,
        sourceType: 'module',
        extraFileExtensions: ['.svelte'],
      },
      globals: {
        // All browser globals for Svelte files
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        EventTarget: 'readonly',
        MouseEvent: 'readonly',
        CustomEvent: 'readonly',
        MessageEvent: 'readonly',
        Worker: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        DOMRect: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        navigator: 'readonly',
        WebGLRenderingContext: 'readonly',
        $state: 'readonly',
        $derived: 'readonly',
        $effect: 'readonly',
        $props: 'readonly',
        $bindable: 'readonly',
      },
    },
    plugins: {
      svelte,
      '@typescript-eslint': typescript,
    },
    rules: {
      ...svelte.configs.recommended.rules,
      // Svelte specific rules
      'svelte/no-unused-svelte-ignore': 'error',
      'svelte/prefer-class-directive': 'error',
      'svelte/prefer-style-directive': 'error',
      'svelte/shorthand-attribute': 'error',
      'svelte/shorthand-directive': 'error',

      // TypeScript in Svelte
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.worker.{js,ts}'],
    languageOptions: {
      globals: {
        self: 'readonly',
        postMessage: 'readonly',
        addEventListener: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: [
      '.git/**',
      '.husky/**',
      '.vite/**',
      '.vscode/**',
      'dist/**',
      'node_modules/**',
      '.svelte-kit/**',
      'build/**',
      'vite.config.ts',
      'svelte.config.ts',
    ],
  },
];
