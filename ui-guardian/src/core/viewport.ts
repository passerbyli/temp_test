import type { Browser, BrowserContext } from 'playwright';
import type { ViewportConfig } from '../config/types.js';

export async function createViewportContext(
  browser: Browser,
  viewport: ViewportConfig,
  storageState: Awaited<ReturnType<BrowserContext['storageState']>>,
): Promise<BrowserContext> {
  return browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    storageState,
  });
}
