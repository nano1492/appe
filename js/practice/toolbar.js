// "Trova il pulsante": una barra multifunzione finta (schede + pulsanti con icone originali).
// Tutti i testi si inseriscono SOLO con textContent.
import { el, bottone, iconaSpan, creaControllo } from './comune.js';

// ======================================================================================
// DATI: barra multifunzione di Microsoft 365 in italiano (Word, Excel e PowerPoint per
// Windows, versione 2025-2026). Unica tabella da cui dipendono sia l'interfaccia sia la
// ricetta "trova-pulsante": un pulsante con "comando" e' una risposta giusta per quel comando,
// quindi le schede giuste di un comando sono quelle che contengono un suo pulsante.
//   Salva, Stampa              -> File (Salva anche nella barra di accesso rapido)
//   Annulla                    -> Home (anche nella barra di accesso rapido)
//   Copia, Incolla             -> Home
//   Tabella, Immagini          -> Inserisci
//   Controllo ortografia       -> Revisione (in Word: "Editor" oppure "Controllo ortografia e grammatica")
//   Ordina (solo Excel)        -> Home ("Ordina e filtra") oppure Dati ("Ordina")
//   Unisci e allinea al centro -> Home (solo Excel)
//   Nuova diapositiva          -> Home oppure Inserisci (solo PowerPoint)
//   Transizione Dissolvenza    -> Transizioni (solo PowerPoint)
// Gli altri pulsanti sono "distrattori" veri delle stesse schede; nessuno ha l'etichetta
// di un pulsante giusto (lo controlla un test).
// ======================================================================================
const P = (etichetta, icona, comando) => (comando ? { etichetta, icona, comando } : { etichetta, icona });

const FILE = [
  P('Nuovo', 'r-nuovo'), P('Apri', 'r-apri'), P('Informazioni', 'r-informazioni'), P('Salva', 'r-salva', 'salva'),
  P('Salva con nome', 'r-salva-nome'), P('Stampa', 'r-stampa', 'stampa'), P('Condividi', 'r-condividi'),
  P('Esporta', 'r-esporta'), P('Chiudi', 'r-chiudi'),
];
const APPUNTI = [
  P('Annulla', 'r-annulla', 'annulla'), P('Ripeti', 'r-ripeti'), P('Incolla', 'r-incolla', 'incolla'),
  P('Taglia', 'r-taglia'), P('Copia', 'r-copia', 'copia'),
];
const RAPIDO = [P('Salva', 'r-salva', 'salva'), P('Annulla', 'r-annulla', 'annulla')];

