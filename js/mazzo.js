// Mazzo di flashcard di una sessione (funzioni pure, senza DOM).
import { mescola } from './rng.js';

export function creaMazzo(flashcard, rnd = Math.random) {
  const lista = Array.isArray(flashcard) ? flashcard : [];
  return { coda: mescola(lista, rnd), fatte: 0 };
}

// "Lo sapevo" toglie la carta; "Da ripassare" la manda in fondo alla coda.
export function rispondiCarta(mazzo, sapevo) {
  if (mazzo.coda.length === 0) return { coda: [], fatte: mazzo.fatte };
  const [prima, ...resto] = mazzo.coda;
  if (sapevo) return { coda: resto, fatte: mazzo.fatte + 1 };
  return { coda: [...resto, prima], fatte: mazzo.fatte };
}

export function mazzoFinito(mazzo) {
  return mazzo.coda.length === 0;
}
