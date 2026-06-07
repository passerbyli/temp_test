import type { GlobalConfig, PagesConfig } from './types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isValidUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}

export function validateGlobalConfig(config: GlobalConfig): ValidationResult {
  const errors: string[] = [];
  if (!config.auth) errors.push('auth is required');
  else if (!config.auth.skipAuth) {
    if (!config.auth.loginUrl) errors.push('auth.loginUrl is required');
    else if (!isValidUrl(config.auth.loginUrl)) errors.push('auth.loginUrl must be a valid URL');
    if (!config.auth.username) errors.push('auth.username is required');
    if (!config.auth.password) errors.push('auth.password is required');
    if (!config.auth.usernameSelector) errors.push('auth.usernameSelector is required');
    if (!config.auth.passwordSelector) errors.push('auth.passwordSelector is required');
    if (!config.auth.submitSelector) errors.push('auth.submitSelector is required');
  }
  if (!config.viewports || config.viewports.length === 0) {
    errors.push('viewports must have at least one entry');
  } else {
    config.viewports.forEach((v, i) => {
      if (!Number.isInteger(v.width) || v.width <= 0) errors.push(`viewports[${i}].width must be a positive integer`);
      if (!Number.isInteger(v.height) || v.height <= 0) errors.push(`viewports[${i}].height must be a positive integer`);
    });
  }
  if (config.diff?.threshold !== undefined) {
    if (config.diff.threshold < 0 || config.diff.threshold > 1) errors.push('diff.threshold must be between 0 and 1');
  }
  if (config.capture?.mode !== undefined) {
    if (!['fullPage', 'region', 'scroll'].includes(config.capture.mode)) errors.push('capture.mode must be fullPage, region, or scroll');
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