const DATI = {
  word: {
    nome: 'Word',
    schede: {
      File: FILE,
      Home: [...APPUNTI, P('Copia formato', 'r-pennello'), P('Grassetto', 'ed-grassetto'), P('Corsivo', 'ed-corsivo'),
        P('Sottolineato', 'ed-sottolineato'), P('Elenchi puntati', 'ed-puntato'), P('Numerazione', 'ed-numerato'), P('Centra', 'ed-centro'),
        P('Trova', 'r-trova'), P('Sostituisci', 'r-revisioni')],
      Inserisci: [P('Pagina vuota', 'r-pagina'), P('Tabella', 'tabella', 'tabella'), P('Immagini', 'r-immagine', 'immagine'),
        P('Forme', 'r-forme'), P('Icone', 'r-icone'), P('Grafico', 'r-grafico'), P('Collegamento', 'r-collegamento'),
        P('Intestazione', 'r-intestazione'), P('Piè di pagina', 'r-pie'), P('Numero di pagina', 'r-numero-pagina'),
        P('Casella di testo', 'r-casella-testo'), P('Simbolo', 'r-simbolo')],
      Layout: [P('Margini', 'r-margini'), P('Orientamento', 'r-orientamento'), P('Dimensioni', 'r-dimensioni'),
        P('Colonne', 'r-colonne'), P('Interruzioni', 'r-interruzioni'), P('Sillabazione', 'r-sillabazione')],
      Revisione: [P('Editor', 'r-editor', 'ortografia'), P('Controllo ortografia e grammatica', 'r-ortografia', 'ortografia'), P('Sinonimi', 'r-sinonimi'),
        P('Conteggio parole', 'r-conteggio'), P('Leggi ad alta voce', 'r-voce'), P('Traduci', 'r-traduci'),
        P('Nuovo commento', 'r-commento'), P('Revisioni', 'r-revisioni')],
    },
  },
  excel: {
    nome: 'Excel',
    schede: {
      File: FILE,
      Home: [...APPUNTI, P('Grassetto', 'ed-grassetto'), P('Unisci e allinea al centro', 'r-unisci', 'unisci'),
        P('Testo a capo', 'r-a-capo'), P('Formattazione condizionale', 'r-condizionale'), P('Somma automatica', 'r-somma'),
        P('Ordina e filtra', 'r-ordina', 'ordina'), P('Trova e seleziona', 'r-trova')],
      Inserisci: [P('Tabella pivot', 'r-pivot'), P('Tabella', 'tabella', 'tabella'), P('Immagini', 'r-immagine', 'immagine'),
        P('Forme', 'r-forme'), P('Grafici consigliati', 'r-grafico'), P('Collegamento', 'r-collegamento'),
        P('Casella di testo', 'r-casella-testo'), P('Simbolo', 'r-simbolo')],
      Dati: [P('Recupera dati', 'r-dati'), P('Aggiorna tutti', 'r-aggiorna'), P('Ordina', 'r-ordina', 'ordina'),
        P('Filtro', 'r-filtro'), P('Testo in colonne', 'r-testo-colonne'), P('Rimuovi duplicati', 'r-duplicati'),
        P('Convalida dati', 'r-convalida')],
      Revisione: [P('Controllo ortografia', 'r-ortografia', 'ortografia'), P('Sinonimi', 'r-sinonimi'), P('Traduci', 'r-traduci'),
        P('Nuovo commento', 'r-commento'), P('Proteggi foglio', 'r-proteggi'), P('Proteggi cartella di lavoro', 'r-proteggi')],
    },
  },
  powerpoint: {
    nome: 'PowerPoint',
    schede: {
      File: FILE,
      Home: [...APPUNTI, P('Nuova diapositiva', 'r-diapo-nuova', 'nuova-diapositiva'), P('Layout', 'r-layout'),
        P('Reimposta', 'r-reimposta'), P('Sezione', 'r-sezione'), P('Grassetto', 'ed-grassetto'), P('Forme', 'r-forme'),
        P('Trova', 'r-trova')],
      Inserisci: [P('Nuova diapositiva', 'r-diapo-nuova', 'nuova-diapositiva'), P('Tabella', 'tabella', 'tabella'),
        P('Immagini', 'r-immagine', 'immagine'), P('Forme', 'r-forme'), P('Icone', 'r-icone'), P('SmartArt', 'r-smartart'),
        P('Grafico', 'r-grafico'), P('Casella di testo', 'r-casella-testo'), P('Video', 'r-video'), P('Audio', 'r-suono')],
      Transizioni: [P('Anteprima', 'r-anteprima'), P('Nessuna', 'r-nessuna'), P('Morphing', 'r-morphing'),
        P('Dissolvenza', 'r-dissolvenza', 'transizioni'), P('Spinta', 'r-spinta'), P('Opzioni effetto', 'r-opzioni'),
        P('Suono', 'r-suono'), P('Durata', 'r-durata'), P('Applica a tutte', 'r-applica-tutte')],
      Revisione: [P('Controllo ortografia', 'r-ortografia', 'ortografia'), P('Sinonimi', 'r-sinonimi'), P('Traduci', 'r-traduci'),
        P('Nuovo commento', 'r-commento'), P('Confronta', 'r-confronta')],
    },
  },
};

// Cosa si chiede di fare per ogni comando (nella consegna: "In Word vuoi ...").
export const COMANDI = {
  salva: { azione: 'salvare il file' },
  stampa: { azione: 'stampare il file' },
  annulla: { azione: 'annullare l\'ultima modifica' },
  copia: { azione: 'copiare quello che hai selezionato' },
  incolla: { azione: 'incollare quello che hai copiato' },
  tabella: { azione: 'inserire una tabella' },
  immagine: { azione: 'inserire un\'immagine salvata sul computer' },
  ortografia: { azione: 'controllare l\'ortografia' },
  ordina: { azione: 'ordinare i dati della tabella' },
  unisci: { azione: 'unire alcune celle e centrare il testo' },
  'nuova-diapositiva': { azione: 'aggiungere una nuova diapositiva' },
  transizioni: { azione: 'applicare alla diapositiva la transizione Dissolvenza' },
};

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
const conId = (prefisso, pulsanti) => pulsanti.map(p => ({ id: `${prefisso}-${slug(p.etichetta)}`, ...p }));

// BARRE[programma] = { nome, schede: [{nome, pulsanti: [{id, etichetta, icona, comando?}]}], rapido: [...] }
export const BARRE = Object.fromEntries(Object.entries(DATI).map(([prog, d]) => [prog, {
  nome: d.nome,
  schede: Object.entries(d.schede).map(([nome, pulsanti]) => ({ nome, pulsanti: conId(slug(nome), pulsanti) })),
  rapido: conId('rapido', RAPIDO),
}]));

export const PROGRAMMI = Object.keys(BARRE);

// Comandi che esistono in quel programma (nell'ordine di COMANDI).
export function comandiDi(programma) {
  const b = BARRE[programma];
  const usati = new Set([...b.schede.flatMap(s => s.pulsanti), ...b.rapido].map(p => p.comando).filter(Boolean));
  return Object.keys(COMANDI).filter(c => usati.has(c));
}

