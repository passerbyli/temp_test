import { PNG } from 'pngjs';
import type { TextDiffEntry } from '../config/types.js';

// 5x7 bitmap font for digits 0-9 and special chars
const FONT: Record<string, number[][]> = {
  '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
  '2': [[1,1,1],[0,0,1],[0,0,1],[1,1,1],[1,0,0],[1,0,0],[1,1,1]],
  '3': [[1,1,1],[0,0,1],[0,0,1],[1,1,1],[0,0,1],[0,0,1],[1,1,1]],
  '4': [[1,0,1],[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1],[0,0,1]],
  '5': [[1,1,1],[1,0,0],[1,0,0],[1,1,1],[0,0,1],[0,0,1],[1,1,1]],
  '6': [[1,1,1],[1,0,0],[1,0,0],[1,1,1],[1,0,1],[1,0,1],[1,1,1]],
  '7': [[1,1,1],[0,0,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
  '8': [[1,1,1],[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1],[1,1,1]],
  '9': [[1,1,1],[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1],[1,1,1]],
};

function drawFilledCircle(png: PNG, cx: number, cy: number, r: number, R: number, G: number, B: number) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        const px = cx + dx;
        const py = cy + dy;
        if (px >= 0 && px < png.width && py >= 0 && py < png.height) {
          const idx = (py * png.width + px) << 2;
          png.data[idx] = R;
          png.data[idx + 1] = G;
          png.data[idx + 2] = B;
          png.data[idx + 3] = 255;
        }
      }
    }
  }
}

function drawDigit(png: PNG, digit: string, x: number, y: number, scale: number, R: number, G: number, B: number) {
  const bitmap = FONT[digit];
  if (!bitmap) return;
  for (let row = 0; row < bitmap.length; row++) {
    for (let col = 0; col < bitmap[row].length; col++) {
      if (bitmap[row][col]) {
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = x + col * scale + sx;
            const py = y + row * scale + sy;
            if (px >= 0 && px < png.width && py >= 0 && py < png.height) {
              const idx = (py * png.width + px) << 2;
              png.data[idx] = R;
              png.data[idx + 1] = G;
              png.data[idx + 2] = B;
              png.data[idx + 3] = 255;
            }
          }
        }
      }
    }
  }
}

function drawNumber(png: PNG, num: number, cx: number, cy: number, scale: number) {
  const digits = String(num).split('');
  const charWidth = 3 * scale;
  const charGap = scale;
  const totalWidth = digits.length * charWidth + (digits.length - 1) * charGap;
  const startX = cx - Math.floor(totalWidth / 2);
  const startY = cy - Math.floor(7 * scale / 2);

  for (let i = 0; i < digits.length; i++) {
    drawDigit(png, digits[i], startX + i * (charWidth + charGap), startY, scale, 255, 255, 255);
  }
}

export function matchTextPositions(
  textDiffs: TextDiffEntry[],
  positions: { text: string; x: number; y: number; width: number; height: number }[],
  baselinePositions?: { text: string; x: number; y: number; width: number; height: number }[],
  originX = 0,
  originY = 0,
  baselineOriginX = 0,
  baselineOriginY = 0,
): void {
  for (const entry of textDiffs) {
    if (entry.type === 'unchanged') continue;
    const diffText = entry.value.trim();
    if (!diffText) continue;

    if (entry.type === 'removed' && baselinePositions) {
      for (const pos of baselinePositions) {
        if (pos.text.includes(diffText) || diffText.includes(pos.text)) {
          entry.position = { x: pos.x - baselineOriginX, y: pos.y - baselineOriginY, width: pos.width, height: pos.height };
          break;
        }
      }
    } else {
      for (const pos of positions) {
        if (pos.text.includes(diffText) || diffText.includes(pos.text)) {
          entry.position = { x: pos.x - originX, y: pos.y - originY, width: pos.width, height: pos.height };
          break;
        }
      }
    }
  }
}

export function annotateDiffImage(
  diffImage: Buffer,
  textDiffs: TextDiffEntry[],
): Buffer {
  const png = PNG.sync.read(diffImage);

  let markerIndex = 0;
  for (const entry of textDiffs) {
    if (entry.type === 'unchanged' || !entry.position) continue;
    markerIndex++;

    // Positions are already container-relative (converted in processPage.ts)
    // For combined scroll images, container-relative Y directly maps to combined image Y
    const cx = entry.position.x + Math.floor(entry.position.width / 2);
    const cy = entry.position.y + Math.floor(entry.position.height / 2);

    const radius = 14;
    drawFilledCircle(png, cx, cy, radius, 37, 99, 235);
    drawNumber(png, markerIndex, cx, cy, 2);
  }

  return PNG.sync.write(png);
}
