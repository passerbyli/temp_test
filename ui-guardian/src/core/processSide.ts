import type { Page } from 'playwright';
import path from 'path';
import { writeFileSync } from 'fs';
import type { ResolvedPageConfig, PageSideResult, Collector } from '../config/types.js';
import { captureScreenshot } from './capture.js';

export async function processSide(
  page: Page,
  url: string,
  config: ResolvedPageConfig,
  outputDir: string,
  side: 'baseline' | 'candidate',
  fileSuffix: string,
  collector: Collector,
): Promise<PageSideResult> {
  collector.attach(page, url);

  await page.goto(url, {
    waitUntil: config.waitForNetworkIdle ? 'networkidle' : 'load',
    timeout: config.pageLoadTimeout,
  });

  if (config.screenshotDelay > 0) {
    await page.waitForTimeout(config.screenshotDelay);
  }

  // Inject ignoreSelectors
  if (config.ignoreSelectors.length > 0) {
    await page.addStyleTag({
      content: config.ignoreSelectors.map(s => `${s} { display: none !important; }`).join('\n'),
    });
  }

  let screenshotPath: string | null = null;
  let screenshotPaths: string[] | undefined;
  let screenshotMeta = null;

  try {
    const result = await captureScreenshot(page, config);
    if (result.meta.mode === 'scroll' && result.images.length > 1) {
      screenshotPaths = result.images.map((_, i) => `screenshots/${side}/${fileSuffix}_seg${i}.png`);
      for (let i = 0; i < result.images.length; i++) {
        writeFileSync(path.join(outputDir, screenshotPaths[i]), result.images[i]);
      }
      screenshotPath = screenshotPaths[0];
    } else {
      screenshotPath = `screenshots/${side}/${fileSuffix}.png`;
      writeFileSync(path.join(outputDir, screenshotPath), result.images[0]);
    }
    screenshotMeta = result.meta;
  } catch {
    // screenshotPath stays null
  }

  const anomalies = collector.collect();

  return {
    url,
    screenshotPath,
    screenshotPaths,
    screenshotMeta,
    anomalies,
  };
}
