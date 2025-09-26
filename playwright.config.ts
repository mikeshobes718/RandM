import { defineConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://reviewsandmarketing.com',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
