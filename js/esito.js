// Effetti di una risposta o di una sfida su stato, livello e medaglie. Funzioni pure.
import { registraRisposta } from './review.js';
import { livelloDa, nomeLivello, aggiornaStreak, nuoveMedaglie } from './game.js';

const elenco = v => (Array.isArray(v) ? v : []);

// banca: array di moduli. Restituisce un nuovo stato (l'originale non cambia).
export function applicaRisposta(stato, domanda, giusta, banca) {
  const prima = livelloDa(stato.xp).livello;
  const r = registraRisposta(stato, domanda, giusta);
  let nuovo = r.stato;
  const dopo = livelloDa(nuovo.xp).livello;
  const livelloSu = dopo > prima ? { livello: dopo, nome: nomeLivello(dopo) } : null;
  const medaglie = nuoveMedaglie(nuovo, banca);
  if (medaglie.length) nuovo = { ...nuovo, medaglie: [...elenco(nuovo.medaglie), ...medaglie] };
  return { stato: nuovo, xpGuadagnati: r.xpGuadagnati, livelloSu, nuoveMedaglie: medaglie };
}

// oggi: "AAAA-MM-GG" (giorno locale al momento del completamento).
export function concludiSfida(stato, oggi, banca) {
  const streak = aggiornaStreak(stato.streak, oggi);
  const migliore = Math.max(Number(stato.streakMigliore) || 0, streak.giorni);
  let nuovo = { ...stato, sfide: { ...(stato.sfide || {}), [oggi]: true }, streak, streakMigliore: migliore };
  const medaglie = nuoveMedaglie(nuovo, banca);
  if (medaglie.length) nuovo = { ...nuovo, medaglie: [...elenco(nuovo.medaglie), ...medaglie] };
  return { stato: nuovo, nuoveMedaglie: medaglie };
}

function giornoPrima(oggi) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof oggi === 'string' ? oggi : '');
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) - 86400000);
  const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

// Giorni di streak da mostrare: 0 se l'ultimo giorno non e' oggi ne' ieri.
export function streakVisibile(streak, oggi) {
  if (!streak || typeof streak !== 'object') return 0;
  const giorni = typeof streak.giorni === 'number' && Number.isFinite(streak.giorni) ? streak.giorni : 0;
  const u = streak.ultimoGiorno;
  if (typeof u !== 'string') return 0;
  // Il futuro (orologio andato indietro) tiene lo streak, come aggiornaStreak.
  const ieri = giornoPrima(oggi);
  return ieri !== null && u >= ieri ? giorni : 0;
}
