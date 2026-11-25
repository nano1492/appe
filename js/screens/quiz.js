// Schermata quiz: sfida del giorno, allenamento di un modulo, ripasso errori.
// Testi di domande e risposte arrivano da JSON scritto a mano: si inseriscono SOLO con textContent.
import { icona } from '../icons.js';
import { el } from './home.js';
import { mostraCelebrazione } from './celebra.js';
import { suona } from '../sound.js';
import { mescola } from '../rng.js';
import { sfidaDelGiorno, allenamento } from '../sessions.js';
import { domandeRipasso, moduloFinito } from '../review.js';
import { giornoLocale, MEDAGLIE } from '../game.js';
import { applicaRisposta, concludiSfida } from '../esito.js';
import { renderPratico, ambienteDisponibile } from '../practice/index.js';

const MSG_RIPASSO_VUOTO = 'Nessun errore da ripassare. Ottimo lavoro!';
const MSG_NIENTE = 'Per ora non ci sono domande pronte qui. Torna a trovarci presto!';

function icon(nome, classe = 'pillola-icona') {
  const s = el('span', classe);
  s.innerHTML = icona(nome);
  return s;
}

function schermataMessaggio(ctx, radice, testo) {
  const s = el('section', 'schermata centrata');
  const b = el('button', 'bottone bottone-acqua', 'Torna alla mappa');
  b.type = 'button';
  b.addEventListener('click', () => ctx.vai('#/home'));
  const h = el('h1', 'titolo', testo);
  s.append(icon('razzo', 'grande-icona'), h, b);
  radice.append(s);
  focalizza(h);
}

function focalizza(h) {
  h.tabIndex = -1;
  h.focus({ preventScroll: true });
}

// Costruisce l'elenco delle domande della sessione. Restituisce {domande, modulo} oppure {errore: 'home'|testo}.
function preparaSessione(ctx, tipo, idModulo) {
  const moduli = ctx.banca.moduli;
  const modulo = idModulo ? moduli.find(m => m.modulo === idModulo) : null;
  if (idModulo && !modulo) return { errore: 'home' };
  if (tipo === 'allenamento' && !modulo) return { errore: 'home' };
  if (tipo !== 'sfida' && tipo !== 'allenamento' && tipo !== 'ripasso') return { errore: 'home' };
  if (tipo === 'sfida' && idModulo) return { errore: 'home' };

  // Si saltano solo gli esercizi pratici il cui ambiente non ha ancora un'interfaccia.
  const pronta = d => d.tipo !== 'pratico' || ambienteDisponibile(d.ricetta);
  const soloPronte = m => ({ ...m, domande: m.domande.filter(pronta) });
  let domande;
  if (tipo === 'sfida') {
    domande = sfidaDelGiorno(moduli.map(soloPronte), ctx.stato);
  } else if (tipo === 'allenamento') {
    domande = allenamento(soloPronte(modulo), ctx.stato);
  } else {
    const scelti = modulo ? [modulo] : moduli;
    const inRipasso = domandeRipasso(scelti, ctx.stato);
    if (inRipasso.length === 0) return { errore: MSG_RIPASSO_VUOTO };
    domande = inRipasso.filter(pronta);
  }
  if (domande.length === 0) return { errore: MSG_NIENTE };
  return { domande, modulo };
}

