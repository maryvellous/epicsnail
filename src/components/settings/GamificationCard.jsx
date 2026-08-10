import React from 'react';
import { RotateCcw } from 'lucide-react';
import { AestheticChartPieIcon } from '../AestheticIcons';

export function GamificationCard({
  xpRules,
  updateXpRules,
  resetXpRulesToDefault,
  difficulty,
  updateDifficulty,
}) {
  return (
    <div className="dashboard-card bg-gradient-to-br from-card via-canvas to-plum/30 border-2 border-plum/60 p-7 flex flex-col gap-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-plum/40 pb-3">
        <h2 className="font-heading font-bold text-lg text-white flex items-center gap-3">
          <AestheticChartPieIcon className="w-8 h-8 shrink-0 filter drop-shadow-md" />
          Gamification & Regole XP
        </h2>
        <button
          onClick={resetXpRulesToDefault}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold text-sand border border-sand/30 transition-all cursor-pointer shadow-sm"
          title="Ripristina valori consigliati di default"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Ripristina Default</span>
        </button>
      </div>

      {/* Difficulty Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono font-bold text-sand uppercase tracking-wider">
          Difficilita di Progressione Livelli
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'easy', label: 'Facile (0.7x)', desc: 'Progressione rapida' },
            { id: 'normal', label: 'Normale (1.0x)', desc: 'Bilanciamento standard' },
            { id: 'hard', label: 'Difficile (1.5x)', desc: 'Per veri pro' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => updateDifficulty(d.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                difficulty === d.id
                  ? 'bg-plum border-sand shadow-lg text-white font-bold'
                  : 'bg-canvas border-white/10 text-white/70 hover:border-white/30'
              }`}
            >
              <p className="text-xs font-bold text-white">{d.label}</p>
              <span className="text-[10px] text-blue font-mono block mt-0.5">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action XP Rules Grid */}
      <div className="flex flex-col gap-3 pt-2">
        <label className="text-xs font-mono font-bold text-lavender uppercase tracking-wider">
          Punti XP Assegnati per Azione
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'taskComplete', label: 'Task Post-it completata' },
            { key: 'taskCreate', label: 'Creazione nuova task' },
            { key: 'calendarEvent', label: 'Evento Google Calendar' },
            { key: 'aiChat', label: 'Interazione con Chatbot AI' },
            { key: 'spotifySession', label: 'Sessione musica Spotify' },
            { key: 'dailyStreak', label: 'Accesso quotidiano (Streak)' },
          ].map((rule) => (
            <div key={rule.key} className="p-3 bg-canvas rounded-2xl border border-lavender/30 flex items-center justify-between shadow-inner">
              <span className="text-xs font-bold text-white">
                {rule.label}
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={xpRules[rule.key] || 0}
                  onChange={(e) => updateXpRules({ [rule.key]: parseInt(e.target.value) || 1 })}
                  className="w-16 bg-card border border-sand/50 text-center text-xs font-mono font-bold text-sand rounded-xl px-2 py-1 focus:outline-none focus:border-sand"
                />
                <span className="text-[10px] font-mono text-blue">XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GamificationCard;
