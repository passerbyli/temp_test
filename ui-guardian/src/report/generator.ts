// src/report/generator.ts
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import type { RunResult } from '../config/types.js';
import { renderIndexHtml, renderPageHtml } from './template.js';

export async function generateHtmlReport(runResult: RunResult): Promise<void> {
  const pagesDir = path.join(runResult.reportDir, 'pages');
  mkdirSync(pagesDir, { recursive: true });

  // Generate index.html
  const indexHtml = renderIndexHtml(runResult);
  writeFileSync(path.join(runResult.reportDir, 'index.html'), indexHtml);

  // Generate per-page detail HTML
  for (const page of runResult.pages) {
    const pageHtml = renderPageHtml(page, runResult);
    writeFileSync(path.join(runResult.reportDir, page.reportPath), pageHtml);
  }
}
