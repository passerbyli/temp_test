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
  it('ignoreSelectors appends from pagePair', () => {
    const pagePair: PagePair = { name: 'Home', baseline: { url: 'https://a.com' }, candidate: { url: 'https://b.com' }, ignoreSelectors: ['.page-ad'] };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.ignoreSelectors).toEqual(['.cookie-banner', '.page-ad']);
  });
  it('mainRegionSelector forces region mode', () => {
    const pagePair: PagePair = { name: 'Home', baseline: { url: 'https://a.com' }, candidate: { url: 'https://b.com' }, mainRegionSelector: '.main-content' };
    const result = mergeConfig(globalConfig, pagePair);
    expect(result.mode).toBe('region');
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
