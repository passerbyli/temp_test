import { EventEmitter } from 'events';
import { createCollector } from '../../src/core/collector.js';

class MockPage extends EventEmitter {
  // Playwright Page interface stub - only event emitting is needed for collector tests
}

describe('createCollector', () => {
  it('returns empty results when no events fired', () => {
    const collector = createCollector();
    const result = collector.collect();
    expect(result.console).toEqual([]);
    expect(result.network).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('collects console error events', () => {
    const page = new MockPage() as any;
    const collector = createCollector();
    collector.attach(page, 'http://test.com');

    page.emit('console', { type: () => 'error', text: () => 'test error' });

    const result = collector.collect();
    expect(result.console).toHaveLength(1);
    expect(result.console[0].type).toBe('error');
    expect(result.console[0].text).toBe('test error');
  });

  it('collects console warning events as warn type', () => {
    const page = new MockPage() as any;
    const collector = createCollector();
    collector.attach(page, 'http://test.com');

    page.emit('console', { type: () => 'warning', text: () => 'test warning' });

    const result = collector.collect();
    expect(result.console).toHaveLength(1);
    expect(result.console[0].type).toBe('warn');
  });

  it('ignores console log/info/debug events', () => {
    const page = new MockPage() as any;
    const collector = createCollector();
    collector.attach(page, 'http://test.com');

    page.emit('console', { type: () => 'log', text: () => 'log' });
    page.emit('console', { type: () => 'info', text: () => 'info' });
    page.emit('console', { type: () => 'debug', text: () => 'debug' });

    const result = collector.collect();
    expect(result.console).toHaveLength(0);
  });

  it('collects requestfailed events', () => {
    const page = new MockPage() as any;
    const collector = createCollector();
    collector.attach(page, 'http://test.com');

    page.emit('requestfailed', {
      url: () => 'http://api.com/fail',
      method: () => 'GET',
      failure: () => ({ errorText: 'net::ERR' }),
    });

    const result = collector.collect();
    expect(result.network).toHaveLength(1);
    expect(result.network[0].url).toBe('http://api.com/fail');
    expect(result.network[0].status).toBe(0);
  });

  it('collects response events with status >= 400', () => {
    const page = new MockPage() as any;
    const collector = createCollector();
    collector.attach(page, 'http://test.com');

    page.emit('response', {
      status: () => 404,
      url: () => 'http://api.com/not-found',
      statusText: () => 'Not Found',
      request: () => ({ method: () => 'GET' }),
    });

    const result = collector.collect();
    expect(result.network).toHaveLength(1);
    expect(result.network[0].status).toBe(404);
  });

  it('ignores response events with status < 400', () => {
    const page = new MockPage() as any;
    const collector = createCollector();
    collector.attach(page, 'http://test.com');

    page.emit('response', {
      status: () => 200,
      url: () => 'http://api.com/ok',
      statusText: () => 'OK',
      request: () => ({ method: () => 'GET' }),
    });

    const result = collector.collect();
    expect(result.network).toHaveLength(0);
  });

  it('collects pageerror events', () => {
    const page = new MockPage() as any;
    const collector = createCollector();
    collector.attach(page, 'http://test.com');

    page.emit('pageerror', {
      message: 'TypeError: x is undefined',
      stack: 'Error at line 10',
    });

    const result = collector.collect();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('TypeError: x is undefined');
  });

  it('reset clears all collected data', () => {
    const page = new MockPage() as any;
    const collector = createCollector();
    collector.attach(page, 'http://test.com');

    // Populate data
    page.emit('console', { type: () => 'error', text: () => 'error' });
    page.emit('requestfailed', { url: () => 'u', method: () => 'GET', failure: () => null });
    page.emit('pageerror', { message: 'err', stack: undefined });

    expect(collector.collect().console).toHaveLength(1);

    collector.reset();

    const result = collector.collect();
    expect(result.console).toEqual([]);
    expect(result.network).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('collect returns copies, not references', () => {
    const collector = createCollector();
    const result1 = collector.collect();
    const result2 = collector.collect();
    expect(result1.console).not.toBe(result2.console);
    expect(result1.network).not.toBe(result2.network);
    expect(result1.errors).not.toBe(result2.errors);
  });
});
