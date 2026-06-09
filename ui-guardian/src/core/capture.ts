import type { Page } from 'playwright';
import type { ScreenshotResult, ResolvedSideConfig } from '../config/types.js';

export class CaptureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaptureError';
  }
}

async function captureByScrolling(
  page: Page,
  config: ResolvedSideConfig,
  scrollStep?: number,
): Promise<ScreenshotResult> {
  const step = scrollStep ?? 800;
  const mainRegionSelector = config.mainRegionSelector!;

  // Get scroll container info - find the widest scrollable container
  const scrollInfo = await page.evaluate((selector: string) => {
    const el = document.querySelector(selector);
    if (!el) return null;

    // Find all scrollable containers
    const scrollableContainers: Array<{
      element: Element;
      scrollHeight: number;
      clientHeight: number;
      width: number;
      isParent: boolean;
    }> = [];

    // Check parent elements for scrollbar
    let parent = el.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      if (parent.scrollHeight > parent.clientHeight) {
        const rect = parent.getBoundingClientRect();
        scrollableContainers.push({
          element: parent,
          scrollHeight: parent.scrollHeight,
          clientHeight: parent.clientHeight,
          width: rect.width,
          isParent: true,
        });
      }
      parent = parent.parentElement;
    }

    // Check children for scrollbar
    const scrollableChildren = el.querySelectorAll('.el-scrollbar__wrap, [style*="overflow"], [style*="overflow-y"]');
    for (const child of scrollableChildren) {
      if (child.scrollHeight > child.clientHeight) {
        const rect = child.getBoundingClientRect();
        scrollableContainers.push({
          element: child,
          scrollHeight: child.scrollHeight,
          clientHeight: child.clientHeight,
          width: rect.width,
          isParent: false,
        });
      }
    }

    // Also check all elements with scrollbar class
    const allScrollbarWraps = document.querySelectorAll('.el-scrollbar__wrap');
    for (const wrap of allScrollbarWraps) {
      if (wrap.scrollHeight > wrap.clientHeight) {
        const rect = wrap.getBoundingClientRect();
        // Check if this wrap is related to our element
        if (wrap.contains(el) || el.contains(wrap)) {
          scrollableContainers.push({
            element: wrap,
            scrollHeight: wrap.scrollHeight,
            clientHeight: wrap.clientHeight,
            width: rect.width,
            isParent: wrap.contains(el),
          });
        }
      }
    }

    if (scrollableContainers.length === 0) return null;

    // Find the widest container (likely the main content area)
    let widest = scrollableContainers[0];
    for (const container of scrollableContainers) {
      if (container.width > widest.width) {
        widest = container;
      }
    }

    return {
      scrollHeight: widest.scrollHeight,
      clientHeight: widest.clientHeight,
      isParent: widest.isParent,
      containerSelector: widest.isParent ? null : mainRegionSelector,
    };
  }, mainRegionSelector);

  if (!scrollInfo) {
    throw new CaptureError(`No scrollable container found in ${mainRegionSelector}`);
  }

  console.log(`  Scrolling container: ${scrollInfo.scrollHeight}px total, ${scrollInfo.clientHeight}px viewport`);

  const images: Buffer[] = [];
  const totalHeight = scrollInfo.scrollHeight;

  // Scroll and capture each segment
  for (let scrollTop = 0; scrollTop < totalHeight; scrollTop += step) {
    // Scroll the container
    if (scrollInfo.isParent) {
      // Scroll parent element
      await page.evaluate(({ selector, y }) => {
        const el = document.querySelector(selector);
        if (!el) return;
        // Find the widest scrollable parent
        let parent = el.parentElement;
        let widestParent = null;
        let maxWidth = 0;

        for (let i = 0; i < 3 && parent; i++) {
          if (parent.scrollHeight > parent.clientHeight) {
            const rect = parent.getBoundingClientRect();
            if (rect.width > maxWidth) {
              maxWidth = rect.width;
              widestParent = parent;
            }
          }
          parent = parent.parentElement;
        }

        if (widestParent) {
          widestParent.scrollTop = y;
        }
      }, { selector: mainRegionSelector, y: scrollTop });
    } else {
      // Scroll child element
      await page.evaluate(({ selector, y }) => {
        const el = document.querySelector(selector);
        if (!el) return;
        // Find the widest scrollable child
        const scrollableChildren = el.querySelectorAll('.el-scrollbar__wrap, [style*="overflow"], [style*="overflow-y"]');
        let widestChild = null;
        let maxWidth = 0;

        for (const child of scrollableChildren) {
          if (child.scrollHeight > child.clientHeight) {
            const rect = child.getBoundingClientRect();
            if (rect.width > maxWidth) {
              maxWidth = rect.width;
              widestChild = child;
            }
          }
        }

        // Also check all elements with scrollbar class
        const allScrollbarWraps = document.querySelectorAll('.el-scrollbar__wrap');
        for (const wrap of allScrollbarWraps) {
          if (wrap.scrollHeight > wrap.clientHeight && (wrap.contains(el) || el.contains(wrap))) {
            const rect = wrap.getBoundingClientRect();
            if (rect.width > maxWidth) {
              maxWidth = rect.width;
              widestChild = wrap;
            }
          }
        }

        if (widestChild) {
          widestChild.scrollTop = y;
        }
      }, { selector: mainRegionSelector, y: scrollTop });
    }

    await page.waitForTimeout(300); // let render settle

    // Capture the widest scrollable container
    const widestContainer = await page.evaluate((selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return null;

      // Find all scrollable containers
      const containers: Array<{ element: Element; width: number }> = [];

      // Check parents
      let parent = el.parentElement;
      for (let i = 0; i < 3 && parent; i++) {
        if (parent.scrollHeight > parent.clientHeight) {
          containers.push({ element: parent, width: parent.getBoundingClientRect().width });
        }
        parent = parent.parentElement;
      }

      // Check children
      const scrollableChildren = el.querySelectorAll('.el-scrollbar__wrap, [style*="overflow"], [style*="overflow-y"]');
      for (const child of scrollableChildren) {
        if (child.scrollHeight > child.clientHeight) {
          containers.push({ element: child, width: child.getBoundingClientRect().width });
        }
      }

      // Check all scrollbar wraps
      const allScrollbarWraps = document.querySelectorAll('.el-scrollbar__wrap');
      for (const wrap of allScrollbarWraps) {
        if (wrap.scrollHeight > wrap.clientHeight && (wrap.contains(el) || el.contains(wrap))) {
          containers.push({ element: wrap, width: wrap.getBoundingClientRect().width });
        }
      }

      if (containers.length === 0) return null;

      // Find widest
      let widest = containers[0];
      for (const container of containers) {
        if (container.width > widest.width) {
          widest = container;
        }
      }

      // Return a unique selector for the widest container
      const className = widest.element.className;
      const allWithClass = document.querySelectorAll('.' + className.split(' ').join('.'));
      for (let i = 0; i < allWithClass.length; i++) {
        if (allWithClass[i] === widest.element) {
          return {
            selector: '.' + className.split(' ').join('.'),
            index: i,
          };
        }
      }

      return null;
    }, mainRegionSelector);

    if (widestContainer) {
      const containerLocator = page.locator(widestContainer.selector).nth(widestContainer.index);
      const buffer = await containerLocator.screenshot();
      images.push(buffer);
    }
  }

  // Get viewport dimensions
  const viewport = page.viewportSize() ?? { width: 0, height: 0 };

  return {
    images,
    meta: {
      mode: 'scroll',
      width: viewport.width,
      height: totalHeight,
      segments: images.length,
    },
  };
}

