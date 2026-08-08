// ─────────────────────────────────────────────────────────
//  CodeQuestView — Ultra-Colorful Multi-Mode Puzzle Game UI
//  Aesthetic fidget coding playground for downtime.
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGamification } from '../context/GamificationContext';
import { soundFX } from '../utils/audio';
import { runCodeSafely } from '../utils/safeRunner';
import {
  getRandomPuzzle,
  getBlockAccent,
  ACCENT_COLORS,
  LANGUAGE_COLORS,
  LANGUAGE_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  MODE_METADATA,
  ALL_PUZZLE_TEMPLATES,
} from '../data/codePuzzles';

// ── Inject CSS keyframes and cute animations ────────────────
const QUEST_CSS = `
  @keyframes cq-slideIn {
    from { opacity: 0; transform: translateX(-18px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes cq-bounce {
    0%   { transform: translateY(0) scale(1); }
    30%  { transform: translateY(-10px) scale(1.04); }
    55%  { transform: translateY(-4px) scale(1.01); }
    75%  { transform: translateY(-7px) scale(1.02); }
    100% { transform: translateY(0) scale(1); }
  }
  @keyframes cq-shake {
    0%,100% { transform: translateX(0); }
    18%     { transform: translateX(-8px) rotate(-1.5deg); }
    36%     { transform: translateX(8px)  rotate(1.5deg); }
    54%     { transform: translateX(-6px); }
    72%     { transform: translateX(6px); }
    90%     { transform: translateX(-2px); }
  }
  @keyframes cq-zapBug {
    0%   { transform: scale(1) rotate(0deg); filter: brightness(1); }
    50%  { transform: scale(1.12) rotate(3deg); filter: brightness(1.6) drop-shadow(0 0 16px #8F5A5A); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes cq-result {
    from { opacity: 0; transform: translateY(16px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes cq-sparkle {
    0%,100% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
    50%     { opacity: 1;   transform: scale(1.1) rotate(180deg); }
  }
  @keyframes cq-dropLine {
    0%,100% { opacity: 0.6; box-shadow: 0 0 6px 2px rgba(157,133,198,0.5); }
    50%     { opacity: 1;   box-shadow: 0 0 16px 6px rgba(157,133,198,0.8); }
  }
  @keyframes cq-cardFade {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes cq-pulseGlow {
    0%,100% { opacity: 0.4; transform: scale(1); }
    50%     { opacity: 0.8; transform: scale(1.08); }
  }
  @keyframes cq-xpPop {
    0%   { opacity: 0; transform: translateY(0) scale(0.7); }
    25%  { opacity: 1; transform: translateY(-6px) scale(1.15); }
    100% { opacity: 0; transform: translateY(-32px) scale(0.9); }
  }
`;

function injectStyles() {
  if (!document.getElementById('cq-styles')) {
    const el = document.createElement('style');
    el.id = 'cq-styles';
    el.textContent = QUEST_CSS;
    document.head.appendChild(el);
  }
}

// ── Floating colorful background spheres ─────────────────────
const BG_ORBS = [
  { top: '10%', left: '5%',  color: 'rgba(157, 133, 198, 0.18)', size: 140 },
  { top: '65%', left: '80%', color: 'rgba(232, 209, 158, 0.16)', size: 160 },
  { top: '80%', left: '15%', color: 'rgba(165, 196, 220, 0.15)', size: 130 },
  { top: '20%', left: '85%', color: 'rgba(122, 63, 103, 0.22)',  size: 150 },
];

function DragHandle() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, opacity: 0.4 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#fff' }} />
      ))}
    </div>
  );
}

