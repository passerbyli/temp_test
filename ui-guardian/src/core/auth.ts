import type { Browser, BrowserContext, Page } from 'playwright';
import type { AuthConfig, AuthResult } from '../config/types.js';

type RequiredAuthConfig = Required<Pick<AuthConfig, 'loginUrl' | 'username' | 'password' | 'usernameSelector' | 'passwordSelector' | 'submitSelector'>> & Omit<AuthConfig, 'loginUrl' | 'username' | 'password' | 'usernameSelector' | 'passwordSelector' | 'submitSelector'>;

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function authenticate(browser: Browser, config: RequiredAuthConfig): Promise<AuthResult> {
  const timeout = config.timeout ?? 30000;
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(config.loginUrl, { timeout, waitUntil: 'networkidle' });
    await page.locator(config.usernameSelector).fill(config.username);
    await page.locator(config.passwordSelector).fill(config.password);
    await page.locator(config.submitSelector).click();

    if (config.successWait) {
      if (config.successWait.type === 'url') {
        await page.waitForURL(`**${config.successWait.value}**`, { timeout });
      } else {
        await page.locator(config.successWait.value).waitFor({ timeout });
      }
    } else {
      await page.waitForLoadState('networkidle', { timeout });
    }

    const storageState = await context.storageState();
    const cookies = await context.cookies();

    return { context, cookies, storageState };
  } catch (error) {
    await context.close();
    const message = error instanceof Error ? error.message : String(error);
    throw new AuthError(`Login failed: ${message}`);
  }
}
