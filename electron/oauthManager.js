const http = require('http');
const crypto = require('crypto');
const { shell } = require('electron');

class OAuthManager {
  // Base64URL helper
  static base64UrlEncode(buffer) {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate PKCE code_verifier and code_challenge
  static generatePKCE() {
    const verifier = this.base64UrlEncode(crypto.randomBytes(32));
    const challenge = this.base64UrlEncode(
      crypto.createHash('sha256').update(verifier).digest()
    );
    return { verifier, challenge };
  }

  // Start Google OAuth 2.0 PKCE Flow
  static async startGoogleOAuth({ clientId, clientSecret = '' }) {
    if (!clientId) {
      return { success: false, error: 'Per connettere l\'Account Google Master, inserisci la variabile GOOGLE_CLIENT_ID nel tuo file .env del progetto.' };
    }

    const { verifier, challenge } = this.generatePKCE();
    const stateToken = crypto.randomBytes(16).toString('hex');
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/tasks',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return new Promise((resolve) => {
      let isFinalized = false;
      let timeoutTimer = null;
      let server = null;

      // Single, idempotent transaction finalizer
      const finalizeTransaction = (result) => {
        if (isFinalized) return;
        isFinalized = true;

        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }

        if (server) {
          try {
            server.close();
          } catch (_) {
            // Ignore if already closing/closed
          }
        }

        resolve(result);
      };

      // Start local loopback HTTP server on an available port
      server = http.createServer(async (req, res) => {
        try {
          const reqUrl = new URL(req.url, `http://127.0.0.1`);

          // 1. Path & Method Filter: strictly accept GET /oauth/callback
          if (req.method !== 'GET' || reqUrl.pathname !== '/oauth/callback') {
            if (!res.headersSent) {
              res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('Not Found');
            }
            return; // Completely ignore foreign HTTP requests without affecting OAuth transaction
          }

          // If transaction has already been finalized (e.g. duplicate callback), respond gracefully
          if (isFinalized) {
            if (!res.headersSent) {
              res.writeHead(410, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('Sessione OAuth gia completata o scaduta.');
            }
            return;
          }

          const code = reqUrl.searchParams.get('code');
          const errorParam = reqUrl.searchParams.get('error');
          const incomingState = reqUrl.searchParams.get('state');

          // 2. Explicit handling of error returned by Google
          if (errorParam) {
            if (!res.headersSent) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end('<h2>Autenticazione annullata o fallita. Puoi chiudere questa pagina.</h2>');
            }
            finalizeTransaction({ success: false, error: `Google OAuth error: ${errorParam}` });
            return;
          }

          // 3. State CSRF validation (only checked AFTER confirming path is /oauth/callback)
          if (!incomingState || incomingState !== stateToken) {
            if (!res.headersSent) {
              res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end('<h2>Errore di sicurezza: State CSRF non valido.</h2>');
            }
            finalizeTransaction({ success: false, error: 'Stato CSRF OAuth non valido o manomesso.' });
            return;
          }

          // 4. Validate Code presence
          if (!code) {
            if (!res.headersSent) {
              res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end('<h2>Errore: Codice di autorizzazione non presente.</h2>');
            }
            finalizeTransaction({ success: false, error: 'Codice di autorizzazione non presente nel callback.' });
            return;
          }

          // 5. Exchange Code for Tokens BEFORE sending HTML response to browser
          const port = server.address().port;
          const redirectUri = `http://127.0.0.1:${port}/oauth/callback`;
          const tokenResult = await OAuthManager.exchangeGoogleCode({
            code,
            verifier,
            clientId,
            clientSecret,
            redirectUri,
          });

          // 6. Send definitive HTML response and finalize transaction
          if (tokenResult.success) {
            if (!res.headersSent) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>Diaspro Viboard - Autenticazione Completata</title></head>
                <body style="font-family: system-ui, -apple-system, sans-serif; background: #1e1333; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                  <div style="text-align: center; background: #2b1c47; padding: 40px; border-radius: 20px; border: 1px solid #9D85C6; max-width: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                    <h1 style="color: #9D85C6; margin-bottom: 12px; font-size: 24px;">Autenticazione Completata</h1>
                    <p style="color: #E8D19E; font-size: 15px; margin-bottom: 16px;">L'account Google Workspace e collegato a Diaspro Viboard.</p>
                    <p style="color: #A5C4DC; font-size: 13px;">Puoi chiudere questa scheda e tornare all'applicazione.</p>
                  </div>
                </body>
                </html>
              `);
            }
            finalizeTransaction(tokenResult);
          } else {
            if (!res.headersSent) {
              res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end('<h2>Errore durante l\'autenticazione. Puoi chiudere questa scheda e riprovare nell\'applicazione.</h2>');
            }
            finalizeTransaction(tokenResult);
          }
        } catch (e) {
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Errore interno durante il callback OAuth.');
          }
          finalizeTransaction({ success: false, error: e.message });
        }
      });

      // 3-minute timeout to close inactive server
      timeoutTimer = setTimeout(() => {
        finalizeTransaction({ success: false, error: 'Timeout autenticazione: l\'operazione e scaduta (3 minuti).' });
      }, 180000);

      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        const redirectUri = `http://127.0.0.1:${port}/oauth/callback`;

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(clientId)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent(scopes.join(' '))}` +
          `&code_challenge=${encodeURIComponent(challenge)}` +
          `&code_challenge_method=S256` +
          `&state=${encodeURIComponent(stateToken)}` +
          `&access_type=offline` +
          `&prompt=consent`;

        // Open system browser
        shell.openExternal(authUrl);
      });

      server.on('error', (err) => {
        finalizeTransaction({ success: false, error: `Errore avvio server OAuth locale: ${err.message}` });
      });
    });
  }

  // Exchange Code for Access & Refresh Tokens
  static async exchangeGoogleCode({ code, verifier, clientId, clientSecret, redirectUri }) {
    try {
      const bodyParams = new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      });

      if (clientSecret) {
        bodyParams.append('client_secret', clientSecret);
      }

      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString(),
      });

      if (!res.ok) {
        const errJson = await res.json();
        return { success: false, error: errJson.error_description || 'Errore scambio token Google' };
      }

      const data = await res.json();
      const expiresAt = Date.now() + (data.expires_in * 1000);

      // Fetch user profile info
      let userEmail = '';
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          userEmail = profile.email || '';
        }
      } catch (e) {
        console.warn('Could not fetch user profile email:', e);
      }

      return {
        success: true,
        tokens: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: expiresAt,
          user_email: userEmail,
        },
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Refresh Google Access Token
  static async refreshGoogleToken({ refreshToken, clientId, clientSecret = '' }) {
    if (!refreshToken || !clientId) {
      return { success: false, error: 'Refresh token o Client ID non disponibili' };
    }

    try {
      const bodyParams = new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      if (clientSecret) {
        bodyParams.append('client_secret', clientSecret);
      }

      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString(),
      });

      if (!res.ok) {
        const errJson = await res.json();
        return { success: false, error: errJson.error_description || 'Refresh token scaduto o revocato' };
      }

      const data = await res.json();
      const expiresAt = Date.now() + (data.expires_in * 1000);

      return {
        success: true,
        accessToken: data.access_token,
        expiresAt: expiresAt,
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Revoke Google Access or Refresh Token
  static async revokeGoogleToken(token) {
    if (!token) {
      return { success: false, error: 'Nessun token fornito per la revoca' };
    }

    try {
      const bodyParams = new URLSearchParams({ token });

      const res = await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error_description || errJson.error || `HTTP ${res.status}` };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

module.exports = OAuthManager;
