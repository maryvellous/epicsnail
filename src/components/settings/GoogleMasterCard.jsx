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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CARD 1: ACCOUNT PROFILE */}
          <div className="bg-canvas p-5 rounded-2xl border border-sand/30 flex flex-col justify-between gap-4">
            <div>
              <label className="text-xs font-mono font-bold text-sand uppercase tracking-wider block mb-3">
                1. Profilo Utente Google
              </label>
              <div className="flex items-center gap-3.5">
                {googleStatus.avatarUrl ? (
                  <img src={googleStatus.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-sand" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sand/20 flex items-center justify-center border border-sand/40 shrink-0">
                    <AestheticIdCardIcon className="w-5 h-5 text-sand" />
                  </div>
                )}
                <div className="truncate">
                  <p className="font-bold text-sm text-white truncate">{googleStatus.userName || userName || 'Utente Workspace'}</p>
                  <p className="text-[11px] font-mono text-sand truncate">{googleStatus.userEmail || 'account@google.com'}</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] font-mono text-white/50">
              L'Account Google costituisce l'identita master per l'Hub Workspace ed il contesto di Diaspro AI.
            </p>
          </div>

          {/* CARD 2: WORKSPACE SERVICES */}
          <div className="bg-canvas p-5 rounded-2xl border border-sand/30 flex flex-col justify-between gap-3">
            <div>
              <label className="text-xs font-mono font-bold text-sand uppercase tracking-wider block mb-2">
                2. Servizi Integrati
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Calendar', status: 'Attivo', color: 'text-sage border-sage/40' },
                  { name: 'Tasks', status: 'Attivo', color: 'text-sage border-sage/40' },
                  { name: 'Drive', status: 'Integrazione v3', color: 'text-blue border-blue/40' },
                  { name: 'Docs', status: 'Integrazione v3', color: 'text-blue border-blue/40' },
                ].map((srv, idx) => (
                  <div key={idx} className="p-2 bg-card rounded-xl border border-white/10 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-white truncate">{srv.name}</span>
                    <span className={`text-[9px] font-mono ${srv.color} block`}>{srv.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 3: ACCOUNT ACTIONS */}
          <div className="bg-canvas p-5 rounded-2xl border border-sand/30 flex flex-col justify-between gap-3">
            <div>
              <label className="text-xs font-mono font-bold text-sand uppercase tracking-wider block mb-2">
                3. Gestione Connessione
              </label>
              <p className="text-xs text-white/70 leading-relaxed mb-3">
                Token OAuth 2.0 attivo. Puoi rinfrescare i permessi o disconnettere l'account.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleStartGoogleOAuth}
                disabled={connectingGoogle}
                className="action-pill bg-sand hover:bg-sand/80 text-canvas font-bold text-xs py-2 justify-center w-full shadow-md"
              >
                {connectingGoogle ? 'Aggiornamento...' : 'Rinfresca Permessi'}
              </button>
              <button
                onClick={handleDisconnectGoogle}
                className="action-pill bg-canvas hover:bg-card border border-rose-500/40 text-rose-300 text-xs py-1.5 justify-center w-full"
              >
                Disconnetti Account
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 items-center text-center p-6 bg-canvas rounded-2xl border border-sand/30">
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
