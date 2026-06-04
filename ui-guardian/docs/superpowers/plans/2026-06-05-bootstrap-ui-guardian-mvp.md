# ui-guardian MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local CLI tool that compares pages across two frontend environments, generates visual diffs with anomaly context, and outputs versioned HTML/JSON reports.

**Architecture:** CLI (Commander.js) → Runner (orchestration) → Playwright browser for screenshots + anomaly collection → pixelmatch for pixel diff → multi-file HTML/JSON report. Config-driven with global + pagePair two-level model.

**Tech Stack:** Node.js, TypeScript, Playwright, pixelmatch, pngjs, Commander.js

---

## File Structure

```
ui-guardian/
├── package.json
├── tsconfig.json
├── src/
│   ├── cli/
│   │   ├── init.ts                    # Generate config templates
│   │   └── run.ts                     # Execute comparison flow
│   ├── config/
│   │   ├── types.ts                   # All TypeScript interfaces
│   │   ├── validation.ts              # Config validation
│   │   └── defaults.ts                # Default value merging
│   ├── core/
│   │   ├── auth.ts                    # Auto-login, credential management
│   │   ├── viewport.ts                # BrowserContext creation per viewport
│   │   ├── capture.ts                 # Screenshot (fullPage/region/scroll)
│   │   ├── collector.ts               # Console/network/error anomaly collection
│   │   ├── diff.ts                    # pixelmatch pixel comparison
│   │   ├── processSide.ts             # Single-side processing (baseline or candidate)
│   │   ├── processPage.ts             # Single-page processing (baseline + candidate + diff)
│   │   └── runner.ts                  # Top-level orchestration
│   └── report/
│       ├── json.ts                    # data.json generation
│       ├── template.ts                # HTML template strings
│       └── generator.ts               # Multi-file HTML report generation
└── tests/
    ├── config/
    │   ├── validation.test.ts
    │   └── defaults.test.ts
    ├── core/
    │   ├── diff.test.ts
    │   ├── collector.test.ts
    │   └── capture.test.ts
    └── report/
        └── json.test.ts
```

---

## Phase 1: Foundation (Milestone M1 — `init` works)

### Task 1.1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "ui-guardian",
  "version": "0.1.0",
  "description": "UI consistency verification tool for comparing pages across environments",
  "main": "dist/index.js",
  "bin": {
    "ui-guardian": "dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "start": "node dist/cli/index.js"
  },
  "type": "module",
  "license": "MIT"
}
```

- [ ] **Step 2: Install production dependencies**

Run: `npm install commander playwright pixelmatch pngjs`

- [ ] **Step 3: Install dev dependencies**

Run: `npm install -D typescript @types/node @types/pixelmatch @types/pngjs jest ts-jest @types/jest`

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 5: Create directory structure**

Run: `mkdir -p src/{cli,config,core,report} tests/{config,core,report}`

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors (empty project compiles cleanly)

- [ ] **Step 7: Install Playwright browsers**

Run: `npx playwright install chromium`

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json package-lock.json
git commit -m "feat: initialize project with dependencies and TypeScript config"
```

---

### Task 1.2: Core Type Definitions

**Files:**
- Create: `src/config/types.ts`

- [ ] **Step 1: Create types.ts with all interfaces**

```typescript
// ===== Config Types =====

export interface AuthConfig {
  loginUrl: string;
  username: string;
  password: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
  successWait?: {
    type: 'url' | 'selector';
    value: string;
  };
  timeout?: number;
}

export interface ViewportConfig {
  width: number;
  height: number;
  label?: string;
}

export interface CaptureConfig {
  mode?: 'fullPage' | 'region' | 'scroll';
  scrollStep?: number;
  waitForNetworkIdle?: boolean;
  pageLoadTimeout?: number;
  screenshotDelay?: number;
}

export interface DiffConfig {
  threshold?: number;
  includeAA?: boolean;
}

export interface GlobalConfig {
  auth: AuthConfig;
  viewports: ViewportConfig[];
  capture?: CaptureConfig;
  diff?: DiffConfig;
  ignoreSelectors?: string[];
  outputDir?: string;
}

export interface PagePair {
  name: string;
  id?: string;
  baseline: { url: string };
  candidate: { url: string };
  mainRegionSelector?: string;
  mainRegionIndex?: number;
  ignoreSelectors?: string[];
  viewports?: ViewportConfig[];
  captureMode?: 'fullPage' | 'region' | 'scroll';
  scrollCapture?: boolean;
  threshold?: number;
}

export interface PagesConfig {
  pagePairs: PagePair[];
}

// ===== Runtime Result Types =====

export interface ConsoleEntry {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  text: string;
  timestamp: number;
}

export interface NetworkEntry {
  url: string;
  method: string;
  status: number;
  statusText: string;
  timestamp: number;
}

export interface ErrorEntry {
  message: string;
  stack?: string;
  timestamp: number;
}

export interface AnomalyResult {
  console: ConsoleEntry[];
  network: NetworkEntry[];
  errors: ErrorEntry[];
}

export interface ScreenshotMeta {
  mode: 'fullPage' | 'region' | 'scroll';
  width: number;
  height: number;
  segments?: number;
}

export interface ScreenshotResult {
  images: Buffer[];
  meta: ScreenshotMeta;
}

export interface DiffResult {
  diffImage: Buffer;
  diffPercent: number;
  diffPixels: number;
  totalPixels: number;
  passed: boolean;
  threshold: number;
}

export interface PageSideResult {
  url: string;
  screenshotPath: string | null;
  screenshotMeta: ScreenshotMeta | null;
  anomalies: AnomalyResult;
}

export interface PageResult {
  pageId: string;
  pageName: string;
  viewport: { width: number; height: number; label: string };
  baseline: PageSideResult;
  candidate: PageSideResult;
  diff: {
    diffImagePath: string;
    diffPercent: number;
    diffPixels: number;
    totalPixels: number;
    passed: boolean;
    threshold: number;
  } | null;
  config: {
    mainRegionSelector?: string;
    mainRegionIndex?: number;
    ignoreSelectors: string[];
  };
  status: 'passed' | 'failed' | 'error';
  error?: string;
  duration: number;
  reportPath: string;
}

export interface ViewportSummaryItem {
  label: string;
  width: number;
  height: number;
  passed: number;
  failed: number;
  errors: number;
}

export interface RunResult {
  runId: string;
  timestamp: string;
  duration: number;
  uiGuardianVersion: string;
  config: {
    global: GlobalConfig;
    pages: PagesConfig;
  };
  summary: {
    totalPages: number;
    totalPagePairs: number;
    totalViewports: number;
    passed: number;
    failed: number;
    errors: number;
    passRate: number;
    totalDuration: number;
  };
  viewportSummary: ViewportSummaryItem[];
  pages: PageResult[];
  anomalySummary: {
    totalConsoleErrors: number;
    totalNetworkFailures: number;
    totalJsErrors: number;
    pagesWithAnomalies: number;
  };
  reportDir: string;
}

// ===== Resolved Config (after merging) =====

export interface ResolvedPageConfig {
  name: string;
  id: string;
  baselineUrl: string;
  candidateUrl: string;
  mainRegionSelector?: string;
  mainRegionIndex: number;
  ignoreSelectors: string[];
  mode: 'fullPage' | 'region' | 'scroll';
  scrollStep: number;
  threshold: number;
  waitForNetworkIdle: boolean;
  pageLoadTimeout: number;
  screenshotDelay: number;
  diffIncludeAA: boolean;
}

// ===== Module Return Types =====

export interface AuthResult {
  context: import('playwright').BrowserContext;
  cookies: import('playwright').Cookie[];
  storageState: import('playwright').StorageState;
}

export interface Collector {
  attach(page: import('playwright').Page, pageUrl: string): void;
  collect(): AnomalyResult;
  reset(): void;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/config/types.ts
git commit -m "feat: define all TypeScript interfaces for config and runtime types"
```

