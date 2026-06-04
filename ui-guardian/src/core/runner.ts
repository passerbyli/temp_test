import type { Browser } from 'playwright';
import path from 'path';
import { mkdirSync } from 'fs';
import type { GlobalConfig, PagesConfig, PageResult, RunResult, ViewportSummaryItem } from '../config/types.js';
import { validateGlobalConfig, validatePagesConfig } from '../config/validation.js';
import { mergeConfig } from '../config/defaults.js';
import { authenticate } from './auth.js';
import { createViewportContext } from './viewport.js';
import { processPage } from './processPage.js';
import { generateHtmlReport } from '../report/generator.js';
import { generateJsonReport } from '../report/json.js';

export class RunnerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RunnerError';
  }
}

function createOutputDir(baseDir: string): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, '-').replace(/\..+/, '');
  const dir = path.join(baseDir, ts);
  mkdirSync(path.join(dir, 'screenshots', 'baseline'), { recursive: true });
  mkdirSync(path.join(dir, 'screenshots', 'candidate'), { recursive: true });
  mkdirSync(path.join(dir, 'screenshots', 'diff'), { recursive: true });
  mkdirSync(path.join(dir, 'logs'), { recursive: true });
  return dir;
}

export async function runAll(
  browser: Browser,
  globalConfig: GlobalConfig,
  pagesConfig: PagesConfig,
): Promise<RunResult> {
  // Validate
  const globalValidation = validateGlobalConfig(globalConfig);
  if (!globalValidation.valid) throw new RunnerError(`Global config invalid:\n${globalValidation.errors.join('\n')}`);
  const pagesValidation = validatePagesConfig(pagesConfig);
  if (!pagesValidation.valid) throw new RunnerError(`Pages config invalid:\n${pagesValidation.errors.join('\n')}`);

  // Create output dir
  const outputDir = createOutputDir(globalConfig.outputDir ?? 'output/reports');

  // Authenticate
  const authResult = await authenticate(browser, globalConfig.auth);
  const storageState = authResult.storageState;

  const startTime = Date.now();
  const allPageResults: PageResult[] = [];

  // Outer loop: pagePairs, inner loop: viewports
  for (const pagePair of pagesConfig.pagePairs) {
    const resolved = mergeConfig(globalConfig, pagePair);
    // Use resolved.viewports if available (from pagePair override), otherwise global
    const viewports = resolved.viewports ?? globalConfig.viewports;

    for (const viewport of viewports) {
      const context = await createViewportContext(browser, viewport, storageState);
      const page = await context.newPage();

      let pageResult: PageResult;
      try {
        pageResult = await processPage(page, resolved, viewport, outputDir);
      } catch (e) {
        const viewportLabel = viewport.label ?? `${viewport.width}x${viewport.height}`;
        pageResult = {
          pageId: resolved.id,
          pageName: resolved.name,
          viewport: { width: viewport.width, height: viewport.height, label: viewportLabel },
          baseline: { url: resolved.baselineUrl, screenshotPath: null, screenshotMeta: null, anomalies: { console: [], network: [], errors: [] } },
          candidate: { url: resolved.candidateUrl, screenshotPath: null, screenshotMeta: null, anomalies: { console: [], network: [], errors: [] } },
          diff: null,
          config: { mainRegionSelector: resolved.mainRegionSelector, mainRegionIndex: resolved.mainRegionIndex, ignoreSelectors: resolved.ignoreSelectors },
          status: 'error',
          error: e instanceof Error ? e.message : String(e),
          duration: 0,
          reportPath: `pages/${resolved.id}_${viewport.label ?? `${viewport.width}x${viewport.height}`}.html`,
        };
      } finally {
        await page.close().catch(() => {});
        await context.close().catch(() => {});
      }

      allPageResults.push(pageResult);
    }
  }

  await authResult.context.close();

  const duration = Date.now() - startTime;
  const passed = allPageResults.filter(r => r.status === 'passed').length;
  const failed = allPageResults.filter(r => r.status === 'failed').length;
  const errors = allPageResults.filter(r => r.status === 'error').length;

  // Build per-viewport summary
  const viewportMap = new Map<string, ViewportSummaryItem>();
  for (const pr of allPageResults) {
    const key = pr.viewport.label;
    if (!viewportMap.has(key)) {
      viewportMap.set(key, { label: key, width: pr.viewport.width, height: pr.viewport.height, passed: 0, failed: 0, errors: 0 });
    }
    const vs = viewportMap.get(key)!;
    if (pr.status === 'passed') vs.passed++;
    else if (pr.status === 'failed') vs.failed++;
    else vs.errors++;
  }

  const runResult: RunResult = {
    runId: path.basename(outputDir),
    timestamp: new Date().toISOString(),
    duration,
    uiGuardianVersion: '0.1.0',
    config: { global: globalConfig, pages: pagesConfig },
    summary: {
      totalPages: allPageResults.length,
      totalPagePairs: pagesConfig.pagePairs.length,
      totalViewports: globalConfig.viewports.length,
      passed, failed, errors,
      passRate: allPageResults.length > 0 ? passed / allPageResults.length : 0,
      totalDuration: duration,
    },
    viewportSummary: Array.from(viewportMap.values()),
    pages: allPageResults,
    anomalySummary: (() => {
      let totalConsoleErrors = 0;
      let totalNetworkFailures = 0;
      let totalJsErrors = 0;
      let pagesWithAnomalies = 0;
      for (const pr of allPageResults) {
        const bAnomalies = pr.baseline.anomalies;
        const cAnomalies = pr.candidate.anomalies;
        const consoleErrors = bAnomalies.console.filter(e => e.type === 'error').length + cAnomalies.console.filter(e => e.type === 'error').length;
        const networkFailures = bAnomalies.network.length + cAnomalies.network.length;
        const jsErrors = bAnomalies.errors.length + cAnomalies.errors.length;
        totalConsoleErrors += consoleErrors;
        totalNetworkFailures += networkFailures;
        totalJsErrors += jsErrors;
        if (consoleErrors > 0 || networkFailures > 0 || jsErrors > 0) pagesWithAnomalies++;
      }
      return { totalConsoleErrors, totalNetworkFailures, totalJsErrors, pagesWithAnomalies };
    })(),
    reportDir: outputDir,
  };

  await generateHtmlReport(runResult);
  await generateJsonReport(runResult);

  return runResult;
}
