// Riquadro di festa per salto di livello e medaglie. Si chiude con un tocco o con Esc.
import { icona } from '../icons.js';

function nodo(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo !== undefined) e.textContent = testo;
  return e;
}

// Restituisce una promessa che si risolve quando il riquadro viene chiuso,
// anche se viene tolto dal DOM dall'esterno (cambio di schermata).
export function mostraCelebrazione(radice, { tipo, titolo, sottotitolo, icona: nomeIcona }) {
  return new Promise((risolvi) => {
    const fondo = nodo('div', 'celebra-fondo');
    fondo.setAttribute('role', 'dialog');
    fondo.setAttribute('aria-modal', 'true');
    fondo.setAttribute('aria-label', titolo);
    const scheda = nodo('div', 'celebra-scheda celebra-' + (tipo === 'livello' ? 'livello' : 'medaglia'));
    const ic = nodo('span', 'celebra-icona');
    ic.innerHTML = icona(nomeIcona || (tipo === 'livello' ? 'fulmine' : 'stella'));
    const chiudi = nodo('button', 'bottone bottone-acqua', 'Continua');
    chiudi.type = 'button';
    scheda.append(ic, nodo('h2', 'celebra-titolo', titolo), nodo('p', 'celebra-sotto', sottotitolo || ''), chiudi);
    fondo.append(scheda);

    const precedente = document.activeElement;
    let finito = false;
    let osservatore = null;
    const fine = (ripristinaFocus) => {
      if (finito) return;
      finito = true;
      if (osservatore) osservatore.disconnect();
      fondo.removeEventListener('keydown', tasto);
      fondo.remove();
      if (ripristinaFocus && precedente && precedente.isConnected && precedente.focus) precedente.focus({ preventScroll: true });
      risolvi();
    };
    // L'unico elemento attivabile e' il bottone: Tab e Maiusc+Tab restano li'.
    function tasto(e) {
      if (e.key === 'Escape') { e.preventDefault(); fine(true); }
      else if (e.key === 'Tab') { e.preventDefault(); chiudi.focus({ preventScroll: true }); }
    }
    fondo.addEventListener('keydown', tasto);
    fondo.addEventListener('click', () => fine(true));

    radice.append(fondo);
    chiudi.focus({ preventScroll: true });

    // Se qualcuno svuota la radice, la promessa si risolve comunque.
    osservatore = new MutationObserver(() => { if (!fondo.isConnected) fine(false); });
    osservatore.observe(radice, { childList: true });
  });
}
