import React, { useState, useEffect } from 'react';
import { 
  Settings, FolderPlus, Trash2, ExternalLink, User, Bot, 
  FolderGit2, Calendar, Music, HardDrive, CheckCircle2, Key, ShieldCheck,
  Sparkles, RotateCcw, Trophy, Sliders, Pin, ChevronDown, Lock, RefreshCw, Zap
} from 'lucide-react';
import { useProjects } from '../context/ProjectsContext';
import { useGamification } from '../context/GamificationContext';
import { useSections } from '../context/SectionsContext';

import { PROVIDER_INFO as providerInfo } from '../constants/providers';
import { GoogleIcon, SpotifyIcon, PinterestIcon, GithubIcon } from './BrandIcons';
import { 
  AestheticCogIcon, 
  AestheticIdCardIcon, 
  AestheticChartPieIcon, 
  AestheticKeyIcon, 
  AestheticGlobeIcon, 
  AestheticImacIcon 
} from './AestheticIcons';


export default function SettingsView() {
  const { refreshProjects } = useProjects();
  const { 
    userName, 
    completeOnboarding, 
    xpRules, 
    updateXpRules, 
    resetXpRulesToDefault, 
    difficulty, 
    updateDifficulty,
    addXp
  } = useGamification();

  const { enabledSections, updateSection } = useSections();
  const [googleExpanded, setGoogleExpanded] = useState(false);
  const [spotifyExpanded, setSpotifyExpanded] = useState(false);
  const [pinterestExpanded, setPinterestExpanded] = useState(false);
  const [githubExpanded, setGithubExpanded] = useState(false);

  const [nameInput, setNameInput] = useState(userName || '');
  const [scanPaths, setScanPaths] = useState([]);
  const [newPath, setNewPath] = useState('');

  // AI Provider states
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiKey, setAiKey] = useState('');
  const [aiStatus, setAiStatus] = useState(null);
  const [testingAi, setTestingAi] = useState(false);

  // GitHub State
  const [githubToken, setGithubToken] = useState('');
  const [githubUser, setGithubUser] = useState(null);
  const [validatingGh, setValidatingGh] = useState(false);

  // Google OAuth Credentials
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleStatus, setGoogleStatus] = useState({ status: 'disconnected', userEmail: '' });
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  // Spotify Status
  const [spotifyStatus, setSpotifyStatus] = useState({ status: 'disconnected', userName: '' });
  const [connectingSpotify, setConnectingSpotify] = useState(false);

  // Pinterest Status
  const [pinterestStatus, setPinterestStatus] = useState({ status: 'disconnected', userName: '' });
  const [connectingPinterest, setConnectingPinterest] = useState(false);

  useEffect(() => {
    setNameInput(userName);

    if (window.electronAPI) {
      window.electronAPI.getStoreData().then((data) => {
        if (data && data.scanPaths) {
          setScanPaths(data.scanPaths);
        }
      });

      // Load selected provider & keys
      window.electronAPI.getToken('selected_ai_provider').then((prov) => {
        const activeProv = prov || 'gemini';
        setAiProvider(activeProv);
        window.electronAPI.getToken(`${activeProv}_api_key`).then((k) => {
          if (k) setAiKey(k);
        });
      });

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
  }, [userName]);

  const handleProviderChange = (e) => {
    const newProv = e.target.value;
    setAiProvider(newProv);
    setAiKey('');
    setAiStatus(null);
    if (window.electronAPI) {
      window.electronAPI.saveToken('selected_ai_provider', newProv);
      window.electronAPI.getToken(`${newProv}_api_key`).then((k) => {
        if (k) setAiKey(k);
      });
    }
  };

  const handleSaveName = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    completeOnboarding(nameInput.trim());
  };

  const handleSaveAiKey = async () => {
    if (aiProvider !== 'ollama' && !aiKey.trim()) return;
    setTestingAi(true);
    setAiStatus(null);
    if (window.electronAPI) {
      const res = await window.electronAPI.testAiKey(aiProvider, aiKey.trim());
      setTestingAi(false);
      setAiStatus(res);
      if (res.success) {
        await window.electronAPI.saveToken(`${aiProvider}_api_key`, aiKey.trim());
        await window.electronAPI.saveToken('selected_ai_provider', aiProvider);
      }
    } else {
      setTestingAi(false);
      setAiStatus({ success: true, message: 'Demo Web OK' });
    }
  };

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

  const handleAddPath = (e) => {
    e.preventDefault();
    if (!newPath.trim()) return;
    const updated = [...scanPaths, newPath.trim()];
    setScanPaths(updated);
    setNewPath('');
    if (window.electronAPI) {
      window.electronAPI.setStoreData('scanPaths', updated);
    }
    refreshProjects();
  };

  const handleRemovePath = (index) => {
    const updated = scanPaths.filter((_, i) => i !== index);
    setScanPaths(updated);
    if (window.electronAPI) {
      window.electronAPI.setStoreData('scanPaths', updated);
    }
    refreshProjects();
  };

  return (
    <div className="projects-canvas-container select-none overflow-y-auto">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-heading font-black text-3xl text-white flex items-center gap-3.5">
            <AestheticCogIcon className="w-10 h-10 shrink-0 filter drop-shadow-md" />
            Impostazioni & Connessioni
          </h1>
          <p className="text-xs text-blue mt-1 font-sans">
            Gestisci profilo, provider IA, integrazioni app e percorsi di scansione locale
          </p>
        </div>
      </div>

      {/* BALANCED 2-COLUMN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start pb-16">
        
        {/* LEFT COLUMN: Account Google Master, Gamification & AI Config */}
        <div className="flex flex-col gap-8">
          
          {/* Account Google Master Card - Warm Sand & Sage Accent */}
          <div className="dashboard-card bg-gradient-to-br from-card via-canvas to-sand/10 border-2 border-sand/60 p-7 flex flex-col gap-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-sand/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sand/20 rounded-2xl border border-sand/40">
                  <GoogleIcon className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-lg text-white">Account Google Master</h2>
                  <p className="text-xs text-sand font-mono">Identita Primaria & Workspace Hub</p>
                </div>
              </div>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                googleStatus.status === 'connected'
                  ? 'bg-sage/30 border-sage text-sage'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}>
                {googleStatus.status === 'connected' ? 'Master Connesso' : 'Disconnesso'}
              </span>
            </div>

            {googleStatus.status === 'connected' ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-canvas rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3.5">
                    {googleStatus.avatarUrl ? (
                      <img src={googleStatus.avatarUrl} alt="Avatar" className="w-11 h-11 rounded-full border-2 border-sand" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-sand/20 flex items-center justify-center border border-sand/40">
                        <AestheticIdCardIcon className="w-6 h-6 text-sand" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-white">{googleStatus.userName || userName || 'Utente Workspace'}</p>
                      <p className="text-xs font-mono text-sand">{googleStatus.userEmail || 'account@google.com'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartGoogleOAuth}
                      disabled={connectingGoogle}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-sand border border-sand/30 transition-all"
                    >
                      {connectingGoogle ? 'Aggiornamento...' : 'Rinfresca Permessi'}
                    </button>
                    <button
                      onClick={handleDisconnectGoogle}
                      className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold transition-all"
                    >
                      Disconnetti
                    </button>
                  </div>
                </div>

                {/* Workspace Services Grid */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono font-bold text-sand uppercase tracking-wider">
                    Servizi Workspace Integrati
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { name: 'Google Calendar', status: 'Attivo', color: 'text-sage border-sage/40' },
                      { name: 'Google Tasks', status: 'Attivo', color: 'text-sage border-sage/40' },
                      { name: 'Google Drive', status: 'Integrazione v3', color: 'text-blue border-blue/40' },
                      { name: 'Google Docs', status: 'Integrazione v3', color: 'text-blue border-blue/40' },
                      { name: 'Google Keep', status: 'Integrazione v3', color: 'text-blue border-blue/40' },
                    ].map((srv, idx) => (
                      <div key={idx} className="p-2.5 bg-canvas rounded-xl border border-white/10 flex flex-col justify-between">
                        <span className="text-xs font-bold text-white">{srv.name}</span>
                        <span className={`text-[10px] font-mono ${srv.color} mt-1 block`}>{srv.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-white/60 font-mono bg-black/20 p-3 rounded-xl border border-white/5">
                  L'Account Google costituisce l'identita master per l'Hub Workspace ed il contesto di Diaspro AI.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 items-center text-center p-4">
                <p className="text-xs text-white/80">
                  Nessun Account Google attualmente collegato. Collega il tuo account per attivare la suite di strumenti.
                </p>
                <button
                  onClick={handleStartGoogleOAuth}
                  disabled={connectingGoogle}
                  className="action-pill bg-sand hover:bg-sand/80 text-canvas font-bold shadow-lg"
                >
                  <GoogleIcon className="w-5 h-5" />
                  <span>{connectingGoogle ? 'Attendi Browser...' : 'Connetti Account Google Master'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Gamification & XP Rules Card - Rich Plum & Sand */}
          <div className="dashboard-card bg-gradient-to-br from-card via-canvas to-plum/30 border-2 border-plum/60 p-7 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-plum/40 pb-3">
              <h2 className="font-heading font-bold text-lg text-white flex items-center gap-3">
                <AestheticChartPieIcon className="w-8 h-8 shrink-0 filter drop-shadow-md" />
                Gamification & Regole XP
              </h2>
              <button
                onClick={resetXpRulesToDefault}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold text-sand border border-sand/30 transition-all cursor-pointer shadow-sm"
                title="Ripristina valori consigliati di default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ripristina Default</span>
              </button>
            </div>

            {/* Difficulty Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-bold text-sand uppercase tracking-wider">
                Difficilita di Progressione Livelli
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'easy', label: 'Facile (0.7x)', desc: 'Progressione rapida' },
                  { id: 'normal', label: 'Normale (1.0x)', desc: 'Bilanciamento standard' },
                  { id: 'hard', label: 'Difficile (1.5x)', desc: 'Per veri pro' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => updateDifficulty(d.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      difficulty === d.id
                        ? 'bg-plum border-sand shadow-lg text-white font-bold'
                        : 'bg-canvas border-white/10 text-white/70 hover:border-white/30'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{d.label}</p>
                    <span className="text-[10px] text-blue font-mono block mt-0.5">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action XP Rules Grid */}
            <div className="flex flex-col gap-3 pt-2">
              <label className="text-xs font-mono font-bold text-lavender uppercase tracking-wider">
                Punti XP Assegnati per Azione
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'taskComplete', label: 'Task Post-it completata' },
                  { key: 'taskCreate', label: 'Creazione nuova task' },
                  { key: 'calendarEvent', label: 'Evento Google Calendar' },
                  { key: 'aiChat', label: 'Interazione con Chatbot AI' },
                  { key: 'spotifySession', label: 'Sessione musica Spotify' },
                  { key: 'dailyStreak', label: 'Accesso quotidiano (Streak)' },
                ].map((rule) => (
                  <div key={rule.key} className="p-3 bg-canvas rounded-2xl border border-lavender/30 flex items-center justify-between shadow-inner">
                    <span className="text-xs font-bold text-white">
                      {rule.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={xpRules[rule.key] || 0}
                        onChange={(e) => updateXpRules({ [rule.key]: parseInt(e.target.value) || 1 })}
                        className="w-16 bg-card border border-sand/50 text-center text-xs font-mono font-bold text-sand rounded-xl px-2 py-1 focus:outline-none focus:border-sand"
                      />
                      <span className="text-[10px] font-mono text-blue">XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-Provider AI BYOK Card - Deep Purple & Glowing Blue */}
          <div className="dashboard-card bg-gradient-to-br from-card to-canvas border-2 border-blue/50 p-7 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue/20 pb-3">
              <h2 className="font-heading font-bold text-lg text-white flex items-center gap-3">
                <AestheticKeyIcon className="w-8 h-8 shrink-0 filter drop-shadow-md" />
                Configurazione IA (Multi-Provider BYOK)
              </h2>
              <ShieldCheck className="w-5 h-5 text-sage" />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono font-bold text-blue uppercase tracking-wider">
                  Provider Selezionato
                </label>
                <select
                  value={aiProvider}
                  onChange={handleProviderChange}
                  className="bg-canvas border border-blue/40 text-white rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-blue cursor-pointer"
                >
                  <option value="gemini" className="bg-card text-white">Google Gemini</option>
                  <option value="deepseek" className="bg-card text-white">DeepSeek</option>
                  <option value="anthropic" className="bg-card text-white">Anthropic (Claude)</option>
                  <option value="openai" className="bg-card text-white">OpenAI</option>
                  <option value="ollama" className="bg-card text-white">Ollama (Locale)</option>
                </select>
              </div>

              {aiProvider !== 'ollama' && (
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono font-bold text-blue uppercase tracking-wider">
                      Chiave API {providerInfo[aiProvider]?.name}
                    </label>
                    <a
                      href={providerInfo[aiProvider]?.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue hover:underline flex items-center gap-1 font-mono"
                    >
                      Ottieni Chiave <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="password"
                      placeholder={providerInfo[aiProvider]?.placeholder}
                      value={aiKey}
                      onChange={(e) => setAiKey(e.target.value)}
                      className="flex-1 bg-canvas border border-blue/30 text-white font-mono text-xs rounded-2xl px-4 py-3 focus:outline-none focus:border-blue"
                    />
                    <button
                      onClick={handleSaveAiKey}
                      disabled={testingAi}
                      className="action-pill bg-blue text-canvas hover:bg-white font-black disabled:opacity-50 shadow-md"
                    >
                      {testingAi ? 'Verifica...' : 'Salva & Test'}
                    </button>
                  </div>
                </div>
              )}

              {aiProvider === 'ollama' && (
                <div className="flex justify-between items-center p-3.5 bg-canvas rounded-2xl border border-white/10">
                  <span className="text-xs font-mono text-blue">Endpoint: http://localhost:11434</span>
                  <button
                    onClick={handleSaveAiKey}
                    disabled={testingAi}
                    className="action-pill bg-sidebar hover:bg-plum text-white font-bold"
                  >
                    {testingAi ? 'Verifica...' : 'Test Ollama'}
                  </button>
                </div>
              )}

              {aiStatus && (
                <div className={`p-3 rounded-xl border text-xs font-mono font-semibold ${
                  aiStatus.success 
                    ? 'bg-sage/20 border-sage/50 text-sage' 
                    : 'bg-canvas border-terracotta/40 text-terracotta'
                }`}>
                  {aiStatus.message || aiStatus.error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Unified Hub Connessioni & Scan Paths */}
        <div className="flex flex-col gap-8">

          {/* ── UNIFIED HUB CONNESSIONI PREMIUM ── */}
          <div className="dashboard-card bg-gradient-to-br from-card via-canvas to-card border-2 border-sand/60 p-7 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-sand/25 pb-4">
              <div>
                <h2 className="font-heading font-black text-xl text-white flex items-center gap-3">
                  <AestheticGlobeIcon className="w-9 h-9 shrink-0 filter drop-shadow-md" />
                  Hub Connessioni
                </h2>
                <p className="text-xs text-blue font-sans mt-0.5">
                  Tutte le tue app e servizi integrati con login 1-click in un unico pannello
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-sand bg-plum/60 px-3 py-1 rounded-full border border-sand/30 uppercase tracking-wider">
                App &amp; Servizi
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">

              {/* 1. SPOTIFY SECTION */}
              <div className="bg-canvas rounded-2xl border border-sage/40 overflow-hidden transition-all shadow-md">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sage/20 to-canvas">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-canvas border border-sage/40 flex items-center justify-center shrink-0 shadow-md">
                      <SpotifyIcon className="w-6 h-6 text-sage" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Spotify Web Player</p>
                      <p className="text-[11px] font-mono text-white/60">
                        {spotifyStatus.status === 'connected' ? spotifyStatus.userName || 'Account Spotify Attivo' : 'Controllo musica in-app'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-full border ${
                      spotifyStatus.status === 'connected'
                        ? 'bg-sage/25 text-sage border-sage/50'
                        : spotifyStatus.status === 'expired'
                        ? 'bg-amber-950/40 text-sand border-amber-400/40'
                        : 'bg-terracotta/25 text-plum-muted border-terracotta/40'
                    }`}>
                      {spotifyStatus.status === 'connected' ? '● Connesso' : spotifyStatus.status === 'expired' ? '⚠ Scaduto' : '○ Disconnesso'}
                    </span>
                    <label className="hub-toggle" title="Mostra/Nascondi Spotify nella sidebar">
                      <input
                        type="checkbox"
                        checked={!!enabledSections.spotify}
                        onChange={(e) => updateSection('spotify', e.target.checked)}
                      />
                      <span className="hub-toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Inline Login/Disconnect Spotify */}
                <div className="p-4 border-t border-white/10 bg-canvas">
                  {spotifyStatus.status === 'connected' ? (
                    <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-white/10 font-mono text-xs">
                      <span className="text-sage font-bold">Account: {spotifyStatus.userName}</span>
                      <button
                        onClick={handleDisconnectSpotify}
                        className="action-pill bg-canvas hover:bg-card border border-terracotta/40 text-terracotta text-xs py-1 px-3"
                      >
                        Disconnetti Spotify
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartSpotifyOAuth}
                      disabled={connectingSpotify}
                      className="action-pill bg-sage hover:bg-sage/80 text-canvas font-black w-full justify-center shadow-md text-xs py-2.5"
                    >
                      <Zap className="w-4 h-4 fill-canvas" />
                      <span>{connectingSpotify ? 'Attendi Browser...' : 'Connetti Spotify in 1-Click (Browser)'}</span>
                    </button>
                  )}
                </div>
              </div>


              {/* 3. PINTEREST MOODBOARD SECTION */}
              <div className="bg-canvas rounded-2xl border border-plum/40 overflow-hidden transition-all shadow-md">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-plum/20 to-canvas">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-canvas border border-plum/40 flex items-center justify-center shrink-0 shadow-md">
                      <PinterestIcon className="w-6 h-6 text-plum" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Pinterest Moodboard</p>
                      <p className="text-[11px] font-mono text-white/60">
                        {pinterestStatus.status === 'connected' ? pinterestStatus.userName || 'Account Pinterest Attivo' : 'Bacheche visive d\'ispirazione'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-full border ${
                      pinterestStatus.status === 'connected'
                        ? 'bg-sage/25 text-sage border-sage/50'
                        : pinterestStatus.status === 'expired'
                        ? 'bg-amber-950/40 text-sand border-amber-400/40'
                        : 'bg-terracotta/25 text-plum-muted border-terracotta/40'
                    }`}>
                      {pinterestStatus.status === 'connected' ? '● Connesso' : pinterestStatus.status === 'expired' ? 'Scaduto' : '○ Disconnesso'}
                    </span>
                    <label className="hub-toggle" title="Mostra/Nascondi Moodboard nella sidebar">
                      <input
                        type="checkbox"
                        checked={!!enabledSections.pinterest}
                        onChange={(e) => updateSection('pinterest', e.target.checked)}
                      />
                      <span className="hub-toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Inline Login/Disconnect Pinterest */}
                <div className="p-4 border-t border-white/10 bg-canvas">
                  {pinterestStatus.status === 'connected' ? (
                    <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-white/10 font-mono text-xs">
                      <span className="text-plum font-bold">Account: @{pinterestStatus.userName}</span>
                      <button
                        onClick={handleDisconnectPinterest}
                        className="action-pill bg-canvas hover:bg-card border border-terracotta/40 text-terracotta text-xs py-1 px-3"
                      >
                        Disconnetti Pinterest
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartPinterestOAuth}
                      disabled={connectingPinterest}
                      className="action-pill bg-plum hover:bg-plum/80 text-white font-black w-full justify-center shadow-md text-xs py-2.5"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>{connectingPinterest ? 'Attendi Browser...' : 'Connetti Pinterest in 1-Click (Browser)'}</span>
                    </button>
                  )}
                </div>
              </div>


              {/* 4. GITHUB SECTION */}
              <div className="bg-canvas rounded-2xl border border-white/30 overflow-hidden transition-all shadow-md">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white/10 to-canvas">
                  <div
                    onClick={() => setGithubExpanded(!githubExpanded)}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-canvas border border-white/30 flex items-center justify-center shrink-0 shadow-md">
                      <GithubIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        GitHub Personal Access Token
                        <ChevronDown className={`w-4 h-4 text-white/70 transition-transform duration-200 ${githubExpanded ? 'rotate-180' : ''}`} />
                      </p>
                      <p className="text-[11px] font-mono text-white/60">
                        {githubUser ? `@${githubUser.login}` : 'Integrazione Repository & Issues'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-black px-3 py-1.5 rounded-full border ${
                    githubUser
                      ? 'bg-sage/25 text-sage border-sage/50'
                      : 'bg-terracotta/25 text-plum-muted border-terracotta/40'
                  }`}>
                    {githubUser ? '● Connesso' : '○ Disconnesso'}
                  </span>
                </div>

                {/* Inline Token Form / Account status */}
                <div className="p-4 border-t border-white/10 bg-canvas flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Token ghp_..."
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="flex-1 bg-card border border-white/20 text-white font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-white"
                    />
                    <button
                      onClick={handleSaveGitHubToken}
                      disabled={validatingGh}
                      className="action-pill bg-sidebar hover:bg-plum text-white font-black text-xs py-2 px-4 disabled:opacity-50 shadow-md"
                    >
                      {validatingGh ? 'Verifica...' : 'Connetti'}
                    </button>
                  </div>

                  {githubUser && (
                    <div className="flex items-center gap-3 font-mono text-xs text-sage bg-card p-3 rounded-xl border border-white/10">
                      <img src={githubUser.avatar_url} alt={githubUser.login} className="w-6 h-6 rounded-full border border-sage" />
                      <span>Account GitHub collegato: @{githubUser.login}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>



          {/* Local Disk Scan Paths Card - Vibrant Sage & Lavender */}
          <div className="dashboard-card bg-gradient-to-br from-card to-canvas border-2 border-sage/50 p-7 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sage/25 pb-3">
              <h2 className="font-heading font-bold text-lg text-white flex items-center gap-3">
                <AestheticImacIcon className="w-8 h-8 shrink-0 filter drop-shadow-md" />
                Percorsi Scansione Disco
              </h2>
              <span className="text-xs font-mono font-bold text-sage bg-sage/20 px-3 py-1 rounded-full border border-sage/40">
                {scanPaths.length} percorsi attivi
              </span>
            </div>

            <form onSubmit={handleAddPath} className="flex gap-3">
              <input
                type="text"
                placeholder="Aggiungi percorso locale..."
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className="flex-1 bg-canvas border border-sage/30 text-white text-xs font-semibold rounded-2xl px-4 py-3 placeholder-white/40 focus:outline-none focus:border-sage"
              />
              <button type="submit" className="action-pill bg-sage hover:bg-sage/80 text-canvas font-black shadow-md">
                <FolderPlus className="w-4 h-4" />
                <span>Aggiungi</span>
              </button>
            </form>

            <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
              {scanPaths.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-canvas border border-white/10 flex items-center justify-between font-mono text-xs text-white"
                >
                  <span className="truncate mr-2">{p}</span>
                  <button
                    onClick={() => handleRemovePath(idx)}
                    className="p-1.5 rounded-xl text-white/50 hover:text-terracotta transition-colors cursor-pointer"
                    title="Rimuovi percorso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
