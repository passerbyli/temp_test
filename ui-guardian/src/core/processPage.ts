import type { Page } from 'playwright';
import path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import type { ResolvedPageConfig, ViewportConfig, PageResult } from '../config/types.js';
import { diffScreenshots, diffScrollSegments } from './diff.js';
import { createCollector } from './collector.js';
import { processSide } from './processSide.js';

export async function processPage(
  page: Page,
  config: ResolvedPageConfig,
  viewport: ViewportConfig,
  outputDir: string,
): Promise<PageResult> {
  const viewportLabel = viewport.label ?? `${viewport.width}x${viewport.height}`;
  const fileSuffix = `${config.id}_${viewportLabel}`;
  const startTime = Date.now();

  let status: 'passed' | 'failed' | 'error' = 'passed';
  let error: string | undefined;
  let diffResult = null;

  const collector = createCollector();

  try {
    // Process baseline
    const baseline = await processSide(page, config.baselineUrl, config, outputDir, 'baseline', fileSuffix, collector);
    collector.reset();

    // Process candidate
    const candidate = await processSide(page, config.candidateUrl, config, outputDir, 'candidate', fileSuffix, collector);

    // Diff
    if (baseline.screenshotPath && candidate.screenshotPath) {
      const diffConfig = {
        threshold: config.threshold,
        includeAA: config.diffIncludeAA,
      };

      let diff;
      if (baseline.screenshotPaths && candidate.screenshotPaths) {
        const baselineImgs = baseline.screenshotPaths.map(p => readFileSync(path.join(outputDir, p)));
        const candidateImgs = candidate.screenshotPaths.map(p => readFileSync(path.join(outputDir, p)));
        diff = diffScrollSegments(baselineImgs, candidateImgs, diffConfig);
      } else {
        const baselineImg = readFileSync(path.join(outputDir, baseline.screenshotPath));
        const candidateImg = readFileSync(path.join(outputDir, candidate.screenshotPath));
        diff = diffScreenshots(baselineImg, candidateImg, diffConfig);
      }

      const diffPath = `screenshots/diff/${fileSuffix}.png`;
      writeFileSync(path.join(outputDir, diffPath), diff.diffImage);

      diffResult = {
        diffImagePath: diffPath,
        diffPercent: diff.diffPercent,
        diffPixels: diff.diffPixels,
        totalPixels: diff.totalPixels,
        passed: diff.passed,
        threshold: diff.threshold,
      };

      status = diff.passed ? 'passed' : 'failed';
    }

    return {
      pageId: config.id,
      pageName: config.name,
      viewport: { width: viewport.width, height: viewport.height, label: viewportLabel },
      baseline,
      candidate,
      diff: diffResult,
      config: {
        mainRegionSelector: config.mainRegionSelector,
        mainRegionIndex: config.mainRegionIndex,
        ignoreSelectors: config.ignoreSelectors,
      },
      status,
      error,
      duration: Date.now() - startTime,
      reportPath: `pages/${fileSuffix}.html`,
    };
  } catch (e) {
    return {
      pageId: config.id,
      pageName: config.name,
      viewport: { width: viewport.width, height: viewport.height, label: viewportLabel },
      baseline: { url: config.baselineUrl, screenshotPath: null, screenshotMeta: null, anomalies: { console: [], network: [], errors: [] } },
      candidate: { url: config.candidateUrl, screenshotPath: null, screenshotMeta: null, anomalies: { console: [], network: [], errors: [] } },
      diff: null,
      config: { mainRegionSelector: config.mainRegionSelector, mainRegionIndex: config.mainRegionIndex, ignoreSelectors: config.ignoreSelectors },
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
      duration: Date.now() - startTime,
      reportPath: `pages/${fileSuffix}.html`,
    };
  }
}
