import React, { useState, useEffect } from 'react';
import { Pin, RefreshCw, ExternalLink, Sliders, LayoutGrid, AlertCircle, Layers } from 'lucide-react';
import { PinterestIcon } from './BrandIcons';
import { AestheticHeartIcon } from './AestheticIcons';
import { useGamification } from '../context/GamificationContext';

export default function PinterestView({ onNavigateTab }) {
  const { addXp } = useGamification();
  const [statusInfo, setStatusInfo] = useState({ status: 'disconnected', userName: '' });
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState('all');
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [bookmark, setBookmark] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const checkStatusAndFetchData = async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    setErrorMessage('');
    setBookmark(null);

    try {
      const st = await window.electronAPI.getPinterestStatus();
      setStatusInfo(st);

      if (st.status === 'connected') {
        const boardsRes = await window.electronAPI.getPinterestBoards();
        if (boardsRes.success) {
          setBoards(boardsRes.boards || []);
        }

        const pinsRes = await window.electronAPI.getPinterestPins(
          selectedBoardId === 'all' ? '' : selectedBoardId,
          ''
        );
        if (pinsRes.success) {
          setPins(pinsRes.pins || []);
          setBookmark(pinsRes.bookmark || null);
        } else {
          setErrorMessage(pinsRes.error || 'Impossibile caricare i Pin');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Errore di connessione a Pinterest');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!bookmark || loadingMore || !window.electronAPI) return;
    setLoadingMore(true);
    try {
      const pinsRes = await window.electronAPI.getPinterestPins(
        selectedBoardId === 'all' ? '' : selectedBoardId,
        bookmark
      );
      if (pinsRes.success) {
        setPins(prev => [...prev, ...(pinsRes.pins || [])]);
        setBookmark(pinsRes.bookmark || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    checkStatusAndFetchData();
  }, [selectedBoardId]);

  const handleStartOAuth = async () => {
    if (!window.electronAPI) return;
    setConnecting(true);
    setErrorMessage('');
    const res = await window.electronAPI.startPinterestOAuth();
    setConnecting(false);
    if (res.success) {
      addXp(30, 'Account Pinterest collegato');
      checkStatusAndFetchData();
    } else {
      setErrorMessage(res.error || 'Errore durante la connessione Pinterest');
    }
  };

  const handleDisconnect = async () => {
    if (window.electronAPI) {
      await window.electronAPI.disconnectPinterest();
      setStatusInfo({ status: 'disconnected', userName: '' });
      setPins([]);
      setBoards([]);
    }
  };

  const isConnected = statusInfo.status === 'connected';

  return (
    <div className="projects-canvas-container select-none overflow-y-auto flex flex-col h-full">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-heading font-black text-3xl text-white flex items-center gap-3.5">
            <AestheticHeartIcon className="w-10 h-10 shrink-0 filter drop-shadow-md" />
            Moodboard Pinterest
          </h1>
          <p className="text-xs text-blue mt-1 font-sans">
            Bacheca visiva d'ispirazione per le tue idee e progetti Diaspro Viboard
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Board selector */}
          {isConnected && boards.length > 0 && (
            <div className="relative">
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="appearance-none bg-card text-sand border border-sand/50 rounded-2xl px-4 py-2 pr-9 text-xs font-bold focus:outline-none focus:border-sand cursor-pointer shadow-md"
              >
                <option value="all" className="bg-card text-white">Tutte le bacheche</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id} className="bg-card text-white font-normal">
                    {b.name} ({b.pinCount} pin)
                  </option>
                ))}
              </select>
              <Layers className="w-3.5 h-3.5 text-sand absolute right-3 top-3 pointer-events-none" />
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={checkStatusAndFetchData}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-card border border-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50 shadow-md"
            title="Aggiorna Pin"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sand' : ''}`} />
          </button>
        </div>
      </div>

      {/* DISCONNECTED OR EXPIRED STATE */}
      {!isConnected && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="dashboard-card bg-card border border-plum-muted/40 p-10 max-w-md flex flex-col items-center gap-5 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-canvas border border-plum/40 flex items-center justify-center shadow-lg">
              <PinterestIcon className="w-8 h-8 text-plum" />
            </div>

            <div>
              <h2 className="font-heading font-bold text-xl text-white">Connetti il tuo Pinterest</h2>
              <p className="text-xs text-blue font-sans leading-relaxed mt-2">
                Sincronizza le tue bacheche visive d'ispirazione direttamente in Diaspro Viboard in 1-Click via browser.
              </p>
            </div>

            {errorMessage && (
              <p className="text-xs font-mono text-terracotta bg-canvas/80 p-3 rounded-xl border border-terracotta/30">
                {errorMessage}
              </p>
            )}

            <button
              onClick={handleStartOAuth}
              disabled={connecting}
              className="action-pill bg-plum hover:bg-plum/80 text-white font-black w-full justify-center disabled:opacity-50 shadow-lg"
            >
              <span>{connecting ? 'Attendi Browser...' : 'Connetti Pinterest in 1-Click'}</span>
            </button>
          </div>
        </div>
      )}

      {/* LOADING SKELETON */}
      {isConnected && loading && pins.length === 0 && (
        <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-4 space-y-4 pb-12">
          {[180, 260, 210, 320, 190, 240, 300, 220].map((h, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-3xl bg-card/60 border border-white/10 animate-pulse"
              style={{ height: h }}
            />
          ))}
        </div>
      )}

      {/* EMPTY PINS STATE */}
      {isConnected && !loading && pins.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="dashboard-card bg-card border border-white/10 p-8 max-w-sm flex flex-col items-center gap-3">
            <LayoutGrid className="w-10 h-10 text-sand/50" />
            <p className="text-sm font-bold text-white">Nessun Pin trovato</p>
            <p className="text-xs text-blue">
              Non sono stati trovati Pin per la bacheca selezionata. Seleziona un'altra bacheca o aggiungi immagini su Pinterest.
            </p>
          </div>
        </div>
      )}

      {/* MASONRY GRID OF PINS */}
      {isConnected && pins.length > 0 && (
        <div className="flex flex-col gap-8 pb-12">
          <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-4 space-y-4">
            {pins.map((pin, idx) => (
              <div
                key={`${pin.id}-${idx}`}
                className="break-inside-avoid group relative rounded-3xl overflow-hidden bg-card border border-plum-muted/30 shadow-xl hover:border-sand transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Image */}
                {pin.imageUrl ? (
                  <img
                    src={pin.imageUrl}
                    alt={pin.title}
                    loading="lazy"
                    className="w-full object-cover rounded-3xl group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-48 bg-canvas flex items-center justify-center text-white/30 text-xs font-mono">
                    Senza immagine
                  </div>
                )}

                {/* Glassmorphism Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-canvas/95 via-canvas/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end gap-2">
                  <h3 className="font-heading font-black text-sm text-sand line-clamp-2 leading-tight">
                    {pin.title}
                  </h3>
                  {pin.description && (
                    <p className="text-[11px] text-blue line-clamp-2 font-sans">
                      {pin.description}
                    </p>
                  )}
                  {pin.link && (
                    <a
                      href={pin.link}
                      target="_blank"
                      rel="noreferrer"
                      className="action-pill bg-sand text-canvas hover:bg-sand/80 font-bold text-[11px] py-1.5 px-3 self-start mt-1 shadow-md flex items-center gap-1.5"
                    >
                      <span>Apri su Pinterest</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {bookmark && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="action-pill bg-card border border-sand/40 text-sand hover:bg-sand hover:text-canvas font-bold px-6 py-2.5 shadow-lg disabled:opacity-50 transition-all"
              >
                {loadingMore ? 'Caricamento altri Pin...' : 'Carica altri Pin'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
