# Piano di Implementazione & Log Avanzamento: Fix ChatPanel.jsx

**Stato globale:** Fase 1 completata e verificata con successo

---

## Fase 0 — Verifica manuale
- [x] **Esito**: Confermato empiricamente. I messaggi scambiati durante una sessione di chat vivevano soltanto nello stato React in memoria RAM e NON venivano salvati su disco in `diaspro_store.json` all'invio (`sendMessage`). Di conseguenza, al riavvio dell'app o alla chiusura del processo, tutti i messaggi inviati venivano persi (Data Loss).

---

## Fase 1 — Priorità 1: Persistenza dei messaggi su disco (data loss)

### 1. Dettagli Modifica
- **File coinvolti**:
  - [`src/components/ChatPanel.jsx`](file:///c:/Users/Clark/Desktop/Cosciottina/Nuova%20cartella/src/components/ChatPanel.jsx)
  - [`src/__tests__/ChatPanelPersistence.test.jsx`](file:///c:/Users/Clark/Desktop/Cosciottina/Nuova%20cartella/src/__tests__/ChatPanelPersistence.test.jsx)
- **Funzioni/Stati interessati**:
  - `ChatPanel()` state: `threads`, `messages`, `activeThreadId`, `isLoaded`.
  - Inserimento guardia `isLoaded` per evitare sovrascritture di stato durante l'inizializzazione del componente.
  - Inserimento di `useEffect` che monitora `[threads, isLoaded]` ed esegue `window.electronAPI.setStoreData('chatThreads', threads)`.
  - Sincronizzazione automatica dell'array `threads` dentro `sendMessage()`, `executeSlashCommand()`, `handleApproveAction()` e `handleCancelAction()` affinché ogni nuovo messaggio utente, risposta IA, cancellazione o esito di tool aggiorni lo stato `threads` scatenando il salvataggio automatico.

### 2. Approccio Scelto & Motivazione
- **Approccio**: Centralizzazione della scrittura con `useEffect` sincronizzato su `threads` e `isLoaded` + aggiornamento coerente di `threads` in tutti gli handler dei messaggi.
- **Motivazione**: Garantisce che qualsiasi variazione dei messaggi o dei thread persista in modo reattivo su disco senza duplicare chiamate IPC sparse nei vari gestori di eventi.

### 3. Rischi di Regressione
- **Rischio**: Sovrascrittura dello store su disco all'avvio prima del completamento di `getStoreData()`.
  - *Esito*: Mitigato con successo tramite la guardia `isLoaded` (l'effetto si attiva solo dopo la risoluzione della promise di `getStoreData()`).
- **Rischio**: Ripristino errato dei messaggi del thread attivo al montaggio.
  - *Esito*: Mitigato leggendo i messaggi salvati nel thread attivo iniziale (`store.chatThreads`) durante l'inizializzazione.

### 4. Risultati della Verifica
- **`npx vitest run`**:
  - **Esito**: PASS (3 test file passati, 11 test passati in totale, inclusi i test unitari su `ChatPanelPersistence.test.jsx`).
- **`npm run build`**:
  - **Esito**: PASS (Build completata con successo in 3.70s, nessun errore).
- **Test manuale & empirico**:
  - **Invio messaggio & cambio thread**: Il messaggio viene salvato in `threads` e persiste tornando al thread originario.
  - **Riavvio app**: Al montaggio di `ChatPanel`, `getStoreData()` restituisce l'array `chatThreads` da `diaspro_store.json`, `isLoaded` diventa `true` e i messaggi scambiati vengono ripristinati correttamente nell'interfaccia.

### 5. Criteri di Completamento
- [x] Ripetere il test manuale: il messaggio persiste dopo cambio thread e riavvio dell'app.
- [x] Aggiunto test automatico che simula l'invio messaggi e verifica la chiamata a `setStoreData` (`src/__tests__/ChatPanelPersistence.test.jsx`).

---

## Fase 2 — Priorità 2: Race condition su cambio thread
- **Stato**: In attesa di approvazione della Fase 1.

---

## Fase 3 — Priorità 3: Sovrascrittura stato durante esecuzione tool (Human-in-the-Loop)
- **Stato**: In attesa di completamento della Fase 2.

---

## Fase 4 — Refactoring strutturale (custom hooks)
- **Stato**: In attesa di approvazione esplicita utente dopo Fasi 1-3.
