import React, { useEffect } from 'react';
import { Search, X, FolderGit2, Terminal, Code2, Smartphone, Sparkles, FolderOpen } from 'lucide-react';
import { useProjects } from '../context/ProjectsContext';

export default function QuickSearchModal({ isOpen, onClose }) {
  const { projects, searchQuery, setSearchQuery, setActiveProject, projectNicknames, launchTerminal, launchVSCode, launchAndroidStudio, launchAntigravityIDE, launchExplorer } = useProjects();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setSearchQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-6 bg-black/70 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-2xl dashboard-card bg-canvas text-white flex flex-col overflow-hidden shadow-2xl border-white/30">
        {/* Search Input Bar */}
        <div className="p-5 border-b border-white/15 flex items-center gap-4 bg-canvas">
          <Search className="w-5 h-5 text-lavender shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Cerca progetti o repository Git..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white text-base font-semibold placeholder-lavender/50"
          />
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-lavender hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto p-4 flex flex-col gap-3">
          {projects.length === 0 ? (
            <p className="text-xs text-blue text-center py-8 font-mono">
              Nessun progetto corrisponde alla ricerca.
            </p>
          ) : (
            projects.map((p) => {
              const displayName = projectNicknames[p.id] || p.name;
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-card hover:bg-white/15 border border-white/10 flex items-center justify-between group transition-all"
                >
                  <div
                    onClick={() => {
                      setActiveProject(p);
                      onClose();
                    }}
                    className="cursor-pointer flex-1 truncate mr-4"
                  >
                    <div className="flex items-center gap-3">
                      <FolderGit2 className="w-4 h-4 text-lavender shrink-0" />
                      <span className="text-sm font-black text-white group-hover:text-sand">
                        {displayName}
                      </span>
                      <span className="badge-pill bg-canvas text-blue border border-blue/30">
                        {p.branch}
                      </span>
                    </div>
                    <p className="text-xs text-blue font-mono truncate mt-1">
                      {p.path}
                    </p>
                  </div>

                  {/* Launcher Icons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => launchTerminal(p.path)}
                      title="Apri Terminale"
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-lavender hover:text-white"
                    >
                      <Terminal className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => launchAndroidStudio(p.path)}
                      title="Apri in Android Studio"
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-sage hover:text-white"
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => launchAntigravityIDE(p.path)}
                      title="Apri in Antigravity IDE"
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue hover:text-white"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => launchVSCode(p.path)}
                      title="Apri in VS Code"
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-lavender hover:text-white"
                    >
                      <Code2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