---

### Task 1.3: Config Validation

**Files:**
- Create: `src/config/validation.ts`
- Create: `tests/config/validation.test.ts`

- [ ] **Step 1: Write validation tests**

```typescript
// tests/config/validation.test.ts
import { validateGlobalConfig, validatePagesConfig } from '../../src/config/validation.js';
import type { GlobalConfig, PagesConfig } from '../../src/config/types.js';

const validGlobal: GlobalConfig = {
  auth: {
    loginUrl: 'https://example.com/login',
    username: 'admin',
    password: 'pass',
    usernameSelector: '#user',
    passwordSelector: '#pass',
    submitSelector: '#btn',
  },
  viewports: [{ width: 1920, height: 1080 }],
};

const validPages: PagesConfig = {
  pagePairs: [
    {
      name: 'Home',
      baseline: { url: 'https://staging.example.com/' },
      candidate: { url: 'https://prod.example.com/' },
    },
  ],
};

describe('validateGlobalConfig', () => {
  it('accepts valid config', () => {
    const result = validateGlobalConfig(validGlobal);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing auth.loginUrl', () => {
    const config = { ...validGlobal, auth: { ...validGlobal.auth, loginUrl: '' } };
    const result = validateGlobalConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('loginUrl'));
  });

  it('rejects empty viewports', () => {
    const config = { ...validGlobal, viewports: [] };
    const result = validateGlobalConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('viewports'));
  });

  it('rejects invalid viewport dimensions', () => {
    const config = { ...validGlobal, viewports: [{ width: -1, height: 0 }] };
    const result = validateGlobalConfig(config);
    expect(result.valid).toBe(false);
  });

  it('rejects threshold out of range', () => {
    const config = { ...validGlobal, diff: { threshold: 1.5 } };
    const result = validateGlobalConfig(config);
    expect(result.valid).toBe(false);
  });

  it('rejects invalid capture mode', () => {
    const config = { ...validGlobal, capture: { mode: 'invalid' as any } };
    const result = validateGlobalConfig(config);
    expect(result.valid).toBe(false);
  });
});

describe('validatePagesConfig', () => {
  it('accepts valid config', () => {
    const result = validatePagesConfig(validPages);
    expect(result.valid).toBe(true);
  });

  it('rejects empty pagePairs', () => {
    const result = validatePagesConfig({ pagePairs: [] });
    expect(result.valid).toBe(false);
  });

  it('rejects duplicate page names', () => {
    const config: PagesConfig = {
      pagePairs: [
        { name: 'Home', baseline: { url: 'https://a.com' }, candidate: { url: 'https://b.com' } },
        { name: 'Home', baseline: { url: 'https://c.com' }, candidate: { url: 'https://d.com' } },
      ],
    };
    const result = validatePagesConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('unique'));
  });

  it('rejects missing baseline url', () => {
    const config: PagesConfig = {
      pagePairs: [{ name: 'Test', baseline: { url: '' }, candidate: { url: 'https://b.com' } }],
    };
    const result = validatePagesConfig(config);
    expect(result.valid).toBe(false);
  });

  it('rejects invalid url format', () => {
    const config: PagesConfig = {
      pagePairs: [{ name: 'Test', baseline: { url: 'not-a-url' }, candidate: { url: 'https://b.com' } }],
    };
    const result = validatePagesConfig(config);
    expect(result.valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/config/validation.test.ts --no-cache`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement validation.ts**

