// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from 'http';

const openExternalMock = vi.fn();

// Mock del modulo 'electron' in Node CJS
const electronPath = require.resolve('electron');
delete require.cache[electronPath];
require.cache[electronPath] = {
  id: electronPath,
  filename: electronPath,
  loaded: true,
  exports: {
    shell: {
      openExternal: openExternalMock,
    },
  },
};

const OAuthManager = require('../../electron/oauthManager.js');

describe('OAuthManager - Suite di Test del Lifecycle Riprogettato', () => {

  beforeEach(() => {
    openExternalMock.mockClear();
    vi.restoreAllMocks();
  });

  // Helper per inviare richieste HTTP
  const makeRequest = (url) => {
    return new Promise((resolve) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      }).on('error', (err) => resolve({ error: err }));
    });
  };

  it('1. Richieste estranee (/ e /favicon.ico) vengono ignorate con 404 senza toccare la transazione OAuth', async () => {
    vi.spyOn(OAuthManager, 'exchangeGoogleCode').mockResolvedValue({
      success: true,
      tokens: { access_token: 'valid-token' },
    });

    const oauthPromise = OAuthManager.startGoogleOAuth({ clientId: 'mock-id' });

    await vi.waitFor(() => expect(openExternalMock).toHaveBeenCalled());
    const authUrl = new URL(openExternalMock.mock.calls[0][0]);
    const port = new URL(authUrl.searchParams.get('redirect_uri')).port;

    // Invia prima /favicon.ico
    const favRes = await makeRequest(`http://127.0.0.1:${port}/favicon.ico`);
    expect(favRes.statusCode).toBe(404);

    // Invia / (root)
    const rootRes = await makeRequest(`http://127.0.0.1:${port}/`);
    expect(rootRes.statusCode).toBe(404);

    // Dopodiché invia il callback reale valido
    const state = authUrl.searchParams.get('state');
    const validRes = await makeRequest(`http://127.0.0.1:${port}/oauth/callback?code=abc&state=${state}`);
    expect(validRes.statusCode).toBe(200);

    const result = await oauthPromise;
    expect(result.success).toBe(true);
    expect(result.tokens.access_token).toBe('valid-token');
  });

  it('2. Callback valido con exchange riuscito (Caso A)', async () => {
    vi.spyOn(OAuthManager, 'exchangeGoogleCode').mockResolvedValue({
      success: true,
      tokens: { access_token: 'test-token-123' },
    });

    const oauthPromise = OAuthManager.startGoogleOAuth({ clientId: 'mock-id' });

    await vi.waitFor(() => expect(openExternalMock).toHaveBeenCalled());
    const authUrl = new URL(openExternalMock.mock.calls[0][0]);
    const port = new URL(authUrl.searchParams.get('redirect_uri')).port;
    const state = authUrl.searchParams.get('state');

    const res = await makeRequest(`http://127.0.0.1:${port}/oauth/callback?code=valid_code&state=${state}`);
    expect(res.statusCode).toBe(200);
    expect(res.data).toContain('Autenticazione Completata');

    const result = await oauthPromise;
    expect(result.success).toBe(true);
    expect(result.tokens.access_token).toBe('test-token-123');
  });

  it('3. Callback con state mancante restituisce 403 ed errore (Caso C)', async () => {
    const oauthPromise = OAuthManager.startGoogleOAuth({ clientId: 'mock-id' });

    await vi.waitFor(() => expect(openExternalMock).toHaveBeenCalled());
    const authUrl = new URL(openExternalMock.mock.calls[0][0]);
    const port = new URL(authUrl.searchParams.get('redirect_uri')).port;

    const res = await makeRequest(`http://127.0.0.1:${port}/oauth/callback?code=valid_code`);
    expect(res.statusCode).toBe(403);

    const result = await oauthPromise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Stato CSRF OAuth non valido o manomesso.');
  });

  it('4. Callback con state errato/manomesso restituisce 403 (Caso D)', async () => {
    const oauthPromise = OAuthManager.startGoogleOAuth({ clientId: 'mock-id' });

    await vi.waitFor(() => expect(openExternalMock).toHaveBeenCalled());
    const authUrl = new URL(openExternalMock.mock.calls[0][0]);
    const port = new URL(authUrl.searchParams.get('redirect_uri')).port;

    const res = await makeRequest(`http://127.0.0.1:${port}/oauth/callback?code=valid_code&state=WRONG_STATE`);
    expect(res.statusCode).toBe(403);

    const result = await oauthPromise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Stato CSRF OAuth non valido o manomesso.');
  });

  it('5. Callback valido ma exchange fallito restituisce HTML 400 pulito e gestisce errore (Caso B)', async () => {
    vi.spyOn(OAuthManager, 'exchangeGoogleCode').mockResolvedValue({
      success: false,
      error: 'Invalid Grant / Bad Refresh Token',
    });

    const oauthPromise = OAuthManager.startGoogleOAuth({ clientId: 'mock-id' });

    await vi.waitFor(() => expect(openExternalMock).toHaveBeenCalled());
    const authUrl = new URL(openExternalMock.mock.calls[0][0]);
    const port = new URL(authUrl.searchParams.get('redirect_uri')).port;
    const state = authUrl.searchParams.get('state');

    const res = await makeRequest(`http://127.0.0.1:${port}/oauth/callback?code=valid_code&state=${state}`);
    expect(res.statusCode).toBe(400);
    expect(res.data).toContain('Errore durante l\'autenticazione');

    const result = await oauthPromise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid Grant / Bad Refresh Token');
  });

  it('6. Errore OAuth restituito da Google (?error=access_denied) (Caso E)', async () => {
    const oauthPromise = OAuthManager.startGoogleOAuth({ clientId: 'mock-id' });

    await vi.waitFor(() => expect(openExternalMock).toHaveBeenCalled());
    const authUrl = new URL(openExternalMock.mock.calls[0][0]);
    const port = new URL(authUrl.searchParams.get('redirect_uri')).port;

    const res = await makeRequest(`http://127.0.0.1:${port}/oauth/callback?error=access_denied`);
    expect(res.statusCode).toBe(200);

    const result = await oauthPromise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Google OAuth error: access_denied');
  });

  it('7. Eccezione inattesa dentro l\'handler risponde 500 senza sollevare ERR_HTTP_HEADERS_SENT (Caso I)', async () => {
    vi.spyOn(OAuthManager, 'exchangeGoogleCode').mockImplementation(async () => {
      throw new Error('Eccezione inaspettata durante lo scambio codice');
    });

    let headersSentErrorOccurred = false;
    const unhandledListener = (err) => {
      if (err && err.code === 'ERR_HTTP_HEADERS_SENT') {
        headersSentErrorOccurred = true;
      }
    };
    process.on('uncaughtException', unhandledListener);

    const oauthPromise = OAuthManager.startGoogleOAuth({ clientId: 'mock-id' });

    await vi.waitFor(() => expect(openExternalMock).toHaveBeenCalled());
    const authUrl = new URL(openExternalMock.mock.calls[0][0]);
    const port = new URL(authUrl.searchParams.get('redirect_uri')).port;
    const state = authUrl.searchParams.get('state');

    const res = await makeRequest(`http://127.0.0.1:${port}/oauth/callback?code=valid_code&state=${state}`);
    expect(res.statusCode).toBe(500);
    expect(res.data).toContain('Errore interno');

    const result = await oauthPromise;
    process.removeListener('uncaughtException', unhandledListener);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Eccezione inaspettata durante lo scambio codice');
    expect(headersSentErrorOccurred).toBe(false);
  });

  it('8. Callback multipli / concorrenza: la seconda richiesta viene ignorata idempotentemente (Caso G)', async () => {
    vi.spyOn(OAuthManager, 'exchangeGoogleCode').mockImplementation(async () => {
      // Ritardo simulato
      await new Promise(r => setTimeout(r, 50));
      return { success: true, tokens: { access_token: 'first-token' } };
    });

    const oauthPromise = OAuthManager.startGoogleOAuth({ clientId: 'mock-id' });

    await vi.waitFor(() => expect(openExternalMock).toHaveBeenCalled());
    const authUrl = new URL(openExternalMock.mock.calls[0][0]);
    const port = new URL(authUrl.searchParams.get('redirect_uri')).port;
    const state = authUrl.searchParams.get('state');

    // Invia due richieste quasi contemporanee
    const req1 = makeRequest(`http://127.0.0.1:${port}/oauth/callback?code=code1&state=${state}`);
    const req2 = makeRequest(`http://127.0.0.1:${port}/oauth/callback?code=code2&state=${state}`);

    const [res1, res2] = await Promise.all([req1, req2]);
    const result = await oauthPromise;

    expect(result.success).toBe(true);
    expect(result.tokens.access_token).toBe('first-token');
    // Almeno una delle due ha completato con successo 200, l'altra ha ricevuto 410 o socket chiuso
    expect([res1.statusCode, res2.statusCode]).toContain(200);
  });
});
