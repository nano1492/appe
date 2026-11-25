// Pezzi comuni a TUTTE le interfacce pratiche (foglio, editor, diapositive, "Trova il pulsante").
// Tutti i testi si inseriscono SOLO con textContent.
import { icona } from '../icons.js';

export const TENTATIVI = 2;

export function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo !== undefined) e.textContent = testo;
  return e;
}

// Icona decorativa (SVG originale di icons.js, nessun testo esterno dentro).
export function iconaSpan(nome, classe = 'pratico-icona') {
  const s = el('span', classe);
  s.innerHTML = icona(nome);
  return s;
}

export function bottone(classe, testo) {
  const b = el('button', classe, testo);
  b.type = 'button';
  return b;
}

export const copia = o => JSON.parse(JSON.stringify(o));

// Tentativi e suggerimenti, uguali per tutti gli esercizi pratici:
// - al primo errore: "Non ancora!" + suggerimento + "Hai ancora un tentativo.";
// - al secondo: suggerimento + "La soluzione era: ..." e onFine(false);
// - giusto: onFine(true). onFine si chiama una volta sola; alla fine tutti i pulsanti e i campi del box si spengono.
// L'esito ("Giusto!"/"Sbagliato") e la spiegazione li mostra il quiz che ospita l'esercizio.
// Gli avvisi (es. "Prima seleziona una parola") stanno in una riga separata e non cancellano i suggerimenti.
// opzioni:
//   invariato(stato) -> true se l'utente non ha ancora cambiato nulla: si mostra msgInvariato e non si consuma un tentativo;
//   soluzione() -> nodi da mettere dopo "La soluzione era: " (pred. il testo di esercizio.soluzione in grassetto).
export function creaControllo(box, esercizio, onFine, opzioni = {}) {
  const zona = el('div', 'pratico-zona');
  const avvisoEl = el('p', 'pratico-avviso');
  avvisoEl.setAttribute('role', 'status');
  avvisoEl.setAttribute('aria-live', 'polite');
  avvisoEl.hidden = true;
  const feedback = el('div', 'foglio-feedback pratico-feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  zona.append(avvisoEl, feedback);
  let tentativi = 0;
  let finito = false;

  const scrivi = (classe, ...parti) => {
    feedback.className = 'foglio-feedback pratico-feedback ' + classe;
    feedback.replaceChildren(...parti);
  };
  const avviso = testo => {
    avvisoEl.textContent = testo || '';
    avvisoEl.hidden = !testo;
  };
  const fine = giusta => {
    finito = true;
    avviso('');
    for (const c of box.querySelectorAll('button, input')) c.disabled = true;
    onFine(giusta);
  };

  const esame = esercizio.modoEsame === true;
  return {
    zona,
    get finito() { return finito; },
    avviso(testo) { if (!finito) avviso(testo); },
    pulisciAvviso() { if (!finito) avviso(''); },
    // Restituisce l'esito di verifica, oppure null se non c'e' stato un tentativo (esercizio finito o niente cambiato).
    // In modo esame la prima consegna e' definitiva: nessun feedback, e restituisce sempre null (cosi' nessun colore).
    controlla(stato) {
      if (finito) return null;
      if (opzioni.invariato && opzioni.invariato(stato)) {
        avviso(opzioni.msgInvariato);
        return null;
      }
      avviso('');
      if (esame) { fine(!!esercizio.verifica(stato).ok); return null; }
      const v = esercizio.verifica(stato);
      if (v.ok) { scrivi(''); fine(true); return v; }
      tentativi++;
      const suggerimento = el('p', '', v.suggerimento || 'Non è ancora giusto.');
      if (tentativi < TENTATIVI) {
        scrivi('no', el('p', 'foglio-esito', 'Non ancora!'), suggerimento, el('p', 'secondario', 'Hai ancora un tentativo.'));
        return v;
      }
      const sol = el('p', 'foglio-soluzione', 'La soluzione era: ');
      sol.append(...(opzioni.soluzione ? opzioni.soluzione() : [el('strong', '', esercizio.soluzione)]));
      scrivi('soluzione', suggerimento, sol);
      fine(false);
      return v;
    },
  };
}

// "Niente e' cambiato rispetto allo stato iniziale" (per l'opzione invariato).
export const uguale = (a, b) => JSON.stringify(a) === JSON.stringify(b);
