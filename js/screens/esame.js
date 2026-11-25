// Schermata "Simulazione d'esame". Testi di domande e risposte arrivano da JSON: si inseriscono SOLO con textContent.
import { icona } from '../icons.js';
import { el } from './home.js';
import { mostraCelebrazione } from './celebra.js';
import { conferma } from './dialogo.js';
import { suona } from '../sound.js';
import { creaRng, mescola } from '../rng.js';
import { costruisciEsame } from '../sessions.js';
import { MEDAGLIE } from '../game.js';
import { renderPratico, ambienteDisponibile } from '../practice/index.js';
import { tempoRimasto, formattaTempo, durataEsameS } from '../timer.js';
import { iniziaEsame, rispondiEsame, chiudiEsame, esameInCorsoValido, domandeDellEsame, durataDi, salvaConsegna } from '../esame.js';

const SOGLIA_POCO_TEMPO_S = 300;

function icon(nome, classe = 'pillola-icona') {
  const s = el('span', classe);
  s.innerHTML = icona(nome);
  return s;
}

function bottone(classe, testo) {
  const b = el('button', classe, testo);
  b.type = 'button';
  return b;
}

function focalizza(h) {
  h.tabIndex = -1;
  h.focus({ preventScroll: true });
}

// Moduli senza gli esercizi pratici che non si possono ancora mostrare.
function moduloMostrabile(m) {
  return { ...m, domande: m.domande.filter(d => d.tipo !== 'pratico' || ambienteDisponibile(d.ricetta)) };
}

