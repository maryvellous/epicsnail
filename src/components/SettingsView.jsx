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

import { AestheticCogIcon } from './AestheticIcons';

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

  const [nameInput, setNameInput] = useState(userName || '');

  useEffect(() => {
    setNameInput(userName);
  }, [userName]);

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
          
          {/* Account Google Master Card */}
          <GoogleMasterCard
            googleStatus={googleStatus}
            userName={userName}
            connectingGoogle={connectingGoogle}
            handleStartGoogleOAuth={handleStartGoogleOAuth}
            handleDisconnectGoogle={handleDisconnectGoogle}
          />

          {/* Gamification & XP Rules Card */}
          <GamificationCard
            xpRules={xpRules}
            updateXpRules={updateXpRules}
            resetXpRulesToDefault={resetXpRulesToDefault}
            difficulty={difficulty}
            updateDifficulty={updateDifficulty}
          />

          {/* Multi-Provider AI BYOK Card */}
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

        {/* RIGHT COLUMN: Unified Hub Connessioni & Scan Paths */}
        <div className="flex flex-col gap-8">

          {/* Hub Connessioni */}
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

          {/* Local Disk Scan Paths Card */}
          <ScanPathsCard
            scanPaths={scanPaths}
            newPath={newPath}
            setNewPath={setNewPath}
            handleAddPath={handleAddPath}
            handleRemovePath={handleRemovePath}
          />

        </div>

      </div>
    </div>
  );
}
