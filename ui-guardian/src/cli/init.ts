import { writeFileSync } from 'fs';
import path from 'path';

const GLOBAL_TEMPLATE = {
  auth: {
    loginUrl: 'https://example.com/login',
    username: 'admin',
    password: 'your-password',
    usernameSelector: '#username',
    passwordSelector: '#password',
    submitSelector: '#login-btn',
    successWait: { type: 'url', value: '/dashboard' },
    timeout: 30000,
  },
  viewports: [
    { width: 1920, height: 1080, label: 'desktop' },
    { width: 1366, height: 768, label: 'laptop' },
    { width: 375, height: 812, label: 'mobile' },
  ],
  capture: { mode: 'fullPage', scrollStep: 800, waitForNetworkIdle: true, pageLoadTimeout: 60000, screenshotDelay: 0 },
  diff: { threshold: 0.01, includeAA: false },
  ignoreSelectors: ['.cookie-banner', '.timestamp', '.ad-container'],
  outputDir: 'output/reports',
};

const PAGES_TEMPLATE = {
  pagePairs: [
    {
      name: 'Home',
      baseline: { url: 'https://staging.example.com/' },
      candidate: { url: 'https://prod.example.com/' },
      mainRegionSelector: '.main-content',
      mainRegionIndex: 0,
      ignoreSelectors: [],
    },
  ],
};

export async function init(): Promise<void> {
  const cwd = process.cwd();
  const globalPath = path.join(cwd, 'global.config.json');
  const pagesPath = path.join(cwd, 'pages.config.json');

  writeFileSync(globalPath, JSON.stringify(GLOBAL_TEMPLATE, null, 2) + '\n');
  writeFileSync(pagesPath, JSON.stringify(PAGES_TEMPLATE, null, 2) + '\n');

  console.log('Configuration templates created:');
  console.log(`  ${globalPath}`);
  console.log(`  ${pagesPath}`);
  console.log('');
  console.log('Edit these files, then run: npx ui-guardian run');
}
