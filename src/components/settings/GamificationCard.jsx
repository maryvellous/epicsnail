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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: DIFFICULTY SELECTOR */}
        <div className="bg-canvas p-5 rounded-2xl border border-plum/40 flex flex-col justify-between gap-3">
          <div>
            <label className="text-xs font-mono font-bold text-sand uppercase tracking-wider block mb-3">
              1. Difficilita Livelli
            </label>
            <div className="flex flex-col gap-2">
              {[
                { id: 'easy', label: 'Facile (0.7x)', desc: 'Progressione rapida' },
                { id: 'normal', label: 'Normale (1.0x)', desc: 'Standard' },
                { id: 'hard', label: 'Difficile (1.5x)', desc: 'Per veri pro' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => updateDifficulty(d.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    difficulty === d.id
                      ? 'bg-plum border-sand shadow-lg text-white font-bold'
                      : 'bg-card border-white/10 text-white/70 hover:border-white/30'
                  }`}
                >
                  <p className="text-xs font-bold text-white">{d.label}</p>
                  <span className="text-[9px] text-blue font-mono block">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: XP RULES PART 1 */}
        <div className="bg-canvas p-5 rounded-2xl border border-plum/40 flex flex-col justify-between gap-3">
          <div>
            <label className="text-xs font-mono font-bold text-lavender uppercase tracking-wider block mb-3">
              2. XP Produttivita
            </label>
            <div className="flex flex-col gap-2.5">
              {[
                { key: 'taskComplete', label: 'Task Post-it completata' },
                { key: 'taskCreate', label: 'Creazione nuova task' },
                { key: 'calendarEvent', label: 'Evento Google Calendar' },
              ].map((rule) => (
                <div key={rule.key} className="p-2.5 bg-card rounded-xl border border-lavender/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate mr-2">{rule.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={xpRules[rule.key] || 0}
                      onChange={(e) => updateXpRules({ [rule.key]: parseInt(e.target.value) || 1 })}
                      className="w-14 bg-canvas border border-sand/50 text-center text-xs font-mono font-bold text-sand rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-sand"
                    />
                    <span className="text-[9px] font-mono text-blue">XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 3: XP RULES PART 2 */}
        <div className="bg-canvas p-5 rounded-2xl border border-plum/40 flex flex-col justify-between gap-3">
          <div>
            <label className="text-xs font-mono font-bold text-lavender uppercase tracking-wider block mb-3">
              3. XP Interaction & Daily
            </label>
            <div className="flex flex-col gap-2.5">
              {[
                { key: 'aiChat', label: 'Interazione Chatbot AI' },
                { key: 'spotifySession', label: 'Sessione musica Spotify' },
                { key: 'dailyStreak', label: 'Streak accesso giornaliero' },
              ].map((rule) => (
                <div key={rule.key} className="p-2.5 bg-card rounded-xl border border-lavender/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate mr-2">{rule.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={xpRules[rule.key] || 0}
                      onChange={(e) => updateXpRules({ [rule.key]: parseInt(e.target.value) || 1 })}
                      className="w-14 bg-canvas border border-sand/50 text-center text-xs font-mono font-bold text-sand rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-sand"
                    />
                    <span className="text-[9px] font-mono text-blue">XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GamificationCard;
