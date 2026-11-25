// Ricette degli esercizi pratici: ogni volta generano un esercizio diverso (numeri casuali da 1 a 99).
//
// ===================== GUIDA PER CHI SCRIVE LE DOMANDE (domande/*.json) =====================
// Una domanda pratica nel JSON:
//   { "id": "SS-020", "tipo": "pratico", "argomento": "4.1 Formule", "ricetta": "somma-intervallo",
//     "parametri": { "colonna": "B", "righe": [2, 6] }, "spiegazione": "..." }
// "parametri" e' facoltativo: se manca (o un valore non e' valido) si usano i valori predefiniti indicati sotto.
// Il foglio ha 5 colonne (A-E) e 7 righe (1-7). La riga 1 contiene le intestazioni, la colonna A le etichette.
//
// Ambiente "foglio" (mini foglio di calcolo):
//   somma-intervallo  funzione SOMMA.         parametri: colonna "B"-"E" (pred. "B"), righe [inizio, fine] con
//                     2 <= inizio <= fine <= 6 (pred. [2, 6]). Risultato nella cella sotto l'intervallo
//                     (pred. B7). Soluzione: =SOMMA(B2:B6)
//   media-intervallo  funzione MEDIA.         parametri come somma-intervallo. Soluzione: =MEDIA(B2:B6)
//   max-intervallo    funzione MAX.           parametri come somma-intervallo. Soluzione: =MAX(B2:B6)
//   min-intervallo    funzione MIN.           parametri come somma-intervallo. Soluzione: =MIN(B2:B6)
//   conta-numeri      funzione CONTA.NUMERI.  parametri come somma-intervallo; nell'intervallo ci sono anche celle
//                     con testo (es. "assente"). Soluzione: =CONTA.NUMERI(B2:B6)
//   se-soglia         funzione SE.            parametri: riga 2-6 (pred. 2): valore in B<riga>, risultato in C<riga>;
//                     soglia numero intero 1-99 (pred. casuale 30-70); confronto ">", ">=", "<", "<=" (pred. ">=");
//                     si (pred. "Promosso") e no (pred. "Bocciato"): testi diversi, massimo 40 caratteri.
//                     Soluzione: =SE(B2>=60;"Promosso";"Bocciato")
//   operazione-celle  nessuna funzione.       parametri: operazione "+", "-", "*", "/" (pred. "*"); riga 2-6 (pred. 2).
//                     Valori in B<riga> e C<riga>, risultato in D<riga>. Soluzione: =B2*C2
//   percentuale       nessuna funzione.       parametri: riga 2-6 (pred. 2). Prezzo in B<riga>, sconto in % in C<riga>,
//                     risultato (euro di sconto) in D<riga>. Soluzione: =B2*C2/100 (va bene anche =B2*C2%)
//
// verifica({cella, formula}) accetta qualsiasi formula scritta nella cella giusta che da' il risultato atteso,
// che usa almeno un riferimento a una cella, che non usa la sua stessa cella (riferimento circolare), che contiene
// la funzione richiesta (se c'e') e che da' lo stesso risultato della soluzione anche su copie del foglio con
// i numeri cambiati (cosi' un intervallo o una condizione sbagliati non passano "per caso").
//
// Ambiente "testo" (mini editor: un paragrafo diviso in parole, presa da 10 frasi a tema informatico).
//   Stato: {parole:[{testo, grassetto, corsivo, sottolineato, dimensione, colore}], allineamento, elenco}
//   con allineamento "sinistra"|"centro"|"destra"|"giustificato" ed elenco "nessuno"|"puntato"|"numerato".
//   All'inizio: niente formattazione, dimensione 11, colore "automatico", "sinistra", "nessuno".
//   grassetto-parola      la parola (o le 2 parole) indicata va in grassetto, le altre no.
//                         parametri: frase 1-10 (pred. casuale). La parola si sceglie a caso tra quelle importanti.
//   corsivo-parola        come grassetto-parola, ma in corsivo.
//   sottolinea-parola     come grassetto-parola, ma sottolineata.
//   dimensione-carattere  la parola indicata diventa piu' grande o piu' piccola, le altre restano a 11.
//                         parametri: frase 1-10; verso "aumenta"|"riduci" (pred. casuale).
//   allinea               parametri: frase 1-10; allineamento "centro"|"destra"|"giustificato" (pred. casuale).
//   elenco-puntato        il paragrafo diventa un elenco. parametri: frase 1-10; tipo "puntato"|"numerato" (pred. "puntato").
//   Le proprieta' non chieste dalla consegna (es. il corsivo in un esercizio sul grassetto) non contano.
//
// Ambiente "diapositiva" (mini presentazione).
//   Stato: {diapositive:[{id, layout, titolo}]}; layout "Diapositiva titolo"|"Titolo e contenuto"|"Solo titolo"|"Vuota".
//   "id" e' nascosto e stabile: le verifiche riconoscono le diapositive dall'id (riscrivere i titoli non basta).
//   iniziale.titoloModificabile e' true solo in scrivi-titolo: negli altri esercizi il titolo non si puo' scrivere.
//   scegli-layout        3 diapositive. parametri: diapositiva 1-3 (pred. casuale); layout uno dei 4 (pred. casuale;
//                        se e' uguale a quello che ha gia' la diapositiva se ne sceglie un altro).
//   scrivi-titolo        3 diapositive, una senza titolo. parametri: diapositiva 1-3 (pred. casuale). Maiuscole e
//                        spazi in piu' non contano.
//   ordina-diapositive   4 diapositive con una fuori posto; si controlla l'ordine esatto. Nessun parametro.
//   elimina-diapositiva  4 diapositive. parametri: diapositiva 1-4 da eliminare (pred. casuale); le altre restano in ordine.
//   nuova-diapositiva    2 diapositive; se ne aggiunge una in fondo. parametri: layout uno dei 4 (pred. casuale).
//
// Ambiente "pulsante" ("Trova il pulsante" in una barra multifunzione finta di Microsoft 365 in italiano).
//   Stato: {scheda, toccato} (nome della scheda aperta e id del pulsante toccato).
//   trova-pulsante  parametri: programma "word"|"excel"|"powerpoint" (pred. "word"); comando (pred. casuale tra
//                   quelli del programma): "salva", "stampa", "annulla", "copia", "incolla", "tabella", "immagine",
//                   "ortografia", "ordina" e "unisci" (solo excel), "nuova-diapositiva" e "transizioni" (solo powerpoint).
//                   Dove sta ogni comando: tabella BARRE in js/practice/toolbar.js.
//
// Per questi tre ambienti "soluzione" e' una breve frase che spiega cosa fare (si mostra dopo 2 errori) e
// "statoSoluzione" e' uno stato dell'interfaccia che passa verifica (serve ai test).
// ============================================================================================
import { valuta, funzioniUsate, usaRiferimenti, stessoValore, riferimentiUsati } from './formula.js';
import { BARRE, COMANDI, PROGRAMMI, comandiDi, pulsantiGiusti, schedeGiuste } from './toolbar.js';