export function renderQuiz(ctx, parametri, radice) {
  const tipo = parametri[0];
  const sessione = preparaSessione(ctx, tipo, parametri[1]);
  if (sessione.errore === 'home') { ctx.vai('#/home'); return; }
  if (sessione.errore) { schermataMessaggio(ctx, radice, sessione.errore); return; }

  const { domande, modulo } = sessione;
  const totale = domande.length;
  const moduloDi = new Map();
  for (const m of ctx.banca.moduli) for (const d of m.domande) moduloDi.set(d.id, m);
  const bancaModuli = ctx.banca.moduli;

  let indice = 0;
  let giuste = 0;
  let xp = 0;
  let coda = Promise.resolve();
  let concluso = false;
  let streakGiorni = null;

  // La coda vive quanto questa schermata: se si naviga o si riparte, i riquadri non ancora mostrati si lasciano perdere
  // (le medaglie sono gia' salvate nello stato).
  const mio = Symbol('quiz');
  radice._quizAttivo = mio;
  const vivo = () => radice._quizAttivo === mio && radice.isConnected && !!radice.querySelector('.quiz, .quiz-fine');

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
    if (livelloSu) {
      eventi.push({ suono: 'livello', tipo: 'livello', titolo: `Livello ${livelloSu.livello}!`, sottotitolo: livelloSu.nome });
    }
    for (const id of medaglie) {
      const m = MEDAGLIE.find(x => x.id === id);
      if (m) eventi.push({ suono: 'medaglia', tipo: 'medaglia', titolo: m.nome, sottotitolo: m.descrizione, icona: m.icona });
    }
    accoda(eventi);
  };

  function intestazione(titolo) {
    const testa = el('header', 'quiz-testa');
    const riga = el('div', 'quiz-riga');
    // Uscita (l'app installata su iPhone non ha il tasto indietro). Le risposte gia' date restano salvate.
    const esci = el('a', 'bottone-icona indietro');
    esci.href = modulo && tipo !== 'sfida' ? '#/modulo/' + encodeURIComponent(modulo.modulo) : '#/home';
    esci.setAttribute('aria-label', 'Esci');
    esci.innerHTML = icona('indietro');
    const h = el('h1', 'titolo', titolo);
    const suono = el('button', 'bottone-icona suono');
    suono.type = 'button';
    suono.setAttribute('aria-label', 'Suoni');
    const aggiornaSuono = () => {
      const on = ctx.stato.impostazioni.suoni === true;
      suono.setAttribute('aria-pressed', String(on));
      suono.innerHTML = icona(on ? 'suono-acceso' : 'suono-spento');
    };
    aggiornaSuono();
    suono.addEventListener('click', () => {
      ctx.stato = { ...ctx.stato, impostazioni: { ...ctx.stato.impostazioni, suoni: !(ctx.stato.impostazioni.suoni === true) } };
      ctx.salva();
      aggiornaSuono();
    });
    riga.append(esci, h, suono);
    testa.append(riga);
    return { testa, h };
  }

  function barra(valore) {
    const traccia = el('div', 'traccia');
    traccia.setAttribute('role', 'progressbar');
    traccia.setAttribute('aria-label', 'Avanzamento del quiz');
    traccia.setAttribute('aria-valuemin', '0');
    traccia.setAttribute('aria-valuemax', String(totale));
    traccia.setAttribute('aria-valuenow', String(valore));
    const r = el('div', 'riempi riempi-rosa');
    r.style.width = Math.round((valore / totale) * 100) + '%';
    traccia.append(r);
    return traccia;
  }

  function bottoneAvanti(ultima) {
    const avanti = el('button', 'bottone bottone-acqua', ultima ? 'Vedi il risultato' : 'Avanti');
    avanti.type = 'button';
    avanti.addEventListener('click', () => {
      if (ultima) mostraRiepilogo();
      else { indice++; radice.replaceChildren(); mostraDomanda(); }
    });
    return avanti;
  }

  function mostraDomanda() {
    const d = domande[indice];
    const m = moduloDi.get(d.id);
    const s = el('section', 'schermata quiz');
    if (m) s.style.setProperty('--colore', m.colore);
    const { testa, h } = intestazione(`Domanda ${indice + 1} / ${totale}`);
    testa.append(barra(indice));
    s.append(testa);
    if (m) s.append(el('div', 'quiz-modulo', m.nome));
    const zonaFeedback = el('div', 'quiz-feedback-zona');

    if (d.tipo === 'pratico') {
      // Esercizio pratico: consegna, interfaccia e tentativi li gestisce js/practice.
      const area = el('div', 'quiz-pratico');
      s.append(area, zonaFeedback);
      const mostrato = renderPratico(area, d, Math.random, giusta => esito(giusta));
      if (!mostrato) {
        // Non conta come risposta: si spiega e si passa oltre (niente vicolo cieco).
        area.append(el('p', 'quiz-testo', 'Questo esercizio non si può mostrare adesso. Passiamo al prossimo!'));
        const ultima = indice === totale - 1;
        zonaFeedback.append(bottoneAvanti(ultima));
        if (ultima) celebrazioni(null, concludiSessione());
      }
    } else {
      s.append(el('p', 'quiz-testo', d.testo));
      // Ogni opzione: {testo, giusta}. Le 4 crocette si mescolano, vero/falso resta in ordine.
      const opzioni = d.tipo === 'vf'
        ? [{ testo: 'Vero', giusta: d.giusta === true }, { testo: 'Falso', giusta: d.giusta !== true }]
        : mescola(d.risposte.map((t, i) => ({ testo: t, giusta: i === d.giusta })), Math.random);

      const lista = el('div', 'risposte' + (d.tipo === 'vf' ? ' vf' : ''));
      const bottoni = [];
      for (const o of opzioni) {
        const b = el('button', 'risposta');
        b.type = 'button';
        b.append(el('span', 'risposta-testo', o.testo));
        b.addEventListener('click', () => rispondi(o, b));
        bottoni.push({ b, o });
        lista.append(b);
      }
      s.append(lista, zonaFeedback);

      function rispondi(scelta, bottone) {
        for (const { b, o } of bottoni) {
          b.disabled = true;
          if (o.giusta) { b.classList.add('giusta'); b.append(icon('spunta', 'risposta-icona')); }
          else if (b === bottone) { b.classList.add('sbagliata'); b.append(icon('croce', 'risposta-icona')); }
        }
        esito(scelta.giusta);
      }
    }

    function esito(giusta) {
      const r = applicaRisposta(ctx.stato, d, giusta, bancaModuli);
      ctx.stato = r.stato;
      ctx.salva();
      xp += r.xpGuadagnati;
      if (giusta) giuste++;
      suona(giusta ? 'giusto' : 'sbagliato', ctx);

      const fb = el('div', 'quiz-feedback ' + (giusta ? 'ok' : 'no'));
      fb.setAttribute('role', 'status');
      fb.append(el('div', 'quiz-esito', giusta ? `Giusto! +${r.xpGuadagnati} XP` : 'Sbagliato'));
      fb.append(el('p', 'quiz-spiegazione', d.spiegazione || ''));
      const ultima = indice === totale - 1;
      const avanti = bottoneAvanti(ultima);
      zonaFeedback.append(fb, avanti);
      avanti.focus({ preventScroll: true });
      avanti.scrollIntoView({ block: 'nearest' });
      let medaglie = r.nuoveMedaglie;
      if (ultima) medaglie = [...medaglie, ...concludiSessione()];
      celebrazioni(r.livelloSu, medaglie);
    }

    radice.replaceChildren(s);
    focalizza(h);
  }

  // Alla risposta all'ultima domanda: la sfida conta subito per lo streak (una volta sola). Restituisce le nuove medaglie.
  function concludiSessione() {
    if (concluso) return [];
    concluso = true;
    if (tipo !== 'sfida') return [];
    const r = concludiSfida(ctx.stato, giornoLocale(new Date()), bancaModuli);
    ctx.stato = r.stato;
    ctx.salva();
    streakGiorni = r.stato.streak.giorni;
    return r.nuoveMedaglie;
  }

  function mostraRiepilogo() {
    const s = el('section', 'schermata quiz-fine');
    const { testa, h } = intestazione(tipo === 'sfida' ? 'Sfida completata!' : 'Sessione finita!');
    testa.append(barra(totale));
    s.append(testa);
    const riga = (valore, etichetta) => {
      const c = el('div', 'dato');
      c.append(el('div', 'dato-valore', valore), el('div', 'dato-etichetta', etichetta));
      return c;
    };
    const dati = el('div', 'dati');
    dati.append(riga(`${giuste} / ${totale}`, 'Risposte giuste'), riga(`+${xp}`, 'XP guadagnati'));
    if (streakGiorni !== null) dati.append(riga(String(streakGiorni), streakGiorni === 1 ? 'Giorno di fila' : 'Giorni di fila'));
    s.append(dati);
    if (modulo && moduloFinito(ctx.stato, modulo)) {
      s.append(el('div', 'banner-finito', 'Domande finite! Chiedi un nuovo pacchetto'));
    }
    const azioni = el('div', 'azioni');
    if (tipo === 'allenamento') {
      const ancora = el('button', 'bottone bottone-modulo', 'Ancora!');
      ancora.type = 'button';
      ancora.addEventListener('click', () => { radice.replaceChildren(); renderQuiz(ctx, parametri, radice); });
      azioni.append(ancora);
    }
    const mappa = el('button', 'bottone bottone-scuro', 'Torna alla mappa');
    mappa.type = 'button';
    mappa.addEventListener('click', () => ctx.vai('#/home'));
    azioni.append(mappa);
    s.append(azioni);
    radice.replaceChildren(s);
    focalizza(h);
  }

  mostraDomanda();
}
