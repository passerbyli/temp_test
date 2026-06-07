// src/report/template.ts
import type { RunResult, PageResult } from '../config/types.js';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary: #1E40AF;
  --primary-light: #3B82F6;
  --primary-bg: #EFF6FF;
  --accent: #F59E0B;
  --accent-bg: #FFFBEB;
  --success: #059669;
  --success-bg: #ECFDF5;
  --danger: #DC2626;
  --danger-bg: #FEF2F2;
  --warning: #D97706;
  --warning-bg: #FFFBEB;
  --text: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --border: #E2E8F0;
  --bg: #F8FAFC;
  --card: #FFFFFF;
  --sidebar-bg: #0F172A;
  --sidebar-text: #CBD5E1;
  --sidebar-hover: #1E293B;
  --sidebar-active: #1E40AF;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  --radius: 10px;
  --radius-sm: 6px;
  --sidebar-width: 280px;
}

html, body { height: 100%; overflow: hidden; }

body {
  font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Layout */
.app { display: flex; height: 100vh; }

/* Sidebar */
.sidebar {
  width: var(--sidebar-width); min-width: var(--sidebar-width);
  background: var(--sidebar-bg);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.sidebar-header {
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.sidebar-header h1 {
  font-size: 1.1rem; font-weight: 700; color: #fff;
  display: flex; align-items: center; gap: 0.5rem;
}
.sidebar-header .run-meta {
  font-size: 0.72rem; color: var(--text-muted);
  font-family: 'Fira Code', monospace;
  margin-top: 0.35rem;
}

.sidebar-nav {
  flex: 1; overflow-y: auto; padding: 0.5rem 0;
}
.sidebar-nav::-webkit-scrollbar { width: 4px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

.nav-section {
  padding: 0.5rem 1.25rem 0.25rem;
  font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.08em; color: rgba(255,255,255,0.3);
}

.nav-item {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.55rem 1.25rem;
  color: var(--sidebar-text);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.88rem; font-weight: 400;
  border-left: 3px solid transparent;
  text-decoration: none;
}
.nav-item:hover {
  background: var(--sidebar-hover);
  color: #fff;
}
.nav-item.active {
  background: rgba(30, 64, 175, 0.3);
  color: #fff;
  border-left-color: var(--primary-light);
  font-weight: 500;
}
.nav-item svg { flex-shrink: 0; opacity: 0.6; }
.nav-item.active svg { opacity: 1; }

.nav-item .badge {
  margin-left: auto;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.65rem; font-weight: 600;
  font-family: 'Fira Code', monospace;
}
.nav-item .badge-passed { background: rgba(5,150,105,0.2); color: #34D399; }
.nav-item .badge-failed { background: rgba(220,38,38,0.2); color: #F87171; }
.nav-item .badge-error { background: rgba(217,119,6,0.2); color: #FBBF24; }

/* Image panel */
.image-panel {
  background: var(--card); border-radius: var(--radius);
  border: 1px solid var(--border); overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.image-panel h3 {
  padding: 0.75rem 1rem; font-size: 0.85rem; font-weight: 600;
  color: var(--text-secondary); border-bottom: 1px solid var(--border);
  text-transform: uppercase; letter-spacing: 0.03em;
  background: var(--bg);
}
.image-panel img {
  width: 100%; height: auto; display: block;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: opacity 0.2s ease;
}
.image-panel img:hover { opacity: 0.9; }
.image-panel .empty-state {
  padding: 3rem; text-align: center; color: var(--text-muted);
  font-size: 0.9rem;
}

/* Lightbox modal */
.lightbox {
  display: none;
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.85);
  z-index: 1000;
  justify-content: center; align-items: center;
  padding: 2rem;
  cursor: pointer;
}
.lightbox.active { display: flex; }
.lightbox img {
  max-width: 95vw; max-height: 95vh;
  object-fit: contain;
  border-radius: var(--radius-sm);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.lightbox-close {
  position: absolute; top: 1rem; right: 1.5rem;
  color: white; font-size: 2rem; cursor: pointer;
  opacity: 0.7; transition: opacity 0.2s;
  background: none; border: none;
}
.lightbox-close:hover { opacity: 1; }
.lightbox-caption {
  position: absolute; bottom: 1.5rem; left: 50%;
  transform: translateX(-50%);
  color: white; font-size: 0.9rem;
  background: rgba(0,0,0,0.6);
  padding: 0.5rem 1rem; border-radius: 999px;
}

/* Main content */
.main {
  flex: 1; overflow: hidden;
  display: flex; flex-direction: column;
}
.main-header {
  padding: 1rem 2rem;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 0.75rem;
  min-height: 56px;
}
.main-header h2 {
  font-size: 1.15rem; font-weight: 600; color: var(--text);
}
.main-header .breadcrumb {
  font-size: 0.8rem; color: var(--text-muted);
}
.main-header .breadcrumb span { color: var(--primary); font-weight: 500; }

.main-content {
  flex: 1; overflow-y: auto;
  padding: 1.5rem 2rem;
}

/* Overview specific */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.kpi-card {
  background: var(--card);
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.kpi-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.kpi-card .label {
  font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.25rem;
}
.kpi-card .value {
  font-size: 1.85rem; font-weight: 700; font-family: 'Fira Code', monospace;
  line-height: 1.2;
}
.kpi-card .value.success { color: var(--success); }
.kpi-card .value.danger { color: var(--danger); }
.kpi-card .value.warning { color: var(--warning); }
.kpi-card .value.primary { color: var(--primary); }

.section {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  margin-bottom: 1.5rem;
  overflow: hidden;
}
.section-header {
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 0.5rem;
}
.section-header h2 { font-size: 0.95rem; font-weight: 600; color: var(--text); }
.section-body { padding: 1.25rem 1.5rem; }

table { width: 100%; border-collapse: collapse; }
thead th {
  text-align: left; padding: 0.65rem 1rem;
  font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--text-muted);
  border-bottom: 2px solid var(--border);
  background: var(--bg);
}
tbody td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.88rem;
  transition: background 0.15s ease;
}
tbody tr:hover td { background: var(--primary-bg); }
tbody tr:last-child td { border-bottom: none; }

.badge {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.15rem 0.55rem; border-radius: 999px;
  font-size: 0.72rem; font-weight: 600;
  font-family: 'Fira Code', monospace;
}
.badge-passed { background: var(--success-bg); color: var(--success); }
.badge-failed { background: var(--danger-bg); color: var(--danger); }
.badge-error { background: var(--warning-bg); color: var(--warning); }

a { color: var(--primary); text-decoration: none; font-weight: 500; }
a:hover { color: var(--primary-light); text-decoration: underline; }

/* iframe view */
.iframe-wrap {
  width: 100%; height: 100%;
  border: none; border-radius: var(--radius);
}
.iframe-loading {
  display: flex; align-items: center; justify-content: center;
  height: 300px; color: var(--text-muted); font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar { width: 60px; min-width: 60px; }
  .sidebar-header h1 span, .sidebar-header .run-meta,
  .nav-section, .nav-item span { display: none; }
  .nav-item { justify-content: center; padding-left: 0; padding-right: 0; }
  .main-content { padding: 1rem; }
}
`;

/* ===== SVG Icons ===== */
const ICO = {
  shield: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  home: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  page: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
};

export function renderIndexHtml(runResult: RunResult): string {
  const { summary, viewportSummary, anomalySummary, pages } = runResult;

  // Sidebar menu items
  const pageMenuItems = pages.map(p => {
    const badgeClass = p.status === 'passed' ? 'badge-passed' : p.status === 'failed' ? 'badge-failed' : 'badge-error';
    const diffPercent = p.diff ? (p.diff.diffPercent * 100).toFixed(1) + '%' : '-';
    const diffLabel = p.status === 'passed' ? '&#10003;' : p.status === 'failed' ? '&#10007;' : '&#9888;';
    return `<a class="nav-item" href="#" onclick="loadPage('${p.pageId}', '${p.pageName}', this); return false;">
      ${ICO.page}
      <span>${p.pageName}</span>
      <span class="badge ${badgeClass}" style="margin-left:auto">${diffLabel} ${diffPercent}</span>
    </a>`;
  }).join('');

  // Overview table rows
  const pageRows = pages.map(p => {
    const badgeClass = p.status === 'passed' ? 'badge-passed' : p.status === 'failed' ? 'badge-failed' : 'badge-error';
    const statusLabel = p.status === 'passed' ? '&#10003; 通过' : p.status === 'failed' ? '&#10007; 失败' : '&#9888; 错误';
    const diffPercent = p.diff ? (p.diff.diffPercent * 100).toFixed(2) + '%' : '-';
    const anomalyCount = p.baseline.anomalies.console.length + p.baseline.anomalies.network.length + p.baseline.anomalies.errors.length
      + p.candidate.anomalies.console.length + p.candidate.anomalies.network.length + p.candidate.anomalies.errors.length;
    return `<tr onclick="loadPage('${p.pageId}', '${p.pageName}')" style="cursor:pointer">
      <td style="font-weight:500">${p.pageName}</td>
      <td>${p.viewport.label}</td>
      <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
      <td style="font-family:'Fira Code',monospace;font-weight:600">${diffPercent}</td>
      <td style="font-family:'Fira Code',monospace">${anomalyCount}</td>
      <td style="font-family:'Fira Code',monospace">${(p.duration / 1000).toFixed(1)}s</td>
    </tr>`;
  }).join('');

  const viewportRows = viewportSummary.map(v =>
    `<tr>
      <td style="font-weight:500">${v.label}</td>
      <td style="font-family:'Fira Code',monospace">${v.width}&times;${v.height}</td>
      <td><span class="badge badge-passed">&#10003; ${v.passed}</span></td>
      <td><span class="badge badge-failed">&#10007; ${v.failed}</span></td>
      <td><span class="badge badge-error">&#9888; ${v.errors}</span></td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>UI Guardian &mdash; ${runResult.runId}</title>
<style>${CSS}</style>
</head>
<body>
<div class="app">

  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1>${ICO.shield} <span>UI Guardian</span></h1>
      <div class="run-meta">${runResult.runId} &middot; ${(runResult.duration / 1000).toFixed(1)}s</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">导航</div>
      <a class="nav-item active" id="nav-overview" href="#" onclick="showOverview(this)">
        ${ICO.home}
        <span>总览</span>
        <span class="badge ${summary.failed > 0 ? 'badge-failed' : 'badge-passed'}" style="margin-left:auto">${summary.passed}/${summary.totalPages}</span>
      </a>

      <div class="nav-section" style="margin-top:0.75rem">页面</div>
      ${pageMenuItems}
    </nav>
  </aside>

  <!-- Main -->
  <div class="main">
    <div class="main-header">
      <h2 id="main-title">总览</h2>
      <div class="breadcrumb" id="main-breadcrumb">
        运行时间: ${new Date(runResult.timestamp).toLocaleString('zh-CN')}
      </div>
    </div>
    <div class="main-content" id="main-content">
      <div id="overview-panel">
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="label">总页面数</div>
            <div class="value primary">${summary.totalPages}</div>
          </div>
          <div class="kpi-card">
            <div class="label">通过</div>
            <div class="value success">${summary.passed}</div>
          </div>
          <div class="kpi-card">
            <div class="label">失败</div>
            <div class="value danger">${summary.failed}</div>
          </div>
          <div class="kpi-card">
            <div class="label">错误</div>
            <div class="value warning">${summary.errors}</div>
          </div>
          <div class="kpi-card">
            <div class="label">通过率</div>
            <div class="value ${summary.passRate >= 1 ? 'success' : summary.passRate > 0 ? 'warning' : 'danger'}">${(summary.passRate * 100).toFixed(1)}%</div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h2>视口摘要</h2>
          </div>
          <table>
            <thead><tr><th>视口</th><th>分辨率</th><th>通过</th><th>失败</th><th>错误</th></tr></thead>
            <tbody>${viewportRows}</tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-header">
            <h2>异常统计</h2>
          </div>
          <div class="section-body">
            <div class="kpi-grid" style="margin-bottom:0">
              <div class="kpi-card">
                <div class="label">控制台错误</div>
                <div class="value ${anomalySummary.totalConsoleErrors > 0 ? 'danger' : 'success'}">${anomalySummary.totalConsoleErrors}</div>
              </div>
              <div class="kpi-card">
                <div class="label">网络失败</div>
                <div class="value ${anomalySummary.totalNetworkFailures > 0 ? 'danger' : 'success'}">${anomalySummary.totalNetworkFailures}</div>
              </div>
              <div class="kpi-card">
                <div class="label">JS 错误</div>
                <div class="value ${anomalySummary.totalJsErrors > 0 ? 'danger' : 'success'}">${anomalySummary.totalJsErrors}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h2>页面列表</h2>
          </div>
          <table>
            <thead><tr><th>页面</th><th>视口</th><th>状态</th><th>差异%</th><th>异常</th><th>耗时</th></tr></thead>
            <tbody>${pageRows}</tbody>
          </table>
        </div>
      </div>
      <div id="iframe-panel" style="display:none;height:100%">
        <iframe name="content-frame" class="iframe-wrap" id="content-frame"></iframe>
      </div>
    </div>
  </div>

</div>

<script>
const PAGES = ${JSON.stringify(pages.map(p => ({ id: p.pageId, name: p.pageName, path: p.reportPath })))};

function showOverview(el) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('overview-panel').style.display = '';
  document.getElementById('iframe-panel').style.display = 'none';
  document.getElementById('main-title').textContent = '总览';
  document.getElementById('main-breadcrumb').innerHTML = '运行时间: ${new Date(runResult.timestamp).toLocaleString('zh-CN')}';
}

function loadPage(pageId, pageName, navEl) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  const page = PAGES.find(p => p.id === pageId);
  if (!page) return;
  document.getElementById('overview-panel').style.display = 'none';
  document.getElementById('iframe-panel').style.display = '';
  document.getElementById('content-frame').src = page.path;
  document.getElementById('main-title').textContent = pageName;
  document.getElementById('main-breadcrumb').innerHTML = '总览 &rsaquo; <span>' + pageName + '</span>';
}
</script>
</body>
</html>`;
}

export function renderPageHtml(page: PageResult, _runResult: RunResult): string {
  const diffPercent = page.diff ? (page.diff.diffPercent * 100).toFixed(2) + '%' : 'N/A';
  const baselineImg = page.baseline.screenshotPath
    ? `<img src="../${page.baseline.screenshotPath}" alt="Baseline screenshot">`
    : '<div class="empty-state">No screenshot captured</div>';
  const candidateImg = page.candidate.screenshotPath
    ? `<img src="../${page.candidate.screenshotPath}" alt="Candidate screenshot">`
    : '<div class="empty-state">No screenshot captured</div>';
  const diffImg = page.diff
    ? `<img src="../${page.diff.diffImagePath}" alt="Diff visualization">`
    : '<div class="empty-state">No diff generated</div>';

  const anomalySection = (side: 'baseline' | 'candidate', label: string) => {
    const a = page[side].anomalies;
    if (a.console.length === 0 && a.network.length === 0 && a.errors.length === 0) return '';
    return `<div class="anomaly-group">
      <h3>${label}</h3>
      ${a.console.length ? `<h4>控制台 (${a.console.length})</h4><ul class="anomaly-list">${a.console.map(e => `<li class="${e.type}">[${e.type}] ${e.text}</li>`).join('')}</ul>` : ''}
      ${a.network.length ? `<h4>网络 (${a.network.length})</h4><ul class="anomaly-list">${a.network.map(e => `<li>${e.method} ${e.url} &mdash; ${e.status} ${e.statusText}</li>`).join('')}</ul>` : ''}
      ${a.errors.length ? `<h4>JS 错误 (${a.errors.length})</h4><ul class="anomaly-list">${a.errors.map(e => `<li class="error">${e.message}</li>`).join('')}</ul>` : ''}
    </div>`;
  };

  const hasAnomalies = page.baseline.anomalies.console.length + page.baseline.anomalies.network.length + page.baseline.anomalies.errors.length
    + page.candidate.anomalies.console.length + page.candidate.anomalies.network.length + page.candidate.anomalies.errors.length > 0;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${page.pageName} &mdash; ${page.viewport.label}</title>
<style>
${CSS.replace('html, body { height: 100%; overflow: hidden; }', 'html, body { height: 100%; }')}
.main { display: block !important; }
.sidebar, .main-header { display: none !important; }
.main-content { padding: 1.5rem 2rem; overflow-y: auto; height: 100%; }
.image-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; padding: 1.25rem; }
@media (max-width: 1024px) { .image-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="main" style="display:block">
  <div class="main-content" style="height:auto">

  <div class="section" style="border-left:4px solid var(--primary)">
    <div class="section-header" style="flex-wrap:wrap;gap:0.75rem">
      <h2 style="font-size:1.15rem">${page.pageName} &mdash; ${page.viewport.label}</h2>
      <span class="badge badge-${page.status}" style="margin-left:auto">${page.status === 'passed' ? '&#10003; 通过' : page.status === 'failed' ? '&#10007; 失败' : '&#9888; 错误'}</span>
      <span style="font-size:0.82rem;color:var(--text-muted);font-family:'Fira Code',monospace">差异: ${diffPercent}</span>
      <span style="font-size:0.82rem;color:var(--text-muted);font-family:'Fira Code',monospace">模式: ${page.config.candidate.mainRegionSelector ? '区域' : '全页'}</span>
      <span style="font-size:0.82rem;color:var(--text-muted);font-family:'Fira Code',monospace">耗时: ${(page.duration / 1000).toFixed(1)}s</span>
    </div>
  </div>

  <div class="section">
    <div class="section-header"><h2>截图对比</h2></div>
    <div class="image-grid">
      <div class="image-panel"><h3>基线 (Baseline)</h3>${baselineImg}</div>
      <div class="image-panel"><h3>候选 (Candidate)</h3>${candidateImg}</div>
      <div class="image-panel"><h3>差异 (Diff)</h3>${diffImg}</div>
    </div>
  </div>

${page.textDiff && page.textDiff.filter(e => e.type !== 'unchanged').length > 0 ? (() => {
  const rows: { num: number | null; removed: string; added: string }[] = [];
  let markerNum = 0;
  const changed = page.textDiff.filter(e => e.type !== 'unchanged');
  let i = 0;
  while (i < changed.length) {
    const removes: string[] = [];
    const adds: string[] = [];
    while (i < changed.length && changed[i].type === 'removed') { removes.push(changed[i].value); i++; }
    while (i < changed.length && changed[i].type === 'added') { adds.push(changed[i].value); i++; }
    const blockMax = Math.max(removes.length, adds.length);
    for (let k = 0; k < blockMax; k++) {
      markerNum++;
      rows.push({ num: markerNum, removed: k < removes.length ? removes[k] : '', added: k < adds.length ? adds[k] : '' });
    }
  }
  return `  <div class="section">
    <div class="section-header">
      <h2>文本差异</h2>
      <span class="badge badge-failed" style="margin-left:auto">${rows.length} 处变更</span>
    </div>
    <table class="diff-table" style="font-family:'Fira Code',monospace;font-size:0.82rem">
      <thead><tr><th style="width:40px;text-align:center">#</th><th>基线 (移除)</th><th>候选 (新增)</th></tr></thead>
      <tbody>
      ${rows.map(r => `<tr>
        <td style="text-align:center"><span class="marker">${r.num}</span></td>
        <td style="color:#991B1B;background:#FEF2F2;border-left:3px solid var(--danger);vertical-align:top;padding:0.4rem 0.6rem">${r.removed || '<span style="color:var(--text-muted);font-style:italic">&mdash;</span>'}</td>
        <td style="color:#166534;background:#F0FDF4;border-left:3px solid var(--success);vertical-align:top;padding:0.4rem 0.6rem">${r.added || '<span style="color:var(--text-muted);font-style:italic">&mdash;</span>'}</td>
      </tr>`).join('\n')}
      </tbody>
    </table>
  </div>`;
})() : ''}
${hasAnomalies ? `  <div class="section">
    <div class="section-header"><h2>异常信息</h2></div>
    <div class="section-body">
      ${anomalySection('baseline', '基线 (Baseline)')}
      ${anomalySection('candidate', '候选 (Candidate)')}
    </div>
  </div>` : ''}

  </div>
</div>

<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
  <img id="lightbox-img" src="" alt="">
  <div class="lightbox-caption" id="lightbox-caption"></div>
</div>

<script>
function openLightbox(src, caption) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-caption').textContent = caption;
  document.getElementById('lightbox').classList.add('active');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLightbox();
});
document.querySelectorAll('.image-panel img').forEach(img => {
  img.addEventListener('click', function() {
    const caption = this.closest('.image-panel').querySelector('h3').textContent;
    openLightbox(this.src, caption);
  });
});
</script>
</body>
</html>`;
}
