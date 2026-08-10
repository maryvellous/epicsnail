import React from 'react';
import { GoogleIcon } from '../BrandIcons';
import { AestheticIdCardIcon } from '../AestheticIcons';

export function GoogleMasterCard({
  googleStatus,
  userName,
  connectingGoogle,
  handleStartGoogleOAuth,
  handleDisconnectGoogle,
}) {
  return (
    <div className="dashboard-card bg-gradient-to-br from-card via-canvas to-sand/10 border-2 border-sand/60 p-7 flex flex-col gap-5 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-sand/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sand/20 rounded-2xl border border-sand/40">
            <GoogleIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-white">Account Google Master</h2>
            <p className="text-xs text-sand font-mono">Identita Primaria & Workspace Hub</p>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
          googleStatus.status === 'connected'
            ? 'bg-sage/30 border-sage text-sage'
            : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
        }`}>
          {googleStatus.status === 'connected' ? 'Master Connesso' : 'Disconnesso'}
        </span>
      </div>

      {googleStatus.status === 'connected' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 bg-canvas rounded-2xl border border-white/10">
            <div className="flex items-center gap-3.5">
              {googleStatus.avatarUrl ? (
                <img src={googleStatus.avatarUrl} alt="Avatar" className="w-11 h-11 rounded-full border-2 border-sand" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-sand/20 flex items-center justify-center border border-sand/40">
                  <AestheticIdCardIcon className="w-6 h-6 text-sand" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-white">{googleStatus.userName || userName || 'Utente Workspace'}</p>
                <p className="text-xs font-mono text-sand">{googleStatus.userEmail || 'account@google.com'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartGoogleOAuth}
                disabled={connectingGoogle}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-sand border border-sand/30 transition-all"
              >
                {connectingGoogle ? 'Aggiornamento...' : 'Rinfresca Permessi'}
              </button>
              <button
                onClick={handleDisconnectGoogle}
                className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold transition-all"
              >
                Disconnetti
              </button>
            </div>
          </div>

          {/* Workspace Services Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono font-bold text-sand uppercase tracking-wider">
              Servizi Workspace Integrati
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { name: 'Google Calendar', status: 'Attivo', color: 'text-sage border-sage/40' },
                { name: 'Google Tasks', status: 'Attivo', color: 'text-sage border-sage/40' },
                { name: 'Google Drive', status: 'Integrazione v3', color: 'text-blue border-blue/40' },
                { name: 'Google Docs', status: 'Integrazione v3', color: 'text-blue border-blue/40' },
                { name: 'Google Keep', status: 'Integrazione v3', color: 'text-blue border-blue/40' },
              ].map((srv, idx) => (
                <div key={idx} className="p-2.5 bg-canvas rounded-xl border border-white/10 flex flex-col justify-between">
                  <span className="text-xs font-bold text-white">{srv.name}</span>
                  <span className={`text-[10px] font-mono ${srv.color} mt-1 block`}>{srv.status}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-white/60 font-mono bg-black/20 p-3 rounded-xl border border-white/5">
            L'Account Google costituisce l'identita master per l'Hub Workspace ed il contesto di Diaspro AI.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 items-center text-center p-4">
          <p className="text-xs text-white/80">
            Nessun Account Google attualmente collegato. Collega il tuo account per attivare la suite di strumenti.
          </p>
          <button
            onClick={handleStartGoogleOAuth}
            disabled={connectingGoogle}
            className="action-pill bg-sand hover:bg-sand/80 text-canvas font-bold shadow-lg"
          >
            <GoogleIcon className="w-5 h-5" />
            <span>{connectingGoogle ? 'Attendi Browser...' : 'Connetti Account Google Master'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default GoogleMasterCard;
