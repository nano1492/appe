// Mini editor di testo: un paragrafo diviso in parole da selezionare con un tocco e una barra con i pulsanti
// di Word (Microsoft 365 in italiano). Stato: {parole:[{testo, grassetto, corsivo, sottolineato, dimensione, colore}],
// allineamento, elenco}. Tutti i testi si inseriscono SOLO con textContent.
import { el, bottone, iconaSpan, creaControllo, copia, uguale } from './comune.js';

// Dimensioni del carattere come nell'elenco di Word: "Aumenta/Riduci dimensione carattere" passano alla successiva.
const DIMENSIONI = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
const COLORI = [['automatico', 'Automatico'], ['rosso', 'Rosso'], ['blu', 'Blu'], ['verde', 'Verde']];
const formatta = n => String(n).replace('.', ',');

export function renderEditor(radice, esercizio, onFine) {
  const etichettaVerifica = esercizio.modoEsame === true ? 'Conferma' : 'Controlla'; // modo esame: una sola consegna
  const stato = copia(esercizio.iniziale);
  let sel = null; // {da, a} parole selezionate (contigue), oppure null
  let tavolozzaAperta = false;

  const box = el('div', 'pratico editor-box');
  box.append(el('p', 'quiz-testo', esercizio.consegna));
  box.append(el('p', 'pratico-aiuto', 'Tocca una parola per selezionarla. Per sceglierne più di una, tocca la prima e poi l\'ultima. Per ricominciare tocca «Deseleziona».'));
  const controllo = creaControllo(box, esercizio, onFine, {
    invariato: s => uguale(s, esercizio.iniziale),
    msgInvariato: `Prima cambia il testo con i pulsanti della barra, poi premi «${etichettaVerifica}».`,
  });

  // --- barra degli strumenti (etichette dei pulsanti di Word)
  const barra = el('div', 'editor-barra');
  barra.setAttribute('role', 'toolbar');
  barra.setAttribute('aria-label', 'Barra degli strumenti');
  const pulsanti = {};
  const strumento = (chiave, etichetta, icona, azione) => {
    const b = bottone('editor-strumento');
    b.setAttribute('aria-label', etichetta);
    b.title = etichetta;
    b.append(iconaSpan(icona, 'editor-icona'));
    b.addEventListener('click', () => { if (!controllo.finito) azione(); });
    barra.append(b);
    pulsanti[chiave] = b;
  };
  const selezionate = () => (sel ? stato.parole.slice(sel.da, sel.a + 1) : []);
  const serveSelezione = () => {
    if (sel) return true;
    controllo.avviso('Prima seleziona una parola: toccala nel testo.');
    return false;
  };
  const alterna = prop => {
    if (!serveSelezione()) return;
    const tutte = selezionate().every(w => w[prop]);
    for (const w of selezionate()) w[prop] = !tutte;
    aggiorna();
  };
  const cambiaDimensione = verso => {
    if (!serveSelezione()) return;
    for (const w of selezionate()) {
      const i = DIMENSIONI.findIndex(d => (verso > 0 ? d > w.dimensione : d >= w.dimensione));
      if (verso > 0) w.dimensione = i === -1 ? DIMENSIONI[DIMENSIONI.length - 1] : DIMENSIONI[i];
      else w.dimensione = i <= 0 ? DIMENSIONI[0] : DIMENSIONI[i - 1];
    }
    aggiorna();
  };

  strumento('grassetto', 'Grassetto (Ctrl+G)', 'ed-grassetto', () => alterna('grassetto'));
  strumento('corsivo', 'Corsivo (Ctrl+I)', 'ed-corsivo', () => alterna('corsivo'));
  strumento('sottolineato', 'Sottolineato (Ctrl+S)', 'ed-sottolineato', () => alterna('sottolineato'));
  strumento('sinistra', 'Allinea testo a sinistra', 'ed-sinistra', () => { stato.allineamento = 'sinistra'; aggiorna(); });
  strumento('centro', 'Centra', 'ed-centro', () => { stato.allineamento = 'centro'; aggiorna(); });
  strumento('destra', 'Allinea testo a destra', 'ed-destra', () => { stato.allineamento = 'destra'; aggiorna(); });
  strumento('giustificato', 'Giustifica', 'ed-giustifica', () => { stato.allineamento = 'giustificato'; aggiorna(); });
  // Come in Word, premere di nuovo lo stesso elenco lo toglie.
  strumento('puntato', 'Elenchi puntati', 'ed-puntato', () => { stato.elenco = stato.elenco === 'puntato' ? 'nessuno' : 'puntato'; aggiorna(); });
  strumento('numerato', 'Numerazione', 'ed-numerato', () => { stato.elenco = stato.elenco === 'numerato' ? 'nessuno' : 'numerato'; aggiorna(); });
  strumento('piu', 'Aumenta dimensione carattere', 'ed-piu', () => cambiaDimensione(1));
  strumento('meno', 'Riduci dimensione carattere', 'ed-meno', () => cambiaDimensione(-1));
  strumento('colore', 'Colore carattere', 'ed-colore', () => {
    if (!serveSelezione()) return;
    tavolozzaAperta = !tavolozzaAperta;
    aggiorna();
  });
  pulsanti.colore.setAttribute('aria-haspopup', 'true');
  box.append(barra);

  const tavolozza = el('div', 'editor-tavolozza');
  tavolozza.setAttribute('role', 'group');
  tavolozza.setAttribute('aria-label', 'Colori del carattere');
  for (const [valore, nome] of COLORI) {
    const b = bottone('editor-colore colore-' + valore);
    b.setAttribute('aria-label', nome);
    b.title = nome;
    b.append(el('span', 'editor-campione'), el('span', '', nome));
    b.addEventListener('click', () => {
      if (controllo.finito || !sel) return;
      for (const w of selezionate()) w.colore = valore;
      tavolozzaAperta = false;
      aggiorna();
    });
    tavolozza.append(b);
  }
  box.append(tavolozza);

  // --- il "foglio" con il paragrafo
  const pagina = el('div', 'editor-pagina');
  const paragrafo = el('div', 'editor-paragrafo');
  const segno = el('span', 'editor-segno');
  segno.setAttribute('aria-hidden', 'true');
  paragrafo.append(segno);
  const bottoniParole = stato.parole.map((w, i) => {
    const b = bottone('editor-parola', w.testo);
    b.addEventListener('click', () => tocca(i));
    // spazio vero tra le parole: serve all'allineamento giustificato
    paragrafo.append(b, document.createTextNode(' '));
    return b;
  });
  pagina.append(paragrafo);
  box.append(pagina);

  const info = el('p', 'editor-info');
  info.setAttribute('aria-live', 'polite');
  box.append(info);

  function tocca(i) {
    if (controllo.finito) return;
    if (!sel) sel = { da: i, a: i };
    else if (sel.da === sel.a && sel.da === i) sel = null;
    else if (sel.da === sel.a) sel = { da: Math.min(sel.da, i), a: Math.max(sel.da, i) };
    else sel = { da: i, a: i };
    if (!sel) tavolozzaAperta = false;
    controllo.pulisciAvviso();
    aggiorna();
  }

  const azioni = el('div', 'pratico-azioni');
  const deseleziona = bottone('bottone bottone-scuro', 'Deseleziona');
  deseleziona.addEventListener('click', () => {
    if (controllo.finito) return;
    sel = null;
    tavolozzaAperta = false;
    aggiorna();
  });
  const verifica = bottone('bottone bottone-acqua', etichettaVerifica);
  verifica.addEventListener('click', () => {
    tavolozzaAperta = false;
    if (!controllo.finito) aggiorna();
    controllo.controlla(copia(stato));
  });
  azioni.append(deseleziona, verifica);
  box.append(azioni, controllo.zona);

  const ALLINEA_CSS = { sinistra: 'left', centro: 'center', destra: 'right', giustificato: 'justify' };

  function aggiorna() {
    paragrafo.style.textAlign = ALLINEA_CSS[stato.allineamento] || 'left';
    segno.textContent = stato.elenco === 'puntato' ? '•' : stato.elenco === 'numerato' ? '1.' : '';
    paragrafo.classList.toggle('con-elenco', stato.elenco !== 'nessuno');
    stato.parole.forEach((w, i) => {
      const b = bottoniParole[i];
      const scelta = !!sel && i >= sel.da && i <= sel.a;
      b.className = 'editor-parola';
      if (w.grassetto) b.classList.add('grassetto');
      if (w.corsivo) b.classList.add('corsivo');
      if (w.sottolineato) b.classList.add('sottolineato');
      b.classList.add('colore-' + w.colore);
      if (scelta) b.classList.add('selezionata');
      b.setAttribute('aria-pressed', String(scelta));
      b.style.fontSize = Math.min(2.4, Math.max(0.8, w.dimensione / DIMENSIONI[4])) + 'em';
    });
    const sw = selezionate();
    for (const p of ['grassetto', 'corsivo', 'sottolineato']) {
      pulsanti[p].setAttribute('aria-pressed', String(sw.length > 0 && sw.every(w => w[p])));
    }
    for (const a of ['sinistra', 'centro', 'destra', 'giustificato']) pulsanti[a].setAttribute('aria-pressed', String(stato.allineamento === a));
    for (const e of ['puntato', 'numerato']) pulsanti[e].setAttribute('aria-pressed', String(stato.elenco === e));
    pulsanti.colore.setAttribute('aria-expanded', String(tavolozzaAperta));
    tavolozza.hidden = !tavolozzaAperta;
    if (sw.length === 0) info.textContent = 'Nessuna parola selezionata';
    else {
      const dims = [...new Set(sw.map(w => w.dimensione))];
      const quante = sw.length === 1 ? '1 parola selezionata' : `${sw.length} parole selezionate`;
      info.textContent = `${quante} · dimensione carattere ${dims.length === 1 ? formatta(dims[0]) : 'mista'}`;
    }
  }

  aggiorna();
  radice.append(box);
  return box;
}
