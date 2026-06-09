import type { Page } from 'playwright';
import path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import type { ResolvedPageConfig, ViewportConfig, PageResult, TextDiffEntry } from '../config/types.js';
import { diffScreenshots, diffScrollSegments } from './diff.js';
import { createCollector } from './collector.js';
import { processSide } from './processSide.js';
import { matchTextPositions, annotateDiffImage } from './textMarker.js';

function normalizeText(text: string): string {
  return text.split('\n').filter(l => l.trim() !== '').join('\n');
}

function computeTextDiff(baselineText: string, candidateText: string): TextDiffEntry[] {
  const baseLines = normalizeText(baselineText).split('\n');
  const candLines = normalizeText(candidateText).split('\n');
  const entries: TextDiffEntry[] = [];
  let bi = 0, ci = 0;
  const LOOK = 3;

  while (bi < baseLines.length || ci < candLines.length) {
    if (bi >= baseLines.length) { entries.push({ type: 'added', value: candLines[ci] }); ci++; continue; }
    if (ci >= candLines.length) { entries.push({ type: 'removed', value: baseLines[bi] }); bi++; continue; }
    if (baseLines[bi] === candLines[ci]) { bi++; ci++; continue; }

    let foundInCand = -1;
    for (let look = 1; look <= LOOK && ci + look < candLines.length; look++) {
      if (candLines[ci + look] === baseLines[bi]) { foundInCand = ci + look; break; }
    }
    let foundInBase = -1;
    for (let look = 1; look <= LOOK && bi + look < baseLines.length; look++) {
      if (baseLines[bi + look] === candLines[ci]) { foundInBase = bi + look; break; }
    }

    if (foundInCand >= 0 && (foundInBase < 0 || foundInCand - ci <= foundInBase - bi)) {
      while (ci < foundInCand) { entries.push({ type: 'added', value: candLines[ci] }); ci++; }
    } else if (foundInBase >= 0) {
      while (bi < foundInBase) { entries.push({ type: 'removed', value: baseLines[bi] }); bi++; }
    } else {
      entries.push({ type: 'removed', value: baseLines[bi] });
      entries.push({ type: 'added', value: candLines[ci] });
      bi++; ci++;
    }
  }

  // Post-process: ensure entries alternate removed/added (pair standalone entries)
  const result: TextDiffEntry[] = [];
  let i = 0;
  while (i < entries.length) {
    if (entries[i].type === 'removed') {
      if (i + 1 < entries.length && entries[i + 1].type === 'added') {
        // Already a pair
        result.push(entries[i], entries[i + 1]);
        i += 2;
      } else {
        // Standalone removed — emit as removed + empty added
        result.push(entries[i]);
        result.push({ type: 'added', value: '' });
        i++;
      }
    } else {
      // Standalone added — emit as empty removed + added
      result.push({ type: 'removed', value: '' });
      result.push(entries[i]);
      i++;
    }
  }
  return result;
}

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
    const baseline = await processSide(page, config.baselineUrl, config, config.baselineConfig, outputDir, 'baseline', fileSuffix, collector);
    collector.reset();

    // Process candidate
    const candidate = await processSide(page, config.candidateUrl, config, config.candidateConfig, outputDir, 'candidate', fileSuffix, collector);

    // Text diff
    let textDiff = (baseline.textContent && candidate.textContent)
      ? computeTextDiff(baseline.textContent, candidate.textContent)
      : undefined;

    // Match text diff positions using both baseline and candidate positions
    if (textDiff && (candidate.textPositions || baseline.textPositions)) {
      // For multi-segment scroll screenshots, convert viewport-relative positions to container-relative positions
      // This ensures markers are placed at the correct position in the combined diff image
      const candidateScroll = candidate.scrollContainerState ?? { scrollTop: 0, containerViewportX: 0, containerViewportY: 0 };
      const baselineScroll = baseline.scrollContainerState ?? { scrollTop: 0, containerViewportX: 0, containerViewportY: 0 };

      // Use the scroll container's viewport position (captured at text extraction time)
      // instead of page.locator().boundingBox() which reflects current scroll state
      const originX = candidateScroll.containerViewportX;
      const originY = candidateScroll.containerViewportY;

      // Compute baseline offset by finding a common text node
      let baselineOriginX = 0;
      let baselineOriginY = 0;
      if (config.baselineConfig.mainRegionSelector && baseline.textPositions && candidate.textPositions) {
        for (const bp of baseline.textPositions) {
          for (const cp of candidate.textPositions) {
            if (bp.text === cp.text && bp.text.length > 2) {
              baselineOriginX = bp.x - cp.x;
              baselineOriginY = bp.y - cp.y;
              break;
            }
          }
          if (baselineOriginX !== 0 || baselineOriginY !== 0) break;
        }
      }
      // Add baseline container offset
      baselineOriginX += baselineScroll.containerViewportX;
      baselineOriginY += baselineScroll.containerViewportY;

      // Convert viewport-relative positions to container-relative positions
      // containerRelativeY = viewportY - containerViewportY + scrollTop
      const candidatePos = (candidate.textPositions ?? []).map(p => ({
        text: p.text,
        x: p.x - originX,
        y: p.y - originY + candidateScroll.scrollTop,
        width: p.width,
        height: p.height,
      }));
      const baselinePos = (baseline.textPositions ?? []).map(p => ({
        text: p.text,
        x: p.x - baselineOriginX,
        y: p.y - baselineOriginY + baselineScroll.scrollTop,
        width: p.width,
        height: p.height,
      }));

      // Pass zero origins since all adjustments are already applied
      matchTextPositions(textDiff, candidatePos, baselinePos, 0, 0, 0, 0);
    }

    // Diff
    if (!baseline.screenshotPath || !candidate.screenshotPath) {
      status = 'error';
      error = !baseline.screenshotPath && !candidate.screenshotPath
        ? 'Both screenshots failed to capture'
        : !baseline.screenshotPath
          ? 'Baseline screenshot failed to capture'
          : 'Candidate screenshot failed to capture';
    } else if (baseline.screenshotPath && candidate.screenshotPath) {
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
      let finalDiffImage = diff.diffImage;
      if (textDiff && textDiff.some(e => e.type !== 'unchanged' && e.position)) {
        finalDiffImage = annotateDiffImage(diff.diffImage, textDiff);
      }
      writeFileSync(path.join(outputDir, diffPath), finalDiffImage);

      // Determine pass/fail based on TEXT diff, not pixel diff.
      // Pixel diff reflects visual/layout differences (e.g., width changes cause whole-page shifts),
      // while text diff reflects actual content changes — which is what matters for testing.
      const hasTextChanges = textDiff && textDiff.some(e => e.type !== 'unchanged');

      diffResult = {
        diffImagePath: diffPath,
        diffPercent: diff.diffPercent,
        diffPixels: diff.diffPixels,
        totalPixels: diff.totalPixels,
        passed: !hasTextChanges,
        threshold: diff.threshold,
      };

      status = hasTextChanges ? 'failed' : 'passed';
    }

    return {
      pageId: config.id,
      pageName: config.name,
      viewport: { width: viewport.width, height: viewport.height, label: viewportLabel },
      baseline,
      candidate,
      diff: diffResult,
      config: {
        baseline: {
          mainRegionSelector: config.baselineConfig.mainRegionSelector,
          mainRegionIndex: config.baselineConfig.mainRegionIndex,
          ignoreSelectors: config.baselineConfig.ignoreSelectors,
        },
        candidate: {
          mainRegionSelector: config.candidateConfig.mainRegionSelector,
          mainRegionIndex: config.candidateConfig.mainRegionIndex,
          ignoreSelectors: config.candidateConfig.ignoreSelectors,
        },
      },
      textDiff,
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
      config: {
        baseline: {
          mainRegionSelector: config.baselineConfig.mainRegionSelector,
          mainRegionIndex: config.baselineConfig.mainRegionIndex,
          ignoreSelectors: config.baselineConfig.ignoreSelectors,
        },
        candidate: {
          mainRegionSelector: config.candidateConfig.mainRegionSelector,
          mainRegionIndex: config.candidateConfig.mainRegionIndex,
          ignoreSelectors: config.candidateConfig.ignoreSelectors,
        },
      },
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
      duration: Date.now() - startTime,
      reportPath: `pages/${fileSuffix}.html`,
    };
  }
}
