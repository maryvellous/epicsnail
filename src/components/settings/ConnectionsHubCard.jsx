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
  );
}

export default ConnectionsHubCard;
