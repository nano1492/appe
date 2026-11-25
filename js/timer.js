// Timer dell'esame: si calcola sempre dall'ora di inizio salvata (regge blocco del telefono e ricarica).
export const DURATA_ESAME_S = 2700;

// Durata (in secondi) di una simulazione con n domande: 45 minuti ogni 36 domande, almeno 5 minuti.
export function durataEsameS(n) {
  return Math.max(5, Math.round((45 * n) / 36)) * 60;
}

// Secondi rimasti, interi (per eccesso) e mai negativi. Valori non validi -> 0.
export function tempoRimasto(inizioMs, oraMs, durataS = DURATA_ESAME_S) {
  if (typeof inizioMs !== 'number' || !Number.isFinite(inizioMs) || typeof oraMs !== 'number' || !Number.isFinite(oraMs)) return 0;
  const trascorsoMs = Math.max(0, oraMs - inizioMs);
  return Math.max(0, Math.min(durataS, Math.ceil((durataS * 1000 - trascorsoMs) / 1000)));
}

export function formattaTempo(secondi) {
  const s = Math.max(0, Math.floor(Number(secondi) || 0));
  const p = n => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 60))}:${p(s % 60)}`;
}
