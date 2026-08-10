// ─────────────────────────────────────────────────────────
//  CodeQuest — Expanded Multi-Mode Puzzle Engine
//  Modalità supportate:
//  - 'sort': Riordina blocchi di codice
//  - 'fill': Riempi gli spazi vuoti (??? slot con token da inserire)
//  - 'bug': Caccia al Bug (trova la riga errata)
//  - 'match': Collega i concetti a coppie
// ─────────────────────────────────────────────────────────

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const ensureShuffled = (blocks) => {
  const solutionStr = blocks.map((b) => b.id).join(',');
  let shuffled = shuffle(blocks);
  let attempts = 0;
  while (shuffled.map((b) => b.id).join(',') === solutionStr && attempts < 20) {
    shuffled = shuffle(blocks);
    attempts++;
  }
  return shuffled;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const getBlockAccent = (code) => {
  const c = code.trim().toLowerCase();
  if (c.startsWith('#') || c.startsWith('//') || c.startsWith('/*')) return 'sage';
  if (c.match(/^(def |function |const |let |var |class )/)) return 'lavender';
  if (c.match(/^(if |elif |else|for |while |switch|se |altrimenti|per |finche)/)) return 'plum';
  if (c.match(/^(print|console\.|return |stampa|scrivi|output|ritorna)/)) return 'blue';
  if (c.match(/\{$/) || c === '}' || c === '};') return 'warm-sand';
  if (c.includes('=') && !c.includes('==') && !c.includes('!=') && !c.includes('=>')) return 'warm-sand';
  return 'terracotta';
};

export const ACCENT_COLORS = {
  sage: '#9ca98b',
  lavender: '#9a85c0',
  plum: '#833d6f',
  blue: '#a8c6de',
  'warm-sand': '#785076',
  terracotta: '#8f5a5a',
  sand: '#efdebd',
};

export const LANGUAGE_COLORS = {
  python: '#a8c6de',
  javascript: '#efdebd',
  pseudocode: '#9a85c0',
};

export const LANGUAGE_LABELS = {
  python: 'Python',
  javascript: 'JavaScript',
  pseudocode: 'Pseudocodice',
};

export const MODE_METADATA = {
  sort: { label: 'Riordina', color: '#9a85c0', themeClass: 'theme-lavender', desc: 'Riordina le righe nel giusto ordine' },
  fill: { label: 'Riempi Vuoti', color: '#efdebd', themeClass: 'theme-sand', desc: 'Inserisci il token mancante al posto di ???' },
  bug: { label: 'Caccia al Bug', color: '#8f5a5a', themeClass: 'theme-terracotta', desc: 'Trova e schiaccia la riga di codice sbagliata' },
  match: { label: 'Collega Coppie', color: '#9ca98b', themeClass: 'theme-sage', desc: 'Associa ogni concetto alla sua descrizione' },
};

export const DIFFICULTY_COLORS = {
  easy: '#9ca98b',
  medium: '#efdebd',
  hard: '#8f5a5a',
};

export const DIFFICULTY_LABELS = {
  easy: 'Facile',
  medium: 'Medio',
  hard: 'Difficile',
};

// ─────────────────────────────────────────────────────────
//  MODE 1: SORT TEMPLATES (RIORDINA)
// ─────────────────────────────────────────────────────────

const py_greet_sort = () => {
  const name = pick(['Alice', 'Marco', 'Giulia', 'Luca', 'Sara', 'Chiara']);
  const blocks = [
    { id: '1', code: `nome = "${name}"`, indent: 0 },
    { id: '2', code: `saluto = "Ciao, " + nome + "!"`, indent: 0 },
    { id: '3', code: `print(saluto)`, indent: 0 },
  ];
  return {
    mode: 'sort',
    title: "Saluta l'utente",
    description: `Crea un programma che saluta ${name} per nome. Prima la variabile, poi la concatenazione, infine la stampa!`,
    language: 'python',
    difficulty: 'easy',
    blocks: ensureShuffled(blocks),
    solution: ['1', '2', '3'],
    hints: ['Definisci prima la variabile nome.', 'Unisci le stringhe con +.', 'Stampa con print().'],
    explanation: 'In Python, = assegna, + concatena, print() mostra in output.',
    xpReward: 15,
  };
};

const py_for_sort = () => {
  const n = Math.floor(Math.random() * 4) + 3;
  const blocks = [
    { id: '1', code: `totale = 0`, indent: 0 },
    { id: '2', code: `for n in range(1, ${n + 1}):`, indent: 0 },
    { id: '3', code: `    totale += n`, indent: 1 },
    { id: '4', code: `print("Totale:", totale)`, indent: 0 },
  ];
  return {
    mode: 'sort',
    title: `Somma progressiva da 1 a ${n}`,
    description: `Inizializza la somma a 0, fai il loop da 1 a ${n} e stampa il risultato finale.`,
    language: 'python',
    difficulty: 'medium',
    blocks: ensureShuffled(blocks),
    solution: ['1', '2', '3', '4'],
    hints: ['Inizia da totale = 0.', 'Il ciclo for accumula i numeri con +=.', 'Il print() finale va fuori dal ciclo (non indentato).'],
    explanation: `+= accumula ogni numero da 1 a ${n}. Il print è fuori dal ciclo.`,
    xpReward: 25,
  };
};

const js_if_sort = () => {
  const score = pick([75, 45, 88, 52]);
  const blocks = [
    { id: '1', code: `const punteggio = ${score};`, indent: 0 },
    { id: '2', code: `if (punteggio >= 60) {`, indent: 0 },
    { id: '3', code: `  console.log("Superato!");`, indent: 1 },
    { id: '4', code: `} else {`, indent: 0 },
    { id: '5', code: `  console.log("Riprova!");`, indent: 1 },
    { id: '6', code: `}`, indent: 0 },
  ];
  return {
    mode: 'sort',
    title: 'Esito test in JavaScript',
    description: `Con un punteggio di ${score}, ordina la struttura if/else per verificare se è ≥ 60.`,
    language: 'javascript',
    difficulty: 'easy',
    blocks: ensureShuffled(blocks),
    solution: ['1', '2', '3', '4', '5', '6'],
    hints: ['Inizia definendo il punteggio.', 'if (condizione) apre con {.', 'Chiusura } prima di else {.'],
    explanation: 'Le strutture condizionali JS usano parentesi tonde () per la condizione e graffe {} per i blocchi.',
    xpReward: 20,
  };
};

const pseudo_max_sort = () => {
  const blocks = [
    { id: '1', code: `INIZIO`, indent: 0 },
    { id: '2', code: `  LEGGI x, y`, indent: 1 },
    { id: '3', code: `  SE x > y ALLORA`, indent: 1 },
    { id: '4', code: `    STAMPA x`, indent: 2 },
    { id: '5', code: `  ALTRIMENTI`, indent: 1 },
    { id: '6', code: `    STAMPA y`, indent: 2 },
    { id: '7', code: `FINE`, indent: 0 },
  ];
  return {
    mode: 'sort',
    title: 'Algoritmo: Massimo tra 2 numeri',
    description: 'Ordina i passaggi logici dell’algoritmo in pseudocodice.',
    language: 'pseudocode',
    difficulty: 'easy',
    blocks: ensureShuffled(blocks),
    solution: ['1', '2', '3', '4', '5', '6', '7'],
    hints: ['Gli algoritmi partono con INIZIO e finiscono con FINE.', 'SE/ALLORA/ALTRIMENTI gestisce le due alternative.'],
    explanation: 'Lo pseudocodice esprime la logica prima di scriverla in un linguaggio specifico.',
    xpReward: 20,
  };
};


// ─────────────────────────────────────────────────────────
//  MODE 2: FILL TEMPLATES (RIEMPI I VUOTI)
// ─────────────────────────────────────────────────────────

const py_fill_1 = () => {
  const token = 'print';
  const options = shuffle(['print', 'stampa', 'echo', 'console.log']);
  const codeLines = [
    'messaggio = "Benvenuto su Diaspro Viboard!"',
    '???(messaggio)',
  ];
  return {
    mode: 'fill',
    title: 'Funzione di Stampa',
    description: 'Quale comando si usa in Python per mostrare un testo a schermo?',
    language: 'python',
    difficulty: 'easy',
    codeLines,
    correctToken: token,
    options,
    hints: ['In Python la funzione standard di output è di 5 lettere.', 'Inizia con "pr...".'],
    explanation: 'print() è la funzione nativa di Python per inviare dati allo schermo o alla console.',
    xpReward: 15,
  };
};

const py_fill_2 = () => {
  const token = 'append';
  const options = shuffle(['append', 'push', 'add', 'insert']);
  const codeLines = [
    'frutti = ["mela", "banana"]',
    'frutti.???("fragola")',
    'print(frutti)',
  ];
  return {
    mode: 'fill',
    title: 'Aggiungere a una lista',
    description: 'Inserisci il metodo corretto per aggiungere un elemento in coda a una lista Python.',
    language: 'python',
    difficulty: 'easy',
    codeLines,
    correctToken: token,
    options,
    hints: ['In Python le liste usano .append(), in JS si usa .push().'],
    explanation: 'Il metodo .append(valore) aggiunge un nuovo elemento alla fine della lista.',
    xpReward: 20,
  };
};

const js_fill_1 = () => {
  const token = 'const';
  const options = shuffle(['const', 'var_name', 'define', 'make']);
  const codeLines = [
    '??? velocita = 100;',
    'console.log("Velocità massima:", velocita);',
  ];
  return {
    mode: 'fill',
    title: 'Dichiarare una costante in JS',
    description: 'Scegli la parola chiave moderna per dichiarare una variabile che non cambia valore.',
    language: 'javascript',
    difficulty: 'easy',
    codeLines,
    correctToken: token,
    options,
    hints: ['In JS moderno usiamo const per le costanti e let per le variabili riassegnabili.'],
    explanation: 'const dichiara una variabile immutabile (non riassegnabile).',
    xpReward: 15,
  };
};

const js_fill_2 = () => {
  const token = 'length';
  const options = shuffle(['length', 'size', 'count', 'len']);
  const codeLines = [
    'const colori = ["rosso", "verde", "blu"];',
    'console.log("Numero di colori:", colori.???);',
  ];
  return {
    mode: 'fill',
    title: 'Lunghezza di un Array',
    description: 'Quale proprietà di un array JavaScript restituisce il numero di elementi?',
    language: 'javascript',
    difficulty: 'easy',
    codeLines,
    correctToken: token,
    options,
    hints: ['In JavaScript gli array hanno la proprietà .length (non .size o len()).'],
    explanation: 'array.length restituisce il numero totale di elementi presenti nel vettore.',
    xpReward: 20,
  };
};

const pseudo_fill_1 = () => {
  const token = 'ALTRIMENTI';
  const options = shuffle(['ALTRIMENTI', 'OPPURE', 'THEN', 'FINCHE']);
  const codeLines = [
    'SE punti >= 50 ALLORA',
    '  STAMPA "Vinto"',
    '???',
    '  STAMPA "Perso"',
  ];
  return {
    mode: 'fill',
    title: 'Ramo alternativo',
    description: 'Completa la struttura di controllo in pseudocodice per il caso in cui la condizione è falsa.',
    language: 'pseudocode',
    difficulty: 'easy',
    codeLines,
    correctToken: token,
    options,
    hints: ['SE corrisponde a IF, ALLORA a THEN, ALTRIMENTI a ELSE.'],
    explanation: 'ALTRIMENTI specifica il blocco di codice eseguito quando la condizione del SE risulta falsa.',
    xpReward: 15,
  };
};


// ─────────────────────────────────────────────────────────
//  MODE 3: BUG HUNTER TEMPLATES (CACCIA AL BUG)
// ─────────────────────────────────────────────────────────

const py_bug_1 = () => {
  const lines = [
    { id: '1', code: 'def calcola_area(base, altezza):', isBug: false },
    { id: '2', code: '    area = base * altezza / 2', isBug: false },
    { id: '3', code: '    return area', isBug: false },
    { id: '4', code: 'print("Area = " + area)', isBug: true, errorReason: 'Errore: "area" non esiste fuori dalla funzione! Dovevi usare il valore restituito.' },
  ];
  return {
    mode: 'bug',
    title: 'Variabile fuori scope',
    description: 'Trova quale riga contiene un errore fatale durante l’esecuzione!',
    language: 'python',
    difficulty: 'medium',
    lines,
    hints: ['La variabile "area" è definita all’interno della funzione (scope locale).'],
    explanation: 'Le variabili create all’interno di una funzione sono locali e non sono accessibili dall’esterno senza salvarne il return.',
    xpReward: 25,
  };
};

const py_bug_2 = () => {
  const lines = [
    { id: '1', code: 'numero = 10', isBug: false },
    { id: '2', code: 'if numero = 10:', isBug: true, errorReason: 'Errore: = è per assegnare! Per confrontare serve ==!' },
    { id: '3', code: '    print("È dieci!")', isBug: false },
  ];
  return {
    mode: 'bug',
    title: 'Assegnazione al posto del confronto',
    description: 'Trova la riga con un errore di sintassi classico in Python.',
    language: 'python',
    difficulty: 'easy',
    lines,
    hints: ['Guarda la condizione dell’if. Manca qualcosa sul segno uguale!'],
    explanation: 'In Python (e in quasi tutti i linguaggi), = assegna un valore mentre == confronta l’uguaglianza.',
    xpReward: 20,
  };
};

const js_bug_1 = () => {
  const lines = [
    { id: '1', code: 'const nome = "Diaspro";', isBug: false },
    { id: '2', code: 'nome = "Diaspro Viboard";', isBug: true, errorReason: 'Errore: Impossibile riassegnare una variabile dichiarata con const!' },
    { id: '3', code: 'console.log(nome);', isBug: false },
  ];
  return {
    mode: 'bug',
    title: 'Riassegnazione illegale',
    description: 'Individua la riga che causa un TypeError in JavaScript.',
    language: 'javascript',
    difficulty: 'easy',
    lines,
    hints: ['Una variabile dichiarata con `const` non può essere cambiata successivamente.'],
    explanation: 'Le variabili `const` sono costanti e immutabili nella riassegnazione. Per variabili modificabili si usa `let`.',
    xpReward: 20,
  };
};

const js_bug_2 = () => {
  const lines = [
    { id: '1', code: 'const numeri = [10, 20, 30];', isBug: false },
    { id: '2', code: 'for (let i = 0; i <= numeri.length; i++) {', isBug: true, errorReason: 'Errore Index Out of Bounds: l’ultimo indice è length - 1, quindi `<= length` legge `undefined`!' },
    { id: '3', code: '  console.log(numeri[i]);', isBug: false },
    { id: '4', code: '}', isBug: false },
  ];
  return {
    mode: 'bug',
    title: 'Off-by-one nel ciclo',
    description: 'Schiaccia la riga che va oltre il limite dell’array (undefined)!',
    language: 'javascript',
    difficulty: 'medium',
    lines,
    hints: ['Gli indici degli array partono da 0 e arrivano a length - 1.'],
    explanation: 'Usare `<=` con `numeri.length` fa tentare l’accesso all’elemento `numeri[3]` che non esiste.',
    xpReward: 30,
  };
};


// ─────────────────────────────────────────────────────────
//  MODE 4: MATCH TEMPLATES (COLLEGA COPPIE)
// ─────────────────────────────────────────────────────────

const py_js_match_1 = () => {
  const pairs = [
    { left: 'print("Ciao")', right: 'Stampa testo in Python' },
    { left: 'console.log("Ciao")', right: 'Stampa testo in JavaScript' },
    { left: 'for i in range(5):', right: 'Ripete 5 volte in Python' },
    { left: 'array.push("X")', right: 'Aggiunge un elemento in JS' },
  ];
  return {
    mode: 'match',
    title: 'Corrispondenze Sintattiche',
    description: 'Associa ciascun frammento di codice alla sua descrizione corretta.',
    language: 'python',
    difficulty: 'easy',
    pairs,
    hints: ['Guarda quali comandi appartengono a Python (print, range) e quali a JS (console.log, push).'],
    explanation: 'Accoppiare i costrutti dei vari linguaggi aiuta a fissare le analogie tra Python e JavaScript!',
    xpReward: 25,
  };
};

const concepts_match_1 = () => {
  const pairs = [
    { left: '==', right: 'Confronta se due valori sono uguali' },
    { left: '%', right: 'Operatore Modulo (resto della divisione)' },
    { left: '[]', right: 'Dichiara o accede a una Lista / Array' },
    { left: 'def / function', right: 'Definisce un blocco di codice riutilizzabile' },
  ];
  return {
    mode: 'match',
    title: 'Simboli e Operatori',
    description: 'Collega ogni operatore fondamentale al suo significato logico.',
    language: 'pseudocode',
    difficulty: 'easy',
    pairs,
    hints: ['== confronta, % trova il resto, [] indica le liste/array.'],
    explanation: 'Gli operatori fondamentali hanno significati omogenei in quasi tutti i linguaggi di programmazione.',
    xpReward: 25,
  };
};


// ─────────────────────────────────────────────────────────
//  REGISTRO TEMPLATE MULTI-MODALITÀ
// ─────────────────────────────────────────────────────────

export const ALL_PUZZLE_TEMPLATES = [
  // Sort
  py_greet_sort,
  py_for_sort,
  js_if_sort,
  pseudo_max_sort,
  // Fill
  py_fill_1,
  py_fill_2,
  js_fill_1,
  js_fill_2,
  pseudo_fill_1,
  // Bug
  py_bug_1,
  py_bug_2,
  js_bug_1,
  js_bug_2,
  // Match
  py_js_match_1,
  concepts_match_1,
];

export const getRandomPuzzle = (modeFilter = 'all') => {
  let candidates = ALL_PUZZLE_TEMPLATES;
  if (modeFilter && modeFilter !== 'all') {
    candidates = ALL_PUZZLE_TEMPLATES.filter((tpl) => tpl().mode === modeFilter);
  }
  if (!candidates.length) candidates = ALL_PUZZLE_TEMPLATES;
  const fn = candidates[Math.floor(Math.random() * candidates.length)];
  return fn();
};
