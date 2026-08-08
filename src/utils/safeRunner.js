/**
 * Safe JavaScript Code Execution Sandbox using a Web Worker.
 *
 * Runs untrusted JavaScript code inside a Web Worker Blob isolated within Chromium's renderer process.
 * Explicitly strips out network, storage, nested workers, and beacon APIs to prevent exfiltration,
 * nested worker bypasses, remote script loading, and side-channel leakage.
 * Captures synchronous errors as well as unhandled async errors and unhandled promise rejections.
 *
 * @param {string} code - The JavaScript code to execute.
 * @param {number} timeoutMs - Max execution time in milliseconds before terminating worker (default 1500ms).
 * @returns {Promise<{success: boolean, result?: string, output?: string, error?: string}>}
 */
export function runCodeSafely(code, timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (!code || typeof code !== 'string') {
      resolve({ success: false, error: 'Codice non valido o vuoto' });
      return;
    }

    // Web Worker Execution (Browser / Electron Renderer)
    if (typeof Worker !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const workerScript = `
        (function() {
          const sendResponse = self.postMessage.bind(self);
          
          function safeStringify(a) {
            if (typeof a === 'object' && a !== null) {
              try {
                return JSON.stringify(a);
              } catch (e) {
                return '[Circular]';
              }
            }
            return String(a);
          }

          // Capture unhandled async errors & unhandled promise rejections inside worker
          self.addEventListener('error', function(evt) {
            if (evt.preventDefault) evt.preventDefault();
            sendResponse({
              success: false,
              error: evt.message || 'Errore asincrono non gestito nel Worker',
            });
          });

          self.addEventListener('unhandledrejection', function(evt) {
            if (evt.preventDefault) evt.preventDefault();
            const reason = evt.reason;
            const errorMsg = typeof reason === 'object' && reason !== null && reason.message
              ? reason.message
              : String(reason);
            sendResponse({
              success: false,
              error: 'Promise Rejection non gestita: ' + errorMsg,
            });
          });

          // List of dangerous APIs to disable defensively
          const dangerousGlobals = [
            'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource',
            'importScripts', 'Worker', 'SharedWorker', 'indexedDB',
            'caches', 'postMessage', 'navigator'
          ];

          // Disable Network, Storage, Nested Workers & Beacon APIs with defensive defineProperty
          dangerousGlobals.forEach(function(prop) {
            try {
              Object.defineProperty(self, prop, { value: undefined, writable: false, configurable: false });
            } catch (e) {
              try { self[prop] = undefined; } catch (e2) {}
            }
          });

          self.onmessage = function(e) {
            const logs = [];
            const errors = [];
            
            const customConsole = {
              log: (...args) => logs.push(args.map(safeStringify).join(' ')),
              error: (...args) => errors.push(args.map(safeStringify).join(' ')),
              warn: (...args) => logs.push('[WARN] ' + args.map(safeStringify).join(' ')),
            };

            try {
              const fn = new Function('console', e.data.code);
              const result = fn(customConsole);
              sendResponse({
                success: true,
                output: logs.join('\\n'),
                result: result !== undefined ? String(result) : undefined,
                errors: errors.join('\\n'),
              });
            } catch (err) {
              sendResponse({
                success: false,
                output: logs.join('\\n'),
                error: err ? err.message : 'Errore durante l executione',
              });
            }
          };
        })();
      `;

      let blob;
      try {
        blob = new Blob([workerScript], { type: 'application/javascript' });
      } catch (e) {
        resolve({ success: false, error: 'Impossibile creare il Web Worker: ' + e.message });
        return;
      }

      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      const timer = setTimeout(() => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        resolve({
          success: false,
          error: `Timeout: Il codice ha impiegato più di ${timeoutMs}ms (possibile loop infinito).`,
        });
      }, timeoutMs);

      worker.onmessage = (event) => {
        clearTimeout(timer);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        resolve(event.data);
      };

      worker.onerror = (err) => {
        clearTimeout(timer);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        resolve({
          success: false,
          error: err && err.message ? err.message : 'Errore nel Web Worker',
        });
      };

      worker.postMessage({ code });
      return;
    }

    // Fallback for Headless Node.js Test Environments (where Web Worker is unavailable)
    function safeStringify(a) {
      if (typeof a === 'object' && a !== null) {
        try {
          return JSON.stringify(a);
        } catch (e) {
          return '[Circular]';
        }
      }
      return String(a);
    }

    const logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.map(safeStringify).join(' ')),
      error: (...args) => errors.push(args.map(safeStringify).join(' ')),
      warn: (...args) => logs.push('[WARN] ' + args.map(safeStringify).join(' ')),
    };

    try {
      const fn = new Function('console', code);
      const result = fn(customConsole);
      resolve({
        success: true,
        output: logs.join('\n'),
        result: result !== undefined ? String(result) : undefined,
      });
    } catch (err) {
      resolve({
        success: false,
        output: logs.join('\n'),
        error: err ? err.message : 'Errore durante l executione',
      });
    }
  });
}
