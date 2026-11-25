// Finestra di conferma accessibile. Restituisce una promessa true/false.
// Esc o tocco fuori = annulla; Tab resta dentro il dialogo; alla chiusura il focus torna dov'era.
import { el } from './home.js';

export function conferma(radice, { titolo, testo, si = 'Sì', no = 'Annulla' }) {
  return new Promise((risolvi) => {
    const prima = document.activeElement;
    const fondo = el('div', 'dialogo-fondo');
    fondo.setAttribute('role', 'dialog');
    fondo.setAttribute('aria-modal', 'true');
    fondo.setAttribute('aria-label', titolo || testo);
    const scheda = el('div', 'dialogo-scheda');
    const ok = el('button', 'bottone bottone-rosa', si);
    const nega = el('button', 'bottone bottone-scuro', no);
    ok.type = 'button';
    nega.type = 'button';
    if (titolo) scheda.append(el('h2', 'dialogo-titolo', titolo));
    scheda.append(el('p', 'dialogo-testo', testo), nega, ok);
    fondo.append(scheda);
    const chiudi = (v) => {
      fondo.remove();
      if (prima && prima.isConnected && typeof prima.focus === 'function') prima.focus({ preventScroll: true });
      risolvi(v);
    };
    ok.addEventListener('click', () => chiudi(true));
    nega.addEventListener('click', () => chiudi(false));
    fondo.addEventListener('click', (ev) => { if (ev.target === fondo) chiudi(false); });
    fondo.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { ev.preventDefault(); chiudi(false); }
      else if (ev.key === 'Tab') {
        ev.preventDefault();
        const ordine = [nega, ok];
        const k = ordine.indexOf(document.activeElement);
        const prossimo = k === -1 ? 0 : (k + (ev.shiftKey ? ordine.length - 1 : 1)) % ordine.length;
        ordine[prossimo].focus({ preventScroll: true });
      }
    });
    radice.append(fondo);
    nega.focus({ preventScroll: true });
  });
}
