// src/report/template.ts
import type { RunResult, PageResult } from '../config/types.js';

export function renderIndexHtml(runResult: RunResult): string {
  const { summary, viewportSummary, anomalySummary, pages } = runResult;

  const pageRows = pages.map(p => {
    const statusIcon = p.status === 'passed' ? '&#10003;' : p.status === 'failed' ? '&#10007;' : '&#9888;';
    const statusClass = p.status;
    const diffPercent = p.diff ? (p.diff.diffPercent * 100).toFixed(2) + '%' : '-';
    const anomalyCount = p.baseline.anomalies.console.length + p.baseline.anomalies.network.length + p.baseline.anomalies.errors.length
      + p.candidate.anomalies.console.length + p.candidate.anomalies.network.length + p.candidate.anomalies.errors.length;
    return `<tr class="${statusClass}">
      <td><a href="${p.reportPath}">${p.pageName}</a></td>
      <td>${p.viewport.label}</td>
      <td>${statusIcon} ${p.status}</td>
      <td>${diffPercent}</td>
      <td>${anomalyCount}</td>
      <td>${(p.duration / 1000).toFixed(1)}s</td>
    </tr>`;
  }).join('\n');

  const viewportRows = viewportSummary.map(v =>
    `<tr><td>${v.label} (${v.width}x${v.height})</td><td>${v.passed}</td><td>${v.failed}</td><td>${v.errors}</td></tr>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ui-guardian Report — ${runResult.runId}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; background: #f5f5f5; }
  .summary { display: flex; gap: 1rem; margin: 1rem 0; }
  .stat { background: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .stat .num { font-size: 2rem; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th, td { padding: 0.5rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
  tr.passed td { color: #16a34a; }
  tr.failed td { color: #dc2626; }
  tr.error td { color: #d97706; }
  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
<h1>ui-guardian Report</h1>
<p>Run: ${runResult.runId} | ${runResult.timestamp} | Duration: ${(runResult.duration / 1000).toFixed(1)}s</p>

<div class="summary">
  <div class="stat"><div class="num">${summary.totalPages}</div>Total</div>
  <div class="stat"><div class="num" style="color:#16a34a">${summary.passed}</div>Passed</div>
  <div class="stat"><div class="num" style="color:#dc2626">${summary.failed}</div>Failed</div>
  <div class="stat"><div class="num" style="color:#d97706">${summary.errors}</div>Errors</div>
  <div class="stat"><div class="num">${(summary.passRate * 100).toFixed(1)}%</div>Pass Rate</div>
</div>

<h2>Viewport Summary</h2>
<table><tr><th>Viewport</th><th>Passed</th><th>Failed</th><th>Errors</th></tr>
${viewportRows}
</table>

<h2>Anomalies</h2>
<p>Console Errors: ${anomalySummary.totalConsoleErrors} | Network Failures: ${anomalySummary.totalNetworkFailures} | JS Errors: ${anomalySummary.totalJsErrors}</p>

<h2>Pages</h2>
<table>
<tr><th>Page</th><th>Viewport</th><th>Status</th><th>Diff %</th><th>Anomalies</th><th>Duration</th></tr>
${pageRows}
</table>
</body>
</html>`;
}

export function renderPageHtml(page: PageResult, runResult: RunResult): string {
  const diffPercent = page.diff ? (page.diff.diffPercent * 100).toFixed(2) + '%' : 'N/A';
  const baselineImg = page.baseline.screenshotPath ? `<img src="../${page.baseline.screenshotPath}" style="max-width:100%">` : '<p>No screenshot</p>';
  const candidateImg = page.candidate.screenshotPath ? `<img src="../${page.candidate.screenshotPath}" style="max-width:100%">` : '<p>No screenshot</p>';
  const diffImg = page.diff ? `<img src="../${page.diff.diffImagePath}" style="max-width:100%">` : '<p>No diff</p>';

  const anomalySection = (side: 'baseline' | 'candidate', label: string) => {
    const a = page[side].anomalies;
    if (a.console.length === 0 && a.network.length === 0 && a.errors.length === 0) return '';
    return `<h3>${label}</h3>
${a.console.length ? `<h4>Console (${a.console.length})</h4><ul>${a.console.map(e => `<li>[${e.type}] ${e.text}</li>`).join('')}</ul>` : ''}
${a.network.length ? `<h4>Network (${a.network.length})</h4><ul>${a.network.map(e => `<li>${e.method} ${e.url} — ${e.status} ${e.statusText}</li>`).join('')}</ul>` : ''}
${a.errors.length ? `<h4>JS Errors (${a.errors.length})</h4><ul>${a.errors.map(e => `<li>${e.message}</li>`).join('')}</ul>` : ''}`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${page.pageName} — ${page.viewport.label}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; background: #f5f5f5; }
  .header { background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
  .images { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
  .images .panel { background: white; padding: 1rem; border-radius: 8px; }
  .images img { max-width: 100%; border: 1px solid #eee; }
  .anomalies { background: white; padding: 1rem; border-radius: 8px; margin-top: 1rem; }
  .passed { color: #16a34a; } .failed { color: #dc2626; } .error { color: #d97706; }
</style>
</head>
<body>
<div class="header">
  <h1>${page.pageName} — ${page.viewport.label}</h1>
  <p class="${page.status}">Status: ${page.status} | Diff: ${diffPercent} | Threshold: ${(page.config.mainRegionSelector ? 'region' : 'fullPage')} | Duration: ${(page.duration / 1000).toFixed(1)}s</p>
</div>

<div class="images">
  <div class="panel"><h3>Baseline</h3>${baselineImg}</div>
  <div class="panel"><h3>Candidate</h3>${candidateImg}</div>
  <div class="panel"><h3>Diff</h3>${diffImg}</div>
</div>

<div class="anomalies">
  <h2>Anomalies</h2>
  ${anomalySection('baseline', 'Baseline Side')}
  ${anomalySection('candidate', 'Candidate Side')}
  ${page.baseline.anomalies.console.length + page.baseline.anomalies.network.length + page.baseline.anomalies.errors.length + page.candidate.anomalies.console.length + page.candidate.anomalies.network.length + page.candidate.anomalies.errors.length === 0 ? '<p>No anomalies detected</p>' : ''}
</div>
</body>
</html>`;
}
