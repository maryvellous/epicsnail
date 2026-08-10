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

      <form onSubmit={handleAddPath} className="flex gap-3">
        <input
          type="text"
          placeholder="Aggiungi percorso locale..."
          value={newPath}
          onChange={(e) => setNewPath(e.target.value)}
          className="flex-1 bg-canvas border border-sage/30 text-white text-xs font-semibold rounded-2xl px-4 py-3 placeholder-white/40 focus:outline-none focus:border-sage"
        />
        <button type="submit" className="action-pill bg-sage hover:bg-sage/80 text-canvas font-black shadow-md">
          <FolderPlus className="w-4 h-4" />
          <span>Aggiungi</span>
        </button>
      </form>

      <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
        {scanPaths.map((p, idx) => (
          <div
            key={idx}
            className="p-3 rounded-2xl bg-canvas border border-white/10 flex items-center justify-between font-mono text-xs text-white"
          >
            <span className="truncate mr-2">{p}</span>
            <button
              onClick={() => handleRemovePath(idx)}
              className="p-1.5 rounded-xl text-white/50 hover:text-terracotta transition-colors cursor-pointer"
              title="Rimuovi percorso"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScanPathsCard;
