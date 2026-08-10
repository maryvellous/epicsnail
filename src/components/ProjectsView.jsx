import React, { useState, useEffect } from 'react';
import { useProjects } from '../context/ProjectsContext';
import { AestheticBriefcaseIcon } from './AestheticIcons';
import {
  Terminal,
  Code2,
  Smartphone,
  Sparkles,
  GitBranch,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Check,
  ChevronDown,
  FolderOpen,
  Plus,
  Trash2,
  Circle,
  FileText,
  X,
  StickyNote,
  Bot,
  Pin,
  Eye,
  EyeOff,
  ArrowUpDown,
  Globe,
  RefreshCw,
  Star,
  Clock
} from 'lucide-react';
import { formatLastModified } from '../utils/dateUtils';

export default function ProjectsView({ onNavigateTab }) {
  const {
    projects,
    loading,
    setActiveProject,
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    projectNicknames,
    setProjectNickname,
    projectColors,
    setProjectColor,
    pinnedProjectIds,
    togglePinProject,
    hiddenProjectIds,
    toggleHideProject,
    showHiddenProjects,
    setShowHiddenProjects,
    sortBy,
    changeSortBy,
    projectFilter,
    changeProjectFilter,
    refreshProjects,
    launchTerminal,
    launchVSCode,
    launchAndroidStudio,
    launchAntigravityIDE,
    launchExplorer,
    openExternal,
    syncProject
  } = useProjects();

  const [editingId, setEditingId] = useState(null);
  const [tempNickname, setTempNickname] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [newTaskInput, setNewTaskInput] = useState({});

  const [activePostItId, setActivePostItId] = useState(null);

  const COLOR_OPTIONS = [
    { id: 'blue', name: 'Azzurro Cielo', bg: '#a8c6de' },
    { id: 'sage', name: 'Verde Salvia', bg: '#9ca98b' },
    { id: 'sand', name: 'Sabbia Dorata', bg: '#efdebd' },
    { id: 'lavender', name: 'Lavanda Soft', bg: '#9a85c0' },
    { id: 'plum', name: 'Prugna Intenso', bg: '#833d6f' },
    { id: 'terracotta', name: 'Terracotta Caldo', bg: '#8f5a5a' },
    { id: 'warm-sand', name: 'Sabbia Calda', bg: '#785076' },
    { id: 'default', name: 'Scuro Cozy', bg: '#5c2a5c' },
  ];

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e, project) => {
    e.preventDefault();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.min(e.clientY, window.innerHeight - 300),
      project
    });
  };

  const handleStartRename = (project) => {
    setEditingId(project.id);
    setTempNickname(projectNicknames[project.id] || project.name);
    setContextMenu(null);
  };

  const handleSaveRename = (projectId) => {
    if (tempNickname.trim()) {
      setProjectNickname(projectId, tempNickname.trim());
    }
    setEditingId(null);
  };

  const handleAddTaskToCard = (projectId, e) => {
    e.preventDefault();
    const title = newTaskInput[projectId];
    if (!title || !title.trim()) return;
    addTask(projectId, title.trim());
    setNewTaskInput({ ...newTaskInput, [projectId]: '' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 select-none">
        <Sparkles className="w-12 h-12 text-lavender animate-spin" />
        <span className="text-base font-bold text-white/80">Scansione dei tuoi progetti in corso...</span>
      </div>
    );
  }

  return (
    <div className="projects-canvas-container select-none">
      {/* Header Section & Toolbar Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-heading font-black text-3xl text-white tracking-wide flex items-center gap-3.5">
            <AestheticBriefcaseIcon className="w-10 h-10 shrink-0 filter drop-shadow-md" />
            I Miei Progetti
            <span className="badge-pill bg-sidebar text-white border border-white/20 shadow-md text-xs">
              {projects.length} repository
            </span>
          </h1>
        </div>

        {/* Toolbar: Filter Selector, Sort Selector & Show Hidden Projects Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Selector */}
          <div className="relative">
            <select
              value={projectFilter}
              onChange={(e) => changeProjectFilter(e.target.value)}
              className="appearance-none bg-card text-white border border-lavender/40 hover:border-lavender rounded-2xl px-4 py-2 pr-8 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-lavender cursor-pointer shadow-md"
            >
              <option value="all" className="bg-canvas text-white">📦 Tutti i Progetti</option>
              <option value="local_only" className="bg-canvas text-white">💻 Solo Locali</option>
              <option value="github_only" className="bg-canvas text-white">🐙 Solo Remote GitHub</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-sand absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => changeSortBy(e.target.value)}
              className="appearance-none bg-card text-white border border-lavender/40 hover:border-lavender rounded-2xl px-4 py-2 pr-8 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-lavender cursor-pointer shadow-md"
            >
              <option value="modified_desc" className="bg-canvas text-white">Modifica (Più recenti)</option>
              <option value="modified_asc" className="bg-canvas text-white">Modifica (Meno recenti)</option>
              <option value="created_desc" className="bg-canvas text-white">Creazione (Più recenti)</option>
              <option value="created_asc" className="bg-canvas text-white">Creazione (Meno recenti)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-sand absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Show Hidden Projects Toggle */}
          {hiddenProjectIds.length > 0 && (
            <button
              onClick={() => setShowHiddenProjects(!showHiddenProjects)}
              className={`action-pill transition-all ${
                showHiddenProjects
                  ? 'bg-sand text-canvas font-black'
                  : 'bg-white/10 hover:bg-white/20 border border-white/20 text-blue'
              }`}
              title="Mostra o nascondi i progetti archiviati"
            >
              {showHiddenProjects ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{showHiddenProjects ? 'Nascondi Archiviati' : `Mostra Nascosti (${hiddenProjectIds.length})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State when no repos found */}
      {projects.length === 0 && (
        <div className="dashboard-card bg-card border border-plum/40 p-12 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto my-12 shadow-2xl">
          <FolderOpen className="w-14 h-14 text-lavender animate-bounce" />
          <h2 className="font-heading font-black text-2xl text-white">Nessun Progetto Git Trovato</h2>
          <p className="text-sm text-blue font-sans leading-relaxed">
            Non abbiamo individuato repository Git nei percorsi locali configurati o nei collegamenti GitHub.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={refreshProjects}
              className="action-pill bg-sidebar hover:bg-plum text-white font-bold"
            >
              Riscansiona Progetti
            </button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10 items-start">
        {projects.map((project, idx) => {
          const projectTasks = tasks.filter((t) => t.projectId === project.id);
          const customName = projectNicknames[project.id] || project.name;

          const defaultPaletteColor = COLOR_OPTIONS[idx % (COLOR_OPTIONS.length - 1)].id;
          const themeColor = projectColors[project.id] || defaultPaletteColor;
          const hasTasks = projectTasks.length > 0;
          const isDarkTheme = themeColor === 'plum' || themeColor === 'terracotta' || themeColor === 'default';

          const isPinned = pinnedProjectIds.includes(project.id);
          const isHidden = hiddenProjectIds.includes(project.id);
          const isOverlayOpen = activePostItId === project.id;

          const lastModifiedDate = project.lastModified || project.lastCommit?.date || project.lastFileModified || null;
          const formattedModDate = formatLastModified(lastModifiedDate);

          return (
            <div
              key={project.id}
              onContextMenu={(e) => handleContextMenu(e, project)}
              className={`dashboard-card theme-${themeColor} relative group cursor-default transition-all duration-300 ${
                isHidden ? 'opacity-40 border-2 border-dashed border-amber-300/60 hover:opacity-90' : ''
              }`}
            >
              {/* FLOATING POST-IT OVERLAY STICKER */}
              {isOverlayOpen && (
                <div className="postit-floating-overlay animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-amber-900/20 pb-2.5 mb-4">
                    <span className="font-heading font-black text-xs text-amber-950 uppercase tracking-wider flex items-center gap-2">
                      <StickyNote className="w-4 h-4" /> Tasks Post-it
                    </span>
                    <button
                      onClick={() => setActivePostItId(null)}
                      className="p-1 rounded-lg hover:bg-amber-900/10 text-amber-900/70 hover:text-amber-950"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto mb-4 pr-1">
                    {projectTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 group/task">
                        <div
                          onClick={() => toggleTask(t.id)}
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                        >
                          {t.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-amber-900/40 shrink-0" />
                          )}
                          <span
                            className={`text-xs font-semibold truncate ${
                              t.completed ? 'line-through text-amber-900/40' : 'text-amber-950'
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>

                        <button
                          onClick={() => deleteTask(t.id)}
                          className="opacity-0 group-hover/task:opacity-100 p-1 text-amber-900/40 hover:text-rose-700 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Task on Floating Post-it */}
                  <form onSubmit={(e) => handleAddTaskToCard(project.id, e)} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Aggiungi nota..."
                      value={newTaskInput[project.id] || ''}
                      onChange={(e) => setNewTaskInput({ ...newTaskInput, [project.id]: e.target.value })}
                      className="flex-1 bg-amber-100/90 border-amber-900/30 text-amber-950 text-xs rounded-xl px-3 py-2 placeholder-amber-900/50"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-amber-900 text-amber-100 hover:bg-amber-950 text-xs font-bold shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              <div>
                {/* 1. Title Block (Explicit Card Section 1) */}
                <div className="card-title-block">
                  {editingId === project.id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        autoFocus
                        value={tempNickname}
                        onChange={(e) => setTempNickname(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(project.id)}
                        className="bg-black/80 border-white text-white text-base font-bold rounded-2xl px-4 py-2 flex-1"
                      />
                      <button
                        onClick={() => handleSaveRename(project.id)}
                        className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 group/title min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <h2
                          onClick={() => setActiveProject(project)}
                          className={`font-heading font-black text-2xl leading-snug cursor-pointer transition-opacity hover:opacity-80 break-words line-clamp-2 ${
                            isDarkTheme ? 'text-white' : 'text-canvas'
                          }`}
                          title={customName}
                        >
                          {customName}
                        </h2>
                        {isPinned && (
                          <span className="p-1 rounded-lg bg-sand text-canvas shadow-md shrink-0" title="Fissato in alto">
                            <Pin className="w-3.5 h-3.5 fill-current" />
                          </span>
                        )}
                        {isHidden && (
                          <span className="p-1 rounded-lg bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[10px] font-mono font-bold shrink-0">
                            Nascosto
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleStartRename(project)}
                        title="Modifica nome personalizzato"
                        className={`opacity-0 group-hover/title:opacity-100 p-2 rounded-xl transition-all shrink-0 ${
                          isDarkTheme ? 'hover:bg-white/10 text-white/80' : 'hover:bg-black/10 text-black/80'
                        }`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Subtitle Path with Explicit Class */}
                  <p
                    className={`card-path-subtitle break-all ${
                      isDarkTheme ? 'text-white/70' : 'text-black/70'
                    }`}
                    title={project.path}
                  >
                    {project.path}
                  </p>

                  {/* Last Modified Indicator */}
                  {formattedModDate && (
                    <div className={`flex items-center gap-1.5 text-[11px] font-semibold mt-2.5 ${
                      isDarkTheme ? 'text-blue/90' : 'text-canvas/80'
                    }`}>
                      <Clock className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span>{formattedModDate}</span>
                    </div>
                  )}
                </div>

                {/* 2. Badges Block (Explicit Card Section 2) */}
                <div className="card-badges-block flex-wrap">
                  {project.isLocal !== false && (
                    <span className={`badge-pill ${
                      isDarkTheme
                        ? 'bg-sidebar/60 text-lavender border border-lavender/40'
                        : 'bg-canvas text-blue border border-blue/40 font-bold'
                    }`}>
                      Locale
                    </span>
                  )}

                  {project.isGitHubRemote && (
                    <span className="badge-pill bg-canvas text-sand border border-sand/40">
                      GitHub
                    </span>
                  )}

                  <span className={`badge-pill ${
                    isDarkTheme
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'bg-canvas/15 text-canvas border border-canvas/25 font-extrabold'
                  }`}>
                    <GitBranch className="w-3.5 h-3.5 shrink-0" />
                    <span>{project.branch}</span>
                  </span>

                  {project.isLocal !== false && (
                    project.clean ? (
                      <span className="badge-pill text-canvas bg-sage border border-sage/40 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Clean</span>
                      </span>
                    ) : (
                      <span className="badge-pill text-canvas bg-sand border border-sand/40 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{project.modified} modificati</span>
                      </span>
                    )
                  )}

                  {project.stargazers_count !== undefined && (
                    <span className="badge-pill text-sand bg-canvas/70 border border-sand/40" title="Stelle GitHub">
                      <Star className="w-3.5 h-3.5 fill-sand text-sand shrink-0" />
                      <span>{project.stargazers_count}</span>
                    </span>
                  )}

                  {project.open_issues_count !== undefined && project.open_issues_count > 0 && (
                    <span className="badge-pill text-terracotta bg-canvas/70 border border-terracotta/40" title="Issue aperte su GitHub">
                      <span>Issue: {project.open_issues_count}</span>
                    </span>
                  )}

                  {hasTasks && (
                    <button
                      onClick={() => setActivePostItId(isOverlayOpen ? null : project.id)}
                      className="task-sticker-badge"
                      title="Apri Post-it Task"
                    >
                      <StickyNote className="w-3.5 h-3.5 shrink-0" />
                      <span>{projectTasks.length} task</span>
                    </button>
                  )}
                </div>

                {/* 3. Commit Block (Explicit Card Section 3) */}
                {project.lastCommit && (
                  <div className="card-commit-block bg-canvas/60 border border-white/10 text-white">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold mb-2 text-lavender">
                      <GitCommit className="w-3.5 h-3.5" />
                      <span>{project.lastCommit.hash}</span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed line-clamp-2">
                      {project.lastCommit.message}
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Actions Block (Explicit Card Section 4) */}
              <div className={`card-bottom-actions flex-wrap gap-2 ${
                isDarkTheme ? 'border-white/15' : 'border-black/15'
              }`}>
                {project.isLocal !== false && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                      className={`action-pill ${
                        isDarkTheme ? 'bg-white text-purple-950 hover:bg-purple-100' : 'bg-canvas text-white hover:bg-purple-950'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Apri in...</span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenuId === project.id ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Popover Dropdown Menu */}
                    {openMenuId === project.id && (
                      <div className="absolute left-0 bottom-14 z-50 w-56 dashboard-card p-2 shadow-2xl bg-canvas text-white border-white/20 flex flex-col gap-1 animate-fadeIn">
                        <button
                          onClick={() => {
                            launchTerminal(project.path);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/15 text-xs font-bold text-left transition-colors"
                        >
                          <Terminal className="w-4 h-4 text-purple-300" />
                          <span>PowerShell Terminale</span>
                        </button>

                        <button
                          onClick={() => {
                            launchAndroidStudio(project.path);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/15 text-xs font-bold text-emerald-300 text-left transition-colors"
                        >
                          <Smartphone className="w-4 h-4 text-emerald-400" />
                          <span>Android Studio</span>
                        </button>

                        <button
                          onClick={() => {
                            launchAntigravityIDE(project.path);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/15 text-xs font-bold text-cyan-300 text-left transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-cyan-300" />
                          <span>Antigravity IDE</span>
                        </button>

                        <button
                          onClick={() => {
                            launchVSCode(project.path);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/15 text-xs font-bold text-blue-300 text-left transition-colors"
                        >
                          <Code2 className="w-4 h-4 text-blue-400" />
                          <span>VS Code</span>
                        </button>

                        <button
                          onClick={() => {
                            launchExplorer(project.path);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/15 text-xs font-bold text-amber-300 text-left transition-colors border-t border-white/10 mt-1 pt-3"
                        >
                          <FolderOpen className="w-4 h-4 text-amber-400" />
                          <span>Esplora Risorse</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {project.isGitHubRemote && project.githubUrl && (
                  <button
                    onClick={() => openExternal(project.githubUrl)}
                    className="action-pill bg-sidebar hover:bg-plum text-white border border-white/20"
                    title="Apri repository su GitHub Web"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span>GitHub Web</span>
                  </button>
                )}

                {project.isLocal !== false && (
                  <button
                    onClick={() => syncProject(project.path)}
                    className={`action-pill ${
                      isDarkTheme
                        ? 'bg-white/10 hover:bg-white/20 text-blue border border-white/20'
                        : 'bg-canvas/15 hover:bg-canvas/25 text-canvas border border-canvas/30 font-extrabold'
                    }`}
                    title="Esegui git fetch sul progetto"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>Fetch</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveProject(project)}
                  className={`action-pill ${
                    isDarkTheme
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      : 'bg-black/10 hover:bg-black/20 text-canvas border border-black/20'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Dettagli</span>
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          className="fixed z-50 w-56 dashboard-card p-2 shadow-2xl bg-canvas text-white border-white/30 flex flex-col gap-1 animate-fadeIn"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-white/10 mb-1">
            <span className="text-xs font-bold text-purple-200 block truncate">
              {projectNicknames[contextMenu.project.id] || contextMenu.project.name}
            </span>
          </div>

          <button
            onClick={() => handleStartRename(contextMenu.project)}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/15 text-xs font-bold text-white text-left"
          >
            <Pencil className="w-4 h-4 text-fuchsia-300" />
            <span>Rinomina Progetto</span>
          </button>

          {/* Color Picker Sub-options */}
          <div className="p-2 bg-black/40 rounded-xl my-1 flex items-center justify-around">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setProjectColor(contextMenu.project.id, c.id);
                  setContextMenu(null);
                }}
                title={c.name}
                className="w-4 h-4 rounded-full transition-transform hover:scale-125 border border-white/20"
                style={{ backgroundColor: c.bg }}
              />
            ))}
          </div>

          {contextMenu.project.githubUrl && (
            <button
              onClick={() => {
                openExternal(contextMenu.project.githubUrl);
                setContextMenu(null);
              }}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/15 text-xs font-bold text-sand text-left"
            >
              <Globe className="w-4 h-4 text-sand" />
              <span>Apri su GitHub Web</span>
            </button>
          )}

          {contextMenu.project.isLocal !== false && (
            <button
              onClick={() => {
                syncProject(contextMenu.project.path);
                setContextMenu(null);
              }}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/15 text-xs font-bold text-blue text-left"
            >
              <RefreshCw className="w-4 h-4 text-blue" />
              <span>Sincronizza Git (Fetch)</span>
            </button>
          )}

          <button
            onClick={() => {
              togglePinProject(contextMenu.project.id);
              setContextMenu(null);
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/15 text-xs font-bold text-sand text-left"
          >
            <Pin className="w-4 h-4" />
            <span>{pinnedProjectIds.includes(contextMenu.project.id) ? 'Sblocca / Unpinna Progetto' : 'Pinna in Alto'}</span>
          </button>

          <button
            onClick={() => {
              toggleHideProject(contextMenu.project.id);
              setContextMenu(null);
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/15 text-xs font-bold text-amber-300 text-left"
          >
            {hiddenProjectIds.includes(contextMenu.project.id) ? <Eye className="w-4 h-4 text-emerald-300" /> : <EyeOff className="w-4 h-4 text-amber-300" />}
            <span>{hiddenProjectIds.includes(contextMenu.project.id) ? 'Rendi di Nuovo Visibile' : 'Nascondi Progetto'}</span>
          </button>

          <button
            onClick={() => {
              const title = prompt('Inserisci titolo nuova task per Post-it:');
              if (title && title.trim()) {
                addTask(contextMenu.project.id, title.trim());
                setActivePostItId(contextMenu.project.id);
              }
              setContextMenu(null);
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/15 text-xs font-bold text-blue text-left"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Task Post-it</span>
          </button>

          <button
            onClick={async () => {
              const proj = contextMenu.project;
              const projTasks = tasks.filter((t) => t.projectId === proj.id);
              const nickname = projectNicknames[proj.id] || proj.name;
              
              const contextString = `[CONTESTO PROGETTO: ${nickname}]
- Percorso locale: ${proj.path}
- Ramo Git attivo: ${proj.branch}`;

              if (window.electronAPI) {
                await window.electronAPI.saveContextHeader(contextString);
              }
              setContextMenu(null);
              if (onNavigateTab) {
                onNavigateTab('chat');
              }
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/15 text-xs font-bold text-sand text-left border-t border-white/10 mt-1 pt-2"
          >
            <Bot className="w-4 h-4 text-sand" />
            <span>Apri come contesto nel Chatbot</span>
          </button>

          <button
            onClick={() => {
              setActiveProject(contextMenu.project);
              setContextMenu(null);
            }}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/15 text-xs font-bold text-cyan-300 text-left border-t border-white/10"
          >
            <FileText className="w-4 h-4" />
            <span>Apri Dettagli & Note</span>
          </button>
        </div>
      )}
    </div>
  );
}
