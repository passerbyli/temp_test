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

  let worstResult: DiffResult | null = null;
  for (let i = 0; i < baselineImages.length; i++) {
    const result = diffScreenshots(baselineImages[i], candidateImages[i], config);
    if (!worstResult || result.diffPercent > worstResult.diffPercent) {
      worstResult = result;
    }
  }

  return worstResult!;
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
