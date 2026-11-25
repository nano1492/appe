// XP, livelli, streak e medaglie. Funzioni pure, nessun accesso a DOM o storage.
export const XP_SCELTA = 10;
export const XP_PRATICO = 20;

export const NOMI_LIVELLO = [
  'Recluta dei bit',
  'Cadetto del codice',
  'Pilota di pixel',
  'Navigatore di rete',
  'Esploratore digitale',
  'Guardiano dei dati',
  'Capitano del cloud',
  'Comandante del cursore',
  "Ammiraglio dell'algoritmo",
  'Leggenda della galassia ICDL',
];

// ---- livelli

const XP_MAX = 1e9; // limite di sicurezza contro valori manomessi

export function sogliaLivello(n) {
  return 50 * (n - 1) * n;
}

export function livelloDa(xp) {
  const x = typeof xp === 'number' && Number.isFinite(xp) && xp > 0 ? Math.min(xp, XP_MAX) : 0;
  // inverso di 50*n*(n-1) <= x, poi correzione per l'errore dei decimali
  let livello = Math.max(1, Math.floor((1 + Math.sqrt(1 + x / 12.5)) / 2));
  while (livello > 1 && sogliaLivello(livello) > x) livello--;
  while (sogliaLivello(livello + 1) <= x) livello++;
  return {
    livello,
    xpNelLivello: x - sogliaLivello(livello),
    xpPerProssimo: sogliaLivello(livello + 1) - sogliaLivello(livello),
  };
}

export function nomeLivello(livello) {
  const l = typeof livello === 'number' && Number.isFinite(livello) ? Math.floor(livello) : 1;
  const n = Math.max(1, Math.min(l, NOMI_LIVELLO.length));
  return NOMI_LIVELLO[n - 1];
}

// ---- streak

const pad = (n) => String(n).padStart(2, '0');

export function giornoLocale(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Numero di giorni dal calendario (UTC, quindi senza problemi di ora legale). null se la data non e' valida.
function giorniUTC(testo) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof testo === 'string' ? testo : '');
  if (!m) return null;
  const ms = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(ms);
  // controllo di andata e ritorno: scarta date come 2026-02-30
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
  return Math.round(ms / 86400000);
}

export function aggiornaStreak(streak, oggi) {
  const ultimo = streak && typeof streak === 'object' ? streak.ultimoGiorno : null;
  const giorni = streak && typeof streak.giorni === 'number' && Number.isFinite(streak.giorni) ? streak.giorni : 0;
  const a = giorniUTC(ultimo);
  const b = giorniUTC(oggi);
  if (b === null) return streak && typeof streak === 'object' ? streak : { giorni: 0, ultimoGiorno: null }; // oggi non valido
  if (a === null) return { giorni: 1, ultimoGiorno: oggi };
  const diff = b - a;
  if (diff === 0 || diff < 0) return { giorni, ultimoGiorno: ultimo }; // stesso giorno o orologio indietro
  if (diff === 1) return { giorni: giorni + 1, ultimoGiorno: oggi };
  return { giorni: 1, ultimoGiorno: oggi };
}

// ---- helper per le medaglie (lettura difensiva dello stato)

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const voce = (stato, id) => {
  const r = stato && stato.risposte && typeof stato.risposte === 'object' ? stato.risposte[id] : null;
  return r && typeof r === 'object' ? r : {};
};
const moduli = (banca) => (Array.isArray(banca) ? banca : []);
const domandeDi = (modulo) => (modulo && Array.isArray(modulo.domande) ? modulo.domande : []);
const voci = (stato) => (stato && stato.risposte && typeof stato.risposte === 'object' ? Object.values(stato.risposte) : []);
const somma = (valori, campo) => valori.reduce((t, r) => t + num(r && typeof r === 'object' ? r[campo] : 0), 0);
const esami = (stato) => (Array.isArray(stato && stato.esami) ? stato.esami.filter((e) => e && typeof e === 'object') : []);

export function moduloCompletato(stato, modulo) {
  const d = domandeDi(modulo);
  return d.length >= 1 && d.every((q) => q && num(voce(stato, q.id).giuste) >= 1);
}

