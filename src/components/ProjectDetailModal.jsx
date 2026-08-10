import React, { useState } from 'react';
import { useProjects } from '../context/ProjectsContext';
import {
  X,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Terminal,
  Code2,
  Smartphone,
  Sparkles,
  FileText,
  CheckSquare,
  FolderOpen,
  Clock
} from 'lucide-react';
import { formatLastModified } from '../utils/dateUtils';

export default function ProjectDetailModal() {
  const {
    activeProject,
    setActiveProject,
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    notes,
    saveNotes,
    projectNicknames,
    launchTerminal,
    launchVSCode,
    launchAndroidStudio,
    launchAntigravityIDE,
    launchExplorer
  } = useProjects();

  const [activeTab, setActiveTab] = useState('tasks');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  if (!activeProject) return null;

  const projectTasks = tasks.filter((t) => t.projectId === activeProject.id);
  const noteContent = notes[activeProject.id] || '';
  const customName = projectNicknames[activeProject.id] || activeProject.name;
  const lastModifiedDate = activeProject.lastModified || activeProject.lastCommit?.date || activeProject.lastFileModified || null;
  const formattedModDate = formatLastModified(lastModifiedDate);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(activeProject.id, newTaskTitle.trim());
    setNewTaskTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-3xl max-h-[85vh] dashboard-card bg-card text-white flex flex-col overflow-hidden shadow-2xl border-white/20">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/15 flex items-center justify-between bg-black/20">
          <div>
            <h2 className="font-heading font-black text-2xl text-white flex items-center gap-3">
              {customName}
              <span className="badge-pill bg-canvas text-blue border border-blue/40">
                {activeProject.branch}
              </span>
            </h2>
            <p className="text-xs font-mono text-blue mt-1 break-all">{activeProject.path}</p>
            {formattedModDate && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue/80 mt-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span>{formattedModDate}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Launch Actions */}
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => launchTerminal(activeProject.path)}
                title="Apri Terminale"
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-lavender hover:text-white transition-all"
              >
                <Terminal className="w-4 h-4 text-lavender" />
              </button>

              <button
                onClick={() => launchAndroidStudio(activeProject.path)}
                title="Apri in Android Studio"
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-sage hover:text-white transition-all"
              >
                <Smartphone className="w-4 h-4 text-sage" />
              </button>

              <button
                onClick={() => launchAntigravityIDE(activeProject.path)}
                title="Apri in Antigravity IDE"
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-blue hover:text-white transition-all"
              >
                <Sparkles className="w-4 h-4 text-blue" />
              </button>

              <button
                onClick={() => launchVSCode(activeProject.path)}
                title="Apri in VS Code"
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-lavender hover:text-white transition-all"
              >
                <Code2 className="w-4 h-4 text-lavender" />
              </button>
            </div>

            <button
              onClick={() => setActiveProject(null)}
              className="p-2.5 rounded-full hover:bg-white/15 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-white/15 bg-black/10">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`action-pill ${
              activeTab === 'tasks'
                ? 'bg-sand text-canvas font-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Task ({projectTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`action-pill ${
              activeTab === 'notes'
                ? 'bg-sand text-canvas font-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Note Progetto</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'tasks' ? (
            <div className="flex flex-col gap-4">
              <form onSubmit={handleAddTask} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Nuova task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-canvas border border-white/20 text-sm font-semibold rounded-2xl px-5 py-3 focus:border-sand"
                />
                <button
                  type="submit"
                  className="action-pill bg-sand text-canvas font-black hover:bg-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aggiungi</span>
                </button>
              </form>

              <div className="flex flex-col gap-3 mt-2">
                {projectTasks.length === 0 ? (
                  <p className="text-xs text-purple-200/50 text-center py-8">
                    Nessuna task presente per questo progetto.
                  </p>
                ) : (
                  projectTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-black/30 hover:bg-black/40 border border-white/10 group transition-all"
                    >
                      <div
                        onClick={() => toggleTask(t.id)}
                        className="flex items-center gap-3.5 cursor-pointer flex-1"
                      >
                        {t.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-white/40 group-hover:text-white" />
                        )}
                        <span
                          className={`text-sm ${
                            t.completed
                              ? 'line-through text-purple-200/40'
                              : 'text-white font-bold'
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>

                      <button
                        onClick={() => deleteTask(t.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-white/50 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-2">
              <textarea
                value={noteContent}
                onChange={(e) => saveNotes(activeProject.id, e.target.value)}
                placeholder="Scrivi qui appunti e note in formato Markdown..."
                className="w-full h-64 bg-black/40 border-white/20 text-xs font-mono text-white rounded-2xl p-5 resize-none focus:border-white leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
