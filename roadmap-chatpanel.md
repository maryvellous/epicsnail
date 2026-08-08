# Roadmap: ChatPanel.jsx — Fix critici prima del refactoring

**Contesto:** analisi delle dipendenze implicite in `ChatPanel.jsx` (EpicSnail) ha rivelato 3 bug reali di stato/persistenza, distinti dal problema di dimensione/leggibilità del file. Questa roadmap li tratta separatamente e in ordine, **prima** di qualunque scomposizione in custom hook.

Principio guida: non scomporre un file finché contiene bug di stato non risolti — il refactoring nasconde i bug invece di risolverli, e rende poi impossibile distinguere "bug preesistente" da "bug introdotto dal refactoring".

---

## Fase 0 — Verifica manuale (prima di scrivere qualunque codice)

- [ ] Aprire l'app, mandare un messaggio in una chat, cambiare thread e tornare indietro (o riavviare l'app) → verificare se il messaggio persiste o sparisce.
- [ ] Se sparisce: confermato il bug di Priorità 1 (Fase 1). Va trattato come data-loss attivo, non come debito tecnico rimandabile.
- [ ] Annotare qui l'esito: `_________________________`

---

## Fase 1 — Priorità 1: Persistenza dei messaggi su disco (data loss)

**Problema:** `window.electronAPI.setStoreData('chatThreads', ...)` viene chiamato solo in `handleCreateNewThread` e `handleArchiveThread`, mai dentro `sendMessage` o `handleApproveAction`. I messaggi vivono solo nello state React finché il componente resta montato; al riavvio o ricaricamento dello store, i thread letti da disco sono quelli vecchi — i messaggi scambiati nella sessione vengono persi.

**Obiettivo fix:** ogni volta che `messages`/`threads` cambia in modo significativo (nuovo messaggio utente, risposta IA, esito tool approvato), lo stato aggiornato deve essere persistito su disco.

**Approccio suggerito:**
- Centralizzare il salvataggio in un unico punto (es. `useEffect` con dipendenza su `threads`, con debounce leggero per non scrivere su disco ad ogni singolo carattere/render) invece di aggiungere `setStoreData` sparso in più handler.
- Verificare che il salvataggio avvenga anche in caso di unmount imminente (cambio thread rapido, chiusura app).

**Criterio di completamento:**
- [ ] Ripetere il test manuale della Fase 0 → il messaggio persiste dopo cambio thread e riavvio.
- [ ] Aggiunto test automatico che simula invio messaggio → verifica chiamata a `setStoreData` con il payload aggiornato.

---

## Fase 2 — Priorità 2: Race condition su cambio thread

**Problema:** se l'utente cambia `activeThreadId` mentre una risposta IA è in corso (o un tool in esecuzione) per il thread precedente, la risposta tardiva viene comunque scritta usando `activeThreadId` corrente — finendo iniettata e salvata nel thread sbagliato.

**Obiettivo fix:** ogni richiesta asincrona (invio messaggio, esecuzione tool) deve "ricordare" a quale thread appartiene, e scrivere il risultato in quel thread specifico — non nel thread attivo al momento della risposta.

**Approccio suggerito:**
- Catturare il `threadId` di origine al momento dell'invio (closure o parametro esplicito passato alla funzione asincrona), e usarlo esplicitamente in `setThreads(prev => prev.map(t => t.id === threadIdDiOrigine ? ... : t))` invece di fare riferimento allo stato `activeThreadId` corrente.
- Se la risposta arriva per un thread diverso da quello attualmente visualizzato, valutare se comunque salvarla in background (utile) o scartarla con un avviso — decisione di prodotto, non solo tecnica.

**Criterio di completamento:**
- [ ] Test manuale: inviare un messaggio, cambiare thread immediatamente prima che arrivi la risposta, verificare che la risposta compaia nel thread corretto (quello originale) e non in quello attivo.
- [ ] Aggiunto test automatico che simula questo scenario con mock asincroni.

---

## Fase 3 — Priorità 3: Sovrascrittura stato durante esecuzione tool (Human-in-the-Loop)

**Problema:** se l'utente invia un nuovo messaggio mentre una card tool è in stato `'pending'` (in attesa di approvazione), la risposta IA al nuovo messaggio può sovrascrivere lo stato `messages` costruito su uno snapshot precedente all'approvazione del tool, cancellando il messaggio di sistema con l'esito dell'azione approvata.

**Obiettivo fix:** impedire l'invio di nuovi messaggi mentre un'azione è in attesa di approvazione, oppure garantire che gli aggiornamenti a `messages` siano sempre basati sullo stato più recente (funzione di update, non snapshot catturato in closure).

**Approccio suggerito (scegliere uno, non serve fare entrambi):**
- **Opzione A (più semplice, consigliata prima):** disabilitare l'invio di messaggi quando esiste una card tool `pending` — stessa logica già usata per `isLoading`, estesa a includere lo stato "azione in attesa di conferma".
- **Opzione B (più robusta ma più invasiva):** convertire gli aggiornamenti di `messages` da assegnazione diretta (`setMessages(updatedMsgs)`) a funzione di update (`setMessages(prev => ...)`), così ogni aggiornamento parte sempre dallo stato reale più recente invece che da uno snapshot congelato.

**Criterio di completamento:**
- [ ] Test manuale: generare una card tool pending, inviare un nuovo messaggio prima di approvare/annullare, verificare che il messaggio di esito del tool non venga perso.

---

## Fase 4 — Refactoring strutturale (solo dopo Fasi 1-3 completate e verificate)

Una volta risolti e verificati i bug sopra, procedere con la scomposizione già identificata nell'analisi precedente:

- Estrarre `useAIChat()` — logica di invio messaggi, gestione risposta IA, esecuzione/approvazione tool.
- Estrarre `useChatThreads()` — creazione, archiviazione, switch e persistenza dei thread.
- Isolare le sezioni JSX già mappate (Sidebar Cronologia, Header, Stream Messaggi, Input Bar, Modal Contesto) in componenti separati.

**Nota:** questa fase va affrontata con gli stessi criteri di verifica manuale usati nelle fasi precedenti — ogni bug fix diventa anche un caso di test da ripetere dopo lo split, per confermare che il refactoring non abbia reintrodotto i problemi già risolti.

---

## Ordine di esecuzione consigliato

1. Fase 0 (verifica, ~5 min)
2. Fase 1 (data loss — priorità assoluta)
3. Fase 2 (corruzione stato tra thread)
4. Fase 3 (overwrite Human-in-the-Loop)
5. Fase 4 (refactoring strutturale)

Non passare alla fase successiva senza aver spuntato i criteri di completamento della precedente.
