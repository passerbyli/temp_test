// ===== Config Types =====

export interface AuthConfig {
  skipAuth?: boolean;
  loginUrl?: string;
  username?: string;
  password?: string;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
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

export interface SideConfig {
  mainRegionSelector?: string;
  mainRegionIndex?: number;
  ignoreSelectors?: string[];
  captureMode?: 'fullPage' | 'region' | 'scroll';
}

export interface PagePair {
  name: string;
  id?: string;
  baseline: { url: string } & SideConfig;
  candidate: { url: string } & SideConfig;
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
  screenshotPaths?: string[];
  screenshotMeta: ScreenshotMeta | null;
  anomalies: AnomalyResult;
  textContent?: string;
  textPositions?: { text: string; x: number; y: number; width: number; height: number }[];
  scrollContainerState?: { scrollTop: number; containerViewportX: number; containerViewportY: number };
}

export interface TextDiffEntry {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  position?: { x: number; y: number; width: number; height: number };
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
    baseline: {
      mainRegionSelector?: string;
      mainRegionIndex?: number;
      ignoreSelectors: string[];
    };
    candidate: {
      mainRegionSelector?: string;
      mainRegionIndex?: number;
      ignoreSelectors: string[];
    };
  };
  textDiff?: TextDiffEntry[];
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

export interface ResolvedSideConfig {
  mainRegionSelector?: string;
  mainRegionIndex: number;
  ignoreSelectors: string[];
  mode: 'fullPage' | 'region' | 'scroll';
}

export interface ResolvedPageConfig {
  name: string;
  id: string;
  baselineUrl: string;
  candidateUrl: string;
  baselineConfig: ResolvedSideConfig;
  candidateConfig: ResolvedSideConfig;
  viewports: ViewportConfig[];
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
  storageState: Awaited<ReturnType<import('playwright').BrowserContext['storageState']>>;
}

export interface Collector {
  attach(page: import('playwright').Page, pageUrl: string): void;
  collect(): AnomalyResult;
  reset(): void;
}
