// Costruzione di sfida del giorno, allenamento ed esame; punteggio dell'esame.
import { mescola } from './rng.js';

const MODULI_PRATICI = ['word-processing', 'spreadsheets', 'presentation'];
const elenco = v => (Array.isArray(v) ? v : []);
const oggetto = v => (v && typeof v === 'object' ? v : {});

export function sfidaDelGiorno(banca, stato, rnd = Math.random) {
  const ripasso = oggetto(stato && stato.ripasso);
  const risposte = oggetto(stato && stato.risposte);
  const tutte = [];
  for (const m of elenco(banca)) {
    for (const d of elenco(m && m.domande)) tutte.push({ d, mod: m.modulo });
  }
  const dimensione = Math.min(10, tutte.length);

  const mescolate = mescola(tutte, rnd);
  const inRipasso = mescolate.filter(x => x.d.id in ripasso);
  const mai = mescolate.filter(x => !(x.d.id in ripasso) && !(x.d.id in risposte));
  const altre = mescolate.filter(x => !(x.d.id in ripasso) && x.d.id in risposte);

  const scelte = [];
  const usate = new Set();
  const perModulo = {};
  const prendi = (x) => {
    scelte.push(x);
    usate.add(x.d.id);
    perModulo[x.mod] = (perModulo[x.mod] || 0) + 1;
  };

  // Prima passata: al massimo 2 per modulo; il ripasso entra fino a 3 domande.
  let nRipasso = 0;
  for (const x of inRipasso) {
    if (nRipasso >= 3) break;
    if ((perModulo[x.mod] || 0) < 2) { prendi(x); nRipasso++; }
  }
  for (const x of [...mai, ...altre]) {
    if (scelte.length >= dimensione) break;
    if (!usate.has(x.d.id) && (perModulo[x.mod] || 0) < 2) prendi(x);
  }
  // Seconda passata: se non basta, si toglie il limite per modulo (ripasso incluso, max 3 in totale).
  for (const x of inRipasso) {
    if (scelte.length >= dimensione || nRipasso >= 3) break;
    if (!usate.has(x.d.id)) { prendi(x); nRipasso++; }
  }
  for (const x of [...mai, ...altre]) {
    if (scelte.length >= dimensione) break;
    if (!usate.has(x.d.id)) prendi(x);
  }
  return mescola(scelte, rnd).map(x => x.d);
}

// Campionamento pesato senza reinserimento: ripasso peso 3, le altre peso 1.
export function allenamento(modulo, stato, rnd = Math.random, n = 10) {
  const ripasso = oggetto(stato && stato.ripasso);
  const pool = elenco(modulo && modulo.domande).map(d => ({ d, peso: d.id in ripasso ? 3 : 1 }));
  const scelte = [];
  while (scelte.length < n && pool.length > 0) {
    const totale = pool.reduce((s, x) => s + x.peso, 0);
    let soglia = rnd() * totale;
    let i = 0;
    while (i < pool.length - 1 && soglia >= pool[i].peso) { soglia -= pool[i].peso; i++; }
    scelte.push(pool[i].d);
    pool.splice(i, 1);
  }
  return scelte;
}

export function costruisciEsame(modulo, rnd = Math.random) {
  const domande = elenco(modulo && modulo.domande);
  const TOT = 36;
  let scelte;
  if (modulo && MODULI_PRATICI.includes(modulo.modulo)) {
    const pratiche = mescola(domande.filter(d => d.tipo === 'pratico'), rnd);
    const altre = mescola(domande.filter(d => d.tipo !== 'pratico'), rnd);
    const dalle = pratiche.slice(0, 18);
    const dalleAltre = altre.slice(0, TOT - dalle.length);
    scelte = [...dalle, ...dalleAltre];
    // Poche non pratiche: completa con le pratiche rimaste.
    if (scelte.length < TOT) scelte = [...scelte, ...pratiche.slice(18, 18 + TOT - scelte.length)];
  } else {
    scelte = mescola(domande.filter(d => d.tipo !== 'pratico'), rnd).slice(0, TOT);
  }
  return mescola(scelte, rnd);
}

// Si conta `true`; null e false sono errori.
export function valutaEsame(risposte, totale = 36) {
  const giuste = elenco(risposte).filter(r => r === true).length;
  if (!(totale > 0)) return { giuste, percentuale: 0, promosso: false };
  return {
    giuste,
    percentuale: Math.round((giuste / totale) * 100),
    promosso: giuste >= Math.ceil(totale * 0.75),
  };
}
