// Contesto condiviso dalle schermate: stato, salvataggio e ricarica dello stato scritto da un'altra copia aperta
// (scheda del browser e app installata usano lo stesso salvataggio).
import { carica, salva, CHIAVE_STATO } from './storage.js';

// Testo salvato cosi' com'e' (undefined se lo storage non si puo' leggere).
function grezzo(storage) {
  try {
    const s = storage === undefined ? window.localStorage : storage;
    return s.getItem(CHIAVE_STATO);
  } catch (e) {
    return undefined;
  }
}

// Se nello storage c'e' un testo diverso dall'ultimo letto o scritto da questa copia, l'ha scritto un'altra copia:
// si prende il suo stato. Restituisce true se lo stato e' stato ricaricato.
function prendiStatoAltrui(ctx, storage) {
  const testo = grezzo(storage);
  if (testo === undefined || testo === ctx._visto) return false;
  const r = carica(storage);
  if (!r.persistente) return false;
  ctx.stato = r.stato;
  ctx._visto = testo;
  return true;
}

// storage: facoltativo (i test passano uno storage finto; altrimenti localStorage).
export function creaContesto(storage) {
  const { stato, persistente } = carica(storage);
  const ctx = {
    stato,
    banca: { moduli: [] },
    persistente,
    // Ultimo testo letto o scritto da questa copia.
    _visto: grezzo(storage),
    // Ridisegna la schermata attuale (lo imposta collegaSincronizzazione).
    _ridisegna: () => {},
    // Restituisce true se ha salvato. Se un'altra copia ha salvato nel frattempo NON scrive (non cancella i suoi
    // progressi): ricarica il suo stato e ridisegna la schermata subito dopo, e restituisce false.
    salva() {
      if (prendiStatoAltrui(ctx, storage)) {
        // Dopo: il codice che ha chiamato salva() finisce, poi la schermata si ricostruisce dallo stato ricaricato.
        Promise.resolve().then(() => ctx._ridisegna());
        return false;
      }
      let ok = false;
      try { ok = salva(ctx.stato, storage); } catch (e) { ok = false; }
      if (ok) ctx._visto = grezzo(storage);
      else {
        console.warn('Salvataggio non riuscito');
        ctx.persistente = false; // la home mostra "I progressi non verranno salvati su questo dispositivo"
      }
      return ok;
    },
    vai(hash) { window.location.hash = hash; },
  };
  return ctx;
}

// Rilegge lo stato quando un'altra copia lo cambia (evento storage) o quando l'app torna visibile,
// cosi' una copia vecchia non sovrascrive i progressi nuovi (e salva() controlla di nuovo prima di scrivere).
// Poi ridisegna la schermata attuale: un esame in corso riprende (e' salvato), un quiz o un mazzo di flashcard
// ricomincia (le risposte gia' date restano salvate). Se nessun'altra copia ha scritto non succede niente.
export function collegaSincronizzazione(ctx, { finestra = window, documento = document, storage, ridisegna }) {
  ctx._ridisegna = ridisegna;
  const ricarica = () => { if (prendiStatoAltrui(ctx, storage)) ridisegna(); };
  finestra.addEventListener('storage', e => {
    if (e.key === CHIAVE_STATO || e.key === null) ricarica();
  });
  documento.addEventListener('visibilitychange', () => {
    if (documento.visibilityState === 'visible') ricarica();
  });
}