const oggetto = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const intero = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));
const scegliUno = (rnd, elenco) => elenco[Math.floor(rnd() * elenco.length)];
const eIntero = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
const testoFormula = s => `"${s.replace(/"/g, '""')}"`;

// ---------- verifica comune
function suggerimentoErrore(errore) {
  if (errore === '#DIV/0!') return 'Attenzione: stai dividendo per zero (#DIV/0!). Controlla le celle che usi.';
  if (errore === '#VALORE!') return 'Stai facendo un calcolo con un testo (#VALORE!). Usa le celle con i numeri.';
  return errore;
}

const MSG_PER_CASO = 'La formula dà il risultato giusto solo per caso: controlla l\'intervallo o la condizione';

const posizione = nome => ({ col: nome.charCodeAt(0), riga: Number(nome.slice(1)) });
function contiene({ da, a }, cella) {
  const p = posizione(cella), d = posizione(da), f = posizione(a);
  return p.col >= d.col && p.col <= f.col && p.riga >= d.riga && p.riga <= f.riga;
}

// Copie del foglio con dati cambiati, per scoprire le formule giuste solo "per caso".
// Ogni cella numerica a turno diventa la piu' grande (1000) e la piu' piccola (-1000); i testi in testiDati
// diventano numeri; tutti i numeri v diventano 100 - v (mai zero). Le etichette e le intestazioni non cambiano.
function varianti(celle, testiDati, extra) {
  const numeriche = Object.keys(celle).filter(k => typeof celle[k] === 'number');
  const out = [];
  for (const k of numeriche) {
    out.push({ ...celle, [k]: 1000 });
    out.push({ ...celle, [k]: -1000 });
  }
  for (const k of testiDati) out.push({ ...celle, [k]: 5 });
  const specchio = { ...celle };
  for (const k of numeriche) specchio[k] = 100 - celle[k];
  out.push(specchio);
  return [...out, ...extra];
}

function creaVerifica({ celle, destinazione, soluzione, atteso, funzione, suggerimentoValore, testiDati = [], extra = [] }) {
  let copie = null;
  return function verifica(statoUI) {
    const s = oggetto(statoUI);
    const cella = typeof s.cella === 'string' ? s.cella.trim().toUpperCase() : '';
    if (cella !== destinazione) return { ok: false, suggerimento: `Scrivi la formula nella cella ${destinazione}` };
    const formula = typeof s.formula === 'string' ? s.formula : '';
    const r = valuta(formula, celle);
    if (!r.ok) return { ok: false, suggerimento: suggerimentoErrore(r.errore) };
    if (riferimentiUsati(formula).some(rif => contiene(rif, destinazione))) {
      return { ok: false, suggerimento: `La formula usa la sua stessa cella ${destinazione} (riferimento circolare): togli ${destinazione} dall'intervallo` };
    }
    if (!usaRiferimenti(formula)) {
      return { ok: false, suggerimento: 'Usa i riferimenti alle celle (come B2) invece di scrivere i numeri a mano' };
    }
    if (funzione && !funzioniUsate(formula).includes(funzione)) {
      return { ok: false, suggerimento: `Prova con la funzione ${funzione}` };
    }
    if (!stessoValore(r.valore, atteso)) return { ok: false, suggerimento: suggerimentoValore };
    copie = copie || varianti(celle, testiDati, extra);
    for (const c of copie) {
      const giusto = valuta(soluzione, c);
      if (!giusto.ok) continue;
      const suo = valuta(formula, c);
      if (!suo.ok || !stessoValore(suo.valore, giusto.valore)) return { ok: false, suggerimento: MSG_PER_CASO };
    }
    return { ok: true };
  };
}

function esercizio({ consegna, celle, destinazione, soluzione, ...resto }) {
  return {
    consegna,
    iniziale: { celle, destinazione },
    soluzione,
    verifica: creaVerifica({ celle, destinazione, soluzione, ...resto }),
  };
}

