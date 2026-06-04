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
