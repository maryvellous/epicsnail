const OAuthManager = require('./oauthManager');

class GoogleTools {
  constructor(authVault) {
    this.authVault = authVault;
  }

  getClientId() {
    return (
      this.authVault.getToken('google_client_id') ||
      process.env.GOOGLE_CLIENT_ID ||
      '981628169123-diasproviboard.apps.googleusercontent.com'
    );
  }

  hasConfiguredClientId() {
    const id = this.getClientId();
    return !!id;
  }

  getClientSecret() {
    return (
      this.authVault.getToken('google_client_secret') ||
      process.env.GOOGLE_CLIENT_SECRET ||
      ''
    );
  }

  getTokens() {
    return this.authVault.getToken('google_tokens');
  }

  async getValidAccessToken() {
    let tokens = this.getTokens();
    if (!tokens || !tokens.access_token) return null;

    // Check if access_token is expired (with 60-second buffer)
    if (Date.now() >= (tokens.expires_at - 60000)) {
      if (!tokens.refresh_token) return null;
      
      const clientId = this.getClientId();
      const clientSecret = this.getClientSecret();
      const refreshRes = await OAuthManager.refreshGoogleToken({
        refreshToken: tokens.refresh_token,
        clientId,
        clientSecret,
      });

      if (refreshRes.success) {
        tokens.access_token = refreshRes.accessToken;
        tokens.expires_at = refreshRes.expiresAt;
        this.authVault.saveToken('google_tokens', tokens);
      } else {
        console.error('Failed to refresh Google Token:', refreshRes.error);
        return null;
      }
    }

    return tokens.access_token;
  }

  async getConnectionStatus() {
    const tokens = this.getTokens();
    if (!tokens) return { status: 'disconnected', userEmail: '' };

    const validToken = await this.getValidAccessToken();
    if (!validToken) {
      return { status: 'expired', userEmail: tokens.user_email || '' };
    }

    return { status: 'connected', userEmail: tokens.user_email || '' };
  }

  async getCalendarEvents(maxResults = 10) {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return { success: false, error: 'Account Google non connesso o token scaduto' };

    try {
      const nowISO = new Date().toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(nowISO)}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const errJson = await res.json();
        return { success: false, error: errJson.error?.message || `Google API status ${res.status}` };
      }

      const data = await res.json();
      const events = (data.items || []).map(item => ({
        id: item.id,
        title: item.summary || 'Senza Titolo',
        description: item.description || '',
        location: item.location || '',
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
        htmlLink: item.htmlLink,
      }));

      return { success: true, events };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async createCalendarEvent({ summary, startTime, endTime, description }) {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return { success: false, error: 'Account Google non connesso' };

    try {
      const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

      // Parse start and end time
      let startDateTime = startTime;
      let endDateTime = endTime;

      // If user inputs simple time like "15:00", construct full ISO date string for today
      if (startTime && !startTime.includes('T')) {
        const today = new Date().toISOString().split('T')[0];
        startDateTime = `${today}T${startTime}:00Z`;
        const endHour = parseInt(startTime.split(':')[0], 10) + 1;
        endDateTime = `${today}T${endHour < 10 ? '0' + endHour : endHour}:00Z`;
      }

      const body = {
        summary: summary,
        description: description || '',
        start: { dateTime: startDateTime || new Date().toISOString() },
        end: { dateTime: endDateTime || new Date(Date.now() + 3600000).toISOString() },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json();
        return { success: false, error: errJson.error?.message || 'Errore creazione evento Google' };
      }

      const createdItem = await res.json();
      return { success: true, event: createdItem };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async getGoogleTasks() {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return { success: false, error: 'Account Google non connesso' };

    try {
      // 1. Fetch Tasklists
      const listsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!listsRes.ok) return { success: false, error: 'Errore recupero liste Tasks' };

      const listsData = await listsRes.json();
      const primaryList = (listsData.items && listsData.items[0]) ? listsData.items[0] : null;

      if (!primaryList) return { success: true, tasks: [] };

      // 2. Fetch Tasks in Primary List
      const tasksRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${primaryList.id}/tasks?showCompleted=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!tasksRes.ok) return { success: false, error: 'Errore recupero attività Tasks' };

      const tasksData = await tasksRes.json();
      const tasks = (tasksData.items || []).map(t => ({
        id: t.id,
        title: t.title || 'Senza Titolo',
        status: t.status,
        completed: t.status === 'completed',
        due: t.due,
      }));

      return { success: true, tasks };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async toggleGoogleTask(taskId, completed) {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return { success: false, error: 'Account Google non connesso' };

    try {
      const listsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!listsRes.ok) return { success: false, error: 'Errore recupero lista Tasks' };
      const listsData = await listsRes.json();
      const primaryList = listsData.items?.[0];
      if (!primaryList) return { success: false, error: 'Nessuna lista trovata' };

      const newStatus = completed ? 'completed' : 'needsAction';
      const patchBody = { status: newStatus };
      if (!completed) patchBody.completed = null;

      const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${primaryList.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patchBody),
      });

      if (!res.ok) return { success: false, error: 'Impossibile aggiornare il Task' };
      const updatedItem = await res.json();
      return { success: true, task: updatedItem };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async createGoogleTask(title, due) {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return { success: false, error: 'Account Google non connesso' };

    try {
      const listsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!listsRes.ok) return { success: false, error: 'Errore recupero lista Tasks' };
      const listsData = await listsRes.json();
      const primaryList = listsData.items?.[0];
      if (!primaryList) return { success: false, error: 'Nessuna lista trovata' };

      const body = { title };
      if (due) body.due = new Date(due).toISOString();

      const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${primaryList.id}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) return { success: false, error: 'Errore creazione Task Google' };
      const createdItem = await res.json();
      return { success: true, task: createdItem };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async getDriveFiles(pageSize = 12) {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return { success: false, error: 'Account Google non connesso' };

    try {
      const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,modifiedTime)`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const errJson = await res.json();
        return { success: false, error: errJson.error?.message || `Google Drive API ${res.status}` };
      }

      const data = await res.json();
      const files = (data.files || []).map(f => ({
        id: f.id,
        name: f.name || 'File Senza Titolo',
        mimeType: f.mimeType || '',
        webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        iconLink: f.iconLink || '',
        thumbnailLink: f.thumbnailLink || '',
        modifiedTime: f.modifiedTime || '',
      }));

      return { success: true, files };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async deleteCalendarEvent(eventId) {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return { success: false, error: 'Account Google non connesso' };

    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 204 || res.status === 200) {
        return { success: true };
      }
      return { success: false, error: 'Impossibile eliminare l\'evento' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async postponeTaskToTomorrow(taskId) {
    const accessToken = await this.getValidAccessToken();
    if (!accessToken) return { success: false, error: 'Account Google non connesso' };

    try {
      const listsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!listsRes.ok) return { success: false, error: 'Errore recupero lista Tasks' };
      const listsData = await listsRes.json();
      const primaryList = listsData.items?.[0];
      if (!primaryList) return { success: false, error: 'Nessuna lista trovata' };

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${primaryList.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ due: tomorrow.toISOString() }),
      });

      if (!res.ok) return { success: false, error: 'Impossibile posticipare il task' };
      const updatedItem = await res.json();
      return { success: true, task: updatedItem };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

module.exports = GoogleTools;