// ---------- ricette su un intervallo di una colonna
const TEMI_INTERVALLO = [
  { a: 'Nome', titolo: 'Punti', di: 'dei punti', testo: 'assente', etichette: ['Luca', 'Sara', 'Marco', 'Giulia', 'Omar'] },
  { a: 'Mese', titolo: 'Libri', di: 'dei libri letti', testo: 'nessuno', etichette: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag'] },
  { a: 'Giorno', titolo: 'Minuti', di: 'dei minuti di sport', testo: 'riposo', etichette: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven'] },
];

function parametriIntervallo(parametri) {
  const p = oggetto(parametri);
  const colonna = typeof p.colonna === 'string' && /^[B-E]$/i.test(p.colonna) ? p.colonna.toUpperCase() : 'B';
  const r = p.righe;
  const righe = Array.isArray(r) && r.length === 2 && eIntero(r[0], 2, 6) && eIntero(r[1], 2, 6) && r[0] <= r[1] ? r : [2, 6];
  return { colonna, inizio: righe[0], fine: righe[1] };
}

function ricettaIntervallo({ funzione, etichettaRisultato, frase, calcolaAtteso, conTesti }) {
  return {
    ambiente: 'foglio',
    genera(parametri, rnd) {
      const { colonna, inizio, fine } = parametriIntervallo(parametri);
      const tema = scegliUno(rnd, TEMI_INTERVALLO);
      const da = colonna + inizio, a = colonna + fine;
      const destinazione = colonna + (fine + 1);
      const celle = { A1: tema.a, [colonna + 1]: tema.titolo, ['A' + (fine + 1)]: etichettaRisultato };
      const righe = [];
      for (let r = inizio; r <= fine; r++) righe.push(r);
      const testi = new Set();
      if (conTesti && righe.length >= 2) {
        const quanti = righe.length >= 3 ? intero(rnd, 1, 2) : 1;
        while (testi.size < quanti) testi.add(scegliUno(rnd, righe));
      }
      const numeri = [];
      for (const r of righe) {
        celle['A' + r] = tema.etichette[r - 2];
        if (testi.has(r)) celle[colonna + r] = tema.testo;
        else { const n = intero(rnd, 1, 99); celle[colonna + r] = n; numeri.push(n); }
      }
      return esercizio({
        consegna: `Nella cella ${destinazione} usa una funzione per ${frase(tema, da, a)}.`,
        celle,
        destinazione,
        soluzione: `=${funzione}(${da}:${a})`,
        atteso: calcolaAtteso(numeri),
        funzione,
        testiDati: [...testi].map(r => colonna + r),
        suggerimentoValore: `Il risultato non è ancora giusto: controlla l'intervallo, deve andare da ${da} a ${a}. Ce la puoi fare!`,
      });
    },
  };
}

// ---------- se-soglia
const CONFRONTI = { '>': 'maggiori di', '>=': 'maggiori o uguali a', '<': 'minori di', '<=': 'minori o uguali a' };
const testoValido = v => typeof v === 'string' && v.trim() !== '' && v.length <= 40;

const seSoglia = {
  ambiente: 'foglio',
  genera(parametri, rnd) {
    const p = oggetto(parametri);
    const riga = eIntero(p.riga, 2, 6) ? p.riga : 2;
    const soglia = eIntero(p.soglia, 1, 99) ? p.soglia : intero(rnd, 30, 70);
    const confronto = typeof p.confronto === 'string' && p.confronto in CONFRONTI ? p.confronto : '>=';
    let si = 'Promosso', no = 'Bocciato';
    if (testoValido(p.si) && testoValido(p.no) && !stessoValore(p.si, p.no)) { si = p.si.trim(); no = p.no.trim(); }
    const nomi = ['Luca', 'Sara', 'Marco', 'Giulia', 'Omar'];
    const celle = { A1: 'Nome', B1: 'Punti', C1: 'Esito' };
    for (let r = 2; r <= 6; r++) { celle['A' + r] = nomi[r - 2]; celle['B' + r] = intero(rnd, 1, 99); }
    const v = celle['B' + riga];
    const vero = { '>': v > soglia, '>=': v >= soglia, '<': v < soglia, '<=': v <= soglia }[confronto];
    const destinazione = 'C' + riga;
    return esercizio({
      consegna: `Nella cella ${destinazione} usa la funzione SE: se i punti in B${riga} sono ${CONFRONTI[confronto]} ${soglia} deve comparire "${si}", altrimenti "${no}".`,
      celle,
      destinazione,
      soluzione: `=SE(B${riga}${confronto}${soglia};${testoFormula(si)};${testoFormula(no)})`,
      atteso: vero ? si : no,
      funzione: 'SE',
      // valori proprio attorno alla soglia: distinguono > da >= e una soglia sbagliata
      extra: [soglia - 1, soglia, soglia + 1].map(x => ({ ...celle, ['B' + riga]: x })),
      suggerimentoValore: 'Quasi! Controlla la condizione (il segno e il numero) e i due testi tra virgolette.',
    });
  },
};

// ---------- operazione-celle
const OPERAZIONI = {
  '*': { a: 'Articolo', b: 'Prezzo', c: 'Quantità', d: 'Totale', etichette: ['Penne', 'Zaino', 'Diario', 'Gomma', 'Colla'],
    numeri: rnd => [intero(rnd, 1, 99), intero(rnd, 1, 9)],
    frase: (b, c) => `calcola il totale moltiplicando il prezzo (${b}) per la quantità (${c})` },
  '+': { a: 'Squadra', b: 'Andata', c: 'Ritorno', d: 'Totale', etichette: ['Rossi', 'Blu', 'Verdi', 'Gialli', 'Viola'],
    numeri: rnd => [intero(rnd, 1, 99), intero(rnd, 1, 99)],
    frase: (b, c) => `calcola i punti totali sommando l'andata (${b}) e il ritorno (${c})` },
  '-': { a: 'Gioco', b: 'Prezzo', c: 'Sconto', d: 'Da pagare', etichette: ['Puzzle', 'Palla', 'Carte', 'Robot', 'Aquilone'],
    numeri: rnd => [intero(rnd, 20, 99), intero(rnd, 1, 19)],
    frase: (b, c) => `calcola quanto si paga togliendo lo sconto (${c}) dal prezzo (${b})` },
  '/': { a: 'Gruppo', b: 'Caramelle', c: 'Amici', d: 'A testa', etichette: ['Gruppo 1', 'Gruppo 2', 'Gruppo 3', 'Gruppo 4', 'Gruppo 5'],
    numeri: rnd => [intero(rnd, 10, 99), intero(rnd, 2, 9)],
    frase: (b, c) => `calcola quante caramelle tocca a ciascuno dividendo le caramelle (${b}) per gli amici (${c})` },
};
const CALCOLI = { '+': (x, y) => x + y, '-': (x, y) => x - y, '*': (x, y) => x * y, '/': (x, y) => x / y };

const operazioneCelle = {
  ambiente: 'foglio',
  genera(parametri, rnd) {
    const p = oggetto(parametri);
    const op = typeof p.operazione === 'string' && p.operazione in OPERAZIONI ? p.operazione : '*';
    const riga = eIntero(p.riga, 2, 6) ? p.riga : 2;
    const t = OPERAZIONI[op];
    const celle = { A1: t.a, B1: t.b, C1: t.c, D1: t.d };
    for (let r = 2; r <= 6; r++) {
      const [x, y] = t.numeri(rnd);
      celle['A' + r] = t.etichette[r - 2];
      celle['B' + r] = x;
      celle['C' + r] = y;
    }
    const b = 'B' + riga, c = 'C' + riga, destinazione = 'D' + riga;
    return esercizio({
      consegna: `Nella cella ${destinazione} scrivi una formula che ${t.frase(b, c)}.`,
      celle,
      destinazione,
      soluzione: `=${b}${op}${c}`,
      atteso: CALCOLI[op](celle[b], celle[c]),
      funzione: null,
      suggerimentoValore: `Il risultato non è ancora giusto: controlla le celle (${b} e ${c}) e l'operazione (+ - * /).`,
    });
  },
};

// ---------- percentuale
const percentuale = {
  ambiente: 'foglio',
  genera(parametri, rnd) {
    const p = oggetto(parametri);
    const riga = eIntero(p.riga, 2, 6) ? p.riga : 2;
    const etichette = ['Felpa', 'Scarpe', 'Libro', 'Cuffie', 'Zaino'];
    const celle = { A1: 'Articolo', B1: 'Prezzo', C1: 'Sconto %', D1: 'Sconto €' };
    for (let r = 2; r <= 6; r++) {
      celle['A' + r] = etichette[r - 2];
      celle['B' + r] = intero(rnd, 10, 99);
      celle['C' + r] = 5 * intero(rnd, 1, 10);
    }
    const b = 'B' + riga, c = 'C' + riga, destinazione = 'D' + riga;
    return esercizio({
      consegna: `Nella cella ${destinazione} calcola quanti euro di sconto ci sono: il prezzo è in ${b} e la percentuale di sconto in ${c} (prezzo per percentuale, diviso 100).`,
      celle,
      destinazione,
      soluzione: `=${b}*${c}/100`,
      atteso: celle[b] * celle[c] / 100,
      funzione: null,
      suggerimentoValore: `Quasi! Ricorda: prezzo per percentuale diviso 100, cioè ${b}*${c}/100.`,
    });
  },
};

const somma = a => a.reduce((s, x) => s + x, 0);

// ===================== ambiente "testo" (mini editor)
// "chiavi": parole importanti della frase (anche 2 parole vicine); ognuna compare una volta sola.
export const FRASI = [
  { testo: 'Il processore esegue le istruzioni dei programmi', chiavi: ['processore', 'istruzioni', 'programmi'] },
  { testo: 'La tastiera e il mouse sono dispositivi di input', chiavi: ['tastiera', 'mouse', 'input'] },
  { testo: 'Una password sicura contiene lettere, numeri e simboli', chiavi: ['password', 'lettere', 'simboli'] },
  { testo: 'Il browser serve per navigare su Internet', chiavi: ['browser', 'navigare', 'Internet'] },
  { testo: 'La memoria RAM si svuota quando spegni il computer', chiavi: ['memoria', 'RAM', 'computer'] },
  { testo: 'Un antivirus protegge il computer dai programmi dannosi', chiavi: ['antivirus', 'protegge', 'dannosi'] },
  { testo: 'Il foglio di calcolo organizza i dati in righe e colonne', chiavi: ['dati', 'righe', 'colonne'] },
  { testo: 'La posta elettronica permette di inviare messaggi in pochi secondi', chiavi: ['posta elettronica', 'messaggi', 'secondi'] },
  { testo: 'Ricorda di salvare spesso il tuo documento', chiavi: ['salvare', 'spesso', 'documento'] },
  { testo: 'Il sistema operativo gestisce le risorse del computer', chiavi: ['sistema operativo', 'risorse', 'computer'] },
];
const DIM_INIZIALE = 11;
const ALLINEAMENTI = ['sinistra', 'centro', 'destra', 'giustificato'];
const ELENCHI = ['nessuno', 'puntato', 'numerato'];
const pulita = w => w.replace(/[.,;:!?«»"]/g, '').toLowerCase();

function scegliFrase(p, rnd) {
  const n = eIntero(p.frase, 1, FRASI.length) ? p.frase : intero(rnd, 1, FRASI.length);
  const f = FRASI[n - 1];
  const parole = f.testo.split(' ').map(testo => ({
    testo, grassetto: false, corsivo: false, sottolineato: false, dimensione: DIM_INIZIALE, colore: 'automatico',
  }));
  return { f, parole };
}

// Indici delle parole della chiave (scelta a caso) e il suo testo cosi' come appare nella frase.
function scegliChiave(f, parole, rnd) {
  const pezzi = scegliUno(rnd, f.chiavi).toLowerCase().split(' ');
  const inizio = parole.findIndex((w, i) => pezzi.every((x, j) => parole[i + j] && pulita(parole[i + j].testo) === x));
  const indici = pezzi.map((x, j) => inizio + j);
  return { indici, testo: indici.map(i => parole[i].testo.replace(/[.,;:!?]/g, '')).join(' ') };
}

const statoEditor = parole => ({ parole, allineamento: 'sinistra', elenco: 'nessuno' });

// Legge lo stato dell'editor senza fidarsi: null se non ha la forma giusta.
function leggiTesto(statoUI, n) {
  const s = oggetto(statoUI);
  if (!Array.isArray(s.parole) || s.parole.length !== n || !s.parole.every(w => w && typeof w === 'object')) return null;
  return s;
}
const MSG_FORMA = 'Qualcosa non torna: usa i pulsanti della barra e riprova.';

function esercizioTesto({ consegna, parole, soluzione, cambia, verifica }) {
  const iniziale = statoEditor(parole);
  const statoSoluzione = JSON.parse(JSON.stringify(iniziale));
  cambia(statoSoluzione);
  return {
    consegna, iniziale, soluzione, statoSoluzione,
    verifica(statoUI) {
      const s = leggiTesto(statoUI, parole.length);
      return s ? verifica(s) : { ok: false, suggerimento: MSG_FORMA };
    },
  };
}

const FORMATI = {
  grassetto: { fai: 'Metti in grassetto', pulsante: 'Grassetto (G)', in: 'in grassetto',
    altre: 'Hai messo in grassetto anche altre parole', sbagliata: 'Hai messo in grassetto la parola sbagliata' },
  corsivo: { fai: 'Metti in corsivo', pulsante: 'Corsivo (C)', in: 'in corsivo',
    altre: 'Hai messo in corsivo anche altre parole', sbagliata: 'Hai messo in corsivo la parola sbagliata' },
  sottolineato: { fai: 'Sottolinea', pulsante: 'Sottolineato (S)', in: 'sottolineate',
    altre: 'Hai sottolineato anche altre parole', sbagliata: 'Hai sottolineato la parola sbagliata' },
};
const laParola = (chiave) => (chiave.indici.length > 1 ? `le parole «${chiave.testo}»` : `la parola «${chiave.testo}»`);
const seleziona = (chiave) => (chiave.indici.length > 1
  ? `Seleziona «${chiave.testo}» (tocca la prima parola e poi l'ultima)` : `Seleziona «${chiave.testo}»`);

function ricettaFormato(prop) {
  const t = FORMATI[prop];
  return {
    ambiente: 'testo',
    genera(parametri, rnd) {
      const p = oggetto(parametri);
      const { f, parole } = scegliFrase(p, rnd);
      const chiave = scegliChiave(f, parole, rnd);
      const target = new Set(chiave.indici);
      return esercizioTesto({
        consegna: `${t.fai} ${laParola(chiave)}.`,
        parole,
        soluzione: `${seleziona(chiave)} e premi ${t.pulsante}`,
        cambia: s => { for (const i of chiave.indici) s.parole[i][prop] = true; },
        verifica(s) {
          const si = s.parole.map(w => w[prop] === true);
          const tutte = chiave.indici.every(i => si[i]);
          const qualcuna = chiave.indici.some(i => si[i]);
          const altre = si.some((v, i) => v && !target.has(i));
          if (tutte && !altre) return { ok: true };
          if (tutte) return { ok: false, suggerimento: t.altre };
          if (qualcuna) return { ok: false, suggerimento: `Manca un pezzo: tutte le parole di «${chiave.testo}» vanno ${t.in}` };
          if (altre) return { ok: false, suggerimento: `${t.sbagliata}: devi selezionare «${chiave.testo}»` };
          return { ok: false, suggerimento: `${seleziona(chiave)} e poi premi ${t.pulsante}` };
        },
      });
    },
  };
}

const dimensioneCarattere = {
  ambiente: 'testo',
  genera(parametri, rnd) {
    const p = oggetto(parametri);
    const verso = p.verso === 'aumenta' || p.verso === 'riduci' ? p.verso : scegliUno(rnd, ['aumenta', 'riduci']);
    const { f, parole } = scegliFrase(p, rnd);
    const chiave = scegliChiave(f, parole, rnd);
    const target = new Set(chiave.indici);
    const piu = verso === 'aumenta';
    const pulsante = piu ? '«Aumenta dimensione carattere»' : '«Riduci dimensione carattere»';
    const giusta = d => typeof d === 'number' && (piu ? d > DIM_INIZIALE : d < DIM_INIZIALE);
    const contraria = d => typeof d === 'number' && (piu ? d < DIM_INIZIALE : d > DIM_INIZIALE);
    return esercizioTesto({
      consegna: `${piu ? 'Aumenta' : 'Riduci'} la dimensione del carattere ${chiave.indici.length > 1 ? 'delle parole' : 'della parola'} «${chiave.testo}».`,
      parole,
      soluzione: `${seleziona(chiave)} e premi ${pulsante}`,
      cambia: s => { for (const i of chiave.indici) s.parole[i].dimensione = piu ? 12 : 10.5; },
      verifica(s) {
        const d = s.parole.map(w => w.dimensione);
        const altre = d.some((x, i) => !target.has(i) && x !== DIM_INIZIALE);
        if (chiave.indici.every(i => giusta(d[i]))) {
          return altre ? { ok: false, suggerimento: 'Hai cambiato la dimensione anche di altre parole' } : { ok: true };
        }
        if (chiave.indici.some(i => contraria(d[i]))) {
          return { ok: false, suggerimento: `«${chiave.testo}» è diventata più ${piu ? 'piccola' : 'grande'}: deve diventare più ${piu ? 'grande' : 'piccola'}` };
        }
        if (chiave.indici.some(i => giusta(d[i]))) {
          return { ok: false, suggerimento: `Manca un pezzo: tutte le parole di «${chiave.testo}» devono cambiare dimensione` };
        }
        if (altre) return { ok: false, suggerimento: `Hai cambiato la dimensione della parola sbagliata: devi selezionare «${chiave.testo}»` };
        return { ok: false, suggerimento: `${seleziona(chiave)} e poi premi ${pulsante}` };
      },
    });
  },
};

const ALLINEA = {
  centro: { consegna: 'Centra il paragrafo.', pulsante: '«Centra»', manca: 'Il testo deve stare al centro di ogni riga' },
  destra: { consegna: 'Allinea il paragrafo a destra.', pulsante: '«Allinea testo a destra»', manca: 'Il testo deve essere allineato al margine destro' },
  giustificato: { consegna: 'Giustifica il paragrafo.', pulsante: '«Giustifica»', manca: 'Il testo deve toccare tutti e due i margini, a sinistra e a destra (giustificato)' },
};

const allinea = {
  ambiente: 'testo',
  genera(parametri, rnd) {
    const p = oggetto(parametri);
    const scelto = typeof p.allineamento === 'string' && proprio(ALLINEA, p.allineamento) ? p.allineamento : scegliUno(rnd, Object.keys(ALLINEA));
    const { parole } = scegliFrase(p, rnd);
    const a = ALLINEA[scelto];
    return esercizioTesto({
      consegna: a.consegna,
      parole,
      soluzione: `Premi ${a.pulsante} (l'allineamento vale per tutto il paragrafo, non serve selezionare)`,
      cambia: s => { s.allineamento = scelto; },
      verifica: s => (s.allineamento === scelto ? { ok: true } : { ok: false, suggerimento: `${a.manca}: cerca il pulsante ${a.pulsante}` }),
    });
  },
};

const elencoPuntato = {
  ambiente: 'testo',
  genera(parametri, rnd) {
    const p = oggetto(parametri);
    const tipo = p.tipo === 'numerato' ? 'numerato' : 'puntato';
    const altro = tipo === 'puntato' ? 'numerato' : 'puntato';
    const { parole } = scegliFrase(p, rnd);
    const pulsante = tipo === 'puntato' ? '«Elenchi puntati»' : '«Numerazione»';
    return esercizioTesto({
      consegna: `Trasforma il paragrafo in un elenco ${tipo}.`,
      parole,
      soluzione: `Premi ${pulsante}`,
      cambia: s => { s.elenco = tipo; },
      verifica(s) {
        if (s.elenco === tipo) return { ok: true };
        if (s.elenco === altro) return { ok: false, suggerimento: `Questo è un elenco ${altro}: serve un elenco ${tipo}` };
        return { ok: false, suggerimento: `Il paragrafo non è ancora un elenco: cerca il pulsante ${pulsante}` };
      },
    });
  },
};

// ===================== ambiente "diapositiva" (mini presentazione)
export const LAYOUT = ['Diapositiva titolo', 'Titolo e contenuto', 'Solo titolo', 'Vuota'];
const TEMI_DIAPO = [
  ['Il computer', 'Le periferiche', 'I programmi', 'Riassunto'],
  ['Internet', 'Il browser', 'I motori di ricerca', 'Navigare sicuri'],
  ['La sicurezza', 'Le password', 'I virus', 'Consigli finali'],
  ['Il foglio di calcolo', 'Le formule', 'I grafici', 'Esercizi'],
];
const proprio = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const normaTitolo = t => (typeof t === 'string' ? t : '').replace(/[’‘]/g, '\'').replace(/\s+/g, ' ').trim().toLowerCase();

// Ogni diapositiva ha un "id" nascosto e stabile: le verifiche riconoscono le diapositive dall'id, non dal titolo,
// cosi' non si puo' "barare" riscrivendo i titoli. Le nuove diapositive create nell'interfaccia hanno un id nuovo.
function presentazione(rnd, quante) {
  return scegliUno(rnd, TEMI_DIAPO).slice(0, quante)
    .map((titolo, i) => ({ id: 'd' + (i + 1), layout: i === 0 ? 'Diapositiva titolo' : 'Titolo e contenuto', titolo }));
}

function leggiDiapo(statoUI) {
  const s = oggetto(statoUI);
  if (!Array.isArray(s.diapositive)) return null;
  const valida = d => d && typeof d === 'object' && typeof d.id === 'string' && typeof d.layout === 'string' && typeof d.titolo === 'string';
  if (!s.diapositive.every(valida)) return null;
  return s.diapositive;
}
const MSG_DIAPO = 'Qualcosa non torna: usa i pulsanti e riprova.';
const ids = d => d.map(x => x.id);
const stessiId = (a, b) => a.length === b.length && a.every(x => b.includes(x));

// titoloModificabile: la casella del titolo si puo' scrivere solo se la consegna lo chiede.
// selezionata (facoltativo): indice della diapositiva selezionata all'apertura (altrimenti la prima).
function esercizioDiapo({ consegna, diapositive, soluzione, finale, verifica, titoloModificabile = false, selezionata }) {
  const iniziale = { diapositive, titoloModificabile };
  if (selezionata !== undefined) iniziale.selezionata = selezionata;
  return {
    consegna, iniziale, soluzione,
    statoSoluzione: { diapositive: finale },
    verifica(statoUI) {
      const d = leggiDiapo(statoUI);
      return d ? verifica(d) : { ok: false, suggerimento: MSG_DIAPO };
    },
  };
}
const copiaDiapo = d => d.map(x => ({ ...x }));

// Prima diapositiva (diversa dal bersaglio) con un campo cambiato rispetto all'inizio: l'hint dice cosa rimettere.
function rimetti(d, diapositive, idBersaglio, campo, uguali = (a, b) => a === b) {
  const k = d.findIndex(x => x.id !== idBersaglio && !uguali(x[campo], diapositive.find(y => y.id === x.id)[campo]));
  if (k === -1) return null;
  const orig = diapositive.find(y => y.id === d[k].id)[campo];
  return `Hai cambiato la diapositiva ${k + 1}: rimettile il ${campo} «${orig}», oppure premi «Ricomincia».`;
}

const scegliLayout = {
  ambiente: 'diapositiva',
  genera(parametri, rnd) {
    const p = oggetto(parametri);
    const diapositive = presentazione(rnd, 3);
    const n = eIntero(p.diapositiva, 1, 3) ? p.diapositiva : intero(rnd, 1, 3);
    const bersaglio = diapositive[n - 1];
    const attuale = bersaglio.layout;
    const L = LAYOUT.includes(p.layout) && p.layout !== attuale ? p.layout : scegliUno(rnd, LAYOUT.filter(l => l !== attuale));
    const finale = copiaDiapo(diapositive);
    finale[n - 1].layout = L;
    return esercizioDiapo({
      consegna: `Cambia il layout della diapositiva ${n} in «${L}».`,
      diapositive, finale,
      soluzione: `Seleziona la diapositiva ${n}, premi «Layout» e scegli «${L}»`,
      verifica(d) {
        if (!stessiId(ids(d), ids(diapositive))) return { ok: false, suggerimento: 'Non aggiungere e non eliminare diapositive: cambia solo il layout' };
        const altre = rimetti(d, diapositive, bersaglio.id, 'layout');
        const fatto = d.find(x => x.id === bersaglio.id).layout;
        if (fatto === L) return altre ? { ok: false, suggerimento: altre } : { ok: true };
        if (fatto !== attuale) return { ok: false, suggerimento: `La diapositiva ${n} ha il layout «${fatto}»: deve avere «${L}»` };
        if (altre) return { ok: false, suggerimento: `${altre} Il layout da cambiare è quello della diapositiva ${n}.` };
        return { ok: false, suggerimento: `Seleziona la diapositiva ${n}, poi premi «Layout» e scegli «${L}»` };
      },
    });
  },
};

const scriviTitolo = {
  ambiente: 'diapositiva',
  genera(parametri, rnd) {
    const p = oggetto(parametri);
    const finale = presentazione(rnd, 3);
    const n = eIntero(p.diapositiva, 1, 3) ? p.diapositiva : intero(rnd, 1, 3);
    const titolo = finale[n - 1].titolo;
    const idBersaglio = finale[n - 1].id;
    const diapositive = copiaDiapo(finale);
    diapositive[n - 1].titolo = '';
    return esercizioDiapo({
      consegna: `Scrivi il titolo «${titolo}» nella diapositiva ${n}.`,
      diapositive, finale, titoloModificabile: true,
      soluzione: `Seleziona la diapositiva ${n} e scrivi «${titolo}» nella casella del titolo`,
      verifica(d) {
        if (!stessiId(ids(d), ids(diapositive))) return { ok: false, suggerimento: 'Non aggiungere e non eliminare diapositive: scrivi solo il titolo' };
        const altre = rimetti(d, diapositive, idBersaglio, 'titolo', (a, b) => normaTitolo(a) === normaTitolo(b));
        const scritto = normaTitolo(d.find(x => x.id === idBersaglio).titolo);
        if (scritto === normaTitolo(titolo)) return altre ? { ok: false, suggerimento: altre } : { ok: true };
        if (scritto !== '') return { ok: false, suggerimento: `Il titolo non è giusto: controlla di aver scritto «${titolo}»` };
        if (altre) return { ok: false, suggerimento: `${altre} Il titolo «${titolo}» va nella diapositiva ${n}.` };
        return { ok: false, suggerimento: `Seleziona la diapositiva ${n} e scrivi «${titolo}» nella casella del titolo` };
      },
    });
  },
};

const ordinaDiapositive = {
  ambiente: 'diapositiva',
  genera(parametri, rnd) {
    const finale = presentazione(rnd, 4);
    const da = intero(rnd, 0, 3);
    const a = scegliUno(rnd, [0, 1, 2, 3].filter(x => x !== da));
    const diapositive = copiaDiapo(finale);
    const [mossa] = diapositive.splice(da, 1);
    diapositive.splice(a, 0, mossa);
    const ordine = finale.map(x => x.titolo).join(', ');
    const passi = Math.abs(a - da);
    const verso = a > da ? '«Sposta su»' : '«Sposta giù»';
    return esercizioDiapo({
      consegna: `Metti le diapositive in quest'ordine: ${ordine}.`,
      diapositive, finale,
      soluzione: `Seleziona «${mossa.titolo}» e premi ${verso} ${passi === 1 ? 'una volta' : passi + ' volte'}, così l'ordine diventa: ${ordine}`,
      verifica(d) {
        if (!stessiId(ids(d), ids(finale))) return { ok: false, suggerimento: 'Non eliminare e non aggiungere diapositive: devi solo spostarle' };
        const i = d.findIndex((x, k) => x.id !== finale[k].id);
        if (i === -1) return { ok: true };
        return { ok: false, suggerimento: `L'ordine non è ancora giusto: la diapositiva ${i + 1} deve essere «${finale[i].titolo}»` };
      },
    });
  },
};

const eliminaDiapositiva = {
  ambiente: 'diapositiva',
  genera(parametri, rnd) {
    const p = oggetto(parametri);
    const diapositive = presentazione(rnd, 4);
    const n = eIntero(p.diapositiva, 1, 4) ? p.diapositiva : intero(rnd, 1, 4);
    const { id: idVia, titolo: via } = diapositive[n - 1];
    const finale = copiaDiapo(diapositive.filter((x, i) => i !== n - 1));
    return esercizioDiapo({
      // Solo il titolo: i numeri cambiano dopo un'eliminazione.
      consegna: `Elimina la diapositiva «${via}».`,
      diapositive, finale,
      soluzione: `Seleziona la diapositiva «${via}» e premi «Elimina»`,
      verifica(d) {
        const ancora = d.some(x => x.id === idVia);
        if (d.length === diapositive.length && ancora) return { ok: false, suggerimento: `La diapositiva «${via}» c'è ancora: selezionala e premi «Elimina»` };
        if (d.length < finale.length) return { ok: false, suggerimento: `Hai eliminato troppe diapositive: deve sparire solo «${via}»` };
        if (d.length > finale.length) return { ok: false, suggerimento: `Deve sparire solo la diapositiva «${via}»` };
        if (ancora) return { ok: false, suggerimento: `Hai eliminato la diapositiva sbagliata: deve sparire «${via}»` };
        if (d.some((x, i) => x.id !== finale[i].id)) return { ok: false, suggerimento: 'Le altre diapositive devono restare nello stesso ordine' };
        return { ok: true };
      },
    });
  },
};

const nuovaDiapositiva = {
  ambiente: 'diapositiva',
  genera(parametri, rnd) {
    const p = oggetto(parametri);
    const L = LAYOUT.includes(p.layout) ? p.layout : scegliUno(rnd, LAYOUT);
    const diapositive = presentazione(rnd, 2);
    const finale = [...copiaDiapo(diapositive), { id: 'nuova-1', layout: L, titolo: '' }];
    // In PowerPoint la nuova diapositiva dopo una "Titolo e contenuto" ha lo stesso layout.
    const automatico = 'Titolo e contenuto';
    // All'apertura e' selezionata l'ultima diapositiva: "Nuova diapositiva" aggiunge in fondo.
    return esercizioDiapo({
      consegna: L === automatico
        ? `1) Premi «Nuova diapositiva»: verrà aggiunta dopo quella selezionata (l'ultima). 2) Controlla che abbia il layout «${L}».`
        : `1) Premi «Nuova diapositiva». 2) Premi «Layout» e scegli «${L}».`,
      diapositive, finale, selezionata: diapositive.length - 1,
      soluzione: `Con l'ultima diapositiva selezionata premi «Nuova diapositiva»${L === automatico ? ` (avrà già il layout «${L}»)` : `, poi premi «Layout» e scegli «${L}»`}`,
      verifica(d) {
        const n = diapositive.length;
        if (d.length <= n) return { ok: false, suggerimento: 'Non hai ancora aggiunto la nuova diapositiva: premi «Nuova diapositiva»' };
        if (d.length > n + 1) return { ok: false, suggerimento: 'Hai aggiunto troppe diapositive: ne serve una sola. Premi «Ricomincia» e riprova' };
        if (diapositive.some((x, i) => d[i].id !== x.id)) {
          return { ok: false, suggerimento: 'La nuova diapositiva deve essere l\'ultima. Premi «Ricomincia»: l\'ultima torna selezionata, poi premi «Nuova diapositiva»' };
        }
        const cambiata = rimetti(d.slice(0, n), diapositive, null, 'layout');
        if (cambiata) return { ok: false, suggerimento: cambiata };
        if (d[n].layout !== L) return { ok: false, suggerimento: `La nuova diapositiva ha il layout «${d[n].layout}»: cambialo in «${L}» con il pulsante «Layout»` };
        return { ok: true };
      },
    });
  },
};

// ===================== ambiente "pulsante" (Trova il pulsante)
const elencoNomi = nomi => nomi.map(n => `«${n}»`).join(' oppure ');

const trovaPulsante = {
  ambiente: 'pulsante',
  genera(parametri, rnd) {
    const p = oggetto(parametri);
    const programma = typeof p.programma === 'string' && PROGRAMMI.includes(p.programma) ? p.programma : 'word';
    const validi = comandiDi(programma);
    const comando = typeof p.comando === 'string' && validi.includes(p.comando) ? p.comando : scegliUno(rnd, validi);
    const barra = BARRE[programma];
    const giusti = pulsantiGiusti(programma, comando);
    const nomiSchede = schedeGiuste(programma, comando);
    const nelleSchede = giusti.filter(g => g.scheda !== 'rapido');
    const nomi = [...new Set(nelleSchede.map(g => g.etichetta))];
    const rapido = giusti.find(g => g.scheda === 'rapido');
    const ids = new Set(giusti.map(g => g.id));
    const nomeDi = id => {
      for (const s of barra.schede) for (const x of s.pulsanti) if (x.id === id) return x.etichetta;
      const r = barra.rapido.find(x => x.id === id);
      return r ? r.etichetta : null;
    };
    const soluzione = nelleSchede.map(g => `apri la scheda «${g.scheda}» e tocca «${g.etichetta}»`).join(', oppure ')
      + (rapido ? ` (va bene anche l'icona «${rapido.etichetta}» nella barra di accesso rapido, in alto)` : '');
    return {
      consegna: `In ${barra.nome} vuoi ${COMANDI[comando].azione}. Scegli la scheda giusta e poi tocca il pulsante ${elencoNomi(nomi)}.`,
      iniziale: { programma, scheda: null, toccato: null },
      soluzione: soluzione.charAt(0).toUpperCase() + soluzione.slice(1),
      statoSoluzione: { programma, scheda: nelleSchede[0].scheda, toccato: nelleSchede[0].id },
      comando,
      verifica(statoUI) {
        const s = oggetto(statoUI);
        const scheda = typeof s.scheda === 'string' ? s.scheda : null;
        const toccato = typeof s.toccato === 'string' ? s.toccato : null;
        const tab = barra.schede.find(x => x.nome === scheda);
        const inRapido = barra.rapido.some(x => x.id === toccato);
        const inScheda = !!tab && tab.pulsanti.some(x => x.id === toccato);
        if (!toccato || (!inRapido && !inScheda)) return { ok: false, suggerimento: 'Prima tocca una scheda, poi il pulsante giusto.' };
        if (ids.has(toccato)) return { ok: true };
        if (inRapido) return { ok: false, suggerimento: `Il pulsante «${nomeDi(toccato)}» serve a un'altra cosa: cerca ${elencoNomi(nomi)}` };
        if (!nomiSchede.includes(scheda)) return { ok: false, suggerimento: `Il pulsante ${elencoNomi(nomi)} non è nella scheda «${scheda}»: prova un'altra scheda.` };
        return { ok: false, suggerimento: `La scheda è giusta, ma il pulsante no: cerca ${elencoNomi(nomi)}` };
      },
    };
  },
};

export const RICETTE = {
  'somma-intervallo': ricettaIntervallo({ funzione: 'SOMMA', etichettaRisultato: 'Totale',
    frase: (t, da, a) => `calcolare il totale ${t.di} (celle da ${da} a ${a})`, calcolaAtteso: somma }),
  'media-intervallo': ricettaIntervallo({ funzione: 'MEDIA', etichettaRisultato: 'Media',
    frase: (t, da, a) => `calcolare la media ${t.di} (celle da ${da} a ${a})`, calcolaAtteso: n => somma(n) / n.length }),
  'max-intervallo': ricettaIntervallo({ funzione: 'MAX', etichettaRisultato: 'Massimo',
    frase: (t, da, a) => `trovare il valore più grande ${t.di} (celle da ${da} a ${a})`, calcolaAtteso: n => Math.max(...n) }),
  'min-intervallo': ricettaIntervallo({ funzione: 'MIN', etichettaRisultato: 'Minimo',
    frase: (t, da, a) => `trovare il valore più piccolo ${t.di} (celle da ${da} a ${a})`, calcolaAtteso: n => Math.min(...n) }),
  'conta-numeri': ricettaIntervallo({ funzione: 'CONTA.NUMERI', etichettaRisultato: 'Quanti', conTesti: true,
    frase: (t, da, a) => `contare quante celle da ${da} a ${a} contengono un numero`, calcolaAtteso: n => n.length }),
  'se-soglia': seSoglia,
  'operazione-celle': operazioneCelle,
  'percentuale': percentuale,
  'grassetto-parola': ricettaFormato('grassetto'),
  'corsivo-parola': ricettaFormato('corsivo'),
  'sottolinea-parola': ricettaFormato('sottolineato'),
  'allinea': allinea,
  'elenco-puntato': elencoPuntato,
  'dimensione-carattere': dimensioneCarattere,
  'scegli-layout': scegliLayout,
  'scrivi-titolo': scriviTitolo,
  'ordina-diapositive': ordinaDiapositive,
  'elimina-diapositiva': eliminaDiapositiva,
  'nuova-diapositiva': nuovaDiapositiva,
  'trova-pulsante': trovaPulsante,
};
