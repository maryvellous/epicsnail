import React from 'react';
import { FolderPlus, Trash2 } from 'lucide-react';
import { AestheticImacIcon } from '../AestheticIcons';

export function ScanPathsCard({
  scanPaths,
  newPath,
  setNewPath,
  handleAddPath,
  handleRemovePath,
}) {
  return (
    <div className="dashboard-card bg-gradient-to-br from-card to-canvas border-2 border-sage/50 p-7 flex flex-col gap-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-sage/25 pb-3">
        <h2 className="font-heading font-bold text-lg text-white flex items-center gap-3">
          <AestheticImacIcon className="w-8 h-8 shrink-0 filter drop-shadow-md" />
          Percorsi Scansione Disco
        </h2>
        <span className="text-xs font-mono font-bold text-sage bg-sage/20 px-3 py-1 rounded-full border border-sage/40">
          {scanPaths.length} percorsi attivi
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: ADD PATH FORM */}
        <div className="bg-canvas p-5 rounded-2xl border border-sage/30 flex flex-col justify-between gap-3">
          <div>
            <label className="text-xs font-mono font-bold text-sage uppercase tracking-wider block mb-2">
              Aggiungi Cartella di Scansione
            </label>
            <p className="text-xs text-white/70 mb-3">
              Diaspro Viboard analizza queste cartelle sul tuo disco locale per rilevare automaticamente repository Git e progetti.
            </p>
            <form onSubmit={handleAddPath} className="flex gap-2">
              <input
                type="text"
                placeholder="Es. C:\Progetti\Codice"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className="flex-1 bg-card border border-sage/30 text-white text-xs font-semibold rounded-xl px-3 py-2.5 placeholder-white/40 focus:outline-none focus:border-sage"
              />
              <button type="submit" className="action-pill bg-sage hover:bg-sage/80 text-canvas font-black text-xs py-2 px-3 shadow-md">
                <FolderPlus className="w-4 h-4" />
                <span>+ Aggiungi</span>
              </button>
            </form>
          </div>
        </div>

        {/* CARD 2: ACTIVE PATHS LIST */}
        <div className="bg-canvas p-5 rounded-2xl border border-sage/30 flex flex-col justify-between gap-3">
          <div>
            <label className="text-xs font-mono font-bold text-sage uppercase tracking-wider block mb-2">
              Cartelle Attive ({scanPaths.length})
            </label>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
              {scanPaths.length === 0 ? (
                <p className="text-xs font-mono text-white/40 italic py-2">Nessun percorso registrato.</p>
              ) : (
                scanPaths.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-card border border-white/10 flex items-center justify-between font-mono text-xs text-white"
                  >
                    <span className="truncate mr-2 text-[11px]">{p}</span>
                    <button
                      onClick={() => handleRemovePath(idx)}
                      className="p-1 rounded-lg text-white/50 hover:text-terracotta transition-colors cursor-pointer shrink-0"
                      title="Rimuovi percorso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScanPathsCard;
