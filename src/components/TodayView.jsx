import React, { useState, useEffect } from 'react';
import { useGamification } from '../context/GamificationContext';
import { useProjects } from '../context/ProjectsContext';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ArrowUpRight,
  HardDrive,
  ExternalLink,
  StickyNote as StickyNoteIcon,
} from 'lucide-react';
import StickyNote from './StickyNote';
import { useStickyNotes } from '../hooks/useStickyNotes';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTodayDate() {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

// ── Glassmorphism card style ──────────────────────────────────────────────────

const glassCard = {
  background: 'rgba(43, 28, 71, 0.65)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(157, 133, 198, 0.22)',
  borderRadius: 22,
  padding: '24px 26px',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function TodayHeader({ userName, level, xpInCurrentLevel, xpNeededForNext, levelProgress }) {
  const dateStr = formatTodayDate();
  // Capitalise first letter
  const dateFmt = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      {/* Date + greeting */}
      <div>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(157,133,198,0.7)',
            marginBottom: 2,
          }}
        >
          {dateFmt}
        </p>
        <h1
          style={{
            fontFamily: 'inherit',
            fontSize: 28,
            fontWeight: 900,
            color: '#fff',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          Bentornato{userName ? `, ${userName}` : ''}!
        </h1>
        <span className="inline-block mt-2 px-3 py-1 bg-[#efdebd]/20 text-[#efdebd] border border-[#efdebd]/40 rounded-full font-mono text-[11px] font-bold">
          Google Workspace Hub Attivo
        </span>
      </div>

      {/* XP bar compact */}
      <div style={{ minWidth: 200 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 5,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
          }}
        >
          <span style={{ color: '#efdebd' }}>Livello {level}</span>
          <span style={{ color: 'rgba(239,222,189,0.55)' }}>
            {xpInCurrentLevel} / {xpNeededForNext} XP
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 99,
            background: 'rgba(154,133,192,0.18)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${levelProgress}%`,
              borderRadius: 99,
              background: 'linear-gradient(90deg, #9a85c0, #efdebd)',
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TodayTaskPanel({ tasks, addTask, toggleTask, deleteTask }) {
  const [newTask, setNewTask] = useState('');
  const todayTasks = tasks.filter((t) => !t.projectId || t.projectId === 'today');
  const completed = todayTasks.filter((t) => t.completed).length;
  const total = todayTasks.length;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTask('today', newTask.trim(), 'high');
    setNewTask('');
  };

  return (
    <div style={glassCard} className="flex flex-col gap-5 overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <h2
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: '#efdebd',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Focus di Oggi
        </h2>
        {total > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'rgba(239,222,189,0.55)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {completed}/{total} completati
          </span>
        )}
      </div>

      {/* Progress bar (only if tasks exist) */}
      {total > 0 && (
        <div
          style={{
            height: 4,
            borderRadius: 99,
            background: 'rgba(154,133,192,0.15)',
            overflow: 'hidden',
            marginTop: -10,
          }}
        >
          <div
            style={{
              height: '100%',
              width: total > 0 ? `${(completed / total) * 100}%` : '0%',
              borderRadius: 99,
              background: 'linear-gradient(90deg, #9ca98b, #efdebd)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      )}

      {/* Quick add */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          placeholder="Aggiungi una priorità per oggi..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          style={{
            flex: 1,
            background: 'rgba(30, 19, 51, 0.7)',
            border: '1px solid rgba(154,133,192,0.2)',
            borderRadius: 12,
            padding: '9px 14px',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'rgba(154,133,192,0.25)',
            border: '1px solid rgba(154,133,192,0.35)',
            borderRadius: 12,
            padding: '9px 16px',
            color: '#efdebd',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(154,133,192,0.4)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(154,133,192,0.25)')}
        >
          <Plus size={15} strokeWidth={3} />
          Aggiungi
        </button>
      </form>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {todayTasks.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              color: 'rgba(154,133,192,0.5)',
              fontSize: 13,
              fontWeight: 600,
              padding: '24px 0',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Nessun task ancora — aggiungine uno sopra!
          </p>
        ) : (
          todayTasks.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 13,
                background: t.completed
                  ? 'rgba(156, 169, 139, 0.12)'
                  : 'rgba(30, 19, 51, 0.5)',
                border: '1px solid rgba(154,133,192,0.12)',
                transition: 'background 0.2s',
                gap: 10,
              }}
              className="group"
            >
              <div
                onClick={() => toggleTask(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  flex: 1,
                  overflow: 'hidden',
                }}
              >
                {t.completed ? (
                  <CheckCircle2 size={18} style={{ color: '#9ca98b', flexShrink: 0 }} />
                ) : (
                  <Circle size={18} style={{ color: 'rgba(154,133,192,0.4)', flexShrink: 0 }} />
                )}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: t.completed ? 'rgba(255,255,255,0.3)' : '#fff',
                    textDecoration: t.completed ? 'line-through' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'color 0.2s',
                  }}
                >
                  {t.title}
                </span>
              </div>

              <button
                onClick={() => deleteTask(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(143,90,90,0)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s',
                  flexShrink: 0,
                }}
                className="group-hover:!text-[#8f5a5a]"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TodayProjectsPanel({ projects, projectNicknames, setActiveProject, driveFiles }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Projects card */}
      <div style={glassCard}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 900,
            color: '#a8c6de',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Progetti Recenti
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.length === 0 ? (
            <p
              style={{
                color: 'rgba(168,198,222,0.4)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Nessun progetto aperto.
            </p>
          ) : (
            projects.slice(0, 4).map((p) => {
              const displayName = projectNicknames[p.id] || p.name;
              return (
                <div
                  key={p.id}
                  onClick={() => setActiveProject(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 12,
                    background: 'rgba(30, 19, 51, 0.5)',
                    border: '1px solid rgba(168,198,222,0.12)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    gap: 8,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(168,198,222,0.1)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'rgba(30, 19, 51, 0.5)')
                  }
                >
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#fff',
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {displayName}
                    </span>
                    {p.branch && (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'rgba(168,198,222,0.55)',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                        }}
                      >
                        {p.branch}
                      </span>
                    )}
                  </div>
                  <ArrowUpRight size={14} style={{ color: 'rgba(168,198,222,0.5)', flexShrink: 0 }} />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Google Drive card — conditional */}
      {driveFiles.length > 0 && (
        <div style={glassCard}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: '#a8c6de',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            Drive Recenti
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {driveFiles.map((f) => (
              <a
                key={f.id}
                href={f.webViewLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 11px',
                  borderRadius: 11,
                  background: 'rgba(30,19,51,0.5)',
                  border: '1px solid rgba(168,198,222,0.1)',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                  gap: 8,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(168,198,222,0.08)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(30,19,51,0.5)')
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  {f.iconLink ? (
                    <img src={f.iconLink} alt="" style={{ width: 14, height: 14, flexShrink: 0 }} />
                  ) : (
                    <HardDrive size={13} style={{ color: '#a8c6de', flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {f.name}
                  </span>
                </div>
                <ExternalLink size={11} style={{ color: 'rgba(168,198,222,0.5)', flexShrink: 0 }} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main TodayView ────────────────────────────────────────────────────────────

export default function TodayView() {
  const { userName, level, xpInCurrentLevel, xpNeededForNext, levelProgress } =
    useGamification();
  const { tasks, addTask, toggleTask, deleteTask, projects, setActiveProject, projectNicknames } =
    useProjects();
  const { notes, addNote, updateNote, deleteNote } = useStickyNotes();
  const [driveFiles, setDriveFiles] = useState([]);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getGoogleDriveFiles(6).then((res) => {
        if (res && res.success) setDriveFiles(res.files || []);
      });
    }
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ── Layer 0: Canvas background ─────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(145deg, #1e1333 0%, #5c2a5c 60%, #1e1333 100%)',
          zIndex: 0,
        }}
      />

      {/* ── Layer 1: Ambient background glow ───────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -50,
          right: -50,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(131,61,111,0.15) 0%, rgba(110,90,142,0.08) 50%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Layer 2: Content ───────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 32px 24px',
          gap: 22,
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <TodayHeader
          userName={userName}
          level={level}
          xpInCurrentLevel={xpInCurrentLevel}
          xpNeededForNext={xpNeededForNext}
          levelProgress={levelProgress}
        />

        {/* Main grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 20,
            flex: 1,
            minHeight: 0,
          }}
        >
          <TodayTaskPanel
            tasks={tasks}
            addTask={addTask}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
          />
          <TodayProjectsPanel
            projects={projects}
            projectNicknames={projectNicknames}
            setActiveProject={setActiveProject}
            driveFiles={driveFiles}
          />
        </div>
      </div>

      {/* ── Layer 3: Floating sticky notes ────────────────────────── */}
      {notes.map((note) => (
        <StickyNote
          key={note.id}
          {...note}
          onUpdate={updateNote}
          onDelete={deleteNote}
        />
      ))}

      {/* ── Layer 4: Add sticky note button ───────────────────────── */}
      <button
        onClick={addNote}
        title="Aggiungi sticky note"
        style={{
          position: 'absolute',
          bottom: 28,
          left: 28,
          zIndex: 30,
          background: 'rgba(239, 222, 189, 0.18)',
          border: '1px solid rgba(239, 222, 189, 0.35)',
          borderRadius: 14,
          padding: '9px 16px',
          color: '#efdebd',
          fontWeight: 800,
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.05em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backdropFilter: 'blur(8px)',
          transition: 'background 0.2s, transform 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 222, 189, 0.3)';
          e.currentTarget.style.transform = 'scale(1.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(239, 222, 189, 0.18)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <StickyNoteIcon size={14} strokeWidth={2.5} />
        Sticky Note
      </button>
    </div>
  );
}
