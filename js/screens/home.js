// Home (mappa dei pianeti) e schermata di un modulo.
import { icona } from '../icons.js';
import { livelloDa, giornoLocale } from '../game.js';
import { streakVisibile } from '../esito.js';
import { percentualeModulo, moduloFinito, domandeRipasso } from '../review.js';
import { esameInCorsoValido, durataDi } from '../esame.js';
import { tempoRimasto } from '../timer.js';

export function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo !== undefined) e.textContent = testo;
  return e;
}

function pillola(classe, nomeIcona, testo) {
  const p = el('span', 'pillola ' + classe);
  const i = el('span', 'pillola-icona');
  i.innerHTML = icona(nomeIcona);
  p.append(i, el('span', '', testo));
  return p;
}

// La fiamma dello streak cresce con i giorni di fila (classe CSS sulla pillola).
export function classeFiamma(giorni) {
  if (!(giorni >= 3)) return '';
  if (giorni >= 30) return 'fiamma-30';
  if (giorni >= 7) return 'fiamma-7';
  return 'fiamma-3';
}

export function moduloIniziato(stato, modulo) {
  const r = stato.risposte && typeof stato.risposte === 'object' ? stato.risposte : {};
  return (modulo.domande || []).some(d => d.id in r);
}

function barraXp(stato) {
  const l = livelloDa(stato.xp);
  const blocco = el('div', 'blocco-xp');
  blocco.append(el('div', 'testo-xp', `XP ${l.xpNelLivello} / ${l.xpPerProssimo}`));
  const traccia = el('div', 'traccia');
  traccia.setAttribute('role', 'progressbar');
  traccia.setAttribute('aria-label', 'Esperienza del livello');
  traccia.setAttribute('aria-valuemin', '0');
  traccia.setAttribute('aria-valuemax', String(l.xpPerProssimo));
  traccia.setAttribute('aria-valuenow', String(l.xpNelLivello));
  const riempi = el('div', 'riempi riempi-acqua');
  riempi.style.width = Math.min(100, Math.round((l.xpNelLivello / (l.xpPerProssimo || 1)) * 100)) + '%';
  traccia.append(riempi);
  blocco.append(traccia);
  return { blocco, livello: l.livello };
}

export function barraSuperiore(ctx) {
  const stato = ctx.stato;
  const giorni = streakVisibile(stato.streak, giornoLocale(new Date()));
  const { blocco, livello } = barraXp(stato);
  const sup = el('header', 'barra-sup');
  const riga = el('div', 'riga-pillole');
  riga.append(
    pillola(('pillola-fiamma ' + classeFiamma(giorni)).trim(), 'fiamma',giorni === 1 ? '1 giorno' : `${giorni} giorni`),
    pillola('pillola-livello', 'fulmine', `Liv. ${livello}`),
  );
  const astro = el('a', 'bottone-icona');
  astro.href = '#/profilo';
  astro.setAttribute('aria-label', 'Il tuo profilo');
  astro.innerHTML = icona('astronauta');
  riga.append(astro);
  sup.append(riga, blocco);
  return sup;
}

function pianeta(ctx, m) {
  const perc = percentualeModulo(ctx.stato, m);
  const finito = moduloFinito(ctx.stato, m);
  const iniziato = moduloIniziato(ctx.stato, m);
  const a = el('a', 'pianeta' + (iniziato ? '' : ' non-iniziato'));
  a.href = '#/modulo/' + encodeURIComponent(m.modulo);
  a.style.setProperty('--colore', m.colore);
  a.setAttribute('aria-label', `${m.nome}, ${m.traduzione}, ${perc}% completato${finito ? ', finito' : ''}`);
  const tessera = el('span', 'tessera');
  tessera.innerHTML = icona(m.icona);
  const testi = el('span', 'pianeta-testi');
  testi.append(el('span', 'pianeta-nome', m.nome), el('span', 'pianeta-trad', m.traduzione));
  const traccia = el('span', 'traccia sottile');
  const riempi = el('span', 'riempi');
  riempi.style.width = perc + '%';
  traccia.append(riempi);
  testi.append(traccia);
  a.append(tessera, testi);
  if (finito) {
    const stella = el('span', 'stella-finito');
    stella.innerHTML = icona('stella');
    a.append(stella);
  }
  return a;
}

