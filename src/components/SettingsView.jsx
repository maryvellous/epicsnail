import React, { useState, useEffect } from 'react';
import { useGamification } from '../context/GamificationContext';
import { useSections } from '../context/SectionsContext';
import { useScanPaths } from '../hooks/useScanPaths';
import { useAIConfig } from '../hooks/useAIConfig';
import { useOAuthIntegrations } from '../hooks/useOAuthIntegrations';
import GoogleMasterCard from './settings/GoogleMasterCard';
import GamificationCard from './settings/GamificationCard';
import AIConfigCard from './settings/AIConfigCard';
import ConnectionsHubCard from './settings/ConnectionsHubCard';
import ScanPathsCard from './settings/ScanPathsCard';

import { 
  AestheticCogIcon,
  AestheticIdCardIcon,
  AestheticChartPieIcon,
  AestheticKeyIcon,
  AestheticGlobeIcon,
  AestheticImacIcon
} from './AestheticIcons';
import { GoogleIcon } from './BrandIcons';
import { LayoutGrid, Layers } from 'lucide-react';

export default function SettingsView() {
  const { 
    userName, 
    completeOnboarding, 
    xpRules, 
    updateXpRules, 
    resetXpRulesToDefault, 
    difficulty, 
    updateDifficulty
  } = useGamification();

  const { enabledSections, updateSection } = useSections();
  const { scanPaths, newPath, setNewPath, handleAddPath, handleRemovePath } = useScanPaths();
  const { 
    aiProvider, 
    aiKey, 
    setAiKey, 
    aiStatus, 
    testingAi, 
    handleProviderChange, 
    handleSaveAiKey 
  } = useAIConfig(); 
  const { 
    githubToken, setGithubToken, githubUser, validatingGh, handleSaveGitHubToken,
    googleClientId, setGoogleClientId, googleClientSecret, setGoogleClientSecret, googleStatus, connectingGoogle, handleStartGoogleOAuth, handleDisconnectGoogle, handleSaveGoogleCredentials,
    spotifyStatus, connectingSpotify, handleStartSpotifyOAuth, handleDisconnectSpotify,
    pinterestStatus, connectingPinterest, handleStartPinterestOAuth, handleDisconnectPinterest
  } = useOAuthIntegrations();
  const [githubExpanded, setGithubExpanded] = useState(false);

  // Active category tab state with localStorage persistence
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('viboard_settings_active_tab') || 'google';
  });

  // View mode state: 'single' (one card panel visible) vs 'all' (expanded vertical grid)
  const [viewMode, setViewMode] = useState('single');

  useEffect(() => {
    localStorage.setItem('viboard_settings_active_tab', activeTab);
  }, [activeTab]);

  const navCategories = [
    {
      id: 'google',
      label: 'Google Master',
      sublabel: 'Workspace & Calendar',
      icon: AestheticIdCardIcon,
      badgeText: googleStatus.status === 'connected' ? 'Connesso' : 'Disconnesso',
      badgeClass: googleStatus.status === 'connected' ? 'bg-sage/30 text-sage border-sage/50' : 'bg-black/30 text-sand/60 border-white/10',
    },
    {
      id: 'gamification',
      label: 'Gamification XP',
      sublabel: 'Regole & Difficoltà',
      icon: AestheticChartPieIcon,
      badgeText: `Difficoltà: ${difficulty}`,
      badgeClass: 'bg-plum/50 text-[#efdebd] border-[#efdebd]/30',
    },
    {
      id: 'ai',
      label: 'Provider IA',
      sublabel: 'BYOK API Key',
      icon: AestheticKeyIcon,
      badgeText: aiStatus?.success ? 'API Key Valida' : aiProvider.toUpperCase(),
      badgeClass: aiStatus?.success ? 'bg-sage/30 text-sage border-sage/50' : 'bg-blue/30 text-blue border-blue/50',
    },
    {
      id: 'connections',
      label: 'Hub Connessioni',
      sublabel: 'Spotify, Pinterest, GH',
      icon: AestheticGlobeIcon,
      badgeText: `${(spotifyStatus.status === 'connected' ? 1 : 0) + (pinterestStatus.status === 'connected' ? 1 : 0) + (githubUser ? 1 : 0)} Attive`,
      badgeClass: 'bg-lavender/30 text-lavender border-lavender/50',
    },
    {
      id: 'paths',
      label: 'Percorsi Scansione',
      sublabel: 'Cartelle Progetti Locali',
      icon: AestheticImacIcon,
      badgeText: `${scanPaths.length} Cartelle`,
      badgeClass: 'bg-terracotta/30 text-[#efdebd] border-[#efdebd]/30',
    },
  ];

  return (
    <div className="projects-canvas-container select-none overflow-y-auto">
      {/* HEADER SECTION WITH VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-heading font-black text-3xl text-white flex items-center gap-3.5">
            <AestheticCogIcon className="w-10 h-10 shrink-0 filter drop-shadow-md" />
            Impostazioni & Connessioni
          </h1>
          <p className="text-xs text-blue mt-1 font-sans">
            Gestisci profilo, provider IA, integrazioni app e percorsi di scansione locale
          </p>
        </div>

        {/* SINGLE VS EXPANDED ALL VIEW TOGGLE */}
        <div className="flex items-center p-1 bg-card rounded-2xl border border-white/10 shadow-md shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('single')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'single'
                ? 'bg-lavender text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
            title="Mostra la scheda selezionata"
          >
            <Layers className="w-4 h-4" />
            <span>Scheda Singola</span>
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'bg-lavender text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
            title="Mostra tutte le impostazioni espanse"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Vista Espansa (Tutte)</span>
          </button>
        </div>
      </div>

      {/* STRISCIA TOP DI 5 CARD NAVIGAZIONE (STYLE CALENDARIO 10 GIORNI) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold text-sand uppercase tracking-wider">
            Seleziona Categoria Impostazioni
          </span>
          <span className="text-[11px] font-mono text-blue">
            {viewMode === 'single' ? 'Clicca su una card per visualizzare i relativi controlli' : 'Tutte le schede sono espanse'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {navCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeTab === cat.id && viewMode === 'single';

            return (
              <div
                key={cat.id}
                onClick={() => {
                  setActiveTab(cat.id);
                  setViewMode('single');
                }}
                className={`transition-all duration-300 rounded-2xl p-3.5 cursor-pointer flex flex-col justify-between border h-28 ${
                  isSelected
                    ? 'bg-plum border-sand shadow-xl scale-[1.02]'
                    : 'bg-card border-white/10 hover:border-lavender/50 hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-6 h-6 text-sand shrink-0" />
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${cat.badgeClass}`}>
                    {cat.badgeText}
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-xs text-white truncate">{cat.label}</h3>
                  <p className="text-[10px] font-mono text-blue mt-0.5 truncate">{cat.sublabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTAINER PANNELLO DETTAGLIO MODULARE */}
      <div className="pb-16">
        {viewMode === 'single' ? (
          /* SINGLE TAB VIEW WITH SLIDE ANIMATION */
          <div key={activeTab} className="animate-fadeIn transition-all duration-300">
            {activeTab === 'google' && (
              <GoogleMasterCard
                googleStatus={googleStatus}
                userName={userName}
                connectingGoogle={connectingGoogle}
                handleStartGoogleOAuth={handleStartGoogleOAuth}
                handleDisconnectGoogle={handleDisconnectGoogle}
              />
            )}

            {activeTab === 'gamification' && (
              <GamificationCard
                xpRules={xpRules}
                updateXpRules={updateXpRules}
                resetXpRulesToDefault={resetXpRulesToDefault}
                difficulty={difficulty}
                updateDifficulty={updateDifficulty}
              />
            )}

            {activeTab === 'ai' && (
              <AIConfigCard
                aiProvider={aiProvider}
                aiKey={aiKey}
                setAiKey={setAiKey}
                aiStatus={aiStatus}
                testingAi={testingAi}
                handleProviderChange={handleProviderChange}
                handleSaveAiKey={handleSaveAiKey}
              />
            )}

            {activeTab === 'connections' && (
              <ConnectionsHubCard
                spotifyStatus={spotifyStatus}
                connectingSpotify={connectingSpotify}
                handleStartSpotifyOAuth={handleStartSpotifyOAuth}
                handleDisconnectSpotify={handleDisconnectSpotify}
                pinterestStatus={pinterestStatus}
                connectingPinterest={connectingPinterest}
                handleStartPinterestOAuth={handleStartPinterestOAuth}
                handleDisconnectPinterest={handleDisconnectPinterest}
                githubToken={githubToken}
                setGithubToken={setGithubToken}
                githubUser={githubUser}
                validatingGh={validatingGh}
                handleSaveGitHubToken={handleSaveGitHubToken}
                githubExpanded={githubExpanded}
                setGithubExpanded={setGithubExpanded}
                enabledSections={enabledSections}
                updateSection={updateSection}
              />
            )}

            {activeTab === 'paths' && (
              <ScanPathsCard
                scanPaths={scanPaths}
                newPath={newPath}
                setNewPath={setNewPath}
                handleAddPath={handleAddPath}
                handleRemovePath={handleRemovePath}
              />
            )}
          </div>
        ) : (
          /* EXPANDED VIEW: ALL CARDS IN BALANCED 2-COLUMN GRID */
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-8">
              <GoogleMasterCard
                googleStatus={googleStatus}
                userName={userName}
                connectingGoogle={connectingGoogle}
                handleStartGoogleOAuth={handleStartGoogleOAuth}
                handleDisconnectGoogle={handleDisconnectGoogle}
              />
              <GamificationCard
                xpRules={xpRules}
                updateXpRules={updateXpRules}
                resetXpRulesToDefault={resetXpRulesToDefault}
                difficulty={difficulty}
                updateDifficulty={updateDifficulty}
              />
              <AIConfigCard
                aiProvider={aiProvider}
                aiKey={aiKey}
                setAiKey={setAiKey}
                aiStatus={aiStatus}
                testingAi={testingAi}
                handleProviderChange={handleProviderChange}
                handleSaveAiKey={handleSaveAiKey}
              />
            </div>
            <div className="flex flex-col gap-8">
              <ConnectionsHubCard
                spotifyStatus={spotifyStatus}
                connectingSpotify={connectingSpotify}
                handleStartSpotifyOAuth={handleStartSpotifyOAuth}
                handleDisconnectSpotify={handleDisconnectSpotify}
                pinterestStatus={pinterestStatus}
                connectingPinterest={connectingPinterest}
                handleStartPinterestOAuth={handleStartPinterestOAuth}
                handleDisconnectPinterest={handleDisconnectPinterest}
                githubToken={githubToken}
                setGithubToken={setGithubToken}
                githubUser={githubUser}
                validatingGh={validatingGh}
                handleSaveGitHubToken={handleSaveGitHubToken}
                githubExpanded={githubExpanded}
                setGithubExpanded={setGithubExpanded}
                enabledSections={enabledSections}
                updateSection={updateSection}
              />
              <ScanPathsCard
                scanPaths={scanPaths}
                newPath={newPath}
                setNewPath={setNewPath}
                handleAddPath={handleAddPath}
                handleRemovePath={handleRemovePath}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

