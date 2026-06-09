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
    const pagePair: PagePair = { name: 'Home', baseline: { url: 'https://a.com' }, candidate: { url: 'https://b.com' } };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.viewports).toEqual(globalConfig.viewports);
  });
  it('pagePair viewports override global', () => {
    const pagePair: PagePair = { name: 'Home', baseline: { url: 'https://a.com' }, candidate: { url: 'https://b.com' }, viewports: [{ width: 1366, height: 768 }] };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.viewports).toEqual([{ width: 1366, height: 768 }]);
  });
  it('ignoreSelectors merges from global and pagePair', () => {
    const pagePair: PagePair = { name: 'Home', baseline: { url: 'https://a.com' }, candidate: { url: 'https://b.com' }, ignoreSelectors: ['.page-ad'] };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.baselineConfig.ignoreSelectors).toEqual(['.cookie-banner', '.page-ad']);
    expect(result.candidateConfig.ignoreSelectors).toEqual(['.cookie-banner', '.page-ad']);
  });
  it('side-level ignoreSelectors append after page-level', () => {
    const pagePair: PagePair = {
      name: 'Home',
      baseline: { url: 'https://a.com', ignoreSelectors: ['.baseline-only'] },
      candidate: { url: 'https://b.com' },
      ignoreSelectors: ['.page-ad'],
    };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.baselineConfig.ignoreSelectors).toEqual(['.cookie-banner', '.page-ad', '.baseline-only']);
    expect(result.candidateConfig.ignoreSelectors).toEqual(['.cookie-banner', '.page-ad']);
  });
  it('mainRegionSelector on baseline/candidate forces region mode when no explicit captureMode', () => {
    const globalConfigNoMode: GlobalConfig = {
      auth: globalConfig.auth,
      viewports: globalConfig.viewports,
      diff: globalConfig.diff,
      ignoreSelectors: globalConfig.ignoreSelectors,
      outputDir: globalConfig.outputDir,
    };
    const pagePair: PagePair = {
      name: 'Home',
      baseline: { url: 'https://a.com', mainRegionSelector: '.main-content' },
      candidate: { url: 'https://b.com' },
    };
    const result = mergeConfig(globalConfigNoMode, pagePair);
    expect(result.baselineConfig.mode).toBe('region');
    expect(result.candidateConfig.mode).toBe('fullPage');
  });
  it('page-level mainRegionSelector applies to both sides when no explicit captureMode', () => {
    const globalConfigNoMode: GlobalConfig = {
      auth: globalConfig.auth,
      viewports: globalConfig.viewports,
      diff: globalConfig.diff,
      ignoreSelectors: globalConfig.ignoreSelectors,
      outputDir: globalConfig.outputDir,
    };
    const pagePair: PagePair = {
      name: 'Home',
      baseline: { url: 'https://a.com' },
      candidate: { url: 'https://b.com' },
      mainRegionSelector: '.main-content',
    };
    const result = mergeConfig(globalConfigNoMode, pagePair);
    expect(result.baselineConfig.mode).toBe('region');
    expect(result.candidateConfig.mode).toBe('region');
  });
  it('explicit captureMode overrides mainRegionSelector', () => {
    const pagePair: PagePair = {
      name: 'Home',
      baseline: { url: 'https://a.com', mainRegionSelector: '.main-content' },
      candidate: { url: 'https://b.com', mainRegionSelector: '.main-content' },
    };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.baselineConfig.mode).toBe('fullPage');
    expect(result.candidateConfig.mode).toBe('fullPage');
  });
  it('pagePair threshold overrides global', () => {
    const pagePair: PagePair = { name: 'Home', baseline: { url: 'https://a.com' }, candidate: { url: 'https://b.com' }, threshold: 0.05 };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.threshold).toBe(0.05);
  });
  it('generates id from name when not provided', () => {
    const pagePair: PagePair = { name: 'Login Page', baseline: { url: 'https://a.com' }, candidate: { url: 'https://b.com' } };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.id).toBe('login-page');
  });
  it('uses provided id', () => {
    const pagePair: PagePair = { name: 'Login', id: 'custom-id', baseline: { url: 'https://a.com' }, candidate: { url: 'https://b.com' } };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.id).toBe('custom-id');
  });
});