export default function CodeQuestView() {
  const { addXp } = useGamification();

  // Mode filter tab
  const [selectedMode, setSelectedMode] = useState('all'); // 'all' | 'sort' | 'fill' | 'bug' | 'match'

  // Current Puzzle state
  const [gameState, setGameState] = useState(() => {
    const p = getRandomPuzzle('all');
    return { puzzle: p, userState: initPuzzleState(p) };
  });

  const { puzzle, userState } = gameState;

  // Interactivity / Feedback state
  const [submitted, setSubmitted]         = useState(false);
  const [isCorrect, setIsCorrect]         = useState(false);
  const [animPhase, setAnimPhase]         = useState('idle');
  const [puzzleKey, setPuzzleKey]         = useState(0);
  const [revealedHints, setRevealedHints] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Session stats (in-memory fidget progress)
  const [sessionXP,     setSessionXP]     = useState(0);
  const [sessionSolved, setSessionSolved] = useState(0);
  const [streak,        setStreak]        = useState(0);
  const [showXpPop,     setShowXpPop]     = useState(false);

  // Drag state for SORT mode
  const [dragIdx,  setDragIdx]  = useState(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => { injectStyles(); }, []);

  // Helper to init mode-specific user state
  function initPuzzleState(p) {
    if (p.mode === 'sort') return { blocks: [...p.blocks] };
    if (p.mode === 'fill') return { selectedToken: null };
    if (p.mode === 'bug')  return { selectedLineId: null };
    if (p.mode === 'match') {
      return {
        shuffledRights: shuffle([...p.pairs.map((pair, idx) => ({ id: idx, text: pair.right }))]),
        matches: {}, // { leftIdx: rightObjId }
        activeLeft: null,
      };
    }
    return {};
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── Change Game Mode Filter ────────────────────────────────
  const handleModeSelect = (modeKey) => {
    soundFX.playTaskPop();
    setSelectedMode(modeKey);
    loadNextPuzzle(modeKey);
  };

  // ── Load Next Puzzle ───────────────────────────────────────
  const loadNextPuzzle = (overrideMode = selectedMode) => {
    setTransitioning(true);
    setTimeout(() => {
      const p = getRandomPuzzle(overrideMode);
      setGameState({ puzzle: p, userState: initPuzzleState(p) });
      setSubmitted(false);
      setIsCorrect(false);
      setAnimPhase('idle');
      setRevealedHints(0);
      setDragIdx(null);
      setDragOver(null);
      setPuzzleKey((k) => k + 1);
      setTransitioning(false);
    }, 250);
  };

  const [sandboxResult, setSandboxResult] = useState(null);

  // ── Submit Verification ────────────────────────────────────
  const handleSubmit = async () => {
    if (submitted || animPhase !== 'idle') return;

    let correct = false;

    if (puzzle.mode === 'sort') {
      const currentOrder = userState.blocks.map((b) => b.id).join(',');
      correct = currentOrder === puzzle.solution.join(',');

      // Run code safely in Web Worker sandbox
      const fullCode = userState.blocks.map((b) => b.code).join('\n');
      const sandboxRes = await runCodeSafely(fullCode, 1500);
      setSandboxResult(sandboxRes);
    } else if (puzzle.mode === 'fill') {
      correct = userState.selectedToken === puzzle.correctToken;
    } else if (puzzle.mode === 'bug') {
      const targetLine = puzzle.lines.find((l) => l.id === userState.selectedLineId);
      correct = targetLine && targetLine.isBug;
    } else if (puzzle.mode === 'match') {
      const allMatched = puzzle.pairs.every((pair, idx) => {
        const rightId = userState.matches[idx];
        return rightId !== undefined && userState.shuffledRights.find((r) => r.id === rightId)?.text === pair.right;
      });
      correct = allMatched;
    }

    setSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      soundFX.playGitPushChime();
      setAnimPhase('correct');
      addXp(puzzle.xpReward, `CodeQuest: ${puzzle.title}`);
      setSessionXP((v) => v + puzzle.xpReward);
      setSessionSolved((v) => v + 1);
      setStreak((s) => s + 1);
      setShowXpPop(true);
      setTimeout(() => setShowXpPop(false), 2000);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#9D85C6', '#E8D19E', '#A5C4DC', '#98A78A', '#BC957D', '#7A3F67'],
        scalar: 0.8,
      });

      setTimeout(() => setAnimPhase('idle'), 900);
    } else {
      soundFX.playTaskPop();
      setAnimPhase('wrong');
      setStreak(0);
      setTimeout(() => setAnimPhase('idle'), 700);
    }
  };

  // ── Drag & Drop Handlers (Sort Mode) ──────────────────────
  const handleDragStart = (e, idx) => {
    soundFX.playTaskPop();
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (idx !== dragIdx) setDragOver(idx);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragOver(null);
      return;
    }
    soundFX.playTaskPop();
    const newBlocks = [...userState.blocks];
    const [removed] = newBlocks.splice(dragIdx, 1);
    newBlocks.splice(targetIdx, 0, removed);
    setGameState((prev) => ({ ...prev, userState: { ...prev.userState, blocks: newBlocks } }));
    setDragIdx(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOver(null);
  };

  // ── Derived visual styles ──────────────────────────────────
  const modeMeta = MODE_METADATA[puzzle.mode] || MODE_METADATA.sort;
  const langColor = LANGUAGE_COLORS[puzzle.language];
  const diffColor = DIFFICULTY_COLORS[puzzle.difficulty];

  return (
    <div className="projects-canvas-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', position: 'relative' }}>
      
      {/* Background bioluminescent spheres */}
      {BG_ORBS.map((orb, i) => (
        <div key={i} style={{
          position: 'absolute', top: orb.top, left: orb.left,
          width: orb.size, height: orb.size, borderRadius: '50%',
          background: orb.color, filter: 'blur(45px)', pointerEvents: 'none',
          animation: `cq-pulseGlow ${4 + i}s ease-in-out infinite`,
        }} />
      ))}

      {/* ── Top Header & Mode Tabs ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16, zIndex: 5 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 900, color: '#E8D19E', letterSpacing: '-0.5px', margin: 0 }}>
              CodeQuest
            </h1>
            <span className="badge-pill" style={{ background: '#7A3F67', color: '#fff' }}>
              Fidget Arcade
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            Il tuo parco giochi di coding per rilassarti mentre aspetti l'IA
          </p>
        </div>

        {/* Stats Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {streak >= 2 && (
            <div style={{ background: 'rgba(232,209,158,0.15)', border: '1px solid #E8D19E', borderRadius: 9999, padding: '4px 12px', fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 800, color: '#E8D19E' }}>
              STREAK x{streak}
            </div>
          )}
          <div style={{ background: 'rgba(157,133,198,0.15)', border: '1px solid #9D85C6', borderRadius: 9999, padding: '4px 12px', fontFamily: 'var(--font-code)', fontSize: 11, fontWeight: 700, color: '#9D85C6' }}>
            +{sessionXP} XP
          </div>
          <div style={{ background: 'rgba(152,167,138,0.15)', border: '1px solid #98A78A', borderRadius: 9999, padding: '4px 12px', fontFamily: 'var(--font-code)', fontSize: 11, fontWeight: 700, color: '#98A78A' }}>
            {sessionSolved} Risolti
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap', zIndex: 5 }}>
        <button
          onClick={() => handleModeSelect('all')}
          className="action-pill"
          style={{
            background: selectedMode === 'all' ? 'linear-gradient(135deg, #7A3F67, #9D85C6)' : 'rgba(255,255,255,0.06)',
            color: selectedMode === 'all' ? '#fff' : 'rgba(255,255,255,0.6)',
            border: selectedMode === 'all' ? 'none' : '1px solid rgba(255,255,255,0.12)',
            padding: '7px 16px', fontSize: 12,
          }}
        >
          Tutte le Modalità
        </button>

        {Object.entries(MODE_METADATA).map(([key, meta]) => {
          const isActive = selectedMode === key;
          return (
            <button
              key={key}
              onClick={() => handleModeSelect(key)}
              className="action-pill"
              style={{
                background: isActive ? meta.color : 'rgba(255,255,255,0.06)',
                color: isActive ? '#1e1333' : 'rgba(255,255,255,0.7)',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.12)',
                padding: '7px 16px', fontSize: 12, fontWeight: 800,
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* ── Main Interactive Puzzle Card ──────────────────────────────────── */}
      <div style={{
        maxWidth: 720, width: '100%', margin: '0 auto', position: 'relative', zIndex: 10,
        opacity: transitioning ? 0 : 1, transform: transitioning ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        animation: !transitioning ? 'cq-cardFade 0.3s ease both' : 'none',
      }}>
        {/* Floating XP Notification */}
        {showXpPop && (
          <div style={{
            position: 'absolute', top: -32, right: 24, fontFamily: 'var(--font-heading)',
            fontSize: 16, fontWeight: 900, color: '#E8D19E', animation: 'cq-xpPop 1.8s ease forwards',
            pointerEvents: 'none', zIndex: 20, textShadow: '0 2px 14px rgba(232,209,158,0.7)',
          }}>
            +{puzzle.xpReward} XP!
          </div>
        )}

        <div className="dashboard-card" style={{ background: '#2b1c47', border: `1.5px solid ${modeMeta.color}40`, position: 'relative', overflow: 'hidden' }}>
          
          {/* Header Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            <span className="badge-pill" style={{ background: `${modeMeta.color}25`, color: modeMeta.color, border: `1px solid ${modeMeta.color}60` }}>
              {modeMeta.label}
            </span>
            <span className="badge-pill" style={{ background: `${langColor}20`, color: langColor, border: `1px solid ${langColor}45` }}>
              {LANGUAGE_LABELS[puzzle.language]}
            </span>
            <span className="badge-pill" style={{ background: `${diffColor}20`, color: diffColor, border: `1px solid ${diffColor}45` }}>
              {DIFFICULTY_LABELS[puzzle.difficulty]}
            </span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-code)', fontSize: 11, fontWeight: 700, color: '#E8D19E' }}>
              +{puzzle.xpReward} XP
            </span>
          </div>

          {/* Title & Description */}
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
              {puzzle.title}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
              {puzzle.description}
            </p>
          </div>

          {/* ── MODE 1: SORT (LINE REORDERING) ──────────────────────────────── */}
          {puzzle.mode === 'sort' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22, padding: 14, borderRadius: 18, background: 'rgba(0,0,0,0.25)', border: '1px dashed rgba(157,133,198,0.25)' }}>
              {userState.blocks.map((block, idx) => {
                const accent = ACCENT_COLORS[getBlockAccent(block.code)] || '#9D85C6';
                const isDragging = dragIdx === idx;
                const isOver = dragOver === idx;

                return (
                  <div key={`${puzzleKey}-${block.id}`}>
                    {isOver && dragIdx !== null && dragIdx !== idx && (
                      <div style={{ height: 3, borderRadius: 3, background: modeMeta.color, marginBottom: 4, animation: 'cq-dropLine 0.8s ease infinite' }} />
                    )}
                    <div
                      draggable={!submitted}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12,
                        background: submitted && isCorrect ? 'rgba(152,167,138,0.15)' : submitted && !isCorrect ? 'rgba(143,90,90,0.15)' : isDragging ? 'rgba(157,133,198,0.15)' : 'rgba(24,14,46,0.85)',
                        border: isDragging ? `2px solid ${modeMeta.color}` : `1px solid rgba(255,255,255,0.08)`,
                        borderLeft: `4px solid ${accent}`,
                        cursor: submitted ? 'default' : 'grab', opacity: isDragging ? 0.45 : 1,
                        animation: animPhase === 'correct' ? `cq-bounce 0.6s ease ${idx * 60}ms both` : animPhase === 'wrong' ? `cq-shake 0.5s ease ${idx * 35}ms both` : `cq-slideIn 0.35s ease ${idx * 50}ms both`,
                        transition: 'all 0.2s ease', userSelect: 'none',
                      }}
                    >
                      {!submitted && <DragHandle />}
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: `${accent}20`, border: `1px solid ${accent}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-code)', fontSize: 10, fontWeight: 700, color: accent }}>
                        {idx + 1}
                      </div>
                      <code style={{ fontFamily: 'var(--font-code)', fontSize: 13, color: '#e8e0f0', paddingLeft: block.indent * 18, flex: 1, whiteSpace: 'pre' }}>
                        {block.code}
                      </code>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── MODE 2: FILL (SLOT PICKER) ─────────────────────────────────── */}
          {puzzle.mode === 'fill' && (
            <div style={{ marginBottom: 24 }}>
              {/* Code snippet with ??? slot */}
              <div style={{ padding: 18, borderRadius: 16, background: 'rgba(15,8,30,0.85)', border: '1px solid rgba(157,133,198,0.3)', marginBottom: 20 }}>
                {puzzle.codeLines.map((line, idx) => (
                  <div key={idx} style={{ fontFamily: 'var(--font-code)', fontSize: 13, color: '#e8e0f0', lineHeight: 1.8 }}>
                    {line.includes('???') ? (
                      <span>
                        {line.split('???')[0]}
                        <span style={{
                          display: 'inline-block', padding: '2px 14px', borderRadius: 8,
                          background: userState.selectedToken ? `${ACCENT_COLORS.sand}25` : 'rgba(232,209,158,0.15)',
                          border: `1.5px dashed ${userState.selectedToken ? '#E8D19E' : 'rgba(232,209,158,0.5)'}`,
                          color: userState.selectedToken ? '#E8D19E' : 'rgba(255,255,255,0.4)',
                          fontWeight: 700, margin: '0 4px', transition: 'all 0.2s ease',
                        }}>
                          {userState.selectedToken || '???'}
                        </span>
                        {line.split('???')[1]}
                      </span>
                    ) : (
                      line
                    )}
                  </div>
                ))}
              </div>

              {/* Token Options Picker */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {puzzle.options.map((optionToken, idx) => {
                  const isSelected = userState.selectedToken === optionToken;
                  return (
                    <button
                      key={idx}
                      disabled={submitted}
                      onClick={() => {
                        soundFX.playTaskPop();
                        setGameState((prev) => ({ ...prev, userState: { ...prev.userState, selectedToken: optionToken } }));
                      }}
                      className="action-pill"
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, #E8D19E, #BC957D)' : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#1e1333' : '#fff',
                        border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.15)',
                        fontSize: 13, fontWeight: 700, padding: '10px 20px',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: isSelected ? '0 4px 18px rgba(232,209,158,0.35)' : 'none',
                      }}
                    >
                      {optionToken}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── MODE 3: BUG HUNTER ─────────────────────────────────────────── */}
          {puzzle.mode === 'bug' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {puzzle.lines.map((line, idx) => {
                const isSelected = userState.selectedLineId === line.id;
                return (
                  <div
                    key={line.id}
                    onClick={() => {
                      if (submitted) return;
                      soundFX.playTaskPop();
                      setGameState((prev) => ({ ...prev, userState: { ...prev.userState, selectedLineId: line.id } }));
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14,
                      background: isSelected ? 'rgba(143,90,90,0.22)' : 'rgba(20,10,38,0.8)',
                      border: isSelected ? '2px solid #8F5A5A' : '1px solid rgba(255,255,255,0.08)',
                      cursor: submitted ? 'default' : 'pointer', transition: 'all 0.2s ease',
                      animation: isSelected ? 'cq-zapBug 0.4s ease' : 'none',
                    }}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: isSelected ? '#8F5A5A' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-code)', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                      {idx + 1}
                    </div>
                    <code style={{ fontFamily: 'var(--font-code)', fontSize: 13, color: isSelected ? '#f4a0a0' : '#e8e0f0', flex: 1 }}>
                      {line.code}
                    </code>
                    {isSelected && (
                      <span className="badge-pill" style={{ background: '#8F5A5A', color: '#fff', fontSize: 10 }}>
                        Target Bug
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── MODE 4: MATCH (CONCEPT PAIRING) ────────────────────────────── */}
          {puzzle.mode === 'match' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
              {/* Left Column (Concepts) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {puzzle.pairs.map((pair, leftIdx) => {
                  const matchedRightId = userState.matches[leftIdx];
                  const matchedObj = userState.shuffledRights?.find((r) => r.id === matchedRightId);
                  const isActive = userState.activeLeft === leftIdx;

                  return (
                    <div
                      key={leftIdx}
                      onClick={() => {
                        if (submitted) return;
                        soundFX.playTaskPop();
                        setGameState((prev) => ({ ...prev, userState: { ...prev.userState, activeLeft: leftIdx } }));
                      }}
                      style={{
                        padding: '12px 14px', borderRadius: 12,
                        background: isActive ? 'rgba(152,167,138,0.25)' : matchedObj ? 'rgba(152,167,138,0.12)' : 'rgba(20,10,38,0.85)',
                        border: isActive ? '2px solid #98A78A' : matchedObj ? '1px solid #98A78A' : '1px solid rgba(255,255,255,0.08)',
                        cursor: submitted ? 'default' : 'pointer', transition: 'all 0.2s ease',
                      }}
                    >
                      <code style={{ fontFamily: 'var(--font-code)', fontSize: 12, color: '#98A78A', fontWeight: 700 }}>
                        {pair.left}
                      </code>
                      {matchedObj && (
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                          → {matchedObj.text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Column (Descriptions) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {userState.shuffledRights?.map((rightObj) => {
                  const isAssigned = Object.values(userState.matches).includes(rightObj.id);

                  return (
                    <div
                      key={rightObj.id}
                      onClick={() => {
                        if (submitted || userState.activeLeft === null) return;
                        soundFX.playTaskPop();
                        setGameState((prev) => ({
                          ...prev,
                          userState: {
                            ...prev.userState,
                            matches: { ...prev.userState.matches, [prev.userState.activeLeft]: rightObj.id },
                            activeLeft: null,
                          },
                        }));
                      }}
                      style={{
                        padding: '12px 14px', borderRadius: 12,
                        background: isAssigned ? 'rgba(157,133,198,0.15)' : userState.activeLeft !== null ? 'rgba(232,209,158,0.15)' : 'rgba(20,10,38,0.85)',
                        border: isAssigned ? '1px solid #9D85C6' : userState.activeLeft !== null ? '1px dashed #E8D19E' : '1px solid rgba(255,255,255,0.08)',
                        cursor: userState.activeLeft !== null && !submitted ? 'pointer' : 'default',
                        transition: 'all 0.2s ease', fontFamily: 'var(--font-body)', fontSize: 12, color: '#e8e0f0',
                      }}
                    >
                      {rightObj.text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── HINTS SYSTEM ──────────────────────────────────────────────── */}
          {!submitted && puzzle.hints && puzzle.hints.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  Suggerimenti gratuiti
                </span>
                {revealedHints < puzzle.hints.length && (
                  <button
                    onClick={() => {
                      soundFX.playTaskPop();
                      setRevealedHints((h) => h + 1);
                    }}
                    className="action-pill"
                    style={{ background: 'rgba(188,149,125,0.15)', color: '#BC957D', border: '1px solid rgba(188,149,125,0.3)', fontSize: 11, padding: '5px 12px' }}
                  >
                    Suggerimento {revealedHints + 1}/{puzzle.hints.length}
                  </button>
                )}
              </div>
              {revealedHints > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {puzzle.hints.slice(0, revealedHints).map((hint, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(188,149,125,0.08)', border: '1px solid rgba(188,149,125,0.2)', fontFamily: 'var(--font-body)', fontSize: 12, color: '#BC957D' }}>
                      {hint}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RESULT & EXPLANATION ──────────────────────────────────────── */}
          {submitted && (
            <div style={{
              padding: '16px 20px', borderRadius: 14,
              background: isCorrect ? 'rgba(152,167,138,0.12)' : 'rgba(143,90,90,0.12)',
              border: `1px solid ${isCorrect ? '#98A78A' : '#8F5A5A'}`, marginBottom: 20,
              animation: 'cq-result 0.35s ease both',
            }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 800, color: isCorrect ? '#98A78A' : '#8F5A5A', marginBottom: 6 }}>
                {isCorrect ? 'Ottimo Lavoro!' : 'Non ancora...'}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                {puzzle.explanation}
              </p>
            </div>
          )}

          {/* ── BOTTOM ACTIONS ────────────────────────────────────────────── */}
          <div className="card-bottom-actions" style={{ paddingTop: 0, marginTop: 0 }}>
            {!submitted ? (
              <button
                onClick={handleSubmit}
                className="action-pill"
                style={{
                  background: 'linear-gradient(135deg, #7A3F67, #9D85C6)', color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 900, padding: '10px 28px', boxShadow: '0 4px 20px rgba(122,63,103,0.45)', marginLeft: 'auto',
                }}
              >
                Verifica Soluzione
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                {!isCorrect && (
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setIsCorrect(false);
                      setAnimPhase('idle');
                    }}
                    className="action-pill"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    Riprova
                  </button>
                )}
                <button
                  onClick={() => loadNextPuzzle()}
                  className="action-pill"
                  style={{
                    background: isCorrect ? 'linear-gradient(135deg, #5d7a52, #98A78A)' : 'linear-gradient(135deg, #7A3F67, #9D85C6)',
                    color: '#fff', border: 'none', fontSize: 13, fontWeight: 900, padding: '10px 26px',
                  }}
                >
                  Prossimo Puzzle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
