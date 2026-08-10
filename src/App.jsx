import React, { useState, useEffect } from 'react';
import { GamificationProvider } from './context/GamificationContext';
import { ProjectsProvider } from './context/ProjectsContext';
import { SectionsProvider, useSections } from './context/SectionsContext';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TodayView from './components/TodayView';
import ProjectsView from './components/ProjectsView';
import GoogleCalendarWidget from './components/GoogleCalendarWidget';
import SettingsView from './components/SettingsView';
import ProjectDetailModal from './components/ProjectDetailModal';
import QuickSearchModal from './components/QuickSearchModal';
import XpPopNotification from './components/XpPopNotification';

import OnboardingWizard from './components/OnboardingWizard';
import { useGamification } from './context/GamificationContext';

import SpotifyWidget from './components/SpotifyWidget';
import PinterestView from './components/PinterestView';
import ChatPanel from './components/ChatPanel';
import LevelUpModal from './components/LevelUpModal';
import CodeQuestView from './components/CodeQuestView';

function MainContent({ currentTab, setCurrentTab, onOpenSearch }) {
  const { enabledSections } = useSections();

  if (currentTab === 'chat') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatPanel />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-sidebar via-card to-canvas">
      <Header onOpenSearch={onOpenSearch} />
      <div className="flex-1 flex overflow-hidden">
        {currentTab === 'today'     && <TodayView />}
        {currentTab === 'projects'  && <ProjectsView onNavigateTab={setCurrentTab} />}
        {currentTab === 'calendar'  && <GoogleCalendarWidget />}
        {currentTab === 'spotify'   && enabledSections.spotify   && <SpotifyWidget />}
        {currentTab === 'pinterest' && enabledSections.pinterest && (
          <PinterestView onNavigateTab={setCurrentTab} />
        )}
        {currentTab === 'codequest' && <CodeQuestView />}
        {currentTab === 'settings'  && <SettingsView />}
      </div>
    </div>
  );
}

function AppInner() {
  const { firstLaunchCompleted } = useGamification();
  const { enabledSections } = useSections();
  const [currentTab, setCurrentTab] = useState('projects');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dynamic available tabs based on enabled sections
  const activeTabs = [
    'today',
    'projects',
    'calendar',
    ...(enabledSections.spotify   ? ['spotify']   : []),
    ...(enabledSections.pinterest ? ['pinterest'] : []),
    'codequest',
    'chat',
    'settings',
  ];

  // Auto-redirect to 'today' if active tab is disabled
  useEffect(() => {
    if (!activeTabs.includes(currentTab)) {
      setCurrentTab('today');
    }
  }, [enabledSections, currentTab]);

  // Keyboard navigation & global shortcuts (Cmd/Ctrl + K, Esc, Tab)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }

      const activeEl = document.activeElement;
      const tag = activeEl?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || activeEl?.isContentEditable) {
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setCurrentTab((prev) => {
          const currentIndex = activeTabs.indexOf(prev);
          const validIndex = currentIndex >= 0 ? currentIndex : 0;
          if (e.shiftKey) {
            const nextIndex = (validIndex - 1 + activeTabs.length) % activeTabs.length;
            return activeTabs[nextIndex];
          } else {
            const nextIndex = (validIndex + 1) % activeTabs.length;
            return activeTabs[nextIndex];
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabs]);

  return (
    <div className="flex h-screen w-screen overflow-hidden select-none">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <MainContent
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
      <ProjectDetailModal />
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <XpPopNotification />
      <LevelUpModal />
      {!firstLaunchCompleted && <OnboardingWizard />}
    </div>
  );
}

export default function App() {
  return (
    <GamificationProvider>
      <ProjectsProvider>
        <SectionsProvider>
          <AppInner />
        </SectionsProvider>
      </ProjectsProvider>
    </GamificationProvider>
  );
}
