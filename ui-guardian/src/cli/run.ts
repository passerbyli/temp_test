import { readFileSync } from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import type { GlobalConfig, PagesConfig } from '../config/types.js';
import { runAll } from '../core/runner.js';

export async function run(): Promise<void> {
  const cwd = process.cwd();

  // Load configs
  let globalConfig: GlobalConfig;
  let pagesConfig: PagesConfig;

  try {
    globalConfig = JSON.parse(readFileSync(path.join(cwd, 'global.config.json'), 'utf-8'));
  } catch {
    console.error('Error: global.config.json not found. Run "npx ui-guardian init" first.');
    process.exit(1);
  }

  try {
    pagesConfig = JSON.parse(readFileSync(path.join(cwd, 'pages.config.json'), 'utf-8'));
  } catch {
    console.error('Error: pages.config.json not found. Run "npx ui-guardian init" first.');
    process.exit(1);
  }

  // Launch browser
  const browser = await chromium.launch({ headless: true });

  try {
    const result = await runAll(browser, globalConfig, pagesConfig);

    // Terminal summary
    const { summary } = result;
    console.log('');
    console.log(`${summary.totalPages} pages, ${summary.passed} passed, ${summary.failed} failed, ${summary.errors} errors`);
    console.log(`Report: ${result.reportDir}`);
    console.log(`Duration: ${(summary.totalDuration / 1000).toFixed(1)}s`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}
