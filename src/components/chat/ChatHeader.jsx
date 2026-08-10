import React from 'react';
import { AestheticCommentsIcon } from '../AestheticIcons';
import { History, Sliders, ChevronDown } from 'lucide-react';
import { PROVIDER_TIERS } from '../../constants/providers';

export default function ChatHeader({
  isHistorySidebarOpen,
  onToggleHistorySidebar,
  activeContextProjectId,
  onContextProjectChange,
  projects,
  activeProvider,
  onProviderChange,
  activeTier,
  onTierChange,
  onOpenContextModal
}) {
  return (
    <header className="h-16 px-6 pr-36 bg-card border-b border-plum/50 flex items-center justify-between z-20 shadow-xl drag-region">
      <div className="flex items-center gap-3 no-drag">
        <button
          onClick={onToggleHistorySidebar}
          className="p-2 rounded-xl bg-canvas border border-white/10 text-sand hover:bg-sidebar transition-all cursor-pointer"
          title="Cronologia & Archivio Chat"
        >
          <History className="w-4 h-4" />
        </button>

        <AestheticCommentsIcon className="w-10 h-10 shrink-0 filter drop-shadow-md" />

        <div>
          <h1 className="font-heading font-black text-base text-white leading-tight">
            Diaspro AI
          </h1>
          <p className="text-[11px] text-lavender">Assistente integrato Diaspro Viboard</p>
        </div>
      </div>

      {/* CONTROLS HEADER (Context Pill Dropdown, Provider & Tier) */}
      <div className="flex items-center gap-3 no-drag">
        
        {/* CONTEXT PILL DROPDOWN */}
        <div className="relative">
          <select
            value={activeContextProjectId}
            onChange={(e) => onContextProjectChange(e.target.value)}
            className="appearance-none bg-plum text-sand border border-sand/50 hover:border-sand rounded-2xl px-3.5 py-1.5 pr-8 text-xs font-black focus:outline-none focus:ring-2 focus:ring-sand cursor-pointer shadow-md"
          >
            <option value="none" className="bg-card text-white/70">Nessun Contesto</option>
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id} className="bg-card text-white font-normal">
                Contesto: {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-sand absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Provider Selector */}
        <div className="relative hidden md:block">
          <select
            value={activeProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="appearance-none bg-canvas text-blue border border-lavender/40 hover:border-lavender rounded-2xl px-3.5 py-1.5 pr-8 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-lavender cursor-pointer shadow-inner"
          >
            <option value="gemini">Google Gemini</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="openai">OpenAI GPT</option>
            <option value="deepseek">DeepSeek</option>
            <option value="ollama">Ollama (Locale)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-blue absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Active Tier Selector */}
        <div className="relative">
          <select
            value={activeTier}
            onChange={(e) => onTierChange(e.target.value)}
            className="appearance-none bg-sidebar text-white border border-white/20 hover:border-white rounded-2xl px-3.5 py-1.5 pr-8 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-lavender cursor-pointer shadow-md"
          >
            {(PROVIDER_TIERS[activeProvider] || []).map(t => (
              <option key={t.id} value={t.id} className="bg-card text-white font-normal">
                {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-white absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Context Config Button */}
        <button
          onClick={onOpenContextModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-canvas hover:bg-sidebar border border-white/20 text-xs font-bold text-white transition-all cursor-pointer shadow-md active:scale-95"
          title="Configurazione Manuale Contesto & System Instructions"
        >
          <Sliders className="w-4 h-4 text-sand" />
        </button>
      </div>
    </header>
  );
}
