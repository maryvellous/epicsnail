import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, RefreshCw, LayoutGrid, ListFilter, CheckCircle2 } from 'lucide-react';
import { AestheticCalendarIcon } from './AestheticIcons';
import { useGamification } from '../context/GamificationContext';

export default function GoogleCalendarWidget() {
  const { addXp } = useGamification();
  
  const [statusInfo, setStatusInfo] = useState({ status: 'disconnected', userEmail: '' });
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [viewMode, setViewMode] = useState('today'); // 'today' | 'tenDays'
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeDayIso, setActiveDayIso] = useState(null);

  const fetchGoogleData = async () => {
    if (!window.electronAPI) return;
    setLoading(true);

    const st = await window.electronAPI.getGoogleStatus();
    setStatusInfo(st);

    if (st.status === 'connected') {
      const resEvents = await window.electronAPI.getGoogleCalendarEvents(30);
      if (resEvents.success) {
        setEvents(resEvents.events || []);
      }
      const resTasks = await window.electronAPI.getGoogleTasks();
      if (resTasks.success) {
        setTasks(resTasks.tasks || []);
      }
    }

    setLoading(false);
  };


  useEffect(() => {
    fetchGoogleData();
  }, []);

  const handleStartOAuth = async () => {
    if (!window.electronAPI) return;
    setConnecting(true);
    const res = await window.electronAPI.startGoogleOAuth();
    setConnecting(false);
    if (res.success) {
      fetchGoogleData();
      addXp(30, 'Google Workspace collegato!');
    } else {
      alert(res.error || 'Errore durante la connessione con Google');
    }
  };

  const handleDisconnect = async () => {
    if (window.electronAPI) {
      await window.electronAPI.disconnectGoogle();
      setStatusInfo({ status: 'disconnected', userEmail: '' });
      setEvents([]);
      setTasks([]);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const title = newEventTitle.trim();
    const timeStr = newEventTime || '12:00';
    if (statusInfo.status === 'connected' && window.electronAPI) {
      setLoading(true);
      const res = await window.electronAPI.createGoogleCalendarEvent({ summary: title, startTime: timeStr });
      setLoading(false);
      if (res.success) {
        setNewEventTitle('');
        setNewEventTime('');
        addXp(15, 'Evento aggiunto a Google Calendar');
        fetchGoogleData();
      } else {
        alert(res.error || 'Impossibile aggiungere l\'evento');
      }
    } else {
      const newEv = {
        id: `ev_${Date.now()}`,
        title: title,
        start: timeStr,
      };
      setEvents([newEv, ...events]);
      setNewEventTitle('');
      setNewEventTime('');
      addXp(15, 'Evento locale creato');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.electronAPI) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      await window.electronAPI.deleteGoogleCalendarEvent(eventId);
    } else {
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
  };

  const handlePostponeTask = async (taskId) => {
    if (window.electronAPI) {
      const res = await window.electronAPI.postponeGoogleTask(taskId);
      if (res.success) {
        addXp(5, 'Task posticipato a domani');
        fetchGoogleData();
      }
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    if (!window.electronAPI) return;
    const newCompleted = !currentStatus;
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t));

    const res = await window.electronAPI.toggleGoogleTask(taskId, newCompleted);
    if (res.success) {
      if (newCompleted) addXp(20, 'Task Google completata!');
    } else {
      // Revert if failed
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: currentStatus } : t));
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !window.electronAPI) return;

    const title = newTaskTitle.trim();
    setNewTaskTitle('');
    const res = await window.electronAPI.createGoogleTask(title);
    if (res.success) {
      addXp(10, 'Nuovo Task Google creato');
      fetchGoogleData();
    } else {
      alert(res.error || 'Impossibile creare il Task');
    }
  };

  const formatEventTime = (isoString) => {
    if (!isoString) return 'Tutto il giorno';
    if (!isoString.includes('T')) return isoString;
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  // Generate 10 days array starting from today
  const getTenDaysList = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      
      // Filter events matching this date
      const dayEvents = (events || []).filter(ev => {
        if (!ev || ev.start === undefined || ev.start === null) return false;
        const startStr = String(ev.start);
        return startStr.startsWith(isoDate) || (i === 0 && !startStr.includes('-'));
      });

      days.push({
        dateObj: d,
        isoDate,
        dayName: d.toLocaleDateString('it-IT', { weekday: 'short' }),
        formattedDate: d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
        events: dayEvents,
        isToday: i === 0,
      });
    }
    return days;
  };

  const tenDays = getTenDaysList();

  return (
    <div className="projects-canvas-container select-none overflow-y-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-black text-3xl text-white flex items-center gap-3">
            <Calendar className="w-7 h-7 text-lavender" />
            Google Calendar & Workspace
          </h1>
          <p className="text-xs text-blue mt-1 font-sans">
            Sincronizzazione eventi di oggi ed agende compattate sui 10 giorni
          </p>
        </div>

        {/* View mode toggle & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-card rounded-2xl border border-white/10 shadow-md">
            <button
              onClick={() => setViewMode('today')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'today'
                  ? 'bg-lavender text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Programma Oggi</span>
            </button>
            <button
              onClick={() => setViewMode('tenDays')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'tenDays'
                  ? 'bg-lavender text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Vista 10 Giorni</span>
            </button>
          </div>

          <button
            onClick={fetchGoogleData}
            disabled={loading}
            className="p-2.5 rounded-full bg-card border border-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50"
            title="Aggiorna dati"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MAIN CALENDAR VIEW AREA */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Add Event Form Header */}
          <div className="dashboard-card bg-card border border-lavender/30 p-6">
            <form onSubmit={handleCreateEvent} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Titolo nuovo evento..."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="flex-1 bg-canvas border border-white/15 text-white text-sm font-semibold rounded-2xl px-5 py-3 placeholder-white/50 focus:outline-none focus:border-lavender"
              />
              <input
                type="text"
                placeholder="Orario (es. 15:00)"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                className="w-full sm:w-36 bg-canvas border border-white/15 text-white text-sm font-semibold rounded-2xl px-5 py-3 placeholder-white/50 focus:outline-none focus:border-lavender"
              />
              <button
                type="submit"
                disabled={loading || !newEventTitle.trim()}
                className="action-pill bg-lavender hover:bg-sidebar text-white font-bold disabled:opacity-50 justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Aggiungi Evento</span>
              </button>
            </form>
          </div>

          {/* VIEW MODE 1: TODAY DETAILED VIEW */}
          {viewMode === 'today' && (
            <div className="dashboard-card bg-card border border-plum/40 p-7 flex flex-col gap-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="font-heading font-bold text-xl text-white flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-sand" />
                  Programma di Oggi
                </h2>
                <span className="text-xs font-mono font-bold text-blue bg-canvas px-3 py-1 rounded-full border border-white/10">
                  {tenDays[0]?.events.length || 0} eventi in agenda
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {events.length === 0 ? (
                  <p className="text-xs font-mono text-white/60 py-6 text-center">Nessun evento in programma per oggi.</p>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl bg-canvas border border-white/10 flex items-center justify-between hover:border-lavender/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-sidebar/40 text-sand border border-lavender/30">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{ev.title}</h3>
                          <span className="text-xs font-mono text-blue">{formatEventTime(ev.start)}</span>
                        </div>
                      </div>

                      {ev.htmlLink && (
                        <a
                          href={ev.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-lavender hover:underline"
                        >
                          Apri in Google Calendar ↗
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: COMPACT 10-DAY HORIZONTAL RIBBON STRIP VIEW */}
          {viewMode === 'tenDays' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-sand" />
                  Striscia 10 Giorni
                </h2>
                <span className="text-xs font-mono text-blue">Clicca su un giorno per i dettagli</span>
              </div>

              {/* HORIZONTAL RIBBON STRIP CONTAINER */}
              <div className="w-full bg-card p-3 rounded-3xl border border-lavender/30 shadow-2xl relative" style={{ minHeight: 140 }}>
                {/* Fixed-height ribbon — never scrolls horizontally */}
                <div className="flex gap-2 overflow-x-hidden items-stretch" style={{ height: 116 }}>
                  {tenDays.map((day) => {
                    const isSelected = activeDayIso === day.isoDate;
                    return (
                      <div
                        key={day.isoDate}
                        onClick={() => setActiveDayIso(isSelected ? null : day.isoDate)}
                        className={`transition-all duration-200 rounded-2xl border p-3 cursor-pointer flex flex-col justify-between flex-1 min-w-0 ${
                          isSelected
                            ? 'bg-plum/80 border-sand shadow-lg'
                            : day.isToday
                            ? 'bg-plum/40 border-sand/50 hover:border-sand/80'
                            : 'bg-canvas border-white/10 hover:border-lavender/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-mono uppercase font-black text-sand">{day.dayName}</span>
                            <span className="text-[11px] font-heading font-bold text-white">{day.formattedDate}</span>
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
                            day.events.length > 0
                              ? 'bg-sage/30 text-sage border-sage/50'
                              : 'bg-black/30 text-white/40 border-white/10'
                          }`}>
                            {day.events.length}ev
                          </span>
                        </div>
                        <div className="mt-1 space-y-0.5 overflow-hidden">
                          {day.events.length === 0 ? (
                            <span className="text-[10px] font-mono text-white/30 italic block">Libero</span>
                          ) : (
                            day.events.slice(0, 2).map((ev) => (
                              <div key={ev.id} className="text-[10px] font-semibold text-white/80 truncate">&bull; {ev.title}</div>
                            ))
                          )}
                          {day.events.length > 2 && (
                            <span className="text-[9px] font-mono text-blue">+{day.events.length - 2}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CLICK OVERLAY — absolute, overlaps the ribbon, no layout shift */}
                {activeDayIso && (() => {
                  const day = tenDays.find(d => d.isoDate === activeDayIso);
                  if (!day) return null;
                  return (
                    <div
                      className="absolute inset-0 rounded-3xl z-20 bg-gradient-to-r from-plum via-card to-canvas border-2 border-lavender shadow-2xl p-5 flex flex-col gap-3 animate-fadeIn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-black text-sm text-sand flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {day.dayName} {day.formattedDate}
                          {day.isToday && <span className="text-[10px] font-mono text-sage bg-sage/20 px-2 py-0.5 rounded-full border border-sage/40">Oggi</span>}
                        </h3>
                        <button
                          onClick={() => setActiveDayIso(null)}
                          className="text-xs font-mono text-white/50 hover:text-white bg-black/30 hover:bg-black/50 px-3 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          &#x2715; Chiudi
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto flex-1">
                        {day.events.length === 0 ? (
                          <p className="text-xs font-mono text-white/60 py-2">Nessun evento registrato per questa data.</p>
                        ) : (
                          day.events.map((ev) => (
                            <div key={ev.id} className="p-3 rounded-xl bg-canvas/80 border border-white/10 text-xs flex justify-between items-center">
                              <div>
                                <p className="font-bold text-white">{ev.title}</p>
                                <span className="text-[10px] font-mono text-blue">{formatEventTime(ev.start)}</span>
                              </div>
                              {ev.htmlLink && (
                                <a href={ev.htmlLink} target="_blank" rel="noreferrer" className="text-[10px] text-lavender hover:underline ml-2 shrink-0">
                                  &#x2197;
                                </a>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}


        </div>

          {/* GOOGLE TASKS INTERACTIVE CARD */}
          {statusInfo.status === 'connected' && (
            <div className="dashboard-card bg-card border border-sage/40 p-6 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-heading font-bold text-base text-sand flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sage" />
                  Google Tasks ({tasks.filter(t => !t.completed).length})
                </h3>
                <span className="text-[10px] font-mono text-sage bg-sage/20 px-2 py-0.5 rounded-full">Sincronizzato</span>
              </div>

              {/* Task list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {tasks.length === 0 ? (
                  <p className="text-xs font-mono text-white/40 text-center py-3">Nessuna task in Google Tasks.</p>
                ) : (
                  tasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTask(t.id, t.completed)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center gap-3 cursor-pointer transition-all ${
                        t.completed
                          ? 'bg-canvas/50 border-white/5 opacity-50 line-through text-white/50'
                          : 'bg-canvas border-white/10 text-white hover:border-sage/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => {}}
                        className="w-4 h-4 rounded accent-sage cursor-pointer"
                      />
                      <span className="truncate flex-1 font-semibold">{t.title}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Create new task form */}
              <form onSubmit={handleCreateTask} className="flex gap-2 pt-1 border-t border-white/10">
                <input
                  type="text"
                  placeholder="+ Aggiungi Task Google..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-canvas border border-white/10 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sage"
                />
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="p-2 rounded-xl bg-sage hover:bg-sage/80 text-canvas font-bold disabled:opacity-30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ACCOUNT CONNECTION & GOOGLE STATUS CARD */}
          <div className="dashboard-card bg-plum border border-lavender/40 p-7 flex flex-col justify-between text-white shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-xl text-sand">
                Google Workspace
              </h2>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                statusInfo.status === 'connected'
                  ? 'bg-sage/30 text-sage border-sage/50'
                  : 'bg-black/30 text-blue border-white/20'
              }`}>
                {statusInfo.status === 'connected' ? 'Connesso' : 'Disconnesso'}
              </span>
            </div>
            
            {statusInfo.status === 'connected' ? (
              <div className="flex flex-col gap-2 font-mono text-xs text-white/90">
                <div className="p-3 bg-canvas/60 rounded-2xl border border-white/10">
                  <p className="font-bold text-sand">Account Google:</p>
                  <p className="text-white text-sm font-semibold truncate">{statusInfo.userEmail || 'Account Collegato'}</p>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-blue">
                  Sincronizzazione attiva con Google Cloud Calendar & Tasks.
                </p>
              </div>
            ) : statusInfo.status === 'expired' ? (
              <div className="flex flex-col gap-2 font-mono text-xs text-white/90">
                <div className="p-3 bg-amber-950/60 border border-amber-400/40 rounded-2xl text-sand">
                  <p className="font-bold">Token Scaduto</p>
                  <p className="text-[11px] text-white/80 mt-1">Riconnettiti in 1-Click per continuare a sincronizzare i tuoi eventi.</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-blue leading-relaxed font-sans">
                Connetti il tuo account Google per caricare i tuoi eventi di Google Calendar e la tua agenda in tempo reale.
              </p>
            )}
          </div>

          <div className="mt-6">
            {statusInfo.status === 'connected' ? (
              <button
                onClick={handleDisconnect}
                className="action-pill bg-white/20 hover:bg-white/30 text-white w-full justify-center"
              >
                <span>Disconnetti Account</span>
              </button>
            ) : (
              <button
                onClick={handleStartOAuth}
                disabled={connecting}
                className="action-pill bg-sand text-canvas hover:bg-white w-full justify-center font-black disabled:opacity-50 shadow-lg"
              >
                <span>{connecting ? 'Attendi Browser...' : 'Connetti Google 1-Click'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