// Nomi delle schede (barra di accesso rapido esclusa) che contengono un pulsante giusto per il comando.
export function schedeGiuste(programma, comando) {
  return BARRE[programma].schede.filter(s => s.pulsanti.some(p => p.comando === comando)).map(s => s.nome);
}

// Tutti i pulsanti giusti per il comando, con la loro scheda ('rapido' = barra di accesso rapido).
export function pulsantiGiusti(programma, comando) {
  const b = BARRE[programma];
  const out = [];
  for (const s of b.schede) for (const p of s.pulsanti) if (p.comando === comando) out.push({ ...p, scheda: s.nome });
  for (const p of b.rapido) if (p.comando === comando) out.push({ ...p, scheda: 'rapido' });
  return out;
}

// ======================================================================================
// INTERFACCIA. esercizio.iniziale = {programma, scheda: null, toccato: null}.
// Si apre una scheda (non conta come tentativo), poi si tocca un pulsante: ogni pulsante toccato e' un tentativo.
// ======================================================================================
export function renderPulsante(radice, esercizio, onFine) {
  const barra = BARRE[esercizio.iniziale.programma] || BARRE.word;
  const box = el('div', 'pratico ribbon-box');
  box.append(el('p', 'quiz-testo', esercizio.consegna));
  box.append(el('p', 'pratico-aiuto', 'Prima tocca una scheda, poi il pulsante giusto.'));

  const finestra = el('div', 'ribbon');
  const titolo = el('div', 'ribbon-titolo');
  const rapido = el('div', 'ribbon-rapido-barra');
  rapido.setAttribute('role', 'group');
  rapido.setAttribute('aria-label', 'Barra di accesso rapido');
  titolo.append(rapido, el('span', 'ribbon-programma', barra.nome));

  const schede = el('div', 'ribbon-schede');
  schede.setAttribute('role', 'tablist');
  schede.setAttribute('aria-label', 'Schede della barra multifunzione');
  const pannello = el('div', 'ribbon-pannello');
  pannello.setAttribute('role', 'tabpanel');
  pannello.id = 'ribbon-pannello-' + Math.random().toString(36).slice(2);
  finestra.append(titolo, schede, pannello);
  box.append(finestra);

  let scheda = null;
  const controllo = creaControllo(box, esercizio, onFine);

  // Modo esame: il tocco sceglie soltanto; si consegna con "Conferma" (una volta sola).
  const esame = esercizio.modoEsame === true;
  let scelta = null;
  let conferma = null;
  const tocca = (b, id) => {
    if (controllo.finito) return;
    if (esame) {
      for (const x of box.querySelectorAll('.scelto')) x.classList.remove('scelto');
      b.classList.add('scelto');
      scelta = { scheda, toccato: id };
      conferma.disabled = false;
      return;
    }
    for (const x of box.querySelectorAll('.giusto, .sbagliato')) x.classList.remove('giusto', 'sbagliato');
    const v = controllo.controlla({ scheda, toccato: id });
    if (v) b.classList.add(v.ok ? 'giusto' : 'sbagliato');
  };
  const pulsanteRibbon = (p, classe, conTesto) => {
    const b = bottone(classe);
    b.dataset.id = p.id;
    b.setAttribute('aria-label', p.etichetta);
    b.title = p.etichetta;
    b.append(iconaSpan(p.icona, 'ribbon-icona'));
    if (conTesto) b.append(el('span', 'ribbon-etichetta', p.etichetta));
    if (esame && scelta && scelta.toccato === p.id) b.classList.add('scelto');
    b.addEventListener('click', () => tocca(b, p.id));
    return b;
  };

  for (const p of barra.rapido) rapido.append(pulsanteRibbon(p, 'ribbon-rapido', false));

  const linguette = barra.schede.map(s => {
    const t = bottone('ribbon-scheda', s.nome);
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('aria-controls', pannello.id);
    t.addEventListener('click', () => apri(s, t));
    schede.append(t);
    return t;
  });

  function apri(s, t) {
    if (controllo.finito) return;
    scheda = s.nome;
    for (const x of linguette) x.setAttribute('aria-selected', String(x === t));
    pannello.className = 'ribbon-pannello' + (s.nome === 'File' ? ' ribbon-file' : '');
    pannello.setAttribute('aria-label', 'Scheda ' + s.nome);
    pannello.replaceChildren(...s.pulsanti.map(p => pulsanteRibbon(p, 'ribbon-pulsante', true)));
  }

  pannello.append(el('p', 'ribbon-vuoto', 'Tocca una scheda qui sopra per vedere i suoi pulsanti.'));
  if (esame) {
    conferma = bottone('bottone bottone-acqua', 'Conferma');
    conferma.disabled = true;
    conferma.addEventListener('click', () => { if (scelta) controllo.controlla(scelta); });
    const azioni = el('div', 'pratico-azioni');
    azioni.append(conferma);
    box.append(azioni);
  }
  box.append(controllo.zona);
  radice.append(box);
  return box;
}
