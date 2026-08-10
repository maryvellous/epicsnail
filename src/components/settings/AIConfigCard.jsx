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
    <div className="dashboard-card bg-gradient-to-br from-card to-canvas border-2 border-blue/50 p-7 flex flex-col gap-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-blue/20 pb-3">
        <h2 className="font-heading font-bold text-lg text-white flex items-center gap-3">
          <AestheticKeyIcon className="w-8 h-8 shrink-0 filter drop-shadow-md" />
          Configurazione IA (Multi-Provider BYOK)
        </h2>
        <ShieldCheck className="w-5 h-5 text-sage" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono font-bold text-blue uppercase tracking-wider">
            Provider Selezionato
          </label>
          <select
            value={aiProvider}
            onChange={handleProviderChange}
            className="bg-canvas border border-blue/40 text-white rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-blue cursor-pointer"
          >
            <option value="gemini" className="bg-card text-white">Google Gemini</option>
            <option value="deepseek" className="bg-card text-white">DeepSeek</option>
            <option value="anthropic" className="bg-card text-white">Anthropic (Claude)</option>
            <option value="openai" className="bg-card text-white">OpenAI</option>
            <option value="ollama" className="bg-card text-white">Ollama (Locale)</option>
          </select>
        </div>

        {aiProvider !== 'ollama' && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono font-bold text-blue uppercase tracking-wider">
                Chiave API {providerInfo[aiProvider]?.name}
              </label>
              <a
                href={providerInfo[aiProvider]?.link}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue hover:underline flex items-center gap-1 font-mono"
              >
                Ottieni Chiave <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-3">
              <input
                type="password"
                placeholder={providerInfo[aiProvider]?.placeholder}
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                className="flex-1 bg-canvas border border-blue/30 text-white font-mono text-xs rounded-2xl px-4 py-3 focus:outline-none focus:border-blue"
              />
              <button
                onClick={handleSaveAiKey}
                disabled={testingAi}
                className="action-pill bg-blue text-canvas hover:bg-white font-black disabled:opacity-50 shadow-md"
              >
                {testingAi ? 'Verifica...' : 'Salva & Test'}
              </button>
            </div>
          </div>
        )}

        {aiProvider === 'ollama' && (
          <div className="flex justify-between items-center p-3.5 bg-canvas rounded-2xl border border-white/10">
            <span className="text-xs font-mono text-blue">Endpoint: http://localhost:11434</span>
            <button
              onClick={handleSaveAiKey}
              disabled={testingAi}
              className="action-pill bg-sidebar hover:bg-plum text-white font-bold"
            >
              {testingAi ? 'Verifica...' : 'Test Ollama'}
            </button>
          </div>
        )}

        {aiStatus && (
          <div className={`p-3 rounded-xl border text-xs font-mono font-semibold ${
            aiStatus.success 
              ? 'bg-sage/20 border-sage/50 text-sage' 
              : 'bg-canvas border-terracotta/40 text-terracotta'
          }`}>
            {aiStatus.message || aiStatus.error}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIConfigCard;
