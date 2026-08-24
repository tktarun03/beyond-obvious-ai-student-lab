import { defineConfig, devices } from '@playwright/test';

/**
 * One Playwright config drives every app. Each app's e2e folder sets its own
 * baseURL through a project entry, so `npm run e2e` covers the whole lab.
 */
const ci = !!process.env.CI;

export default defineConfig({
  testDir: '.',
  testMatch: '{apps,projects}/*/e2e/**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  workers: ci ? 1 : undefined,
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    trace: 'on-first-retry',
    // Reduced motion is the default in e2e so animation never makes a test flaky
    // and so the reduced-motion code path stays exercised.
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    {
      name: 'portal',
      testMatch: 'apps/portal/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: '01-knowledge-copilot',
      testMatch: 'projects/01-knowledge-copilot/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
    },
    {
      name: '02-document-intelligence',
      testMatch: 'projects/02-document-intelligence/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3002' },
    },
    {
      name: '03-india-voice-assistant',
      testMatch: 'projects/03-india-voice-assistant/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3003' },
    },
    {
      name: '04-engineering-agent',
      testMatch: 'projects/04-engineering-agent/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3004' },
    },
    {
      name: '05-data-decision-assistant',
      testMatch: 'projects/05-data-decision-assistant/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3005' },
    },
  ],
});
