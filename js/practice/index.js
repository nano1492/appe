// Esercizi pratici: sceglie l'interfaccia giusta in base a RICETTE[ricetta].ambiente.
import { RICETTE } from './recipes.js';
import { renderFoglio } from './sheet.js';
import { renderEditor } from './editor.js';
import { renderDiapositive } from './slides.js';
import { renderPulsante } from './toolbar.js';

const INTERFACCE = { foglio: renderFoglio, testo: renderEditor, diapositiva: renderDiapositive, pulsante: renderPulsante };
const proprio = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

export function ambienteDisponibile(ricetta) {
  return typeof ricetta === 'string' && proprio(RICETTE, ricetta) && proprio(INTERFACCE, RICETTE[ricetta].ambiente);
}

// onFine(giusta). Restituisce false (senza mostrare nulla) se l'esercizio non si puo' mostrare:
// ricetta senza interfaccia o errore nel generarlo. Chi chiama deve offrire un modo per andare avanti.
// opzioni.modoEsame: UNA sola consegna con "Conferma", senza suggerimenti, soluzione ne' colori; onFine(giusta) una volta.
export function renderPratico(radice, domanda, rnd, onFine, opzioni = {}) {
  if (!domanda || !ambienteDisponibile(domanda.ricetta)) return false;
  const ricetta = RICETTE[domanda.ricetta];
  let esercizio;
  try {
    esercizio = ricetta.genera(domanda.parametri, typeof rnd === 'function' ? rnd : Math.random);
  } catch (e) {
    console.warn('Esercizio pratico non generato', domanda.id, e);
    return false;
  }
  const modoEsame = !!(opzioni && opzioni.modoEsame);
  if (modoEsame) esercizio.modoEsame = true;
  // opzioni.alGenerato(esercizio): per chi deve ricordare consegna e soluzione (es. il risultato della simulazione).
  if (opzioni && typeof opzioni.alGenerato === 'function') opzioni.alGenerato(esercizio);
  INTERFACCE[ricetta.ambiente](radice, esercizio, onFine);
  return true;
}
