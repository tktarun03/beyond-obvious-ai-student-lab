import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const pkg = (name: string) => path.join(root, 'packages', name, 'src');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@lab/ai': pkg('ai'),
      '@lab/auth': pkg('auth'),
      '@lab/database': pkg('database'),
      '@lab/observability': pkg('observability'),
      '@lab/shared': pkg('shared'),
      '@lab/ui': pkg('ui'),
      '@lab/validation': pkg('validation'),
    },
  },
  test: {
    globals: true,
    // Default to node. Component tests opt in with `// @vitest-environment jsdom`
    // at the top of the file — keeping the fast path fast.
    environment: 'node',
    setupFiles: [path.join(root, 'test/setup.ts')],
    include: ['{packages,apps,projects}/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/e2e/**', '**/sample-repo/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/*/src/**', 'apps/*/src/**', 'projects/*/src/**'],
      exclude: ['**/*.test.*', '**/evals/**', '**/*.d.ts'],
    },
  },
});
