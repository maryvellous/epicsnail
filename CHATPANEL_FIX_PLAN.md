# Piano di Implementazione & Log Avanzamento: Fix ChatPanel.jsx

**Stato globale:** Fasi 1, 2 e 3 completate e verificate con successo. In attesa di approvazione utente per la Fase 4.

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
- **`npx vitest run`**: PASS (3 test file passati, 11 test passati in totale).
- **`npm run build`**: PASS (Build completata con successo in 3.70s, zero errori).
- **Test manuale & empirico**: PASS (Messaggi salvati in `chatThreads` e ripristinati al riavvio).

### 5. Criteri di Completamento
- [x] Ripetere il test manuale: il messaggio persiste dopo cambio thread e riavvio dell'app.
- [x] Aggiunto test automatico che simula l'invio messaggi e verifica la chiamata a `setStoreData` (`src/__tests__/ChatPanelPersistence.test.jsx`).

---

## Fase 2 — Priorità 2: Race condition su cambio thread

### 1. Dettagli Modifica
- **File coinvolti**:
  - [`src/components/ChatPanel.jsx`](file:///c:/Users/Clark/Desktop/Cosciottina/Nuova%20cartella/src/components/ChatPanel.jsx)
  - [`src/__tests__/ChatPanelThreadRace.test.jsx`](file:///c:/Users/Clark/Desktop/Cosciottina/Nuova%20cartella/src/__tests__/ChatPanelThreadRace.test.jsx)
- **Funzioni/Stati interessati**:
  - `sendMessage()`, `handleApproveAction()`, `handleCancelAction()`.
  - Cattura esplicita di `targetThreadId = activeThreadId` al momento dell'avvio della chiamata asincrona.
  - Aggiornamento mirato dell'array `threads` per `targetThreadId` indipendentemente dal thread attualmente visualizzato.
  - Condizionamento dell'aggiornamento dello stato `messages` visibile a schermo unicamente se `activeThreadId` coincide ancora con `targetThreadId`.

### 2. Approccio Scelto & Motivazione
- **Approccio**: Closure del `targetThreadId` all'inizio dell'azione + aggiornamento condizionale della vista principale.
- **Motivazione**: Se l'utente cambia thread mentre l'IA sta rispondendo, la risposta dell'IA deve comunque essere salvata in background nel thread di origine (così quando l'utente torna su quel thread trova la risposta pronta), ma NON deve inquinare né la vista corrente né l'array dei messaggi del nuovo thread attivo.

### 3. Rischi di Regressione
- **Rischio**: Se l'utente torna al thread originario prima che la chiamata asincrona finisca, l'aggiornamento a schermo della risposta deve avvenire correttamente senza rimanere bloccato.
  - *Esito*: Verificato con successo tramite check funzionale `setActiveThreadId(currentActive => { if (currentActive === targetThreadId) setMessages(...); return currentActive; })`.

### 4. Risultati della Verifica
- **`npx vitest run`**: PASS (4 test file passati, 12 test passati in totale, incluso `ChatPanelThreadRace.test.jsx`).
- **`npm run build`**: PASS (Build completata con successo in 3.17s, zero errori).
- **Test manuale & empirico**: PASS (Inviando un messaggio e cambiando subito thread, la risposta viene immagazzinata nel thread di origine e la vista del nuovo thread rimane incontaminata).

### 5. Criteri di Completamento
- [x] Test manuale: inviare un messaggio, cambiare thread immediatamente prima che arrivi la risposta, verificare che la risposta compaia nel thread corretto (quello originale) e non in quello attivo.
- [x] Aggiunto test automatico che simula lo scenario di cambio thread asincrono (`src/__tests__/ChatPanelThreadRace.test.jsx`).

---

## Fase 3 — Priorità 3: Sovrascrittura stato durante esecuzione tool (Human-in-the-Loop)

### 1. Dettagli Modifica
- **File coinvolti**:
  - [`src/components/ChatPanel.jsx`](file:///c:/Users/Clark/Desktop/Cosciottina/Nuova%20cartella/src/components/ChatPanel.jsx)
  - [`src/__tests__/ChatPanelPendingAction.test.jsx`](file:///c:/Users/Clark/Desktop/Cosciottina/Nuova%20cartella/src/__tests__/ChatPanelPendingAction.test.jsx)
- **Funzioni/Stati interessati**:
  - Calcolo derivato `hasPendingAction = messages.some(m => m.pendingAction && m.pendingAction.status === 'pending')`.
  - `sendMessage()`: Blocco invio se `hasPendingAction` è vero.
  - Input bar & Textarea: Disabilitazione ed indicazione visiva utente quando un'azione Human-in-the-Loop è in attesa di conferma.

### 2. Approccio Scelto & Motivazione
- **Approccio**: Opzione A della roadmap — Disabilitazione dell'invio di nuovi messaggi e dell'input di testo finché esiste una card con `pendingAction.status === 'pending'`.
- **Motivazione**: È la soluzione UX più chiara ed evita la sovrascrittura di stati concorrenti dovuti alla sovrapposizione tra la risposta del nuovo messaggio e l'esito dell'azione approvata.

### 3. Rischi di Regressione
- **Rischio**: Blocco permanente dell'input se la richiesta di approvazione rimanesse bloccata in stato `'pending'`.
  - *Esito*: Mitigato con successo. I pulsanti "Approva ed Esegui" e "Annulla" aggiornano lo stato dell'azione in `'executing'`, `'completed'`, `'cancelled'` o `'error'`, sbloccando immediatamente l'input.

### 4. Risultati della Verifica
- **`npx vitest run`**: PASS (5 test file passati, 14 test passati in totale, incluso `ChatPanelPendingAction.test.jsx`).
- **`npm run build`**: PASS (Build completata con successo in 3.07s, zero errori).
- **Test manuale & empirico**: PASS (Generando una card tool pending, l'input viene visivamente disabilitato ed i messaggi non possono essere inviati finché la card non viene approvata o annullata).

### 5. Criteri di Completamento
- [x] Test manuale: generare una card tool pending, verificare che l'invio di un nuovo messaggio sia bloccato finché non si approva/annulla l'azione, ed eseguire l'azione verificando che l'esito non venga perso.
- [x] Aggiunto test automatico che simula il blocco invio con pending action (`src/__tests__/ChatPanelPendingAction.test.jsx`).

---

## Fase 4 — Refactoring strutturale (custom hooks)
- **Stato**: In attesa di approvazione esplicita utente dopo la revisione delle Fasi 1, 2 e 3.
