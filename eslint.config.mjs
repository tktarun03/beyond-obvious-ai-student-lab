import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      // The sample repo in project 04 contains DELIBERATE defects for the agent to find.
      // Linting it would "fix" the exercise.
      'projects/04-engineering-agent/sample-repo/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends('next/core-web-vitals'),
  prettier,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    settings: {
      // Each Next app has its own root; disable the "no Next.js root detected" warning noise.
      next: { rootDir: ['apps/*/', 'projects/*/'] },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          // SECURITY: NEXT_PUBLIC_* is inlined into the client bundle at build time.
          // A secret read through that prefix is a secret published to every visitor.
          selector:
            "MemberExpression[object.property.name='env'] > Identifier[name=/^NEXT_PUBLIC_.*(KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)/i]",
          message:
            'Never expose a credential through NEXT_PUBLIC_*. Read it server-side in a route handler instead.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@google/genai',
              message:
                'Import the AIProvider from @lab/ai instead. Direct SDK use breaks mock mode and the provider seam.',
            },
          ],
        },
      ],
    },
  },
  {
    // The AI package is the one place allowed to touch the vendor SDK.
    files: ['packages/ai/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/evals/**/*.ts', '**/scripts/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off', 'no-console': 'off' },
  },
  {
    files: ['**/next-env.d.ts'],
    rules: { '@typescript-eslint/triple-slash-reference': 'off' },
  },
);
