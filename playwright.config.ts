import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 7_000,
  },
  fullyParallel: false,
  reporter: [['list'], ['html']],
  use: {
    baseURL: 'http://127.0.0.1:3010',
    viewport: {
      width: 430,
      height: 932,
    },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm.cmd run dev:test',
    url: 'http://127.0.0.1:3010',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});