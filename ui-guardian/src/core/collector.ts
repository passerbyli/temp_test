import type { Page } from 'playwright';
import type { Collector, ConsoleEntry, NetworkEntry, ErrorEntry, AnomalyResult } from '../config/types.js';

export function createCollector(): Collector {
  let consoleEntries: ConsoleEntry[] = [];
  let networkEntries: NetworkEntry[] = [];
  let errorEntries: ErrorEntry[] = [];

  function attach(page: Page, _pageUrl: string): void {
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleEntries.push({
          type: msg.type() === 'warning' ? 'warn' : 'error',
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
