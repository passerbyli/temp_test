import type { GlobalConfig, PagePair, ResolvedPageConfig } from './types.js';

function toKebabCase(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function mergeConfig(global: GlobalConfig, pagePair: PagePair): ResolvedPageConfig {
  const globalCapture = global.capture ?? {};
  const globalDiff = global.diff ?? {};

  const viewports = pagePair.viewports ?? global.viewports;
  const ignoreSelectors = [
    ...(global.ignoreSelectors ?? []),
    ...(pagePair.ignoreSelectors ?? []),
  ];

  let mode: 'fullPage' | 'region' | 'scroll' = pagePair.captureMode ?? globalCapture.mode ?? 'fullPage';
  if (pagePair.mainRegionSelector) mode = 'region';
  else if (pagePair.scrollCapture) mode = 'scroll';

  const threshold = pagePair.threshold ?? globalDiff.threshold ?? 0.01;

  return {
    name: pagePair.name,
    id: pagePair.id ?? toKebabCase(pagePair.name),
    baselineUrl: pagePair.baseline.url,
    candidateUrl: pagePair.candidate.url,
    mainRegionSelector: pagePair.mainRegionSelector,
    mainRegionIndex: pagePair.mainRegionIndex ?? 0,
    ignoreSelectors,
    viewports,
    mode,
    scrollStep: globalCapture.scrollStep ?? 800,
    threshold,
    waitForNetworkIdle: globalCapture.waitForNetworkIdle ?? true,
    pageLoadTimeout: globalCapture.pageLoadTimeout ?? 60000,
    screenshotDelay: globalCapture.screenshotDelay ?? 0,
    diffIncludeAA: globalDiff.includeAA ?? false,
  };
}
