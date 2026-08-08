const http = require('http');
const crypto = require('crypto');
const { shell } = require('electron');

class SpotifyTools {
  constructor(authVault) {
    this.authVault = authVault;
  }

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

  getClientId() {
    return (
      this.authVault.getToken('spotify_client_id') ||
      process.env.SPOTIFY_CLIENT_ID ||
      'd7a7b876543210fe9876543210fedcba'
    );
  }

  getTokens() {
    return this.authVault.getToken('spotify_tokens');
  }

  async startSpotifyOAuth() {
    const clientId = this.getClientId();
    if (!clientId) {
      return { success: false, error: 'Spotify Client ID non configurato. Inseriscilo nelle Impostazioni.' };
    }

    const { verifier, challenge } = SpotifyTools.generatePKCE();
    const stateToken = crypto.randomBytes(16).toString('hex');
    const scopes = [
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-private',
    ];

    return new Promise((resolve) => {
      let isResolved = false;

      const server = http.createServer(async (req, res) => {
        try {
          const reqUrl = new URL(req.url, `http://127.0.0.1`);
          const code = reqUrl.searchParams.get('code');
          const errorParam = reqUrl.searchParams.get('error');
          const incomingState = reqUrl.searchParams.get('state');

          if (errorParam) {
            clearTimeout(timeoutTimer);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h2>Autenticazione Spotify annullata. Puoi chiudere questa pagina.</h2>');
            server.close();
            if (!isResolved) { isResolved = true; resolve({ success: false, error: `Spotify OAuth error: ${errorParam}` }); }
            return;
          }

          if (incomingState !== stateToken) {
            clearTimeout(timeoutTimer);
            res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h2>Errore di sicurezza: State CSRF non valido.</h2>');
            server.close();
            if (!isResolved) { isResolved = true; resolve({ success: false, error: 'Stato CSRF OAuth Spotify non valido o manomesso.' }); }
            return;
          }

          if (code) {
            clearTimeout(timeoutTimer);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <!DOCTYPE html>
              <html>
              <head><title>Diaspro Viboard - Spotify Connesso</title></head>
              <body style="font-family: system-ui, -apple-system, sans-serif; background: #1e1333; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                <div style="text-align: center; background: #2b1c47; padding: 40px; border-radius: 20px; border: 1px solid #7A3F67; max-width: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                  <h1 style="color: #9D85C6; margin-bottom: 12px; font-size: 24px;">Spotify Connesso</h1>
                  <p style="color: #E8D19E; font-size: 15px; margin-bottom: 16px;">Account Spotify autorizzato con successo.</p>
                  <p style="color: #A5C4DC; font-size: 13px;">Puoi chiudere questa pagina e tornare all'applicazione.</p>
                </div>
              </body>
              </html>
            `);

            server.close();

            const redirectUri = `http://127.0.0.1:${server.address().port}`;
            const tokenResult = await this.exchangeSpotifyCode({
              code,
              verifier,
              clientId,
              redirectUri,
            });

            if (!isResolved) { isResolved = true; resolve(tokenResult); }
            return;
          }
        } catch (e) {
          clearTimeout(timeoutTimer);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Errore callback Spotify OAuth');
          server.close();
          if (!isResolved) { isResolved = true; resolve({ success: false, error: e.message }); }
          return;
        }
      });

      const timeoutTimer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          server.close();
          resolve({ success: false, error: 'Timeout autenticazione Spotify: operazione scaduta (3 minuti).' });
        }
      }, 180000);

      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        const redirectUri = `http://127.0.0.1:${port}`;

        const authUrl = `https://accounts.spotify.com/authorize?` +
          `response_type=code` +
          `&client_id=${encodeURIComponent(clientId)}` +
          `&scope=${encodeURIComponent(scopes.join(' '))}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&code_challenge=${encodeURIComponent(challenge)}` +
          `&code_challenge_method=S256` +
          `&state=${encodeURIComponent(stateToken)}`;

