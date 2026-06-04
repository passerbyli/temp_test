import { generateJsonReport } from '../../src/report/json.js';
import type { RunResult } from '../../src/config/types.js';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';
import os from 'os';

function makeRunResult(): RunResult {
  return {
    runId: 'test-run',
    timestamp: '2026-06-05T00:00:00Z',
    duration: 1000,
    uiGuardianVersion: '0.1.0',
    config: {
      global: {
        auth: { loginUrl: 'https://a.com', username: 'u', password: 'SECRET', usernameSelector: '#u', passwordSelector: '#p', submitSelector: '#b' },
        viewports: [{ width: 1920, height: 1080 }],
      },
      pages: { pagePairs: [] },
    },
    summary: { totalPages: 0, totalPagePairs: 0, totalViewports: 1, passed: 0, failed: 0, errors: 0, passRate: 0, totalDuration: 1000 },
    viewportSummary: [],
    pages: [],
    anomalySummary: { totalConsoleErrors: 0, totalNetworkFailures: 0, totalJsErrors: 0, pagesWithAnomalies: 0 },
    reportDir: '/tmp/test',
  };
}

describe('generateJsonReport', () => {
  it('writes data.json with sanitized password', async () => {
    const tmpDir = path.join(os.tmpdir(), 'ui-guardian-json-test-' + Date.now());
    mkdirSync(tmpDir, { recursive: true });
    const result = makeRunResult();
    result.reportDir = tmpDir;

    await generateJsonReport(result);

    const content = JSON.parse(readFileSync(path.join(tmpDir, 'data.json'), 'utf-8'));
    expect(content.config.global.auth.password).toBe('******');
    expect(content.runId).toBe('test-run');
  });
});
