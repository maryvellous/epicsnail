# Roadmap: Viboard — Verso il Livello Successivo

Roadmap consolidata di tutti i miglioramenti identificati nelle sessioni di analisi con Claude. Organizzata per priorità, non per ordine cronologico di scoperta. Ogni voce ha un livello di urgenza e un'indicazione dell'entità dell'intervento.

**Nota di processo**: come da regole globali, questo file contiene solo attività pianificate (`[ ]`). Non va usato per tracciare cosa è già stato fatto — per quello ci sono i commit Git e `CHATPANEL_FIX_PLAN.md`.

---

## 🔴 Priorità Alta — Bug attivi con impatto sull'esperienza utente

### 1. Uniformare la gestione dei risultati dei tool AI tra i provider
**File coinvolto:** `electron/aiEngine.js`

- [ ] **Problema**: `callGemini` e `callOpenAICompatible` (quindi anche DeepSeek) iniettano il risultato grezzo di un tool read-only (es. `get_local_projects`) direttamente come blocco JSON in chat, invece di ridare il risultato all'IA per una risposta in linguaggio naturale. Solo `callAnthropic` fa il secondo giro corretto verso l'LLM.
- [ ] Estendere il pattern "tool result → richiamata LLM di follow-up → risposta naturale" (già presente in `callAnthropic`) anche a `callGemini` e `callOpenAICompatible`.
- [ ] In `callAnthropic`, il blocco `catch` che intercetta il fallimento della chiamata di follow-up ingoia l'errore silenziosamente (commento `// Fallback to raw tool output if follow-up call fails` senza alcun log). Aggiungere almeno un `console.error` per poter diagnosticare quando/perché scatta il fallback.
- [ ] Verifica manuale richiesta (categoria "stato condiviso/API esterna" — vedi regole globali Sezione 6): testare `get_local_projects` e altri tool read-only su tutti e 4 i provider (Gemini, Anthropic, OpenAI, DeepSeek) e confermare che la risposta sia sempre in linguaggio naturale, mai JSON grezzo, salvo errori di rete reali.

---

## 🟠 Priorità Media — Debito tecnico con rischio di regressione

### 2. Refactor IPC handlers in `electron/main.js`
**File coinvolto:** `electron/main.js`

- [ ] Attualmente 50+ registrazioni sequenziali di `ipcMain.handle` in un unico file, senza raggruppamento per dominio.
- [ ] Adottare il pattern "register function per dominio": creare una cartella `electron/ipc/` con file dedicati (`gitHandlers.js`, `authHandlers.js`, `googleHandlers.js`, `spotifyHandlers.js`, `pinterestHandlers.js`, `githubHandlers.js`, `aiHandlers.js`, `systemHandlers.js`), ciascuno esportando una funzione `registerXIPC(ipcMain, deps)`.
- [ ] Può essere fatto in modo incrementale, un dominio alla volta, senza alcuna modifica lato renderer/React — a basso rischio.
- [ ] Verifica dopo ogni dominio migrato: l'app si avvia e le funzionalità di quel dominio continuano a funzionare (test manuale rapido, non serve la lista completa della Sezione 6 perché non tocca dati persistiti o stato condiviso).

### 3. Scomposizione di `SettingsView.jsx`
**File coinvolto:** `src/components/SettingsView.jsx` (817 righe, 17 `useState`, 15+ chiamate IPC dirette)

- [ ] Estrarre custom hook `useOAuthIntegrations()` per la gestione unificata di Google/Spotify/Pinterest/GitHub (stato di connessione, flag di caricamento, connect/disconnect).
- [ ] Estrarre custom hook `useAIConfig()` per la gestione multi-provider BYOK (chiavi API, test validità, provider attivo).
- [ ] Estrarre custom hook `useScanPaths()` per la gestione dei percorsi di scansione disco.
- [ ] Isolare le sezioni JSX già mappate come componenti separati: Card Account Google, Card Gamification/XP, Card Configurazione IA, Card Hub Connessioni (Spotify/Pinterest/GitHub), Card Percorsi Scansione.
- [ ] Priorità di scomposizione più alta di ProjectsView/CodeQuest per via dell'alta frequenza di modifica storica (13 commit) — ogni nuova integrazione futura beneficia subito della struttura modulare.

### 4. Verifica dipendenze nascoste in `ChatPanel.jsx` dopo Fase 4
**File coinvolto:** `src/components/ChatPanel.jsx` e nuovi hook estratti nella Fase 4 (già approvata)

