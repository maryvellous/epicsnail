import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { AestheticKeyIcon } from '../AestheticIcons';
import { PROVIDER_INFO as providerInfo } from '../../constants/providers';

export function AIConfigCard({
  aiProvider,
  aiKey,
  setAiKey,
  aiStatus,
  testingAi,
  handleProviderChange,
  handleSaveAiKey,
}) {
  return (
    <div className="dashboard-card bg-gradient-to-br from-card to-canvas border-2 border-blue/50 p-7 flex flex-col gap-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-blue/20 pb-3">
        <h2 className="font-heading font-bold text-lg text-white flex items-center gap-3">
          <AestheticKeyIcon className="w-8 h-8 shrink-0 filter drop-shadow-md" />
          Configurazione IA (Multi-Provider BYOK)
        </h2>
        <ShieldCheck className="w-5 h-5 text-sage" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: PROVIDER SELECTOR */}
        <div className="bg-canvas p-5 rounded-2xl border border-blue/30 flex flex-col justify-between gap-3">
          <div>
            <label className="text-xs font-mono font-bold text-blue uppercase tracking-wider block mb-2">
              1. Provider Selezionato
            </label>
            <select
              value={aiProvider}
              onChange={handleProviderChange}
              className="w-full bg-card border border-blue/40 text-white rounded-xl px-3.5 py-2.5 font-bold text-xs focus:outline-none focus:border-blue cursor-pointer"
            >
              <option value="gemini" className="bg-card text-white">Google Gemini</option>
              <option value="deepseek" className="bg-card text-white">DeepSeek</option>
              <option value="anthropic" className="bg-card text-white">Anthropic (Claude)</option>
              <option value="openai" className="bg-card text-white">OpenAI</option>
              <option value="ollama" className="bg-card text-white">Ollama (Locale)</option>
            </select>
          </div>
          <p className="text-[10px] font-mono text-white/50">
            Scegli il motore di intelligenza artificiale per l'assistente Diaspro AI.
          </p>
        </div>

        {/* CARD 2: API KEY FORM */}
        <div className="bg-canvas p-5 rounded-2xl border border-blue/30 flex flex-col justify-between gap-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono font-bold text-blue uppercase tracking-wider">
                2. Chiave API {providerInfo[aiProvider]?.name}
              </label>
              {aiProvider !== 'ollama' && (
                <a
                  href={providerInfo[aiProvider]?.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue hover:underline flex items-center gap-1 font-mono"
                >
                  Ottieni <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {aiProvider !== 'ollama' ? (
              <input
                type="password"
                placeholder={providerInfo[aiProvider]?.placeholder}
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                className="w-full bg-card border border-blue/30 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue"
              />
            ) : (
              <span className="text-xs font-mono text-blue block py-1.5">Endpoint: http://localhost:11434</span>
            )}
          </div>

          <button
            onClick={handleSaveAiKey}
            disabled={testingAi}
            className="action-pill bg-blue text-canvas hover:bg-white font-black text-xs py-2 justify-center w-full shadow-md disabled:opacity-50"
          >
            {testingAi ? 'Verifica...' : 'Salva & Test Key'}
          </button>
        </div>

        {/* CARD 3: STATUS & DIAGNOSTICS */}
        <div className="bg-canvas p-5 rounded-2xl border border-blue/30 flex flex-col justify-between gap-3">
          <div>
            <label className="text-xs font-mono font-bold text-blue uppercase tracking-wider block mb-2">
              3. Stato Connessione
            </label>
            {aiStatus ? (
              <div className={`p-3 rounded-xl border text-xs font-mono font-semibold ${
                aiStatus.success 
                  ? 'bg-sage/20 border-sage/50 text-sage' 
                  : 'bg-card border-terracotta/40 text-terracotta'
              }`}>
                {aiStatus.message || aiStatus.error}
              </div>
            ) : (
              <p className="text-xs font-mono text-white/50 italic py-2">In attesa di verifica API Key...</p>
            )}
          </div>
          <span className="text-[10px] font-mono text-white/40">Sicurezza BYOK: la chiave rimane criptata nel tuo sistema locale.</span>
        </div>
      </div>
    </div>
  );
}

export default AIConfigCard;
