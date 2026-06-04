import { diffScreenshots } from '../../src/core/diff.js';
import { PNG } from 'pngjs';

function createPng(width: number, height: number, r: number, g: number, b: number): Buffer {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

describe('diffScreenshots', () => {
  it('returns 0 diff for identical images', () => {
    const img = createPng(10, 10, 255, 0, 0);
    const result = diffScreenshots(img, img, { threshold: 0.01, includeAA: false });
    expect(result.diffPercent).toBe(0);
    expect(result.passed).toBe(true);
    expect(result.diffPixels).toBe(0);
  });

  it('detects difference in different images', () => {
    const img1 = createPng(10, 10, 255, 0, 0);
    const img2 = createPng(10, 10, 0, 255, 0);
    const result = diffScreenshots(img1, img2, { threshold: 0.01, includeAA: false });
    expect(result.diffPercent).toBeGreaterThan(0);
    expect(result.passed).toBe(false);
    expect(result.diffPixels).toBeGreaterThan(0);
  });

  it('generates diff image buffer', () => {
    const img1 = createPng(10, 10, 255, 0, 0);
    const img2 = createPng(10, 10, 0, 255, 0);
    const result = diffScreenshots(img1, img2, { threshold: 0.01, includeAA: false });
    expect(result.diffImage).toBeInstanceOf(Buffer);
    expect(result.diffImage.length).toBeGreaterThan(0);
  });

  it('throws on size mismatch', () => {
    const img1 = createPng(10, 10, 255, 0, 0);
    const img2 = createPng(20, 20, 255, 0, 0);
    expect(() => diffScreenshots(img1, img2, { threshold: 0.01, includeAA: false })).toThrow('size mismatch');
  });
});
