import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundFX } from '../utils/audio';

const GamificationContext = createContext();

export const LEVEL_RANKS = [
  { level: 1, title: 'Viboard Starter', perk: 'Modalità base attiva' },
  { level: 2, title: 'Speedy Coder', perk: 'Badge personalizzati attivati' },
  { level: 3, title: 'Task Explorer', perk: 'Temi colori card personalizzati' },
  { level: 4, title: 'Project Specialist', perk: 'Multi-Provider BYOK Chat AI' },
  { level: 5, title: 'Turbo Architect', perk: 'Contesto avanzato progetti & OAuth' },
  { level: 10, title: 'Legendary Viboard Master', perk: 'Maestro supremo della produttività' }
];

export const DEFAULT_XP_RULES = {
  taskComplete: 25,
  taskCreate: 10,
  calendarEvent: 30,
  aiChat: 15,
  spotifySession: 15,
  dailyStreak: 50,
};

export const DIFFICULTY_MULTIPLIERS = {
  easy: 0.7,
  normal: 1.0,
  hard: 1.5,
};

export const getRankForLevel = (lvl) => {
  if (lvl >= 10) return LEVEL_RANKS[5];
  if (lvl >= 5) return LEVEL_RANKS[4];
  if (lvl >= 4) return LEVEL_RANKS[3];
  if (lvl >= 3) return LEVEL_RANKS[2];
  if (lvl >= 2) return LEVEL_RANKS[1];
  return LEVEL_RANKS[0];
};

export function GamificationProvider({ children }) {
  const [userName, setUserName] = useState('');
  const [firstLaunchCompleted, setFirstLaunchCompleted] = useState(true);
  const [xp, setXp] = useState(150);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(1);
  const [unlockedBadges, setUnlockedBadges] = useState(['b1']);
  const [activeXpPop, setActiveXpPop] = useState(null); // { amount, text, id }
  const [levelUpModalData, setLevelUpModalData] = useState(null); // { oldLevel, newLevel, rank }

  // Configurable XP Rules & Difficulty
  const [xpRules, setXpRules] = useState(DEFAULT_XP_RULES);
  const [difficulty, setDifficulty] = useState('normal');

  // Level formula: XP required for level L = 100 * L^1.5 * difficulty_multiplier
  const diffMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
  const getXpForLevel = (lvl) => Math.floor(100 * Math.pow(lvl, 1.5) * diffMultiplier);

  const currentLevelXpNeeded = getXpForLevel(level);
  const prevLevelXpNeeded = level > 1 ? getXpForLevel(level - 1) : 0;
  const xpInCurrentLevel = xp - prevLevelXpNeeded;
  const xpNeededForNext = Math.max(1, currentLevelXpNeeded - prevLevelXpNeeded);
  const levelProgress = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100));

  const currentRank = getRankForLevel(level);

  // Load from store if electron API available
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getStoreData().then((data) => {
        if (data) {
          if (data.user) {
            setUserName(data.user.name || '');
            setFirstLaunchCompleted(data.user.firstLaunchCompleted ?? false);
            setXp(data.user.xp || 150);
            setLevel(data.user.level || 1);
            setStreak(data.user.streak || 1);
            setUnlockedBadges(data.user.unlockedBadges || ['b1']);
          }
          if (data.xpRules) setXpRules(data.xpRules);
          if (data.difficulty) setDifficulty(data.difficulty);
        }
      });
    }
  }, []);

  // Save changes helper
  const saveUserProgress = (newXp, newLevel, newStreak, newBadges, name = userName, firstLaunch = firstLaunchCompleted) => {
    if (window.electronAPI) {
      window.electronAPI.setStoreData('user', {
        name,
        firstLaunchCompleted: firstLaunch,
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        unlockedBadges: newBadges,
      });
    }
  };

  const updateXpRules = (newRules) => {
    const updated = { ...xpRules, ...newRules };
    setXpRules(updated);
    if (window.electronAPI) {
      window.electronAPI.setStoreData('xpRules', updated);
    }
  };

  const resetXpRulesToDefault = () => {
    setXpRules(DEFAULT_XP_RULES);
    if (window.electronAPI) {
      window.electronAPI.setStoreData('xpRules', DEFAULT_XP_RULES);
    }
  };

  const updateDifficulty = (newDiff) => {
    setDifficulty(newDiff);
    if (window.electronAPI) {
      window.electronAPI.setStoreData('difficulty', newDiff);
    }
  };

  const completeOnboarding = (name) => {
    setUserName(name);
    setFirstLaunchCompleted(true);
    saveUserProgress(xp, level, streak, unlockedBadges, name, true);
  };

  const closeLevelUpModal = () => {
    setLevelUpModalData(null);
  };

  const incrementStreak = () => {
    const newStreak = streak + 1;
    setStreak(newStreak);
    const bonusXp = Math.floor(20 * (newStreak > 3 ? 1.5 : 1.0));
    addXp(bonusXp, `Streak di ${newStreak} giorni di fila! 🔥`);
    saveUserProgress(xp, level, newStreak, unlockedBadges);
  };

  const addXp = (amount, reason = '') => {
    soundFX.playTaskPop();
    const newXp = xp + amount;
    setXp(newXp);

    // Trigger XP Pop notification
    setActiveXpPop({ amount, text: reason, id: Date.now() });

    // Check level up
    let nextLvl = level;
    while (newXp >= getXpForLevel(nextLvl)) {
      nextLvl++;
    }

    if (nextLvl > level) {
      const oldLevel = level;
      setLevel(nextLvl);
      soundFX.playLevelUp();
      
      // Trigger Level-Up Modal
      setLevelUpModalData({
        oldLevel,
        newLevel: nextLvl,
        rank: getRankForLevel(nextLvl),
      });

      // Burst violet/cyan/gold confetti!
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#9a85c0', '#efdebd', '#a8c6de', '#9ca98b', '#785076', '#833d6f'],
      });
    }

    saveUserProgress(newXp, nextLvl, streak, unlockedBadges);
  };

  return (
    <GamificationContext.Provider
      value={{
        userName,
        setUserName,
        firstLaunchCompleted,
        completeOnboarding,
        xp,
        level,
        streak,
        incrementStreak,
        unlockedBadges,
        levelProgress,
        xpInCurrentLevel,
        xpNeededForNext,
        addXp,
        activeXpPop,
        currentRank,
        levelUpModalData,
        closeLevelUpModal,
        xpRules,
        updateXpRules,
        resetXpRulesToDefault,
        difficulty,
        updateDifficulty,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  return useContext(GamificationContext);
}
