import { writeFileSync } from 'fs';
import path from 'path';
import type { RunResult } from '../config/types.js';

export async function generateJsonReport(runResult: RunResult): Promise<void> {
  // Deep clone and sanitize
  const sanitized = JSON.parse(JSON.stringify(runResult));

  // Mask password
  if (sanitized.config?.global?.auth?.password) {
    sanitized.config.global.auth.password = '******';
  }

  // Remove Buffer fields from diff (keep paths only)
  for (const page of sanitized.pages) {
    if (page.diff?.diffImage && Buffer.isBuffer(page.diff.diffImage)) {
      delete page.diff.diffImage;
    }
  }

  const filePath = path.join(runResult.reportDir, 'data.json');
  writeFileSync(filePath, JSON.stringify(sanitized, null, 2) + '\n');
}