export async function captureScreenshot(
  page: Page,
  config: ResolvedSideConfig,
  scrollStep?: number,
): Promise<ScreenshotResult> {
  const { mode } = config;

  if (mode === 'fullPage') {
    // Check if mainRegionSelector element has an internal scrollbar
    // If so, scroll and capture all content
    if (config.mainRegionSelector) {
      const scrollInfo = await page.evaluate((selector: string) => {
        const el = document.querySelector(selector);
        if (!el) return null;

        // Find scrollable child (e.g., Element UI scrollbar)
        const scrollableChild = el.querySelector('.el-scrollbar__wrap, [style*="overflow"], [style*="overflow-y"]');
        if (scrollableChild && scrollableChild.scrollHeight > scrollableChild.clientHeight) {
          return {
            hasScrollbar: true,
            scrollHeight: scrollableChild.scrollHeight,
            clientHeight: scrollableChild.clientHeight,
            selector: selector,
          };
        }

        // Check parent elements for scrollbar
        let parent = el.parentElement;
        for (let i = 0; i < 3 && parent; i++) {
          if (parent.scrollHeight > parent.clientHeight) {
            return {
              hasScrollbar: true,
              scrollHeight: parent.scrollHeight,
              clientHeight: parent.clientHeight,
              selector: selector,
            };
          }
          parent = parent.parentElement;
        }

        // Check if element itself is taller than body
        return {
          hasScrollbar: false,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          bodyHeight: document.body.scrollHeight,
        };
      }, config.mainRegionSelector);

      if (scrollInfo && scrollInfo.hasScrollbar) {
        console.log(`  Found scrollbar in ${config.mainRegionSelector}, capturing by scrolling...`);
        // Capture by scrolling the scrollbar container
        return await captureByScrolling(page, config, scrollStep);
      } else if (scrollInfo && scrollInfo.scrollHeight > (scrollInfo.bodyHeight || 0)) {
        console.log(`  mainRegionSelector (${config.mainRegionSelector}) height ${scrollInfo.scrollHeight}px > body ${scrollInfo.bodyHeight}px, using region mode`);
        const locator = page.locator(config.mainRegionSelector).nth(config.mainRegionIndex ?? 0);
        const count = await locator.count();
        if (count > 0) {
          const buffer = await locator.screenshot();
          const box = await locator.boundingBox();
          return {
            images: [buffer],
            meta: { mode: 'region', width: box?.width ?? 0, height: box?.height ?? 0 },
          };
        }
      }
    }

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
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };

    // Determine scroll container and its height
    const { totalHeight, scrollSelector } = await page.evaluate((selector?: string) => {
      if (selector) {
        const el = document.querySelector(selector);
        if (el && el.scrollHeight > el.clientHeight) {
          return { totalHeight: el.scrollHeight, scrollSelector: selector };
        }
      }
      // Fallback to body or documentElement
      const bodyHeight = document.body.scrollHeight;
      const docHeight = document.documentElement.scrollHeight;
      return { totalHeight: Math.max(bodyHeight, docHeight), scrollSelector: null };
    }, config.mainRegionSelector);

    const images: Buffer[] = [];

    for (let scrollTop = 0; scrollTop < totalHeight; scrollTop += step) {
      if (scrollSelector) {
        await page.evaluate(({ selector, y }) => {
          const el = document.querySelector(selector);
          if (el) el.scrollTop = y;
        }, { selector: scrollSelector, y: scrollTop });
      } else {
        await page.evaluate((y) => window.scrollTo(0, y), scrollTop);
      }
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
