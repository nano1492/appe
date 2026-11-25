// Dati del profilo: funzioni pure, nessun accesso a DOM o storage. Lettura difensiva dello stato.
import { MEDAGLIE, giornoLocale } from './game.js';
import { streakVisibile } from './esito.js';

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function statistiche(stato, oggi = giornoLocale(new Date())) {
  const s = stato && typeof stato === 'object' ? stato : {};
  const voci = s.risposte && typeof s.risposte === 'object' ? Object.values(s.risposte) : [];
  const giuste = voci.reduce((t, r) => t + num(r && typeof r === 'object' ? r.giuste : 0), 0);
  const streak = streakVisibile(s.streak, oggi);
  const esami = Array.isArray(s.esami) ? s.esami : [];
  return {
    giuste,
    streak,
    streakMigliore: Math.max(num(s.streakMigliore), streak),
    simulazioniSuperate: esami.filter(e => e && typeof e === 'object' && e.promosso === true).length,
    flashcardViste: num(s.flashcardViste),
  };
}

export function elencoMedaglie(stato) {
  const prese = stato && Array.isArray(stato.medaglie) ? stato.medaglie : [];
  return MEDAGLIE.map(({ id, nome, descrizione, icona }) => ({ id, nome, descrizione, icona, conquistata: prese.includes(id) }));
}

// Testo mostrato toccando una medaglia (un solo punto finale).
export function testoDettaglio(m) {
  const d = String(m.descrizione).replace(/\.+$/, '');
  return `${m.nome}: ${d}.` + (m.conquistata ? ' Conquistata!' : '');
}
