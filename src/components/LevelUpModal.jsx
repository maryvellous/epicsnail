import React from 'react';
import { Trophy, Sparkles, Award, ArrowRight, X } from 'lucide-react';
import { useGamification } from '../context/GamificationContext';

export default function LevelUpModal() {
  const { levelUpModalData, closeLevelUpModal } = useGamification();

  if (!levelUpModalData) return null;

  const { newLevel, rank } = levelUpModalData;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
      <div className="bg-gradient-to-b from-plum via-card to-canvas border-2 border-sand rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={closeLevelUpModal}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Floating Badge */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sand to-plum-muted mx-auto flex items-center justify-center shadow-2xl border-4 border-white/20 animate-bounce">
          <Trophy className="w-10 h-10 text-canvas" />
        </div>

        {/* Level Up Announcement */}
        <div>
          <span className="text-xs font-mono font-black uppercase tracking-widest text-sand bg-sand/20 px-4 py-1.5 rounded-full border border-sand/40">
            LEVEL UP!
          </span>
          <h2 className="font-heading font-black text-4xl text-white mt-3">
            LIVELLO {newLevel}
          </h2>
          <p className="text-sm font-semibold text-blue mt-1">
            Complimenti! Hai raggiunto un nuovo traguardo di produttività.
          </p>
        </div>

        {/* Rank Card */}
        <div className="p-5 bg-canvas/90 rounded-2xl border border-white/15 space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sidebar text-sand">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-blue uppercase tracking-wider block">Nuovo Titolo Riconosciuto</span>
              <h3 className="font-heading font-black text-lg text-sand">{rank.title}</h3>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/80">
            <span>Privilegio sbloccato:</span>
            <span className="font-bold text-sage">{rank.perk}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={closeLevelUpModal}
          className="action-pill bg-sand hover:bg-white text-canvas font-black text-sm w-full justify-center py-3.5 shadow-2xl active:scale-95 transition-all"
        >
          <span>Continua la Produttività</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>

      </div>
    </div>
  );
}
