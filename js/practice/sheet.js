// Mini foglio di calcolo: griglia 5 colonne (A-E) x 7 righe, barra della formula "fx", pulsante "Controlla".
// Tutti i testi (consegna, celle, suggerimenti) si inseriscono SOLO con textContent.
import { valuta, formattaValore } from './formula.js';
import { el, creaControllo } from './comune.js';

const COLONNE = ['A', 'B', 'C', 'D', 'E'];
const RIGHE = 7;
let contatore = 0;

function mostraValore(td, v) {
  td.classList.toggle('numero', typeof v === 'number');
  td.textContent = v === undefined || v === null ? '' : formattaValore(v);
  td.title = td.textContent;
}

// onFine(giusta) viene chiamata una volta sola: alla risposta giusta o dopo il secondo errore.
export function renderFoglio(radice, esercizio, onFine) {
  const etichettaVerifica = esercizio.modoEsame === true ? 'Conferma' : 'Controlla'; // modo esame: una sola consegna
  const { celle, destinazione } = esercizio.iniziale;
  const box = el('div', 'pratico foglio-box');

  box.append(el('p', 'quiz-testo', esercizio.consegna));
  const obiettivo = el('p', 'foglio-obiettivo', 'Scrivi la formula nella cella ');
  obiettivo.append(el('strong', 'foglio-obiettivo-cella', destinazione));
  box.append(obiettivo);

  const tabella = el('table', 'foglio');
  const testa = el('thead');
  const rigaTesta = el('tr');
  rigaTesta.append(el('th', 'foglio-angolo', ''));
  for (const c of COLONNE) {
    const th = el('th', '', c);
    th.scope = 'col';
    rigaTesta.append(th);
  }
  testa.append(rigaTesta);
  const corpo = el('tbody');
  let cellaDest = null;
  for (let r = 1; r <= RIGHE; r++) {
    const tr = el('tr');
    const th = el('th', '', String(r));
    th.scope = 'row';
    tr.append(th);
    for (const c of COLONNE) {
      const nome = c + r;
      const td = el('td');
      td.dataset.cella = nome;
      if (nome === destinazione) {
        td.classList.add('destinazione');
        cellaDest = td;
      } else {
        mostraValore(td, celle[nome]);
        if (r === 1 && celle[nome] !== undefined) td.classList.add('intestazione');
      }
      tr.append(td);
    }
    corpo.append(tr);
  }
  tabella.append(testa, corpo);
  const scorri = el('div', 'foglio-scorri');
  scorri.append(tabella);
  box.append(scorri);

  const form = el('form', 'formula-barra');
  form.noValidate = true;
  const riga = el('div', 'formula-riga');
  const id = 'formula-' + (++contatore);
  const fx = el('label', 'formula-fx', 'fx');
  fx.htmlFor = id;
  const input = el('input', 'formula-input');
  input.id = id;
  input.type = 'text';
  input.setAttribute('inputmode', 'text');
  input.setAttribute('autocapitalize', 'characters');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('enterkeyhint', 'done');
  input.setAttribute('aria-label', `Formula per la cella ${destinazione}`);
  input.placeholder = '=...';
  riga.append(fx, input);
  const bottone = el('button', 'bottone bottone-acqua', etichettaVerifica);
  bottone.type = 'submit';
  form.append(riga, bottone);
  box.append(form);

  // Tentativi e suggerimenti: stesso flusso di tutti gli esercizi pratici (comune.js).
  // Una formula vuota non conta come tentativo: compare solo un avviso.
  const controllo = creaControllo(box, esercizio, onFine, {
    invariato: s => s.formula.trim() === '',
    msgInvariato: 'Scrivi una formula prima di controllare. Le formule iniziano con =',
    soluzione() {
      const giusto = valuta(esercizio.soluzione, celle);
      return [el('code', 'foglio-codice', esercizio.soluzione), ...(giusto.ok ? [` (risultato ${formattaValore(giusto.valore)})`] : [])];
    },
  });
  box.append(controllo.zona);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (controllo.finito) return;
    const formula = input.value;
    const stato = { cella: destinazione, formula };
    if (formula.trim() !== '') {
      const r = valuta(formula, celle);
      cellaDest.classList.add('calcolata');
      if (r.ok) mostraValore(cellaDest, r.valore);
      else { cellaDest.classList.remove('numero'); cellaDest.textContent = r.errore.startsWith('#') ? r.errore : '#ERR'; }
    }
    const v = controllo.controlla(stato);
    if (v) {
      // L'esito ("Giusto! +20 XP") lo mostra il quiz: qui basta colorare la cella.
      cellaDest.classList.toggle('giusta', v.ok);
      cellaDest.classList.toggle('sbagliata', !v.ok);
    }
    if (!controllo.finito) input.focus();
  });

  radice.append(box);
  return box;
}
