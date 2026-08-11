import React from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import { SpotifyIcon, PinterestIcon, GithubIcon } from '../BrandIcons';
import { AestheticGlobeIcon } from '../AestheticIcons';

export function ConnectionsHubCard({
  spotifyStatus,
  connectingSpotify,
  handleStartSpotifyOAuth,
  handleDisconnectSpotify,
  pinterestStatus,
  connectingPinterest,
  handleStartPinterestOAuth,
  handleDisconnectPinterest,
  githubToken,
  setGithubToken,
  githubUser,
  validatingGh,
  handleSaveGitHubToken,
  githubExpanded,
  setGithubExpanded,
  enabledSections,
  updateSection,
}) {
  return (
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. SPOTIFY CARD */}
        <div className="bg-canvas rounded-2xl border border-sage/40 overflow-hidden transition-all shadow-md flex flex-col justify-between p-5 gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-canvas border border-sage/40 flex items-center justify-center shrink-0 shadow-md">
                <SpotifyIcon className="w-5 h-5 text-sage" />
              </div>
              <label className="hub-toggle" title="Mostra/Nascondi Spotify nella sidebar">
                <input
                  type="checkbox"
                  checked={!!enabledSections.spotify}
                  onChange={(e) => updateSection('spotify', e.target.checked)}
                />
                <span className="hub-toggle-slider"></span>
              </label>
            </div>

            <div>
              <p className="text-sm font-bold text-white">Spotify Player</p>
              <p className="text-[11px] font-mono text-white/60 truncate">
                {spotifyStatus.status === 'connected' ? spotifyStatus.userName || 'Account Spotify Attivo' : 'Controllo musica in-app'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full border self-start ${
              spotifyStatus.status === 'connected'
                ? 'bg-sage/25 text-sage border-sage/50'
                : spotifyStatus.status === 'expired'
                ? 'bg-amber-950/40 text-sand border-amber-400/40'
                : 'bg-terracotta/25 text-plum-muted border-terracotta/40'
            }`}>
              {spotifyStatus.status === 'connected' ? '● Connesso' : spotifyStatus.status === 'expired' ? '⚠ Scaduto' : '○ Disconnesso'}
            </span>

            {spotifyStatus.status === 'connected' ? (
              <button
                onClick={handleDisconnectSpotify}
                className="action-pill bg-canvas hover:bg-card border border-terracotta/40 text-terracotta text-xs py-1.5 px-3 justify-center w-full"
              >
                Disconnetti
              </button>
            ) : (
              <button
                onClick={handleStartSpotifyOAuth}
                disabled={connectingSpotify}
                className="action-pill bg-sage hover:bg-sage/80 text-canvas font-black w-full justify-center shadow-md text-xs py-2"
              >
                <Zap className="w-3.5 h-3.5 fill-canvas" />
                <span>{connectingSpotify ? 'Attendi Browser...' : 'Connetti 1-Click'}</span>
              </button>
            )}
          </div>
        </div>


        {/* 2. PINTEREST MOODBOARD CARD */}
        <div className="bg-canvas rounded-2xl border border-plum/40 overflow-hidden transition-all shadow-md flex flex-col justify-between p-5 gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-canvas border border-plum/40 flex items-center justify-center shrink-0 shadow-md">
                <PinterestIcon className="w-5 h-5 text-plum" />
              </div>
              <label className="hub-toggle" title="Mostra/Nascondi Moodboard nella sidebar">
                <input
                  type="checkbox"
                  checked={!!enabledSections.pinterest}
                  onChange={(e) => updateSection('pinterest', e.target.checked)}
                />
                <span className="hub-toggle-slider"></span>
              </label>
            </div>

            <div>
              <p className="text-sm font-bold text-white">Pinterest Moodboard</p>
              <p className="text-[11px] font-mono text-white/60 truncate">
                {pinterestStatus.status === 'connected' ? pinterestStatus.userName || 'Account Pinterest Attivo' : 'Bacheche visive d\'ispirazione'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full border self-start ${
              pinterestStatus.status === 'connected'
                ? 'bg-sage/25 text-sage border-sage/50'
                : pinterestStatus.status === 'expired'
                ? 'bg-amber-950/40 text-sand border-amber-400/40'
                : 'bg-terracotta/25 text-plum-muted border-terracotta/40'
            }`}>
              {pinterestStatus.status === 'connected' ? '● Connesso' : pinterestStatus.status === 'expired' ? '⚠ Scaduto' : '○ Disconnesso'}
            </span>

            {pinterestStatus.status === 'connected' ? (
              <button
                onClick={handleDisconnectPinterest}
                className="action-pill bg-canvas hover:bg-card border border-terracotta/40 text-terracotta text-xs py-1.5 px-3 justify-center w-full"
              >
                Disconnetti
              </button>
            ) : (
              <button
                onClick={handleStartPinterestOAuth}
                disabled={connectingPinterest}
                className="action-pill bg-plum hover:bg-plum/80 text-white font-black w-full justify-center shadow-md text-xs py-2"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>{connectingPinterest ? 'Attendi Browser...' : 'Connetti 1-Click'}</span>
              </button>
            )}
          </div>
        </div>


        {/* 3. GITHUB ACCESS TOKEN CARD */}
        <div className="bg-canvas rounded-2xl border border-white/30 overflow-hidden transition-all shadow-md flex flex-col justify-between p-5 gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-canvas border border-white/30 flex items-center justify-center shrink-0 shadow-md">
                <GithubIcon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full border ${
                githubUser
                  ? 'bg-sage/25 text-sage border-sage/50'
                  : 'bg-terracotta/25 text-plum-muted border-terracotta/40'
              }`}>
                {githubUser ? '● Connesso' : '○ Disconnesso'}
              </span>
            </div>

            <div>
              <p className="text-sm font-bold text-white">GitHub Access Token</p>
              <p className="text-[11px] font-mono text-white/60 truncate">
                {githubUser ? `@${githubUser.login}` : 'Integrazione Repository & Issues'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Token ghp_..."
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="flex-1 bg-card border border-white/20 text-white font-mono text-[11px] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-white"
              />
              <button
                onClick={handleSaveGitHubToken}
                disabled={validatingGh}
                className="action-pill bg-sidebar hover:bg-plum text-white font-black text-xs py-1.5 px-3 disabled:opacity-50 shadow-md"
              >
                {validatingGh ? '...' : 'Salva'}
              </button>
            </div>

            {githubUser && (
              <p className="text-[10px] font-mono text-sage truncate">
                GitHub: @{githubUser.login}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ConnectionsHubCard;
