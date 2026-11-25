// Schermata flashcard di un modulo: carta che gira, "Lo sapevo" / "Da ripassare", mazzo finito.
// Fronte e retro arrivano da JSON scritto a mano: si inseriscono SOLO con textContent.
import { icona } from '../icons.js';
import { el } from './home.js';
import { mostraCelebrazione } from './celebra.js';
import { suona } from '../sound.js';
import { creaMazzo, rispondiCarta, mazzoFinito } from '../mazzo.js';
import { nuoveMedaglie, MEDAGLIE } from '../game.js';

function focalizza(h) {
  h.tabIndex = -1;
  h.focus({ preventScroll: true });
}

function bottone(testo, classe, onClick) {
  const b = el('button', 'bottone ' + classe, testo);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

export function renderFlashcard(ctx, parametri, radice) {
  const modulo = ctx.banca.moduli.find(m => m.modulo === parametri[0]);
  if (!modulo) { ctx.vai('#/home'); return; }
  const tornaAlModulo = () => ctx.vai('#/modulo/' + modulo.modulo);

  const carte = Array.isArray(modulo.flashcard) ? modulo.flashcard : [];
  if (carte.length === 0) {
    const s = el('section', 'schermata centrata');
    s.style.setProperty('--colore', modulo.colore);
    const h = el('h1', 'titolo', 'Non ci sono ancora flashcard per questo modulo.');
    s.append(h, bottone('Torna al modulo', 'bottone-acqua', tornaAlModulo));
    radice.replaceChildren(s);
    focalizza(h);
    return;
  }

  const totale = carte.length;
  let mazzo = creaMazzo(carte, Math.random);
  const viste = new Set(); // carte gia' girate in questa sessione (contano una volta sola)
  let coda = Promise.resolve();

  // La coda dei riquadri vive quanto questa schermata.
  const mio = Symbol('flashcard');
  radice._flashAttivo = mio;
  const vivo = () => radice._flashAttivo === mio && radice.isConnected && !!radice.querySelector('.flash, .flash-fine');

  function celebraMedaglie(ids) {
    ids.forEach((id, i) => {
      const m = MEDAGLIE.find(x => x.id === id);
      if (!m) return;
      coda = coda
        .then(() => (i === 0 && vivo() ? new Promise(r => setTimeout(r, 400)) : undefined))
        .then(() => {
          if (!vivo()) return undefined;
          suona('medaglia', ctx);
          return mostraCelebrazione(radice, { suono: 'medaglia', tipo: 'medaglia', titolo: m.nome, sottotitolo: m.descrizione, icona: m.icona });
        });
    });
  }

  // Prima volta che questa carta viene girata nella sessione: conta come vista.
  function contaVista(carta) {
    if (viste.has(carta.id)) return;
    viste.add(carta.id);
    const attuali = Number.isFinite(ctx.stato.flashcardViste) ? ctx.stato.flashcardViste : 0;
    let stato = { ...ctx.stato, flashcardViste: attuali + 1 };
    const nuove = nuoveMedaglie(stato, ctx.banca.moduli);
    if (nuove.length) stato = { ...stato, medaglie: [...(Array.isArray(stato.medaglie) ? stato.medaglie : []), ...nuove] };
    ctx.stato = stato;
    ctx.salva();
    if (nuove.length) celebraMedaglie(nuove);
  }

  function mostraCarta() {
    const carta = mazzo.coda[0];
    const s = el('section', 'schermata flash');
    s.style.setProperty('--colore', modulo.colore);

    const testa = el('header', 'quiz-testa');
    const riga = el('div', 'quiz-riga');
    const indietro = el('a', 'bottone-icona indietro');
    indietro.href = '#/modulo/' + modulo.modulo;
    indietro.setAttribute('aria-label', 'Torna al modulo');
    indietro.innerHTML = icona('indietro');
    const h = el('h1', 'titolo', `Carta ${mazzo.fatte + 1} di ${totale}`);
    riga.append(indietro, h, el('span', 'flash-spazio'));
    const traccia = el('div', 'traccia');
    traccia.setAttribute('role', 'progressbar');
    traccia.setAttribute('aria-label', 'Avanzamento delle flashcard');
    traccia.setAttribute('aria-valuemin', '0');
    traccia.setAttribute('aria-valuemax', String(totale));
    traccia.setAttribute('aria-valuenow', String(mazzo.fatte));
    const r = el('div', 'riempi');
    r.style.width = Math.round((mazzo.fatte / totale) * 100) + '%';
    traccia.append(r);
    testa.append(riga, traccia);
    s.append(testa, el('div', 'quiz-modulo', modulo.nome));

    // La carta: due facce nella stessa cella, cosi' la carta e' alta quanto la faccia piu' lunga.
    const bCarta = el('button', 'carta');
    bCarta.type = 'button';
    bCarta.setAttribute('aria-label', 'Gira la carta');
    const giro = el('span', 'carta-giro');
    const fronte = el('span', 'faccia faccia-fronte');
    fronte.append(el('span', 'faccia-etichetta', 'Fronte'), el('span', 'faccia-testo', carta.fronte));
    const retro = el('span', 'faccia faccia-retro');
    retro.append(el('span', 'faccia-etichetta', 'Retro'), el('span', 'faccia-testo', carta.retro));
    retro.setAttribute('aria-hidden', 'true');
    giro.append(fronte, retro);
    bCarta.append(giro);
    const voce = el('p', 'solo-lettori');
    voce.setAttribute('role', 'status');
    voce.setAttribute('aria-live', 'polite');
    voce.textContent = carta.fronte;
    s.append(bCarta, voce);

    const suggerimento = el('p', 'secondario flash-suggerimento', 'Tocca la carta per girarla');
    const zona = el('div', 'azioni flash-azioni');
    zona.hidden = true;
    const avanza = (sapevo) => {
      if (sapevo) suona('giusto', ctx);
      mazzo = rispondiCarta(mazzo, sapevo);
      if (mazzoFinito(mazzo)) mostraFine(); else mostraCarta();
    };
    zona.append(
      bottone('Lo sapevo', 'bottone-acqua', () => avanza(true)),
      bottone('Da ripassare', 'bottone-scuro', () => avanza(false)),
    );
    s.append(suggerimento, zona);

    let girata = false;
    let vistoRetro = false; // dopo il primo giro i bottoni restano anche se si torna sul fronte
    bCarta.addEventListener('click', () => {
      girata = !girata;
      if (girata) vistoRetro = true;
      giro.classList.toggle('girata', girata);
      fronte.setAttribute('aria-hidden', String(girata));
      retro.setAttribute('aria-hidden', String(!girata));
      voce.textContent = girata ? carta.retro : carta.fronte;
      suggerimento.hidden = girata;
      zona.hidden = !vistoRetro;
      if (girata) contaVista(carta);
    });

    radice.replaceChildren(s);
    focalizza(h);
  }

  function mostraFine() {
    const s = el('section', 'schermata flash-fine centrata');
    s.style.setProperty('--colore', modulo.colore);
    const ic = el('span', 'grande-icona');
    ic.innerHTML = icona('stella');
    const h = el('h1', 'titolo', 'Mazzo finito!');
    s.append(ic, h, el('p', 'secondario', `Hai ripassato ${totale} ${totale === 1 ? 'carta' : 'carte'}.`));
    const azioni = el('div', 'azioni');
    azioni.append(
      bottone('Ricomincia', 'bottone-acqua', () => {
        mazzo = creaMazzo(carte, Math.random);
        mostraCarta();
      }),
      bottone('Torna al modulo', 'bottone-scuro', tornaAlModulo),
    );
    s.append(azioni);
    radice.replaceChildren(s);
    focalizza(h);
  }

  mostraCarta();
}