const serieMax = (stato) => Math.max(num(stato && stato.streak && stato.streak.giorni), num(stato && stato.streakMigliore));
const totaleGiuste = (stato) => somma(voci(stato), 'giuste');
const praticheGiuste = (stato, banca) => {
  let t = 0;
  for (const m of moduli(banca)) for (const q of domandeDi(m)) if (q && q.tipo === 'pratico') t += num(voce(stato, q.id).giuste);
  return t;
};

// ---- medaglie

export const MEDAGLIE = [
  { id: 'streak-3', nome: 'Fiamma viva', descrizione: '3 giorni di fila', icona: 'fiamma',
    condizione: (s) => serieMax(s) >= 3 },
  { id: 'streak-7', nome: 'Settimana di fuoco', descrizione: '7 giorni di fila', icona: 'fulmine',
    condizione: (s) => serieMax(s) >= 7 },
  { id: 'streak-30', nome: 'Razzo inarrestabile', descrizione: '30 giorni di fila', icona: 'razzo',
    condizione: (s) => serieMax(s) >= 30 },
  { id: 'giuste-10', nome: 'Primi centri', descrizione: '10 risposte giuste', icona: 'stella',
    condizione: (s) => totaleGiuste(s) >= 10 },
  { id: 'giuste-100', nome: 'Cento stelle', descrizione: '100 risposte giuste', icona: 'stella',
    condizione: (s) => totaleGiuste(s) >= 100 },
  { id: 'giuste-500', nome: 'Cervellone galattico', descrizione: '500 risposte giuste', icona: 'astronauta',
    condizione: (s) => totaleGiuste(s) >= 500 },
  { id: 'modulo-1', nome: 'Missione compiuta', descrizione: 'Hai chiuso un modulo intero', icona: 'scudo',
    condizione: (s, b) => moduli(b).some((m) => moduloCompletato(s, m)) },
  { id: 'moduli-7', nome: 'Signore dei moduli', descrizione: 'Tutti e 7 i moduli completati', icona: 'coppa',
    condizione: (s, b) => moduli(b).length === 7 && moduli(b).every((m) => moduloCompletato(s, m)) },
  { id: 'esame-1', nome: 'Esame superato', descrizione: 'Promosso a una simulazione da 36 domande', icona: 'lucchetto',
    condizione: (s) => esami(s).some((e) => e.promosso === true && e.totale === 36) },
  { id: 'esame-perfetto', nome: 'Punteggio da record', descrizione: 'Esame con 36 su 36', icona: 'coppa',
    condizione: (s) => esami(s).some((e) => e.totale === 36 && e.giuste === 36) },
  { id: 'flashcard-50', nome: 'Maestro di carte', descrizione: '50 flashcard viste', icona: 'documento',
    condizione: (s) => num(s && s.flashcardViste) >= 50 },
  { id: 'pratico-10', nome: 'Mani in pasta', descrizione: '10 esercizi pratici giusti', icona: 'tabella',
    condizione: (s, b) => praticheGiuste(s, b) >= 10 },
  { id: 'ripasso-pulito', nome: 'Errori sconfitti', descrizione: 'Ripasso vuoto dopo 5 sbagli', icona: 'nuvola',
    condizione: (s) => {
      const r = s && s.ripasso;
      const vuoto = !!r && typeof r === 'object' && !Array.isArray(r) && Object.keys(r).length === 0;
      return vuoto && somma(voci(s), 'sbagliate') >= 5;
    } },
  { id: 'livello-5', nome: 'Pilota esperto', descrizione: 'Arrivi al livello 5', icona: 'cpu',
    condizione: (s) => livelloDa(s && s.xp).livello >= 5 },
];

export function nuoveMedaglie(stato, banca) {
  const gia = Array.isArray(stato && stato.medaglie) ? stato.medaglie : [];
  return MEDAGLIE.filter((m) => !gia.includes(m.id) && m.condizione(stato, banca)).map((m) => m.id);
}
