// Ripasso errori: funzioni pure su stato e domande.
import { XP_SCELTA, XP_PRATICO, moduloCompletato } from './game.js';

const SERIE_PER_USCIRE = 3;

const elenco = v => (Array.isArray(v) ? v : []);
const numero = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
const oggetto = v => (v && typeof v === 'object' ? v : {});

// Registra una risposta. Non modifica lo stato ricevuto: ne restituisce uno nuovo.
export function registraRisposta(stato, domanda, giusta) {
  const id = domanda.id;
  const vecchia = oggetto(oggetto(stato.risposte)[id]);
  const risposte = {
    ...oggetto(stato.risposte),
    [id]: {
      giuste: numero(vecchia.giuste) + (giusta ? 1 : 0),
      sbagliate: numero(vecchia.sbagliate) + (giusta ? 0 : 1),
      ultimaGiusta: !!giusta,
    },
  };

  const ripasso = { ...oggetto(stato.ripasso) };
  if (!giusta) {
    ripasso[id] = { serie: 0 };
  } else if (id in ripasso) {
    const serie = numero(oggetto(ripasso[id]).serie) + 1;
    if (serie >= SERIE_PER_USCIRE) delete ripasso[id];
    else ripasso[id] = { serie };
  }

  const xpGuadagnati = !giusta ? 0 : domanda.tipo === 'pratico' ? XP_PRATICO : XP_SCELTA;
  return {
    stato: { ...stato, risposte, ripasso, xp: numero(stato.xp) + xpGuadagnati },
    xpGuadagnati,
  };
}

// Percentuale (intera) di domande con almeno una giusta e fuori dal ripasso.
export function percentualeModulo(stato, modulo) {
  const domande = elenco(modulo && modulo.domande);
  if (domande.length === 0) return 0;
  const risposte = oggetto(stato.risposte);
  const ripasso = oggetto(stato.ripasso);
  const fatte = domande.filter(d => numero(oggetto(risposte[d.id]).giuste) >= 1 && !(d.id in ripasso));
  return Math.round((fatte.length / domande.length) * 100);
}

// "Domande finite": ogni domanda giusta almeno una volta E nessuna domanda del modulo nel ripasso.
// (La medaglia modulo-1 usa moduloCompletato di game.js, senza la condizione sul ripasso.)
export function moduloFinito(stato, modulo) {
  const ripasso = oggetto(stato && stato.ripasso);
  return moduloCompletato(stato, modulo) && !elenco(modulo && modulo.domande).some(d => d && d.id in ripasso);
}

// Tutte le domande della banca che sono nel ripasso.
export function domandeRipasso(banca, stato) {
  const ripasso = oggetto(stato.ripasso);
  const out = [];
  for (const m of elenco(banca)) {
    for (const d of elenco(m && m.domande)) {
      if (d.id in ripasso) out.push(d);
    }
  }
  return out;
}
