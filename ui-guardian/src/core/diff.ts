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

export function diffScreenshots(
  baselineImage: Buffer,
  candidateImage: Buffer,
  config: Required<DiffConfig>,
): DiffResult {
  const baseline = PNG.sync.read(baselineImage);
  const candidate = PNG.sync.read(candidateImage);

  if (baseline.width !== candidate.width || baseline.height !== candidate.height) {
    throw new DiffError(
      `Image size mismatch: baseline ${baseline.width}x${baseline.height} vs candidate ${candidate.width}x${candidate.height}`,
    );
  }

  const { width, height } = baseline;
  const diffPng = new PNG({ width, height });

  const diffPixels = pixelmatch(
    baseline.data,
    candidate.data,
    diffPng.data,
    width,
    height,
    { threshold: config.threshold, includeAA: config.includeAA },
  );

  const totalPixels = width * height;
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