export function renderHome(ctx, parametri, radice) {
  const s = el('section', 'schermata');
  s.append(el('h1', 'solo-lettori', 'ICDL Quest: la mappa'));
  if (!ctx.persistente) {
    const f = el('div', 'fascia-avviso', 'I progressi non verranno salvati su questo dispositivo');
    f.setAttribute('role', 'status');
    s.append(f);
  }
  s.append(barraSuperiore(ctx));

  const fatta = !!(ctx.stato.sfide && ctx.stato.sfide[giornoLocale(new Date())] === true);
  const sfida = el('a', 'bottone bottone-rosa sfida');
  sfida.href = '#/quiz/sfida';
  const ic = el('span', 'pillola-icona');
  ic.innerHTML = icona(fatta ? 'spunta' : 'razzo');
  sfida.append(ic, el('span', '', fatta ? 'Sfida completata!' : 'Sfida del giorno'));
  s.append(sfida);

  const lista = el('div', 'pianeti');
  for (const m of ctx.banca.moduli) lista.append(pianeta(ctx, m));
  s.append(lista);
  radice.append(s);
}

export function renderModulo(ctx, parametri, radice) {
  const m = ctx.banca.moduli.find(x => x.modulo === parametri[0]);
  if (!m) {
    ctx.vai('#/home');
    return;
  }
  const id = encodeURIComponent(m.modulo);
  const perc = percentualeModulo(ctx.stato, m);
  const nErrori = domandeRipasso([m], ctx.stato).length;
  const s = el('section', 'schermata');
  s.style.setProperty('--colore', m.colore);

  const indietro = el('a', 'bottone-icona indietro');
  indietro.href = '#/home';
  indietro.setAttribute('aria-label', 'Torna alla mappa');
  indietro.innerHTML = icona('indietro');
  s.append(indietro);

  const testa = el('div', 'testa-modulo');
  const tessera = el('span', 'tessera grande');
  tessera.innerHTML = icona(m.icona);
  const t = el('div', 'testa-testi');
  t.append(el('h1', 'titolo', m.nome), el('div', 'secondario', m.traduzione));
  testa.append(tessera, t);
  s.append(testa);

  const bl = el('div', 'blocco-xp');
  bl.append(el('div', 'testo-xp', `${perc}% completato`));
  const traccia = el('div', 'traccia');
  traccia.setAttribute('role', 'progressbar');
  traccia.setAttribute('aria-label', 'Avanzamento del modulo');
  traccia.setAttribute('aria-valuemin', '0');
  traccia.setAttribute('aria-valuemax', '100');
  traccia.setAttribute('aria-valuenow', String(perc));
  const riempi = el('div', 'riempi');
  riempi.style.width = perc + '%';
  traccia.append(riempi);
  bl.append(traccia);
  s.append(bl);

  if (moduloFinito(ctx.stato, m)) {
    s.append(el('div', 'banner-finito', 'Domande finite! Chiedi un nuovo pacchetto'));
  }

  // Simulazione di questo modulo lasciata a meta': si avvisa e il bottone la riprende.
  const e = ctx.stato.esameInCorso;
  const inCorso = esameInCorsoValido(e) && e.modulo === m.modulo;
  if (inCorso) {
    const resto = tempoRimasto(e.inizioMs, Date.now(), durataDi(e));
    const minuti = Math.ceil(resto / 60);
    const box = el('div', 'esame-in-corso');
    box.setAttribute('role', 'status');
    box.append(
      el('div', 'esame-in-corso-titolo', 'Hai una simulazione in corso'),
      el('div', 'secondario', resto === 0
        ? 'Tempo scaduto: aprila per vedere il risultato'
        : (minuti === 1 ? 'Manca 1 minuto' : `Mancano ${minuti} minuti`)),
    );
    s.append(box);
  }

  const azioni = el('div', 'azioni');
  const voce =(testo, hash, classe, nomeIcona) => {
    const a = el('a', 'bottone ' + classe);
    a.href = hash;
    if (nomeIcona) {
      const i = el('span', 'pillola-icona');
      i.innerHTML = icona(nomeIcona);
      a.append(i);
    }
    a.append(el('span', '', testo));
    azioni.append(a);
  };
  voce('Allenamento', `#/quiz/allenamento/${id}`, 'bottone-modulo', 'razzo');
  voce('Flashcard', `#/flashcard/${id}`, 'bottone-scuro', 'documento');
  voce(inCorso ? 'Riprendi la simulazione' : "Simulazione d'esame", `#/esame/${id}`, inCorso ? 'bottone-acqua' : 'bottone-scuro', 'coppa');
  if (nErrori > 0) voce(`Ripassa i tuoi errori (${nErrori})`, `#/quiz/ripasso/${id}`, 'bottone-rosa', 'fulmine');
  s.append(azioni);
  radice.append(s);
}
