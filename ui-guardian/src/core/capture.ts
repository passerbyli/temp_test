import type { Page } from 'playwright';
import type { ScreenshotResult, ResolvedSideConfig } from '../config/types.js';

export class CaptureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaptureError';
  }
}

export async function captureScreenshot(
  page: Page,
  config: ResolvedSideConfig,
  scrollStep?: number,
): Promise<ScreenshotResult> {
  const { mode } = config;

  if (mode === 'fullPage') {
    const buffer = await page.screenshot({ fullPage: true });
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    return {
      images: [buffer],
      meta: { mode: 'fullPage', width: viewport.width, height: viewport.height },
    };
  }

  if (mode === 'region') {
    if (!config.mainRegionSelector) throw new CaptureError('mainRegionSelector required for region mode');
    const locator = page.locator(config.mainRegionSelector).nth(config.mainRegionIndex ?? 0);
    const count = await locator.count();
    if (count === 0) {
      // Fallback to full-page screenshot if region element not found
      console.warn(`  Region element not found: ${config.mainRegionSelector}, falling back to full-page screenshot`);
      const buffer = await page.screenshot({ fullPage: true });
      const viewport = page.viewportSize() ?? { width: 0, height: 0 };
      return {
        images: [buffer],
        meta: { mode: 'fullPage', width: viewport.width, height: viewport.height },
      };
    }
    const buffer = await locator.screenshot();
    const box = await locator.boundingBox();
    return {
      images: [buffer],
      meta: { mode: 'region', width: box?.width ?? 0, height: box?.height ?? 0 },
    };
  }

  if (mode === 'scroll') {
    const step = scrollStep ?? 800;
    const totalHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    const images: Buffer[] = [];

    for (let scrollTop = 0; scrollTop < totalHeight; scrollTop += step) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollTop);
      await page.waitForTimeout(200); // let render settle
      const buffer = await page.screenshot();
      images.push(buffer);
    }

    return {
      images,
      meta: { mode: 'scroll', width: viewport.width, height: totalHeight, segments: images.length },
    };
  }

  throw new CaptureError(`Unsupported capture mode: ${mode}`);
}
