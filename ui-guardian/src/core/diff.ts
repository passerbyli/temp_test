import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { DiffResult, DiffConfig } from '../config/types.js';

export class DiffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiffError';
  }
}

export function diffScrollSegments(
  baselineImages: Buffer[],
  candidateImages: Buffer[],
  config: Required<DiffConfig>,
): DiffResult {
  if (baselineImages.length !== candidateImages.length) {
    throw new DiffError(`Segment count mismatch: baseline ${baselineImages.length} vs candidate ${candidateImages.length}`);
  }

  // Diff each segment and collect results
  const segmentResults: DiffResult[] = [];
  for (let i = 0; i < baselineImages.length; i++) {
    const result = diffScreenshots(baselineImages[i], candidateImages[i], config);
    segmentResults.push(result);
  }

  // Find the segment with the most differences for pass/fail determination
  let worstResult = segmentResults[0];
  for (const result of segmentResults) {
    if (result.diffPercent > worstResult.diffPercent) {
      worstResult = result;
    }
  }

  // Combine all diff images vertically
  if (segmentResults.length === 1) {
    return worstResult;
  }

  // Get dimensions from first segment
  const firstPng = PNG.sync.read(segmentResults[0].diffImage);
  const segmentHeight = firstPng.height;
  const segmentWidth = firstPng.width;
  const totalHeight = segmentHeight * segmentResults.length;

  // Create combined diff image
  const combinedPng = new PNG({ width: segmentWidth, height: totalHeight });

  // Copy each segment into the combined image
  for (let i = 0; i < segmentResults.length; i++) {
    const segmentPng = PNG.sync.read(segmentResults[i].diffImage);
    const yOffset = i * segmentHeight;

    for (let y = 0; y < segmentHeight; y++) {
      for (let x = 0; x < segmentWidth; x++) {
        const srcIdx = (y * segmentWidth + x) * 4;
        const dstIdx = ((y + yOffset) * segmentWidth + x) * 4;

        combinedPng.data[dstIdx] = segmentPng.data[srcIdx];
        combinedPng.data[dstIdx + 1] = segmentPng.data[srcIdx + 1];
        combinedPng.data[dstIdx + 2] = segmentPng.data[srcIdx + 2];
        combinedPng.data[dstIdx + 3] = segmentPng.data[srcIdx + 3];
      }
    }
  }

  // Calculate total diff across all segments
  let totalDiffPixels = 0;
  let totalPixels = 0;
  for (const result of segmentResults) {
    totalDiffPixels += result.diffPixels;
    totalPixels += result.totalPixels;
  }

  const combinedDiffPercent = totalPixels > 0 ? totalDiffPixels / totalPixels : 0;
  const combinedDiffImage = PNG.sync.write(combinedPng);

  return {
    diffImage: combinedDiffImage,
    diffPercent: combinedDiffPercent,
    diffPixels: totalDiffPixels,
    totalPixels,
    passed: combinedDiffPercent < config.threshold,
    threshold: config.threshold,
  };
}

function cropToCommon(baseline: PNG, candidate: PNG): { baselineData: Buffer; candidateData: Buffer; diffPng: PNG; width: number; height: number } {
  const width = Math.min(baseline.width, candidate.width);
  const height = Math.min(baseline.height, candidate.height);

  // Extract common region from both images
  const baselineData = Buffer.alloc(width * height * 4);
  const candidateData = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    baseline.data.copy(baselineData, y * width * 4, (y * baseline.width) * 4, (y * baseline.width + width) * 4);
    candidate.data.copy(candidateData, y * width * 4, (y * candidate.width) * 4, (y * candidate.width + width) * 4);
  }

  const diffPng = new PNG({ width, height });
  return { baselineData, candidateData, diffPng, width, height };
}

export function diffScreenshots(
  baselineImage: Buffer,
  candidateImage: Buffer,
  config: Required<DiffConfig>,
): DiffResult {
  const baseline = PNG.sync.read(baselineImage);
  const candidate = PNG.sync.read(candidateImage);

  // Use common area for comparison
  const { baselineData, candidateData, diffPng, width, height } = cropToCommon(baseline, candidate);

  const diffPixels = pixelmatch(
    baselineData,
    candidateData,
    diffPng.data,
    width,
    height,
    { threshold: config.threshold, includeAA: config.includeAA },
  );

  // Total pixels = original baseline size (preserves original context)
  const totalPixels = baseline.width * baseline.height;
  const diffPercent = totalPixels > 0 ? diffPixels / totalPixels : 0;
  const diffImage = PNG.sync.write(diffPng);

  return {
    diffImage,
    diffPercent,
    diffPixels,
    totalPixels,
    passed: diffPercent < config.threshold,
    threshold: config.threshold,
  };
}
