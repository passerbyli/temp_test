import type { Page } from 'playwright';
import path from 'path';
import { writeFileSync } from 'fs';
import type { ResolvedPageConfig, ResolvedSideConfig, PageSideResult, Collector } from '../config/types.js';
import { captureScreenshot } from './capture.js';
import { extractEChartsData } from './echarts.js';

export async function processSide(
  page: Page,
  url: string,
  config: ResolvedPageConfig,
  sideConfig: ResolvedSideConfig,
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

  // Inject ignoreSelectors from side config
  if (sideConfig.ignoreSelectors.length > 0) {
    await page.addStyleTag({
      content: sideConfig.ignoreSelectors.map(s => `${s} { display: none !important; }`).join('\n'),
    });
  }

  let screenshotPath: string | null = null;
  let screenshotPaths: string[] | undefined;
  let screenshotMeta = null;

  // Take screenshot FIRST, then extract text at the same moment
  try {
    const result = await captureScreenshot(page, sideConfig, config.scrollStep);
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
  } catch (e) {
    console.error(`  [${side}] Screenshot failed:`, e instanceof Error ? e.message : e);
    // screenshotPath stays null
  }

  // Extract text content and positions AFTER screenshot (same visual state)
  const { text: textContent, positions: textPositions } = await page.evaluate((selector: string | undefined) => {
    const root = selector ? document.querySelector(selector) : document.body;
    if (!root) return { text: '', positions: [] as { text: string; x: number; y: number; width: number; height: number }[] };

    const text = (root as HTMLElement).innerText;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const positions: { text: string; x: number; y: number; width: number; height: number }[] = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent || !node.textContent.trim()) continue;
      const parent = node.parentElement;
      if (!parent) continue;
      const style = window.getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        positions.push({
          text: node.textContent.trim(),
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    }

    return { text, positions };
  }, sideConfig.mainRegionSelector);

  // Extract ECharts chart data AFTER screenshot
  const echartsData = await extractEChartsData(page);
  const fullText = echartsData ? `${textContent}\n\n${echartsData}` : textContent;
  // Normalize: remove blank lines to ensure consistent diff alignment
  const normalizedText = fullText.split('\n').filter(l => l.trim() !== '').join('\n');

  const anomalies = collector.collect();

  return {
    url,
    screenshotPath,
    screenshotPaths,
    screenshotMeta,
    anomalies,
    textContent: normalizedText,
    textPositions,
  };
}