- [ ] Dopo il refactoring in `useChatThreads()`, `useChatContext()`, `usePendingActions()`: ripetere manualmente i tre test già usati per validare le Fasi 1-3 (persistenza dopo riavvio, race condition su cambio thread, blocco input durante azione pending) per confermare che il refactoring non abbia reintrodotto silenziosamente i bug già risolti.
- [ ] Verificare nello specifico che `usePendingActions` riceva sempre lo stato `messages` aggiornato da `useChatThreads` e non uno snapshot non sincronizzato (rischio segnalato in fase di revisione del piano).
- [ ] Confermare che i test automatici modificati (`ChatPanelPersistence.test.jsx`, `ChatPanelThreadRace.test.jsx`, `ChatPanelPendingAction.test.jsx`) verifichino ancora lo stesso comportamento originale, non solo che "passino" con la nuova struttura.

---

## 🟡 Priorità Bassa — Manutenibilità, non urgente

### 5. Scomposizione parziale di `ProjectsView.jsx`
**File coinvolto:** `src/components/ProjectsView.jsx` (726 righe, ma solo 6 `useState` locali — la logica pesante è già in `ProjectsContext`)

- [ ] La logica di stato è già ben estratta nel Context. Da valutare solo l'estrazione della singola Card Progetto (~350 righe) e del Menu Contestuale (~134 righe) in componenti separati, per leggibilità — non è un problema di accoppiamento o di rischio bug.

### 6. `CodeQuestView.jsx` — nessun intervento necessario a breve termine
**File coinvolto:** `src/components/CodeQuestView.jsx` (715 righe, 0 chiamate IPC dirette, bassissima frequenza di modifica storica)

- [ ] Nessuna azione richiesta. File grande ma isolato, autonomo, e stabile. Rivalutare solo se la frequenza di modifica dovesse aumentare in futuro.

---

## 🔵 Direzione Strategica — L'assistente AI: dallo spettro "minimo indispensabile" a "IA dei sogni"

Questa sezione traccia l'evoluzione dell'assistente AI per livelli, dal più semplice al più ambizioso. **Ogni livello va consolidato prima di espandere al successivo**, perché i livelli superiori ereditano la stessa pipeline (tool → risultato → formattazione → utente) del Livello 0 — se quella pipeline ha ancora bug, si propagano a tutto ciò che viene costruito sopra.

### Livello 0 — Assistente di contesto (RAG, sola lettura)
- [ ] Consolidare la pipeline tool-result → risposta naturale per tutti i provider (vedi punto 1, Priorità Alta — è il prerequisito per tutto il resto).
- [ ] Verificare la qualità delle risposte RAG su progetti locali (`get_local_projects`, `read_local_file`) con contenuti reali, non solo con l'assenza di errori.
- [ ] Definire un comportamento esplicito per output molto lunghi (es. `read_local_file` tronca già a 12000 caratteri — verificare che questo limite sia comunicato bene all'utente quando scatta, invece di restituire un troncamento silenzioso).

### Livello 1 — Istruzioni rapide e azioni locali
- [ ] Già parzialmente implementato (slash commands, Human-in-the-Loop per azioni mutative locali). Nessuna azione aggiuntiva richiesta ora.

### Livello 2 — Azioni di lettura su account esterni
- [ ] Già implementato per Calendar, GitHub, Spotify (playback), Google Tasks. Beneficia automaticamente del fix del punto 1 una volta completato.

### Livello 3 — Azioni di scrittura su account esterni ("l'IA dei sogni")
- [ ] Non iniziare finché Livello 0 non è stabile e verificato.
- [ ] Da progettare: livelli di conferma differenziati in base alla reversibilità dell'azione (es. "metti una canzone" è innocuo e potrebbe non richiedere conferma; "pusha su GitHub main" è delicato e ne richiede una più esplicita di quella generica attuale).
- [ ] Da valutare quali nuovi tool aggiungere (aggiornamento lista della spesa, ricerca su Pinterest, ecc.) e con quale grado di autonomia.

---

## Ordine di esecuzione consigliato

1. **Punto 1** (uniformare gestione tool result) — priorità assoluta, sblocca anche il Livello 0 della visione AI.
2. **Punto 4** (verifica ChatPanel dopo Fase 4, già in corso) — da fare subito dopo il refactoring appena approvato.
3. **Punto 3** (scomposizione SettingsView) — alta frequenza di modifica, beneficio concreto e immediato.
4. **Punto 2** (refactor IPC handlers) — incrementale, a basso rischio, si può fare in parallelo o negli spazi vuoti tra le altre attività.
5. **Punto 5** (ProjectsView parziale) — quando c'è tempo, non urgente.
6. **Punto 6** (CodeQuest) — nessuna azione a meno di cambiamenti futuri.
7. **Direzione strategica AI** — segue naturalmente dal punto 1, poi procede per livelli solo dopo consolidamento.
