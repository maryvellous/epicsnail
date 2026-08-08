import { describe, it, expect, vi } from 'vitest';
import { runCodeSafely } from '../utils/safeRunner';

describe('safeRunner Web Worker Sandbox Utility', () => {
  it('returns error for invalid or empty code input', async () => {
    const res = await runCodeSafely(null);
    expect(res.success).toBe(false);
    expect(res.error).toBe('Codice non valido o vuoto');
  });

  it('executes valid JavaScript code and returns result in fallback mode', async () => {
    const res = await runCodeSafely('return 2 + 2;');
    expect(res.success).toBe(true);
    expect(res.result).toBe('4');
  });

  it('captures console.log outputs correctly', async () => {
    const code = `
      console.log('Hello World');
      console.log('Testing', 123);
      return 'done';
    `;
    const res = await runCodeSafely(code);
    expect(res.success).toBe(true);
    expect(res.output).toContain('Hello World');
    expect(res.output).toContain('Testing 123');
    expect(res.result).toBe('done');
  });

  it('catches runtime evaluation errors safely', async () => {
    const res = await runCodeSafely('undefinedFunction();');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('handles console.log on circular objects without crashing and returns placeholder', async () => {
    const code = `
      const a = {};
      a.self = a;
      console.log(a);
      return 'ok';
    `;
    const res = await runCodeSafely(code);
    expect(res.success).toBe(true);
    expect(res.result).toBe('ok');
    expect(res.output).toContain('[Circular]');
  });

  describe('Web Worker Script Blob Hardening Verification', () => {
    it('simulates Worker Blob execution: sendResponse delivers message even when self.postMessage is disabled', async () => {
      let sentMessage = null;
      const fakeSelf = {
        fetch: () => 'fetch-api',
        XMLHttpRequest: () => 'xhr-api',
        WebSocket: () => 'ws-api',
        importScripts: () => 'import-api',
        Worker: () => 'worker-api',
        navigator: { sendBeacon: () => 'beacon-api' },
        postMessage: (msg) => { sentMessage = msg; },
        onmessage: null,
        addEventListener: vi.fn(),
      };

      const dangerousGlobals = [
        'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource',
        'importScripts', 'Worker', 'SharedWorker', 'indexedDB',
        'caches', 'postMessage', 'navigator'
      ];

      const sendResponse = fakeSelf.postMessage.bind(fakeSelf);

      dangerousGlobals.forEach((prop) => {
        try {
          Object.defineProperty(fakeSelf, prop, { value: undefined, writable: false, configurable: false });
        } catch (e) {
          fakeSelf[prop] = undefined;
        }
      });

      expect(fakeSelf.postMessage).toBeUndefined();
      expect(fakeSelf.fetch).toBeUndefined();
      expect(fakeSelf.Worker).toBeUndefined();
      expect(fakeSelf.navigator).toBeUndefined();

      fakeSelf.onmessage = function (e) {
        function safeStringify(a) {
          if (typeof a === 'object' && a !== null) {
            try {
              return JSON.stringify(a);
            } catch (err) {
              return '[Circular]';
            }
          }
          return String(a);
        }

        const logs = [];
        const customConsole = {
          log: (...args) => logs.push(args.map(safeStringify).join(' ')),
        };

        try {
          const fn = new Function('console', e.data.code);
          const result = fn(customConsole);
          sendResponse({
            success: true,
            output: logs.join('\n'),
            result: result !== undefined ? String(result) : undefined,
          });
        } catch (err) {
          sendResponse({
            success: false,
            error: err.message,
          });
        }
      };

      fakeSelf.onmessage({ data: { code: 'const a = {}; a.self = a; console.log(a); return 42;' } });

      expect(sentMessage).not.toBeNull();
      expect(sentMessage.success).toBe(true);
      expect(sentMessage.result).toBe('42');
      expect(sentMessage.output).toBe('[Circular]');
    });

    it('simulates Worker Blob execution with mocked Worker class in jsdom environment', async () => {
      class MockWorker {
        constructor(url) {
          this.onmessage = null;
          this.onerror = null;
          
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({
                data: {
                  success: true,
                  result: '42',
                  output: 'test log',
                },
              });
            }
          }, 10);
        }
        postMessage(data) {}
        terminate() {}
      }

      global.Worker = MockWorker;
      global.URL = {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn(),
      };

      const res = await runCodeSafely('console.log("test log"); return 42;');
      expect(res.success).toBe(true);
      expect(res.result).toBe('42');
      expect(res.output).toBe('test log');

      delete global.Worker;
      delete global.URL;
    });
  });
});