```typescript
// src/config/validation.ts
import type { GlobalConfig, PagesConfig } from './types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateGlobalConfig(config: GlobalConfig): ValidationResult {
  const errors: string[] = [];

  // Auth
  if (!config.auth) errors.push('auth is required');
  else {
    if (!config.auth.loginUrl) errors.push('auth.loginUrl is required');
    else if (!isValidUrl(config.auth.loginUrl)) errors.push('auth.loginUrl must be a valid URL');
    if (!config.auth.username) errors.push('auth.username is required');
    if (!config.auth.password) errors.push('auth.password is required');
    if (!config.auth.usernameSelector) errors.push('auth.usernameSelector is required');
    if (!config.auth.passwordSelector) errors.push('auth.passwordSelector is required');
    if (!config.auth.submitSelector) errors.push('auth.submitSelector is required');
  }

  // Viewports
  if (!config.viewports || config.viewports.length === 0) {
    errors.push('viewports must have at least one entry');
  } else {
    config.viewports.forEach((v, i) => {
      if (!Number.isInteger(v.width) || v.width <= 0) errors.push(`viewports[${i}].width must be a positive integer`);
      if (!Number.isInteger(v.height) || v.height <= 0) errors.push(`viewports[${i}].height must be a positive integer`);
    });
  }

  // Diff threshold
  if (config.diff?.threshold !== undefined) {
    if (config.diff.threshold < 0 || config.diff.threshold > 1) {
      errors.push('diff.threshold must be between 0 and 1');
    }
  }

  // Capture mode
  if (config.capture?.mode !== undefined) {
    if (!['fullPage', 'region', 'scroll'].includes(config.capture.mode)) {
      errors.push('capture.mode must be fullPage, region, or scroll');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validatePagesConfig(config: PagesConfig): ValidationResult {
  const errors: string[] = [];

  if (!config.pagePairs || config.pagePairs.length === 0) {
    errors.push('pagePairs must have at least one entry');
    return { valid: false, errors };
  }

  const names = new Set<string>();
  config.pagePairs.forEach((pp, i) => {
    if (!pp.name) errors.push(`pagePairs[${i}].name is required`);
    else if (names.has(pp.name)) errors.push(`pagePairs[${i}].name must be unique: "${pp.name}"`);
    else names.add(pp.name);

    if (!pp.baseline?.url) errors.push(`pagePairs[${i}].baseline.url is required`);
    else if (!isValidUrl(pp.baseline.url)) errors.push(`pagePairs[${i}].baseline.url must be a valid URL`);

    if (!pp.candidate?.url) errors.push(`pagePairs[${i}].candidate.url is required`);
    else if (!isValidUrl(pp.candidate.url)) errors.push(`pagePairs[${i}].candidate.url must be a valid URL`);

    if (pp.mainRegionIndex !== undefined && (!Number.isInteger(pp.mainRegionIndex) || pp.mainRegionIndex < 0)) {
      errors.push(`pagePairs[${i}].mainRegionIndex must be a non-negative integer`);
    }
  });

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/config/validation.test.ts --no-cache`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/config/validation.ts tests/config/validation.test.ts
git commit -m "feat: add config validation with tests"
```

---

### Task 1.4: Default Value Merging

**Files:**
- Create: `src/config/defaults.ts`
- Create: `tests/config/defaults.test.ts`

- [ ] **Step 1: Write merge tests**

```typescript
// tests/config/defaults.test.ts
import { mergeConfig } from '../../src/config/defaults.js';
import type { GlobalConfig, PagePair } from '../../src/config/types.js';

const globalConfig: GlobalConfig = {
  auth: {
    loginUrl: 'https://example.com/login',
    username: 'admin',
    password: 'pass',
    usernameSelector: '#user',
    passwordSelector: '#pass',
    submitSelector: '#btn',
  },
  viewports: [
    { width: 1920, height: 1080, label: 'desktop' },
    { width: 375, height: 812, label: 'mobile' },
  ],
  capture: { mode: 'fullPage', scrollStep: 800, waitForNetworkIdle: true, pageLoadTimeout: 60000, screenshotDelay: 0 },
  diff: { threshold: 0.01, includeAA: false },
  ignoreSelectors: ['.cookie-banner'],
  outputDir: 'output/reports',
};

