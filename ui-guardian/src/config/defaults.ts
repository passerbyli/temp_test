import type { GlobalConfig, PagePair, ResolvedPageConfig, ResolvedSideConfig, SideConfig } from './types.js';

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function resolveSideConfig(
  side: SideConfig,
  pagePair: PagePair,
  global: GlobalConfig,
): ResolvedSideConfig {
  const globalCapture = global.capture ?? {};
  const globalIgnore = global.ignoreSelectors ?? [];

  const mainRegionSelector = side.mainRegionSelector ?? pagePair.mainRegionSelector;
  const mainRegionIndex = side.mainRegionIndex ?? pagePair.mainRegionIndex ?? 0;
  const ignoreSelectors = [
    ...globalIgnore,
    ...(pagePair.ignoreSelectors ?? []),
    ...(side.ignoreSelectors ?? []),
  ];

  const explicitMode = side.captureMode ?? pagePair.captureMode ?? globalCapture.mode;
  let mode: 'fullPage' | 'region' | 'scroll';
  if (explicitMode) {
    mode = explicitMode;
  } else if (mainRegionSelector) {
    mode = 'region';
  } else if (pagePair.scrollCapture) {
    mode = 'scroll';
  } else {
    mode = 'fullPage';
  }

  return { mainRegionSelector, mainRegionIndex, ignoreSelectors, mode };
}

export function mergeConfig(global: GlobalConfig, pagePair: PagePair): ResolvedPageConfig {
  const globalCapture = global.capture ?? {};
  const globalDiff = global.diff ?? {};

  const viewports = pagePair.viewports ?? global.viewports;
  const threshold = pagePair.threshold ?? globalDiff.threshold ?? 0.01;

  const baselineConfig = resolveSideConfig(pagePair.baseline, pagePair, global);
  const candidateConfig = resolveSideConfig(pagePair.candidate, pagePair, global);

  return {
    name: pagePair.name,
    id: pagePair.id ?? toKebabCase(pagePair.name),
    baselineUrl: pagePair.baseline.url,
    candidateUrl: pagePair.candidate.url,
    baselineConfig,
    candidateConfig,
    viewports,
    scrollStep: globalCapture.scrollStep ?? 800,
    threshold,
    waitForNetworkIdle: globalCapture.waitForNetworkIdle ?? true,
    pageLoadTimeout: globalCapture.pageLoadTimeout ?? 60000,
    screenshotDelay: globalCapture.screenshotDelay ?? 3000,
    diffIncludeAA: globalDiff.includeAA ?? false,
  };
}
