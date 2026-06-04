
import 'dotenv/config';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: path.resolve(__dirname, './.env.smoke') });

import { defineConfig, devices } from '@playwright/test'

const isSmoke = process.env.PLAYWRIGHT_SUITE === 'smoke'

export default defineConfig({
  testDir: './e2e',
  timeout: isSmoke ? 180_000 : 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'line',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: isSmoke
    ? [
        {
          name: 'smoke',
          testDir: './e2e/smoke',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          testIgnore: ['**/smoke/**'],
          use: { ...devices['Desktop Chrome'] },
        },
      ],
  webServer: isSmoke
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          NEXT_PUBLIC_API_URL: 'http://localhost:3001',
          NEXT_PUBLIC_USE_MOCK_NETWORK: '0',
        },
      },
})