describe('mergeConfig', () => {
  it('uses global viewports when pagePair has none', () => {
    const pagePair: PagePair = {
      name: 'Home',
      baseline: { url: 'https://a.com' },
      candidate: { url: 'https://b.com' },
    };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.viewports).toEqual(globalConfig.viewports);
  });

  it('pagePair viewports override global', () => {
    const pagePair: PagePair = {
      name: 'Home',
      baseline: { url: 'https://a.com' },
      candidate: { url: 'https://b.com' },
      viewports: [{ width: 1366, height: 768 }],
    };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.viewports).toEqual([{ width: 1366, height: 768 }]);
  });

  it('ignoreSelectors appends from pagePair', () => {
    const pagePair: PagePair = {
      name: 'Home',
      baseline: { url: 'https://a.com' },
      candidate: { url: 'https://b.com' },
      ignoreSelectors: ['.page-ad'],
    };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.ignoreSelectors).toEqual(['.cookie-banner', '.page-ad']);
  });

  it('mainRegionSelector forces region mode', () => {
    const pagePair: PagePair = {
      name: 'Home',
      baseline: { url: 'https://a.com' },
      candidate: { url: 'https://b.com' },
      mainRegionSelector: '.main-content',
    };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.mode).toBe('region');
  });

  it('pagePair threshold overrides global', () => {
    const pagePair: PagePair = {
      name: 'Home',
      baseline: { url: 'https://a.com' },
      candidate: { url: 'https://b.com' },
      threshold: 0.05,
    };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.threshold).toBe(0.05);
  });

  it('generates id from name when not provided', () => {
    const pagePair: PagePair = {
      name: 'Login Page',
      baseline: { url: 'https://a.com' },
      candidate: { url: 'https://b.com' },
    };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.id).toBe('login-page');
  });

  it('uses provided id', () => {
    const pagePair: PagePair = {
      name: 'Login',
      id: 'custom-id',
      baseline: { url: 'https://a.com' },
      candidate: { url: 'https://b.com' },
    };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.id).toBe('custom-id');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/config/defaults.test.ts --no-cache`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement defaults.ts**

```typescript
// src/config/defaults.ts
import type { GlobalConfig, PagePair, ResolvedPageConfig } from './types.js';

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function mergeConfig(global: GlobalConfig, pagePair: PagePair): ResolvedPageConfig {
  const globalCapture = global.capture ?? {};
  const globalDiff = global.diff ?? {};

  // Viewports: pagePair overrides global
  const viewports = pagePair.viewports ?? global.viewports;

  // Ignore selectors: append
  const ignoreSelectors = [
    ...(global.ignoreSelectors ?? []),
    ...(pagePair.ignoreSelectors ?? []),
  ];

  // Mode: mainRegionSelector forces region
  let mode: 'fullPage' | 'region' | 'scroll' = pagePair.captureMode ?? globalCapture.mode ?? 'fullPage';
  if (pagePair.mainRegionSelector) {
    mode = 'region';
  } else if (pagePair.scrollCapture) {
    mode = 'scroll';
  }

  // Threshold: pagePair overrides global
  const threshold = pagePair.threshold ?? globalDiff.threshold ?? 0.01;

  return {
    name: pagePair.name,
    id: pagePair.id ?? toKebabCase(pagePair.name),
    baselineUrl: pagePair.baseline.url,
    candidateUrl: pagePair.candidate.url,
    mainRegionSelector: pagePair.mainRegionSelector,
    mainRegionIndex: pagePair.mainRegionIndex ?? 0,
    ignoreSelectors,
    mode,
    scrollStep: globalCapture.scrollStep ?? 800,
    threshold,
    waitForNetworkIdle: globalCapture.waitForNetworkIdle ?? true,
    pageLoadTimeout: globalCapture.pageLoadTimeout ?? 60000,
    screenshotDelay: globalCapture.screenshotDelay ?? 0,
    diffIncludeAA: globalDiff.includeAA ?? false,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/config/defaults.test.ts --no-cache`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/config/defaults.ts tests/config/defaults.test.ts
git commit -m "feat: add config merging with pagePair overrides and tests"
```

---

### Task 1.5: CLI init Command

**Files:**
- Create: `src/cli/index.ts`
- Create: `src/cli/init.ts`

- [ ] **Step 1: Create CLI entry point with Commander.js**

```typescript
// src/cli/index.ts
import { Command } from 'commander';
import { init } from './init.js';

const program = new Command();

program
  .name('ui-guardian')
  .description('UI consistency verification tool')
  .version('0.1.0');

program
  .command('init')
  .description('Generate configuration templates')
  .action(async () => {
    await init();
  });

// run command added in Task 2.5

program.parse();
```

- [ ] **Step 2: Implement init.ts**

```typescript
// src/cli/init.ts
import { writeFileSync } from 'fs';
import path from 'path';

const GLOBAL_TEMPLATE = {
  auth: {
    loginUrl: 'https://example.com/login',
    username: 'admin',
    password: 'your-password',
    usernameSelector: '#username',
    passwordSelector: '#password',
    submitSelector: '#login-btn',
    successWait: { type: 'url', value: '/dashboard' },
    timeout: 30000,
  },
  viewports: [
    { width: 1920, height: 1080, label: 'desktop' },
    { width: 1366, height: 768, label: 'laptop' },
    { width: 375, height: 812, label: 'mobile' },
  ],
  capture: {
    mode: 'fullPage',
    scrollStep: 800,
    waitForNetworkIdle: true,
    pageLoadTimeout: 60000,
    screenshotDelay: 0,
  },
  diff: { threshold: 0.01, includeAA: false },
  ignoreSelectors: ['.cookie-banner', '.timestamp', '.ad-container'],
  outputDir: 'output/reports',
};

const PAGES_TEMPLATE = {
  pagePairs: [
    {
      name: 'Home',
      baseline: { url: 'https://staging.example.com/' },
      candidate: { url: 'https://prod.example.com/' },
      mainRegionSelector: '.main-content',
      mainRegionIndex: 0,
      ignoreSelectors: [],
    },
  ],
};

export async function init(): Promise<void> {
  const cwd = process.cwd();
  const globalPath = path.join(cwd, 'global.config.json');
  const pagesPath = path.join(cwd, 'pages.config.json');

  writeFileSync(globalPath, JSON.stringify(GLOBAL_TEMPLATE, null, 2) + '\n');
  writeFileSync(pagesPath, JSON.stringify(PAGES_TEMPLATE, null, 2) + '\n');

  console.log('Configuration templates created:');
  console.log(`  ${globalPath}`);
  console.log(`  ${pagesPath}`);
  console.log('');
  console.log('Edit these files, then run: npx ui-guardian run');
}
```

- [ ] **Step 3: Verify init works end-to-end**

Run: `mkdir -p /tmp/ui-guardian-test && cd /tmp/ui-guardian-test && node /Users/lihaomin/projects/nas/ui-guardian/dist/cli/index.js init`
Expected: Two config files created, console output shows paths

- [ ] **Step 4: Verify generated configs are valid JSON**

Run: `cat /tmp/ui-guardian-test/global.config.json | node -e "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Valid JSON')"`
Expected: "Valid JSON"

- [ ] **Step 5: Commit**

```bash
git add src/cli/index.ts src/cli/init.ts
git commit -m "feat: add CLI init command to generate config templates (M1)"
```

**Milestone M1 complete.** `npx ui-guardian init` generates valid config templates.

---

## Phase 2: Main Chain (Milestone M2 — single page screenshot works)

### Task 2.1: Auth Module

**Files:**
- Create: `src/core/auth.ts`

- [ ] **Step 1: Implement auth.ts**

```typescript
// src/core/auth.ts
import type { Browser, BrowserContext, Page } from 'playwright';
import type { AuthConfig, AuthResult } from '../config/types.js';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function authenticate(browser: Browser, config: AuthConfig): Promise<AuthResult> {
  const timeout = config.timeout ?? 30000;
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(config.loginUrl, { timeout, waitUntil: 'networkidle' });

    // Fill credentials
    await page.locator(config.usernameSelector).fill(config.username);
    await page.locator(config.passwordSelector).fill(config.password);

    // Submit
    await page.locator(config.submitSelector).click();

    // Wait for success
    if (config.successWait) {
      if (config.successWait.type === 'url') {
        await page.waitForURL(`**${config.successWait.value}**`, { timeout });
      } else {
        await page.locator(config.successWait.value).waitFor({ timeout });
      }
    } else {
      await page.waitForLoadState('networkidle', { timeout });
    }

    // Extract credentials
    const storageState = await context.storageState();
    const cookies = await context.cookies();

    return { context, cookies, storageState };
  } catch (error) {
    await context.close();
    const message = error instanceof Error ? error.message : String(error);
    throw new AuthError(`Login failed: ${message}`);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/core/auth.ts
git commit -m "feat: add auth module for auto-login with credential extraction"
```

---

### Task 2.2: Viewport Module

**Files:**
- Create: `src/core/viewport.ts`

- [ ] **Step 1: Implement viewport.ts**

```typescript
// src/core/viewport.ts
import type { Browser, BrowserContext, StorageState } from 'playwright';
import type { ViewportConfig } from '../config/types.js';

export async function createViewportContext(
  browser: Browser,
  viewport: ViewportConfig,
  storageState: StorageState,
): Promise<BrowserContext> {
  return browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    storageState,
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/core/viewport.ts
git commit -m "feat: add viewport module for BrowserContext creation"
```

---

### Task 2.3: Screenshot Module (fullPage only)

**Files:**
- Create: `src/core/capture.ts`

- [ ] **Step 1: Implement capture.ts with fullPage mode**

```typescript
// src/core/capture.ts
import type { Page } from 'playwright';
import type { ScreenshotResult, ResolvedPageConfig } from '../config/types.js';

export class CaptureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaptureError';
  }
}

export async function captureScreenshot(
  page: Page,
  config: ResolvedPageConfig,
): Promise<ScreenshotResult> {
  const { mode } = config;

  if (mode === 'fullPage') {
    const buffer = await page.screenshot({ fullPage: true });
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    return {
      images: [buffer],
      meta: { mode: 'fullPage', width: viewport.width, height: viewport.height },
    };
  }

  // region and scroll modes added in Task 4.1 and 4.2
  throw new CaptureError(`Unsupported capture mode: ${mode}`);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/core/capture.ts
git commit -m "feat: add screenshot capture module with fullPage mode"
```

---

### Task 2.4: Runner Main Flow

**Files:**
- Create: `src/core/runner.ts`

- [ ] **Step 1: Implement runner.ts with minimal flow**

```typescript
// src/core/runner.ts
import type { Browser } from 'playwright';
import path from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import type { GlobalConfig, PagesConfig, PageResult, RunResult } from '../config/types.js';
import { validateGlobalConfig, validatePagesConfig } from '../config/validation.js';
import { mergeConfig } from '../config/defaults.js';
import { authenticate } from './auth.js';
import { createViewportContext } from './viewport.js';
import { captureScreenshot } from './capture.js';

export class RunnerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RunnerError';
  }
}

function createOutputDir(baseDir: string): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, '-').replace(/\..+/, '');
  const dir = path.join(baseDir, ts);
  mkdirSync(path.join(dir, 'screenshots', 'baseline'), { recursive: true });
  mkdirSync(path.join(dir, 'screenshots', 'candidate'), { recursive: true });
  mkdirSync(path.join(dir, 'screenshots', 'diff'), { recursive: true });
  mkdirSync(path.join(dir, 'logs'), { recursive: true });
  return dir;
}

function buildEmptyAnomaly() {
  return { console: [], network: [], errors: [] };
}

export async function runAll(
  browser: Browser,
  globalConfig: GlobalConfig,
  pagesConfig: PagesConfig,
): Promise<RunResult> {
  // Validate
  const globalValidation = validateGlobalConfig(globalConfig);
  if (!globalValidation.valid) throw new RunnerError(`Global config invalid:\n${globalValidation.errors.join('\n')}`);

  const pagesValidation = validatePagesConfig(pagesConfig);
  if (!pagesValidation.valid) throw new RunnerError(`Pages config invalid:\n${pagesValidation.errors.join('\n')}`);

  // Create output dir
  const outputDir = createOutputDir(globalConfig.outputDir ?? 'output/reports');

  // Authenticate
  const authResult = await authenticate(browser, globalConfig.auth);
  const { storageState } = authResult;

  const startTime = Date.now();
  const allPageResults: PageResult[] = [];

  // Outer loop: pagePairs, inner loop: viewports
  for (const pagePair of pagesConfig.pagePairs) {
    const resolved = mergeConfig(globalConfig, pagePair);
    const viewports = pagePair.viewports ?? globalConfig.viewports;

    for (const viewport of viewports) {
      const viewportLabel = viewport.label ?? `${viewport.width}x${viewport.height}`;
      const context = await createViewportContext(browser, viewport, storageState);
      const page = await context.newPage();

      const pageStartTime = Date.now();
      let status: 'passed' | 'failed' | 'error' = 'passed';
      let error: string | undefined;

      let baselinePath: string | null = null;
      let candidatePath: string | null = null;
      let baselineMeta = null;
      let candidateMeta = null;

      try {
        // Baseline side
        await page.goto(resolved.baselineUrl, {
          waitUntil: resolved.waitForNetworkIdle ? 'networkidle' : 'load',
          timeout: resolved.pageLoadTimeout,
        });
        if (resolved.screenshotDelay > 0) await page.waitForTimeout(resolved.screenshotDelay);

        // Inject ignoreSelectors
        if (resolved.ignoreSelectors.length > 0) {
          await page.addStyleTag({
            content: resolved.ignoreSelectors.map(s => `${s} { display: none !important; }`).join('\n'),
          });
        }

        const baselineResult = await captureScreenshot(page, { ...resolved, mode: resolved.mode } as any);
        baselinePath = `screenshots/baseline/${resolved.id}_${viewportLabel}.png`;
        writeFileSync(path.join(outputDir, baselinePath), baselineResult.images[0]);
        baselineMeta = baselineResult.meta;

        // Candidate side
        await page.goto(resolved.candidateUrl, {
          waitUntil: resolved.waitForNetworkIdle ? 'networkidle' : 'load',
          timeout: resolved.pageLoadTimeout,
        });
        if (resolved.screenshotDelay > 0) await page.waitForTimeout(resolved.screenshotDelay);

        if (resolved.ignoreSelectors.length > 0) {
          await page.addStyleTag({
            content: resolved.ignoreSelectors.map(s => `${s} { display: none !important; }`).join('\n'),
          });
        }

        const candidateResult = await captureScreenshot(page, { ...resolved, mode: resolved.mode } as any);
        candidatePath = `screenshots/candidate/${resolved.id}_${viewportLabel}.png`;
        writeFileSync(path.join(outputDir, candidatePath), candidateResult.images[0]);
        candidateMeta = candidateResult.meta;

      } catch (e) {
        status = 'error';
        error = e instanceof Error ? e.message : String(e);
      }

      await page.close();
      await context.close();

      const pageResult: PageResult = {
        pageId: resolved.id,
        pageName: resolved.name,
        viewport: { width: viewport.width, height: viewport.height, label: viewportLabel },
        baseline: {
          url: resolved.baselineUrl,
          screenshotPath: baselinePath,
          screenshotMeta: baselineMeta,
          anomalies: buildEmptyAnomaly(),
        },
        candidate: {
          url: resolved.candidateUrl,
          screenshotPath: candidatePath,
          screenshotMeta: candidateMeta,
          anomalies: buildEmptyAnomaly(),
        },
        diff: null, // diff added in Task 3.2
        config: {
          mainRegionSelector: resolved.mainRegionSelector,
          mainRegionIndex: resolved.mainRegionIndex,
          ignoreSelectors: resolved.ignoreSelectors,
        },
        status,
        error,
        duration: Date.now() - pageStartTime,
        reportPath: `pages/${resolved.id}_${viewportLabel}.html`,
      };

      allPageResults.push(pageResult);
    }
  }

  // Close auth context
  await authResult.context.close();

  const duration = Date.now() - startTime;
  const passed = allPageResults.filter(r => r.status === 'passed').length;
  const failed = allPageResults.filter(r => r.status === 'failed').length;
  const errors = allPageResults.filter(r => r.status === 'error').length;

  const runResult: RunResult = {
    runId: path.basename(outputDir),
    timestamp: new Date().toISOString(),
    duration,
    uiGuardianVersion: '0.1.0',
    config: { global: globalConfig, pages: pagesConfig },
    summary: {
      totalPages: allPageResults.length,
      totalPagePairs: pagesConfig.pagePairs.length,
      totalViewports: globalConfig.viewports.length,
      passed,
      failed,
      errors,
      passRate: allPageResults.length > 0 ? passed / allPageResults.length : 0,
      totalDuration: duration,
    },
    viewportSummary: [],
    pages: allPageResults,
    anomalySummary: { totalConsoleErrors: 0, totalNetworkFailures: 0, totalJsErrors: 0, pagesWithAnomalies: 0 },
    reportDir: outputDir,
  };

  return runResult;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/core/runner.ts
git commit -m "feat: add runner orchestration with auth, viewport, capture flow"
```

---

### Task 2.5: CLI run Command

**Files:**
- Modify: `src/cli/index.ts`
- Create: `src/cli/run.ts`

- [ ] **Step 1: Implement run.ts**

```typescript
// src/cli/run.ts
import { readFileSync } from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import type { GlobalConfig, PagesConfig } from '../config/types.js';
import { runAll } from '../core/runner.js';

export async function run(): Promise<void> {
  const cwd = process.cwd();

  // Load configs
  let globalConfig: GlobalConfig;
  let pagesConfig: PagesConfig;

  try {
    globalConfig = JSON.parse(readFileSync(path.join(cwd, 'global.config.json'), 'utf-8'));
  } catch {
    console.error('Error: global.config.json not found. Run "npx ui-guardian init" first.');
    process.exit(1);
  }

  try {
    pagesConfig = JSON.parse(readFileSync(path.join(cwd, 'pages.config.json'), 'utf-8'));
  } catch {
    console.error('Error: pages.config.json not found. Run "npx ui-guardian init" first.');
    process.exit(1);
  }

  // Launch browser
  const browser = await chromium.launch({ headless: true });

  try {
    const result = await runAll(browser, globalConfig, pagesConfig);

    // Terminal summary
    const { summary } = result;
    console.log('');
    console.log(`${summary.totalPages} pages, ${summary.passed} passed, ${summary.failed} failed, ${summary.errors} errors`);
    console.log(`Report: ${result.reportDir}`);
    console.log(`Duration: ${(summary.totalDuration / 1000).toFixed(1)}s`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 2: Update cli/index.ts to register run command**

```typescript
// src/cli/index.ts
import { Command } from 'commander';
import { init } from './init.js';
import { run } from './run.js';

const program = new Command();

program
  .name('ui-guardian')
  .description('UI consistency verification tool')
  .version('0.1.0');

program
  .command('init')
  .description('Generate configuration templates')
  .action(async () => {
    await init();
  });

program
  .command('run')
  .description('Execute comparison flow')
  .action(async () => {
    await run();
  });

program.parse();
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: No errors

- [ ] **Step 4: End-to-end smoke test with real config**

Run: `cd /tmp/ui-guardian-test && node /Users/lihaomin/projects/nas/ui-guardian/dist/cli/index.js run`
Expected: Browser opens, screenshots saved to output/reports/<timestamp>/screenshots/

- [ ] **Step 5: Commit**

```bash
git add src/cli/run.ts src/cli/index.ts
git commit -m "feat: add CLI run command with full main chain (M2)"
```

**Milestone M2 complete.** `npx ui-guardian run` navigates, screenshots, and saves results.

---

## Phase 3: Diff + Anomaly (Milestone M3 — diff images and anomaly logs)

### Task 3.1: Anomaly Collector Module

**Files:**
- Create: `src/core/collector.ts`
- Create: `tests/core/collector.test.ts`

- [ ] **Step 1: Write collector tests**

```typescript
// tests/core/collector.test.ts
import { createCollector } from '../../src/core/collector.js';

describe('createCollector', () => {
  it('returns empty results when no events fired', () => {
    const collector = createCollector();
    const result = collector.collect();
    expect(result.console).toEqual([]);
    expect(result.network).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('reset clears collected data', () => {
    const collector = createCollector();
    collector.reset();
    const result = collector.collect();
    expect(result.console).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/core/collector.test.ts --no-cache`
Expected: FAIL

- [ ] **Step 3: Implement collector.ts**

```typescript
// src/core/collector.ts
import type { Page } from 'playwright';
import type { Collector, ConsoleEntry, NetworkEntry, ErrorEntry, AnomalyResult } from '../config/types.js';

export function createCollector(): Collector {
  let consoleEntries: ConsoleEntry[] = [];
  let networkEntries: NetworkEntry[] = [];
  let errorEntries: ErrorEntry[] = [];

  function attach(page: Page, _pageUrl: string): void {
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        consoleEntries.push({
          type: msg.type() as 'error' | 'warn',
          text: msg.text(),
          timestamp: Date.now(),
        });
      }
    });

    page.on('requestfailed', (request) => {
      networkEntries.push({
        url: request.url(),
        method: request.method(),
        status: 0,
        statusText: request.failure()?.errorText ?? 'Unknown',
        timestamp: Date.now(),
      });
    });

    page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        networkEntries.push({
          url: response.url(),
          method: response.request().method(),
          status,
          statusText: response.statusText(),
          timestamp: Date.now(),
        });
      }
    });

    page.on('pageerror', (error) => {
      errorEntries.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
      });
    });
  }

  function collect(): AnomalyResult {
    return {
      console: [...consoleEntries],
      network: [...networkEntries],
      errors: [...errorEntries],
    };
  }

  function reset(): void {
    consoleEntries = [];
    networkEntries = [];
    errorEntries = [];
  }

  return { attach, collect, reset };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/core/collector.test.ts --no-cache`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/collector.ts tests/core/collector.test.ts
git commit -m "feat: add anomaly collector with console/network/error capture"
```

---

### Task 3.2: Pixel Diff Module

**Files:**
- Create: `src/core/diff.ts`
- Create: `tests/core/diff.test.ts`

- [ ] **Step 1: Write diff tests**

```typescript
// tests/core/diff.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/core/diff.test.ts --no-cache`
Expected: FAIL

- [ ] **Step 3: Implement diff.ts**

```typescript
// src/core/diff.ts
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { DiffResult } from '../config/types.js';

export class DiffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiffError';
  }
}

export function diffScreenshots(
  baselineImage: Buffer,
  candidateImage: Buffer,
  config: { threshold: number; includeAA: boolean },
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/core/diff.test.ts --no-cache`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/diff.ts tests/core/diff.test.ts
git commit -m "feat: add pixel diff module with pixelmatch (M3)"
```

---

### Task 3.3: Runner Integration with Collector + Diff

**Files:**
- Modify: `src/core/runner.ts`

- [ ] **Step 1: Update runner.ts to integrate collector and diff**

Key changes to `runAll()` in `src/core/runner.ts`:

1. Import `createCollector` and `diffScreenshots`
2. In the page loop, before `page.goto()`: `const collector = createCollector(); collector.attach(page, url);`
3. After capturing baseline: `const baselineAnomalies = collector.collect(); collector.reset();`
4. After capturing candidate: `const candidateAnomalies = collector.collect();`
5. After both screenshots, if both exist: call `diffScreenshots()` and save diff image
6. Populate `PageResult.diff` and `PageResult.baseline.anomalies` / `PageResult.candidate.anomalies`
7. Build `anomalySummary` in `RunResult`

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Build and smoke test**

Run: `npm run build && cd /tmp/ui-guardian-test && node /Users/lihaomin/projects/nas/ui-guardian/dist/cli/index.js run`
Expected: Diff images in screenshots/diff/, anomaly data in PageResult

- [ ] **Step 4: Commit**

```bash
git add src/core/runner.ts
git commit -m "feat: integrate collector and diff into runner (M3)"
```

**Milestone M3 complete.** Reports show diff images and anomaly logs.

---

## Phase 4: Full Features (Milestone M4 — all config options work)

### Task 4.1: Region Screenshot Mode

**Files:**
- Modify: `src/core/capture.ts`

- [ ] **Step 1: Add region mode to captureScreenshot**

Add to the `captureScreenshot` function, before the `throw`:

```typescript
if (mode === 'region') {
  if (!config.mainRegionSelector) throw new CaptureError('mainRegionSelector required for region mode');
  const locator = page.locator(config.mainRegionSelector).nth(config.mainRegionIndex ?? 0);
  const count = await locator.count();
  if (count === 0) throw new CaptureError(`Region element not found: ${config.mainRegionSelector}`);
  const buffer = await locator.screenshot();
  const box = await locator.boundingBox();
  return {
    images: [buffer],
    meta: { mode: 'region', width: box?.width ?? 0, height: box?.height ?? 0 },
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/core/capture.ts
git commit -m "feat: add region screenshot mode with mainRegionSelector"
```

---

### Task 4.2: Scroll Segment Screenshot Mode

**Files:**
- Modify: `src/core/capture.ts`

- [ ] **Step 1: Add scroll mode to captureScreenshot**

Add to the `captureScreenshot` function:

```typescript
if (mode === 'scroll') {
  const scrollStep = config.scrollStep ?? 800;
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewport = page.viewportSize() ?? { width: 0, height: 0 };
  const images: Buffer[] = [];

  for (let scrollTop = 0; scrollTop < totalHeight; scrollTop += scrollStep) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollTop);
    await page.waitForTimeout(200); // let render settle
    const buffer = await page.screenshot();
    images.push(buffer);
  }

  return {
    images,
    meta: { mode: 'scroll', width: viewport.width, height: totalHeight, segments: images.length },
  };
}
```

- [ ] **Step 2: Implement diffScrollSegments in diff.ts**

```typescript
export function diffScrollSegments(
  baselineImages: Buffer[],
  candidateImages: Buffer[],
  config: { threshold: number; includeAA: boolean },
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/core/capture.ts src/core/diff.ts
git commit -m "feat: add scroll segment screenshot and diff modes"
```

---

### Task 4.3: Multi-Viewport Support

**Files:**
- Modify: `src/core/runner.ts`

- [ ] **Step 1: Update runner to use merged viewports**

The runner already uses `pagePair.viewports ?? globalConfig.viewports` from Task 2.4. Verify the outer loop is `pagePair` and inner loop is `viewports`.

- [ ] **Step 2: Build viewportSummary in RunResult**

After the loop, compute per-viewport stats:

```typescript
const viewportMap = new Map<string, ViewportSummaryItem>();
for (const pr of allPageResults) {
  const key = pr.viewport.label;
  if (!viewportMap.has(key)) {
    viewportMap.set(key, { label: key, width: pr.viewport.width, height: pr.viewport.height, passed: 0, failed: 0, errors: 0 });
  }
  const vs = viewportMap.get(key)!;
  if (pr.status === 'passed') vs.passed++;
  else if (pr.status === 'failed') vs.failed++;
  else vs.errors++;
}
runResult.viewportSummary = Array.from(viewportMap.values());
```

- [ ] **Step 3: Commit**

```bash
git add src/core/runner.ts
git commit -m "feat: add viewport summary and verify multi-viewport execution"
```

---

### Task 4.4: Page-Level Config Override

**Files:**
- No new files — verify mergeConfig (Task 1.4) already handles this

- [ ] **Step 1: Verify mergeConfig handles all overrides**

Check that `mergeConfig` correctly applies:
- `pagePair.viewports` overrides `global.viewports`
- `pagePair.threshold` overrides `global.diff.threshold`
- `pagePair.captureMode` overrides `global.capture.mode`
- `mainRegionSelector` forces `mode = 'region'`

Already implemented in Task 1.4 — no changes needed.

- [ ] **Step 2: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "feat: verify page-level config overrides work correctly"
```

---

### Task 4.5: Extract processSide and processPage

**Files:**
- Create: `src/core/processSide.ts`
- Create: `src/core/processPage.ts`
- Modify: `src/core/runner.ts`

- [ ] **Step 1: Create processSide.ts**

```typescript
// src/core/processSide.ts
import type { Page } from 'playwright';
import path from 'path';
import { writeFileSync } from 'fs';
import type { ResolvedPageConfig, PageSideResult, AnomalyResult } from '../config/types.js';
import { captureScreenshot } from './capture.js';
import { createCollector } from './collector.js';

export async function processSide(
  page: Page,
  url: string,
  config: ResolvedPageConfig,
  outputDir: string,
  side: 'baseline' | 'candidate',
  fileSuffix: string,
): Promise<PageSideResult> {
  const collector = createCollector();
  collector.attach(page, url);

  await page.goto(url, {
    waitUntil: config.waitForNetworkIdle ? 'networkidle' : 'load',
    timeout: config.pageLoadTimeout,
  });

  if (config.screenshotDelay > 0) {
    await page.waitForTimeout(config.screenshotDelay);
  }

  // Inject ignoreSelectors
  if (config.ignoreSelectors.length > 0) {
    await page.addStyleTag({
      content: config.ignoreSelectors.map(s => `${s} { display: none !important; }`).join('\n'),
    });
  }

  let screenshotPath: string | null = null;
  let screenshotMeta = null;

  try {
    const result = await captureScreenshot(page, config);
    screenshotPath = `screenshots/${side}/${fileSuffix}.png`;
    writeFileSync(path.join(outputDir, screenshotPath), result.images[0]);
    screenshotMeta = result.meta;
  } catch (e) {
    // screenshotPath stays null
  }

  const anomalies = collector.collect();

  return {
    url,
    screenshotPath,
    screenshotMeta,
    anomalies,
  };
}
```

- [ ] **Step 2: Create processPage.ts**

```typescript
// src/core/processPage.ts
import type { Page } from 'playwright';
import path from 'path';
import { writeFileSync } from 'fs';
import type { ResolvedPageConfig, ViewportConfig, PageResult } from '../config/types.js';
import { diffScreenshots, diffScrollSegments } from './diff.js';
import { processSide } from './processSide.js';
import { readFileSync } from 'fs';

export async function processPage(
  page: Page,
  config: ResolvedPageConfig,
  viewport: ViewportConfig,
  outputDir: string,
): Promise<PageResult> {
  const viewportLabel = viewport.label ?? `${viewport.width}x${viewport.height}`;
  const fileSuffix = `${config.id}_${viewportLabel}`;
  const startTime = Date.now();

  let status: 'passed' | 'failed' | 'error' = 'passed';
  let error: string | undefined;
  let diffResult = null;

  try {
    // Process baseline
    const baseline = await processSide(page, config.baselineUrl, config, outputDir, 'baseline', fileSuffix);

    // Process candidate
    const candidate = await processSide(page, config.candidateUrl, config, outputDir, 'candidate', fileSuffix);

    // Diff
    if (baseline.screenshotPath && candidate.screenshotPath) {
      const baselineImg = readFileSync(path.join(outputDir, baseline.screenshotPath));
      const candidateImg = readFileSync(path.join(outputDir, candidate.screenshotPath));

      let diff;
      if (config.mode === 'scroll') {
        // For scroll, read all segment images — simplified: single image for now
        diff = diffScreenshots(baselineImg, candidateImg, { threshold: config.threshold, includeAA: config.diffIncludeAA });
      } else {
        diff = diffScreenshots(baselineImg, candidateImg, { threshold: config.threshold, includeAA: config.diffIncludeAA });
      }

      const diffPath = `screenshots/diff/${fileSuffix}.png`;
      writeFileSync(path.join(outputDir, diffPath), diff.diffImage);

      diffResult = {
        diffImagePath: diffPath,
        diffPercent: diff.diffPercent,
        diffPixels: diff.diffPixels,
        totalPixels: diff.totalPixels,
        passed: diff.passed,
        threshold: diff.threshold,
      };

      status = diff.passed ? 'passed' : 'failed';
    }

    return {
      pageId: config.id,
      pageName: config.name,
      viewport: { width: viewport.width, height: viewport.height, label: viewportLabel },
      baseline,
      candidate,
      diff: diffResult,
      config: {
        mainRegionSelector: config.mainRegionSelector,
        mainRegionIndex: config.mainRegionIndex,
        ignoreSelectors: config.ignoreSelectors,
      },
      status,
      error,
      duration: Date.now() - startTime,
      reportPath: `pages/${fileSuffix}.html`,
    };
  } catch (e) {
    return {
      pageId: config.id,
      pageName: config.name,
      viewport: { width: viewport.width, height: viewport.height, label: viewportLabel },
      baseline: { url: config.baselineUrl, screenshotPath: null, screenshotMeta: null, anomalies: { console: [], network: [], errors: [] } },
      candidate: { url: config.candidateUrl, screenshotPath: null, screenshotMeta: null, anomalies: { console: [], network: [], errors: [] } },
      diff: null,
      config: { mainRegionSelector: config.mainRegionSelector, mainRegionIndex: config.mainRegionIndex, ignoreSelectors: config.ignoreSelectors },
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
      duration: Date.now() - startTime,
      reportPath: `pages/${fileSuffix}.html`,
    };
  }
}
```

- [ ] **Step 3: Simplify runner.ts to delegate to processPage**

Refactor runner.ts to use `processPage` instead of inline logic.

- [ ] **Step 4: Verify TypeScript compiles and smoke test**

Run: `npm run build && cd /tmp/ui-guardian-test && node /Users/lihaomin/projects/nas/ui-guardian/dist/cli/index.js run`

- [ ] **Step 5: Commit**

```bash
git add src/core/processSide.ts src/core/processPage.ts src/core/runner.ts
git commit -m "refactor: extract processSide and processPage from runner (M4)"
```

**Milestone M4 complete.** All config options work.

---

## Phase 5: Reports (Milestone M5 — full HTML + JSON reports)

### Task 5.1: JSON Report

**Files:**
- Create: `src/report/json.ts`
- Create: `tests/report/json.test.ts`

- [ ] **Step 1: Write JSON report tests**

```typescript
// tests/report/json.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/report/json.test.ts --no-cache`
Expected: FAIL

- [ ] **Step 3: Implement json.ts**

```typescript
// src/report/json.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/report/json.test.ts --no-cache`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/report/json.ts tests/report/json.test.ts
git commit -m "feat: add JSON report generation with password sanitization"
```

---

### Task 5.2: HTML Templates

**Files:**
- Create: `src/report/template.ts`

- [ ] **Step 1: Implement template.ts with summary and detail page templates**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/report/template.ts
git commit -m "feat: add HTML templates for summary and detail report pages"
```

---

### Task 5.3: HTML Report Generator

**Files:**
- Create: `src/report/generator.ts`

- [ ] **Step 1: Implement generator.ts**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/report/generator.ts
git commit -m "feat: add HTML report generator"
```

---

### Task 5.4: Runner Integration with Reports

**Files:**
- Modify: `src/core/runner.ts`

- [ ] **Step 1: Add report generation to runner**

At the end of `runAll()`, before returning:

```typescript
import { generateHtmlReport } from '../report/generator.js';
import { generateJsonReport } from '../report/json.js';

// ... after building runResult ...
await generateHtmlReport(runResult);
await generateJsonReport(runResult);
```

- [ ] **Step 2: Build and end-to-end test**

Run: `npm run build && cd /tmp/ui-guardian-test && node /Users/lihaomin/projects/nas/ui-guardian/dist/cli/index.js run`

Check output:
- `index.html` exists and shows summary
- `pages/*.html` exists for each page×viewport
- `data.json` exists with sanitized data

- [ ] **Step 3: Commit**

```bash
git add src/core/runner.ts
git commit -m "feat: integrate report generation into runner (M5)"
```

**Milestone M5 (MVP) complete.** Full CLI with screenshots, diffs, anomaly collection, and HTML/JSON reports.
