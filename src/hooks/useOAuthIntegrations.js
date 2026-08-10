import { useState, useEffect } from 'react';
import { useGamification } from '../context/GamificationContext';
import { useProjects } from '../context/ProjectsContext';

export function useOAuthIntegrations() {
  const { addXp } = useGamification();
  const { refreshProjects } = useProjects();

  // GitHub State
  const [githubToken, setGithubToken] = useState('');
  const [githubUser, setGithubUser] = useState(null);
  const [validatingGh, setValidatingGh] = useState(false);

  // Google OAuth Credentials & Status
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleStatus, setGoogleStatus] = useState({ status: 'disconnected', userEmail: '' });
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [googleSaveStatus, setGoogleSaveStatus] = useState(null);

  // Spotify Status
  const [spotifyStatus, setSpotifyStatus] = useState({ status: 'disconnected', userName: '' });
  const [connectingSpotify, setConnectingSpotify] = useState(false);

  // Pinterest Status
  const [pinterestStatus, setPinterestStatus] = useState({ status: 'disconnected', userName: '' });
  const [connectingPinterest, setConnectingPinterest] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getToken('github').then((t) => {
        if (t) {
          setGithubToken(t);
          window.electronAPI.validateGitHubToken(t).then((res) => {
            if (res.valid) setGithubUser(res.user);
          });
        }
      });

      window.electronAPI.getToken('google_client_id').then((cid) => {
        if (cid) setGoogleClientId(cid);
      });
      window.electronAPI.getToken('google_client_secret').then((cs) => {
        if (cs) setGoogleClientSecret(cs);
      });
      window.electronAPI.getGoogleStatus().then((st) => {
        if (st) setGoogleStatus(st);
      });

      window.electronAPI.getSpotifyStatus().then((st) => {
        if (st) setSpotifyStatus(st);
      });

      window.electronAPI.getPinterestStatus().then((st) => {
        if (st) setPinterestStatus(st);
      });
    }
  }, []);

  const handleSaveGitHubToken = async () => {
    if (!githubToken.trim()) return;
    setValidatingGh(true);
    if (window.electronAPI) {
      const res = await window.electronAPI.validateGitHubToken(githubToken.trim());
      setValidatingGh(false);
      if (res.valid) {
        setGithubUser(res.user);
        await window.electronAPI.saveToken('github', githubToken.trim());
        addXp(30, 'GitHub collegato con successo!');
        refreshProjects();
      } else {
        alert(res.error || 'Token non valido');
      }
    } else {
      setValidatingGh(false);
    }
  };

  const handleStartGoogleOAuth = async () => {
    if (!window.electronAPI) return;
    setConnectingGoogle(true);
    const res = await window.electronAPI.startGoogleOAuth();
    setConnectingGoogle(false);
    if (res.success) {
      const st = await window.electronAPI.getGoogleStatus();
      setGoogleStatus(st);
      addXp(30, 'Google Workspace collegato!');
    } else {
      alert(res.error || 'Errore durante la connessione Google');
    }
  };

  const handleDisconnectGoogle = async () => {
    if (window.electronAPI) {
      await window.electronAPI.disconnectGoogle();
      setGoogleStatus({ status: 'disconnected', userEmail: '' });
    }
  };

  const handleStartSpotifyOAuth = async () => {
    if (!window.electronAPI) return;
    setConnectingSpotify(true);
    const res = await window.electronAPI.startSpotifyOAuth();
    setConnectingSpotify(false);
    if (res.success) {
      const st = await window.electronAPI.getSpotifyStatus();
      setSpotifyStatus(st);
      addXp(30, 'Spotify collegato!');
    } else {
      alert(res.error || 'Errore di connessione Spotify');
    }
  };

  const handleDisconnectSpotify = async () => {
    if (window.electronAPI) {
      await window.electronAPI.disconnectSpotify();
      setSpotifyStatus({ status: 'disconnected', userName: '' });
    }
  };

  const handleStartPinterestOAuth = async () => {
    if (!window.electronAPI) return;
    setConnectingPinterest(true);
    const res = await window.electronAPI.startPinterestOAuth();
    setConnectingPinterest(false);
    if (res.success) {
      const st = await window.electronAPI.getPinterestStatus();
      setPinterestStatus(st);
      addXp(30, 'Pinterest collegato!');
    } else {
      alert(res.error || 'Errore di connessione Pinterest');
    }
  };

  const handleDisconnectPinterest = async () => {
    if (window.electronAPI) {
      await window.electronAPI.disconnectPinterest();
      setPinterestStatus({ status: 'disconnected', userName: '' });
    }
  };

  const handleSaveGoogleCredentials = async () => {
    if (!googleClientId.trim()) {
      setGoogleSaveStatus({ success: false, message: 'Google Client ID e un campo obbligatorio.' });
      return;
    }
    if (window.electronAPI) {
      await window.electronAPI.saveToken('google_client_id', googleClientId.trim());
      if (googleClientSecret.trim()) {
        await window.electronAPI.saveToken('google_client_secret', googleClientSecret.trim());
      }
      setGoogleSaveStatus({ success: true, message: 'Credenziali Google salvate nel Vault cifrato!' });
      setTimeout(() => setGoogleSaveStatus(null), 4000);
    }
  };

  return {
    githubToken,
    setGithubToken,
    githubUser,
    setGithubUser,
    validatingGh,
    handleSaveGitHubToken,
    googleClientId,
    setGoogleClientId,
    googleClientSecret,
    setGoogleClientSecret,
    googleStatus,
    connectingGoogle,
    googleSaveStatus,
    handleStartGoogleOAuth,
    handleDisconnectGoogle,
    handleSaveGoogleCredentials,
    spotifyStatus,
    connectingSpotify,
    handleStartSpotifyOAuth,
    handleDisconnectSpotify,
    pinterestStatus,
    connectingPinterest,
    handleStartPinterestOAuth,
    handleDisconnectPinterest,
  };
}

export default useOAuthIntegrations;