export function renderEsame(ctx, parametri, radice) {
  const idModulo = parametri[0];
  const moduli = ctx.banca.moduli;
  const modulo = moduli.find(m => m.modulo === idModulo);
  if (!modulo) { ctx.vai('#/home'); return; }

  const mio = Symbol('esame');
  radice._esameAttivo = mio;
  const vivo = () => radice._esameAttivo === mio && radice.isConnected && !!radice.querySelector('.esame-schermata');

  let coda = Promise.resolve();
  let timerId = null;
  let chiuso = false;
  let timerEl = null;

  // Tornando nell'app (telefono sbloccato) i timer possono essere in ritardo: si ricontrolla subito.
  const alRitorno = () => {
    if (!vivo()) document.removeEventListener('visibilitychange', alRitorno);
    else aggiornaTimer();
  };
  document.addEventListener('visibilitychange', alRitorno);

  const ferma = () => { if (timerId !== null) { clearInterval(timerId); timerId = null; } };

  const accoda = (eventi) => {
    eventi.forEach((ev, i) => {
      coda = coda
        .then(() => (i === 0 && vivo() ? new Promise(r => setTimeout(r, 500)) : undefined))
        .then(() => {
          if (!vivo()) return undefined;
          suona(ev.suono, ctx);
          return mostraCelebrazione(radice, ev);
        });
    });
  };
  const celebrazioni = (livelloSu, medaglie) => {
    const eventi = [];
    if (livelloSu) eventi.push({ suono: 'livello', tipo: 'livello', titolo: `Livello ${livelloSu.livello}!`, sottotitolo: livelloSu.nome });
    for (const id of medaglie) {
      const m = MEDAGLIE.find(x => x.id === id);
      if (m) eventi.push({ suono: 'medaglia', tipo: 'medaglia', titolo: m.nome, sottotitolo: m.descrizione, icona: m.icona });
    }
    accoda(eventi);
  };

  const schermata = (classe) => {
    ferma();
    const s = el('section', 'schermata esame-schermata ' + (classe || ''));
    s.style.setProperty('--colore', modulo.colore);
    return s;
  };
  const mostra = (s, h) => {
    radice.replaceChildren(s);
    if (h) focalizza(h);
  };

  // ---------- partenza

  function schermataPartenza() {
    const s = schermata('esame-inizio');
    const pool = costruisciEsame(moduloMostrabile(modulo), () => 0.5).length;
    const h = el('h1', 'titolo', "Simulazione d'esame");
    s.append(h, el('div', 'quiz-modulo', modulo.nome));
    if (pool === 0) {
      s.append(el('p', 'quiz-testo', 'Per ora non ci sono domande pronte per la simulazione di questo modulo.'));
    } else {
      const soglia = Math.ceil(pool * 0.75);
      const regole = el('div', 'esame-regole');
      const minuti = durataEsameS(pool) / 60; // il tempo scala col numero di domande (36 -> 45 minuti)
      if (pool >= 36) {
        regole.append(el('p', 'quiz-testo', `${pool} domande, ${minuti} minuti, per superare servono almeno ${soglia} risposte giuste.`));
      } else {
        regole.append(el('p', 'quiz-testo', `Simulazione ridotta: ${pool} domande, servono almeno ${soglia} risposte giuste.`));
        regole.append(el('p', 'secondario', `Hai ${minuti} minuti.`));
      }
      regole.append(el('p', 'secondario', 'Come all\'esame vero: non si torna indietro, le risposte non si cambiano e non c\'è la spiegazione subito. La vedi alla fine.'));
      s.append(regole);
      const via = bottone('bottone bottone-rosa bottone-grande', 'Inizia');
      via.addEventListener('click', avviaNuovo);
      s.append(via);
    }
    s.append(bottoneModulo('bottone bottone-scuro', 'Torna al modulo'));
    mostra(s, h);
  }

  function bottoneModulo(classe, testo) {
    const b = bottone(classe, testo);
    b.addEventListener('click', () => ctx.vai('#/modulo/' + encodeURIComponent(modulo.modulo)));
    return b;
  }

  function avviaNuovo() {
    const seme = Math.floor(Math.random() * 2147483647);
    ctx.stato = iniziaEsame(ctx.stato, moduloMostrabile(modulo), Date.now(), seme, Math.random);
    ctx.salva();
    mostraDomanda();
  }

  // ---------- esame di un altro modulo gia' in corso

  function schermataAltroModulo(e) {
    const s = schermata('esame-altro');
    const altro = moduli.find(m => m.modulo === e.modulo);
    const nome = altro ? altro.nome : e.modulo;
    const h = el('h1', 'titolo', `Hai una simulazione in corso di ${nome}`);
    s.append(h);
    s.append(el('p', 'secondario', 'Puoi riprenderla oppure abbandonarla (le risposte date non vengono salvate).'));
    if (altro) {
      const r = bottone('bottone bottone-acqua', 'Riprendi');
      r.addEventListener('click', () => ctx.vai('#/esame/' + encodeURIComponent(e.modulo)));
      s.append(r);
    }
    const a = bottone('bottone bottone-scuro', 'Abbandona');
    a.addEventListener('click', async () => {
      const si = await conferma(radice, { testo: 'Vuoi abbandonare la simulazione? Non verrà salvato niente.', si: 'Abbandona', no: 'Continua' });
      if (!si) return;
      ctx.stato = { ...ctx.stato, esameInCorso: null };
      ctx.salva();
      schermataPartenza();
    });
    s.append(a);
    mostra(s, h);
  }

  // ---------- domande

  function prossima() {
    // Salta le domande sparite dalla banca; restituisce {domanda, indice, posizione, totale} o null se finite.
    const voci = domandeDellEsame(ctx.stato, moduli);
    const e = ctx.stato.esameInCorso;
    const k = voci.findIndex(v => v.indice >= e.indice);
    if (k === -1) return null;
    while (ctx.stato.esameInCorso.indice < voci[k].indice) ctx.stato = rispondiEsame(ctx.stato, null);
    return { domanda: voci[k].domanda, indice: voci[k].indice, posizione: k + 1, totale: voci.length };
  }

  function intestazione(titolo) {
    const testa = el('header', 'quiz-testa');
    const riga = el('div', 'quiz-riga');
    const h = el('h1', 'titolo', titolo);
    timerEl = el('span', 'esame-timer');
    timerEl.setAttribute('role', 'timer');
    riga.append(h, timerEl);
    testa.append(riga);
    aggiornaTimer();
    return { testa, h };
  }

  function aggiornaTimer() {
    const e = ctx.stato.esameInCorso;
    if (!e || !timerEl) return;
    const resto = tempoRimasto(e.inizioMs, Date.now(), durataDi(e));
    timerEl.textContent = formattaTempo(resto);
    timerEl.classList.toggle('poco', resto < SOGLIA_POCO_TEMPO_S);
    if (resto === 0) finisci();
  }

  function avviaTimer() {
    ferma();
    timerId = setInterval(() => {
      if (!vivo()) { ferma(); return; }
      aggiornaTimer();
    }, 1000);
  }

  function mostraDomanda() {
    if (chiuso) return;
    const e = ctx.stato.esameInCorso;
    if (!e || tempoRimasto(e.inizioMs, Date.now(), durataDi(e)) === 0) { finisci(); return; }
    const p = prossima();
    if (!p) { finisci(); return; }
    const { domanda: d, indice, posizione, totale } = p;
    const rnd = creaRng(e.seme + indice);

    const s = schermata('esame');
    s.style.setProperty('--colore', modulo.colore);
    const { testa, h } = intestazione(`Domanda ${posizione} / ${totale}`);
    if (chiuso) return; // il tempo e' scaduto proprio adesso: il risultato e' gia' sullo schermo
    const traccia = el('div', 'traccia');
    traccia.setAttribute('role', 'progressbar');
    traccia.setAttribute('aria-label', 'Avanzamento della simulazione');
    traccia.setAttribute('aria-valuemin', '0');
    traccia.setAttribute('aria-valuemax', String(totale));
    traccia.setAttribute('aria-valuenow', String(posizione - 1));
    const riempi = el('div', 'riempi riempi-rosa');
    riempi.style.width = Math.round(((posizione - 1) / totale) * 100) + '%';
    traccia.append(riempi);
    const consegna = bottone('bottone bottone-scuro esame-consegna', 'Consegna');
    consegna.addEventListener('click', async () => {
      const si = await conferma(radice, { testo: 'Vuoi consegnare? Le domande senza risposta contano come sbagliate.', si: 'Consegna', no: 'Continua' });
      if (si && !chiuso) finisci();
    });
    testa.append(traccia);
    s.append(testa);
    s.append(el('div', 'quiz-modulo', modulo.nome));

    const zonaAzioni = el('div', 'quiz-feedback-zona');
    const ultima = posizione === totale;
    let data = false;
    const registra = (giusta) => {
      if (data || chiuso) return;
      // Risposta dopo la scadenza (timer in ritardo): non conta, si chiude l'esame.
      const corrente = ctx.stato.esameInCorso;
      if (!corrente || tempoRimasto(corrente.inizioMs, Date.now(), durataDi(corrente)) === 0) { finisci(); return; }
      data = true;
      ctx.stato = rispondiEsame(ctx.stato, giusta, Date.now());
      ctx.salva();
      salta.remove();
      const avanti = bottone('bottone bottone-acqua', ultima ? 'Vedi il risultato' : 'Avanti');
      avanti.addEventListener('click', () => { if (ultima) finisci(); else mostraDomanda(); });
      zonaAzioni.prepend(avanti);
      avanti.focus({ preventScroll: true });
      avanti.scrollIntoView({ block: 'nearest' });
    };
    const salta = bottone('bottone bottone-scuro', 'Salta (conta come sbagliata)');
    salta.addEventListener('click', () => {
      for (const c of s.querySelectorAll('.risposta, .pratico button, .pratico input')) c.disabled = true;
      registra(null);
    });

    if (d.tipo === 'pratico') {
      const area = el('div', 'quiz-pratico');
      s.append(area);
      const mostrato = renderPratico(area, d, rnd, giusta => registra(giusta === true), {
        modoEsame: true,
        alGenerato: es => { ctx.stato = salvaConsegna(ctx.stato, indice, es.consegna, es.soluzione); ctx.salva(); },
      });
      if (!mostrato) {
        area.append(el('p', 'quiz-testo', 'Questo esercizio non si può mostrare adesso. Passiamo al prossimo!'));
        zonaAzioni.append(consegna);
        s.append(zonaAzioni);
        registra(null);
        if (chiuso) return; // il tempo e' scaduto nel frattempo: il risultato e' gia' sullo schermo
        mostra(s, h);
        avviaTimer();
        return;
      }
    } else {
      s.append(el('p', 'quiz-testo', d.testo));
      const opzioni = d.tipo === 'vf'
        ? [{ testo: 'Vero', giusta: d.giusta === true }, { testo: 'Falso', giusta: d.giusta !== true }]
        : mescola(d.risposte.map((t, i) => ({ testo: t, giusta: i === d.giusta })), rnd);
      const lista = el('div', 'risposte' + (d.tipo === 'vf' ? ' vf' : ''));
      const bottoni = [];
      for (const o of opzioni) {
        const b = bottone('risposta');
        b.append(el('span', 'risposta-testo', o.testo));
        b.addEventListener('click', () => {
          for (const x of bottoni) x.disabled = true;
          b.classList.add('scelta');
          registra(o.giusta);
        });
        bottoni.push(b);
        lista.append(b);
      }
      s.append(lista);
    }
    zonaAzioni.append(salta, consegna);
    s.append(zonaAzioni);
    mostra(s, h);
    avviaTimer();
  }

  // ---------- risultato

  function finisci() {
    if (chiuso) return;
    chiuso = true;
    ferma();
    const r = chiudiEsame(ctx.stato, moduli, Date.now());
    ctx.stato = r.stato;
    ctx.salva();
    if (!r.esito) { schermataPartenza(); chiuso = false; return; }
    mostraRisultato(r.esito);
    celebrazioni(r.livelloSu, r.nuoveMedaglie);
  }

  function mostraRisultato(esito) {
    const s = schermata('esame-fine');
    const h = el('h1', 'titolo', 'Risultato della simulazione');
    s.append(h, el('div', 'quiz-modulo', modulo.nome));
    const punti = el('div', 'esame-punti');
    punti.append(el('div', 'esame-punteggio', `${esito.giuste} / ${esito.totale}`), el('div', 'secondario', `${esito.percentuale}%`));
    s.append(punti);
    if (esito.promosso) {
      s.append(el('div', 'esame-verdetto promosso', 'PROMOSSO!'));
    } else {
      const k = esito.mancanti;
      s.append(el('div', 'esame-verdetto non-ancora', `Non ancora: ${k === 1 ? 'ti manca 1 risposta giusta' : `ti mancano ${k} risposte giuste`}`));
    }

    const top = esito.erroriPerArgomento.slice(0, 3);
    if (top.length) {
      const box = el('div', 'esame-box');
      box.append(el('h2', 'esame-sottotitolo', 'Argomenti da ripassare'));
      const ul = el('ul', 'esame-elenco');
      for (const a of top) ul.append(el('li', '', `${a.argomento}: ${a.errori} ${a.errori === 1 ? 'errore' : 'errori'}`));
      box.append(ul);
      s.append(box);
    }

    if (esito.sbagliate.length) {
      const mappa = new Map();
      for (const m of moduli) for (const d of m.domande) mappa.set(d.id, d);
      const box = el('div', 'esame-box');
      box.append(el('h2', 'esame-sottotitolo', 'Domande sbagliate'));
      for (const id of esito.sbagliate) {
        const d = mappa.get(id);
        if (!d) continue;
        const voce = el('div', 'esame-errore');
        const c = d.tipo === 'pratico' ? (esito.consegne || {})[id] : null;
        if (d.tipo !== 'pratico') voce.append(el('p', 'quiz-testo', d.testo));
        else if (c) voce.append(el('p', 'quiz-testo', c.consegna));
        else voce.append(el('p', 'quiz-testo', `Esercizio pratico: ${d.argomento || ''}`)); // non mostrato (es. tempo scaduto prima)
        if (c && c.soluzione) voce.append(el('p', 'esame-giusta', `Soluzione: ${c.soluzione}`));
        else if (d.tipo === 'scelta' && Array.isArray(d.risposte)) voce.append(el('p', 'esame-giusta', `Risposta giusta: ${d.risposte[d.giusta]}`));
        else if (d.tipo === 'vf') voce.append(el('p', 'esame-giusta', `Risposta giusta: ${d.giusta === true ? 'Vero' : 'Falso'}`));
        voce.append(el('p', 'quiz-spiegazione', d.spiegazione || ''));
        box.append(voce);
      }
      s.append(box);
    }

    const azioni = el('div', 'azioni');
    azioni.append(bottoneModulo('bottone bottone-acqua', 'Torna al modulo'));
    const ancora = bottone('bottone bottone-scuro', 'Riprova');
    ancora.addEventListener('click', () => { chiuso = false; schermataPartenza(); });
    azioni.append(ancora);
    s.append(azioni);
    mostra(s, h);
  }

  // ---------- ingresso

  let e = ctx.stato.esameInCorso;
  if (e && !esameInCorsoValido(e)) {
    ctx.stato = { ...ctx.stato, esameInCorso: null };
    ctx.salva();
    e = null;
  }
  if (!e) schermataPartenza();
  else if (e.modulo !== modulo.modulo) schermataAltroModulo(e);
  else mostraDomanda(); // riprende; se il tempo e' finito mostraDomanda chiude e mostra il risultato
}
