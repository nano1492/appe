// Simulazione d'esame: funzioni pure su stato e banca. Lo stato dell'esame vive in stato.esameInCorso.
import { costruisciEsame } from './sessions.js';
import { applicaRisposta } from './esito.js';
import { livelloDa, nomeLivello, nuoveMedaglie, giornoLocale } from './game.js';
import { tempoRimasto, durataEsameS, DURATA_ESAME_S } from './timer.js';

const elenco = v => (Array.isArray(v) ? v : []);
const durataValida = v => typeof v === 'number' && Number.isFinite(v) && v > 0;

// Durata dell'esame in corso; gli esami salvati prima (senza durataS) durano 45 minuti.
export function durataDi(e) {
  return e && durataValida(e.durataS) ? e.durataS : DURATA_ESAME_S;
}

// modulo: un modulo della banca (eventualmente gia' filtrato dalle domande non mostrabili).
export function iniziaEsame(stato, modulo, oraMs, seme, rnd = Math.random) {
  const ids = costruisciEsame(modulo, rnd).map(d => d.id);
  return {
    ...stato,
    esameInCorso: { modulo: modulo.modulo, ids, inizioMs: oraMs, risposte: ids.map(() => null), indice: 0, seme, durataS: durataEsameS(ids.length) },
  };
}

// giusta: true, false oppure null (domanda saltata). Si puo' rispondere una volta sola a ogni domanda.
// oraMs (facoltativo): se il tempo e' finito la risposta non conta.
export function rispondiEsame(stato, giusta, oraMs) {
  const e = stato && stato.esameInCorso;
  if (!e || e.indice >= e.ids.length) return stato;
  if (oraMs !== undefined && tempoRimasto(e.inizioMs, oraMs, durataDi(e)) === 0) return stato;
  const risposte = e.risposte.slice();
  risposte[e.indice] = giusta === true ? true : giusta === false ? false : null;
  return { ...stato, esameInCorso: { ...e, risposte, indice: e.indice + 1 } };
}

// Lo stato salvato puo' essere rovinato (localStorage non e' controllato campo per campo).
export function esameInCorsoValido(e) {
  return !!e && typeof e === 'object'
    && typeof e.modulo === 'string'
    && Array.isArray(e.ids) && e.ids.length > 0 && e.ids.every(id => typeof id === 'string')
    && Array.isArray(e.risposte) && e.risposte.length === e.ids.length
    && e.risposte.every(r => r === true || r === false || r === null)
    && typeof e.inizioMs === 'number' && Number.isFinite(e.inizioMs)
    && Number.isInteger(e.indice) && e.indice >= 0 && e.indice <= e.ids.length
    && typeof e.seme === 'number' && Number.isFinite(e.seme)
    && (e.durataS === undefined || durataValida(e.durataS))
    && (e.consegne === undefined || (!!e.consegne && typeof e.consegne === 'object' && !Array.isArray(e.consegne)));
}

// Salva consegna e soluzione dell'esercizio pratico mostrato in posizione indice (servono nel risultato).
export function salvaConsegna(stato, indice, consegna, soluzione) {
  const e = stato && stato.esameInCorso;
  if (!e) return stato;
  const consegne = { ...(e.consegne || {}), [indice]: { consegna: String(consegna || ''), soluzione: String(soluzione || '') } };
  return { ...stato, esameInCorso: { ...e, consegne } };
}

export function esameScaduto(stato, oraMs) {
  const e = stato && stato.esameInCorso;
  return !!e && tempoRimasto(e.inizioMs, oraMs, durataDi(e)) === 0;
}

// Le domande dell'esame in corso, nell'ordine; le domande sparite dalla banca sono saltate.
// Restituisce [{domanda, indice}] dove indice e' la posizione in esameInCorso.ids.
export function domandeDellEsame(stato, banca) {
  const e = stato && stato.esameInCorso;
  if (!e) return [];
  const mappa = new Map();
  for (const m of elenco(banca)) for (const d of elenco(m && m.domande)) mappa.set(d.id, d);
  const out = [];
  elenco(e.ids).forEach((id, indice) => { if (mappa.has(id)) out.push({ domanda: mappa.get(id), indice }); });
  return out;
}

// Chiude l'esame: registra ogni risposta (le non date sono sbagliate), salva il risultato e toglie esameInCorso.
export function chiudiEsame(stato, banca, oraMs) {
  const e = stato && stato.esameInCorso;
  if (!e) return { stato, esito: null, nuoveMedaglie: [], livelloSu: null };
  const prima = livelloDa(stato.xp).livello;
  const voci = domandeDellEsame(stato, banca);
  let corrente = { ...stato };
  const medaglie = [];
  const sbagliate = [];
  const errori = new Map();
  const consegne = {};
  const salvate = e.consegne && typeof e.consegne === 'object' ? e.consegne : {};
  let giuste = 0;
  for (const { domanda, indice } of voci) {
    const giusta = e.risposte[indice] === true;
    const r = applicaRisposta(corrente, domanda, giusta, banca);
    corrente = r.stato;
    medaglie.push(...r.nuoveMedaglie);
    if (giusta) giuste++;
    else {
      sbagliate.push(domanda.id);
      const c = salvate[indice];
      if (domanda.tipo === 'pratico' && c && typeof c.consegna === 'string' && c.consegna) {
        consegne[domanda.id] = { consegna: c.consegna, soluzione: typeof c.soluzione === 'string' ? c.soluzione : '' };
      }
      const a = domanda.argomento || 'Altro';
      errori.set(a, (errori.get(a) || 0) + 1);
    }
  }
  const totale = voci.length;
  const soglia = Math.ceil(totale * 0.75);
  const promosso = totale > 0 && giuste >= soglia;
  const esito = {
    giuste,
    totale,
    percentuale: totale > 0 ? Math.round((giuste / totale) * 100) : 0,
    promosso,
    mancanti: Math.max(0, soglia - giuste),
    erroriPerArgomento: [...errori].map(([argomento, n]) => ({ argomento, errori: n }))
      .sort((a, b) => b.errori - a.errori || (a.argomento < b.argomento ? -1 : 1)),
    sbagliate,
    consegne,
  };
  corrente = {
    ...corrente,
    esameInCorso: null,
    esami: [...elenco(corrente.esami), { modulo: e.modulo, data: giornoLocale(new Date(oraMs)), giuste, totale, promosso }],
  };
  const dall = nuoveMedaglie(corrente, banca);
  if (dall.length) {
    corrente = { ...corrente, medaglie: [...elenco(corrente.medaglie), ...dall] };
    medaglie.push(...dall);
  }
  const dopo = livelloDa(corrente.xp).livello;
  const livelloSu = dopo > prima ? { livello: dopo, nome: nomeLivello(dopo) } : null;
  return { stato: corrente, esito, nuoveMedaglie: medaglie, livelloSu };
}
