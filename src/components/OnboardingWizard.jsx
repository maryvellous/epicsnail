import React, { useState, useEffect } from 'react';
import { ArrowRight, ExternalLink, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { useGamification } from '../context/GamificationContext';
import { PROVIDER_INFO as providerInfo } from '../constants/providers';
import { GoogleIcon, GithubIcon, SpotifyIcon, PinterestIcon } from './BrandIcons';
import { AestheticKeyIcon, AestheticGlobeIcon, AestheticIdCardIcon } from './AestheticIcons';

export default function OnboardingWizard() {
  const { completeOnboarding } = useGamification();
  const [step, setStep] = useState(1);

  // User state from Google
  const [googleStatus, setGoogleStatus] = useState({ status: 'disconnected', userEmail: '', userName: '', avatarUrl: '' });
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // AI Provider states
  const [provider, setProvider] = useState('gemini'); // Default to Gemini
  const [apiKey, setApiKey] = useState('');
  const [aiTesting, setAiTesting] = useState(false);
  const [aiStatus, setAiStatus] = useState(null); // { success: bool, message: string }

  // GitHub State
  const [githubToken, setGithubToken] = useState('');
  const [ghValidating, setGhValidating] = useState(false);
  const [ghUser, setGhUser] = useState(null);
  const [ghError, setGhError] = useState('');

  // Check Google login status periodically or on mount
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.getGoogleStatus) {
      window.electronAPI.getGoogleStatus().then((st) => {
        if (st) {
          setGoogleStatus(st);
          if (st.status === 'connected' && step === 1) {
            setStep(2);
          }
        }
      });
    }
  }, [step]);

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setConnectingGoogle(true);
    setGoogleError('');
    if (window.electronAPI && window.electronAPI.loginGoogle) {
      try {
        const res = await window.electronAPI.loginGoogle();
        setConnectingGoogle(false);
        if (res && res.success) {
          const userEmail = res.userEmail || res.email || 'Utente Google';
          const userName = res.userName || res.name || userEmail.split('@')[0];
          setGoogleStatus({
            status: 'connected',
            userEmail: userEmail,
            userName: userName,
            avatarUrl: res.picture || res.avatarUrl || ''
          });
          // Auto advance to Step 2
          setStep(2);
        } else {
          setGoogleError(res?.error || 'Impossibile completare l\'autenticazione Google');
        }
      } catch (err) {
        setConnectingGoogle(false);
        setGoogleError('Errore durante la connessione con Google');
      }
    } else {
      // Demo Web Mode
      setTimeout(() => {
        setConnectingGoogle(false);
        setGoogleStatus({
          status: 'connected',
          userEmail: 'demo.user@gmail.com',
          userName: 'Utente Demo Workspace',
          avatarUrl: ''
        });
        setStep(2);
      }, 1000);
    }
  };

  // Test AI Key
  const handleTestAiKey = async () => {
    if (provider !== 'ollama' && !apiKey.trim()) return;
    setAiTesting(true);
    setAiStatus(null);
    if (window.electronAPI) {
      const res = await window.electronAPI.testAiKey(provider, apiKey.trim());
      setAiTesting(false);
      setAiStatus(res);
      if (res.success) {
        await window.electronAPI.saveToken(`${provider}_api_key`, apiKey.trim());
        await window.electronAPI.saveToken('selected_ai_provider', provider);
      }
    } else {
      setAiTesting(false);
      setAiStatus({ success: true, message: 'Modalita demo web attiva' });
    }
  };

  // Validate GitHub Token
  const handleValidateGitHub = async () => {
    if (!githubToken.trim()) return;
    setGhValidating(true);
    setGhError('');
    setGhUser(null);
    if (window.electronAPI) {
      const res = await window.electronAPI.validateGitHubToken(githubToken.trim());
      setGhValidating(false);
      if (res.valid) {
        setGhUser(res.user);
        await window.electronAPI.saveToken('github', githubToken.trim());
      } else {
        setGhError(res.error || 'Token non valido');
      }
    } else {
      setGhValidating(false);
      setGhUser({ login: 'demoUser', name: 'Demo Sviluppatore' });
    }
  };

  const handleFinish = () => {
    const finalName = googleStatus.userName || 'Utente Workspace';
    completeOnboarding(finalName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-canvas/90 backdrop-blur-md select-none">
      <div className="w-full max-w-xl bg-card text-white flex flex-col overflow-hidden shadow-2xl border border-lavender/30 rounded-[28px]">
        
        {/* Header Wizard */}
        <div className="p-7 bg-canvas border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-black text-2xl text-white">Setup Diaspro Viboard Hub</h2>
            <p className="text-xs text-lavender font-mono mt-1">Passo {step} di 3</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-lavender' : s < step ? 'w-2.5 bg-sage' : 'w-2.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 flex-1 flex flex-col gap-6">

          {/* STEP 1: LOGIN GOOGLE WORKSPACE OBBLIGATORIO */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div className="p-5 rounded-2xl bg-sand/10 border border-sand/30 flex items-start gap-4">
                <div className="p-3 bg-sand/20 rounded-xl">
                  <GoogleIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-sand">
                    Account Google Master Obbligatorio
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed font-body mt-1">
                    Diaspro Viboard e un Hub di Produttivita guidato da Google Workspace e Diaspro AI. Connetti il tuo account per abilitare Calendario, Tasks, Drive e dare contesto al Chatbot.
                  </p>
                </div>
              </div>

              {googleStatus.status === 'connected' ? (
                <div className="p-5 rounded-2xl bg-sage/20 border border-sage/50 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    {googleStatus.avatarUrl ? (
                      <img src={googleStatus.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border border-sage" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-sage/30 flex items-center justify-between p-2">
                        <AestheticIdCardIcon className="w-6 h-6 text-sage" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {googleStatus.userName || 'Account Google Connesso'}
                      </p>
                      <p className="text-xs text-sage">Google Workspace Master Attivo</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-sage bg-sage/20 px-3 py-1 rounded-full border border-sage/30">
                    CONNESSO
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={connectingGoogle}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-lavender to-plum hover:brightness-110 active:scale-[0.99] transition-all duration-200 text-white font-heading font-black text-base shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <GoogleIcon className="w-6 h-6" />
                    {connectingGoogle ? 'Autenticazione in corso...' : 'Accedi con Google Master'}
                  </button>
                  <p className="text-[11px] text-plum-muted text-center max-w-sm">
                    L'autenticazione sblocchera le viste *Oggi*, *Calendario* e fornira il contesto per il chatbot IA.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: INTELLIGENZA ARTIFICIALE (DIASPRO AI MULTI-PROVIDER) */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="p-5 rounded-2xl bg-lavender/10 border border-lavender/30 flex items-start gap-4">
                <div className="p-3 bg-lavender/20 rounded-xl">
                  <AestheticKeyIcon className="w-8 h-8 text-lavender" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-lavender">
                    Configurazione Diaspro AI
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed font-body mt-1">
                    Seleziona il provider IA da affiancare al tuo workspace Google. Diaspro AI ti aiutera a riassumere progetti e organizzare task.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-semibold text-lavender uppercase tracking-wider">
                    Provider IA
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      setApiKey('');
                      setAiStatus(null);
                    }}
                    className="bg-black/40 border border-white/20 text-white rounded-2xl px-5 py-3.5 font-bold text-sm focus:outline-none focus:border-lavender"
                  >
                    <option value="gemini" className="bg-card text-white">Google Gemini (Consigliato)</option>
                    <option value="anthropic" className="bg-card text-white">Anthropic (Claude)</option>
                    <option value="deepseek" className="bg-card text-white">DeepSeek</option>
                    <option value="openai" className="bg-card text-white">OpenAI</option>
                    <option value="ollama" className="bg-card text-white">Ollama (Locale)</option>
                  </select>
                </div>

                {provider !== 'ollama' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-mono font-semibold text-lavender uppercase tracking-wider">
                        Chiave API {providerInfo[provider].name}
                      </label>
                      <a
                        href={providerInfo[provider].link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue hover:underline flex items-center gap-1 font-mono"
                      >
                        Ottieni chiave API <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex gap-3">
                      <input
                        type="password"
                        placeholder={providerInfo[provider].placeholder}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="flex-1 bg-black/30 border border-white/20 text-white rounded-2xl px-5 py-3.5 font-mono text-xs focus:outline-none focus:border-lavender"
                      />
                      <button
                        onClick={handleTestAiKey}
                        disabled={aiTesting || !apiKey.trim()}
                        className="action-pill bg-lavender hover:bg-sidebar text-white disabled:opacity-50"
                      >
                        {aiTesting ? 'Verifica...' : 'Test Chiave'}
                      </button>
                    </div>
                  </div>
                )}

                {provider === 'ollama' && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-mono text-white/70">Endpoint: http://localhost:11434</span>
                    <button
                      onClick={handleTestAiKey}
                      disabled={aiTesting}
                      className="action-pill bg-lavender hover:bg-sidebar text-white"
                    >
                      {aiTesting ? 'Verifica...' : 'Test Ollama'}
                    </button>
                  </div>
                )}

                {aiStatus && (
                  <div className={`p-3.5 rounded-2xl border text-xs font-mono font-semibold ${
                    aiStatus.success ? 'bg-sage/20 border-sage text-sage' : 'bg-canvas border-terracotta/50 text-terracotta'
                  }`}>
                    {aiStatus.message || aiStatus.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: INTEGRAZIONI OPZIONALI (GITHUB, SPOTIFY, PINTEREST) */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="p-5 rounded-2xl bg-sage/10 border border-sage/30 flex items-start gap-4">
                <div className="p-3 bg-sage/20 rounded-xl">
                  <AestheticGlobeIcon className="w-8 h-8 text-sage" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-sage">
                    Integrazioni Opzionali
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed font-body mt-1">
                    Arricchisci la tua esperienza collegando i tuoi account dev o media preferiti. Potrai gestirli anche in seguito dalle Impostazioni.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* GitHub Token */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono font-semibold text-sage uppercase tracking-wider flex items-center gap-2">
                      <GithubIcon className="w-4 h-4 text-white" />
                      <span>GitHub Access Token</span>
                    </label>
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue hover:underline flex items-center gap-1 font-mono"
                    >
                      Genera Token <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="password"
                      placeholder="Incolla token ghp_..."
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="flex-1 bg-black/30 border border-white/20 text-white rounded-2xl px-5 py-3.5 font-mono text-xs focus:outline-none focus:border-sage"
                    />
                    <button
                      onClick={handleValidateGitHub}
                      disabled={ghValidating || !githubToken.trim()}
                      className="action-pill bg-sage hover:bg-sidebar text-white disabled:opacity-50"
                    >
                      {ghValidating ? 'Verifica...' : 'Valida Token'}
                    </button>
                  </div>

                  {ghUser && (
                    <div className="p-3 rounded-xl bg-sage/20 border border-sage/40 flex items-center gap-3">
                      <img src={ghUser.avatar_url} alt={ghUser.login} className="w-7 h-7 rounded-full" />
                      <div className="font-mono text-xs text-white">
                        <span className="font-bold">{ghUser.name || ghUser.login}</span>
                        <span className="text-white/60 ml-2">@{ghUser.login} (Connesso)</span>
                      </div>
                    </div>
                  )}

                  {ghError && (
                    <div className="p-3 rounded-xl bg-canvas border border-terracotta/50 text-terracotta text-xs font-mono">
                      {ghError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-6 bg-canvas border-t border-white/10 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-all"
            >
              Indietro
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && googleStatus.status !== 'connected'}
              className="action-pill bg-lavender hover:bg-sidebar text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Continua</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="action-pill bg-sage hover:bg-sidebar text-white font-bold"
            >
              <span>Completa Setup ed Entra nell'Hub</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