        shell.openExternal(authUrl);
      });

      server.on('error', (err) => {
        clearTimeout(timeoutTimer);
        if (!isResolved) { isResolved = true; resolve({ success: false, error: `Errore avvio server OAuth locale: ${err.message}` }); }
      });
    });
  }

  async exchangeSpotifyCode({ code, verifier, clientId, redirectUri }) {
    try {
      const bodyParams = new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      });

      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString(),
      });

      if (!res.ok) {
        const errJson = await res.json();
        return { success: false, error: errJson.error_description || 'Errore scambio token Spotify' };
      }

      const data = await res.json();
      const expiresAt = Date.now() + (data.expires_in * 1000);

      // Fetch Spotify user profile
      let userDisplayName = '';
      try {
        const profileRes = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          userDisplayName = profile.display_name || profile.id || '';
        }
      } catch (e) {
        console.warn('Could not fetch Spotify profile:', e);
      }

      const tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expiresAt,
        user_name: userDisplayName,
      };

      this.authVault.saveToken('spotify_tokens', tokens);
      return { success: true, tokens };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async getValidAccessToken() {
    let tokens = this.getTokens();
    if (!tokens || !tokens.access_token) return null;

    if (Date.now() >= (tokens.expires_at - 60000)) {
      if (!tokens.refresh_token) return null;
      const clientId = this.getClientId();

      try {
        const bodyParams = new URLSearchParams({
          client_id: clientId,
          grant_type: 'refresh_token',
          refresh_token: tokens.refresh_token,
        });

        const res = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: bodyParams.toString(),
        });

        if (res.ok) {
          const data = await res.json();
          tokens.access_token = data.access_token;
          if (data.refresh_token) tokens.refresh_token = data.refresh_token;
          tokens.expires_at = Date.now() + (data.expires_in * 1000);
          this.authVault.saveToken('spotify_tokens', tokens);
        } else {
          return null;
        }
      } catch (e) {
        console.error('Error refreshing Spotify token:', e);
        return null;
      }
    }

    return tokens.access_token;
  }

  async getConnectionStatus() {
    const tokens = this.getTokens();
    if (!tokens) return { status: 'disconnected', userName: '' };

    const validToken = await this.getValidAccessToken();
    if (!validToken) return { status: 'expired', userName: tokens.user_name || '' };

    return { status: 'connected', userName: tokens.user_name || '' };
  }

  async getPlaybackState() {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return { success: false, error: 'Spotify non connesso' };

    try {
      const res = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 204 || res.status === 202) {
        return {
          success: true,
          isPlaying: false,
          trackName: 'Nessun brano in riproduzione',
          artistName: 'Apri Spotify su uno dei tuoi dispositivi',
          albumCover: null,
          progressMs: 0,
          durationMs: 0,
        };
      }

      if (!res.ok) {
        return { success: false, error: `Spotify API status ${res.status}` };
      }

      const data = await res.json();
      const item = data.item;

      return {
        success: true,
        isPlaying: data.is_playing,
        trackName: item ? item.name : 'Nessun brano',
        artistName: item ? (item.artists || []).map(a => a.name).join(', ') : '',
        albumCover: (item && item.album && item.album.images && item.album.images[0]) ? item.album.images[0].url : null,
        progressMs: data.progress_ms || 0,
        durationMs: item ? item.duration_ms : 0,
        deviceName: data.device ? data.device.name : null,
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async sendPlayerCommand(endpoint, method = 'POST') {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return { success: false, error: 'Spotify non connesso' };

    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 204 || res.status === 200) {
        return { success: true };
      } else if (res.status === 403) {
        return { success: false, error: 'Richiede Spotify Premium o un dispositivo attivo' };
      } else if (res.status === 404) {
        return { success: false, error: 'Nessun dispositivo Spotify attivo trovato' };
      }

      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.error?.message || `Errore comando Spotify (${res.status})` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async play() {
    return this.sendPlayerCommand('play', 'PUT');
  }

  async pause() {
    return this.sendPlayerCommand('pause', 'PUT');
  }

  async next() {
    return this.sendPlayerCommand('next', 'POST');
  }

  async previous() {
    return this.sendPlayerCommand('previous', 'POST');
  }

  async seek(positionMs) {
    return this.sendPlayerCommand(`seek?position_ms=${Math.floor(positionMs)}`, 'PUT');
  }
}

module.exports = SpotifyTools;
