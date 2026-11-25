// Mini diapositive: elenco con miniature, "Nuova diapositiva", "Layout", casella del titolo, "Sposta su/giù", "Elimina".
// Stato: {diapositive:[{id, layout, titolo}]} (id nascosto e stabile; le nuove diapositive ricevono un id nuovo).
// Il titolo si scrive solo se esercizio.iniziale.titoloModificabile; altrimenti si vede come testo. Layout con i nomi di PowerPoint in italiano.
// Tutti i testi si inseriscono SOLO con textContent.
import { el, bottone, iconaSpan, creaControllo, copia, uguale } from './comune.js';
import { LAYOUT } from './recipes.js';

const CLASSE_LAYOUT = { 'Diapositiva titolo': 'l-titolo', 'Titolo e contenuto': 'l-contenuto', 'Solo titolo': 'l-solo-titolo', Vuota: 'l-vuota' };
let contatore = 0;

// Come PowerPoint: dopo una "Diapositiva titolo" arriva una "Titolo e contenuto", altrimenti lo stesso layout;
// in una presentazione vuota la prima diapositiva e' una "Diapositiva titolo".
function layoutNuova(diapositive, dopo) {
  const prima = diapositive[dopo];
  if (!prima) return 'Diapositiva titolo';
  return prima.layout === 'Diapositiva titolo' ? 'Titolo e contenuto' : prima.layout;
}
const haCasellaTitolo = d => d.layout !== 'Vuota' || d.titolo !== '';

// Disegno schematico di un layout (solo forme, nessun testo).
function schema(layout, titolo) {
  const s = el('div', 'diapo-schema ' + (CLASSE_LAYOUT[layout] || 'l-vuota'));
  s.setAttribute('aria-hidden', titolo === undefined ? 'true' : 'false');
  const t = el('span', 'diapo-mini-titolo', titolo === undefined ? '' : titolo);
  s.append(t, el('span', 'diapo-mini-corpo'));
  return s;
}

export function renderDiapositive(radice, esercizio, onFine) {
  const etichettaVerifica = esercizio.modoEsame === true ? 'Conferma' : 'Controlla'; // modo esame: una sola consegna
  const modificabile = esercizio.iniziale.titoloModificabile === true;
  const stato = { diapositive: copia(esercizio.iniziale.diapositive) };
  // Selezione all'apertura: esercizio.iniziale.selezionata (se valida), altrimenti la prima.
  const s0 = esercizio.iniziale.selezionata;
  const selIniziale = Number.isInteger(s0) && s0 >= 0 && s0 < stato.diapositive.length ? s0 : (stato.diapositive.length ? 0 : -1);
  let nuove = 0;
  let sel = selIniziale;
  let menuLayout = false;
  const idInput = 'diapo-titolo-' + (++contatore);

  const box = el('div', 'pratico diapo-box');
  box.append(el('p', 'quiz-testo', esercizio.consegna));
  box.append(el('p', 'pratico-aiuto', 'Tocca una miniatura per selezionare la diapositiva, poi usa i pulsanti. «Ricomincia» rimette le diapositive com\'erano all\'inizio.'));
  const controllo = creaControllo(box, esercizio, onFine, {
    invariato: s => uguale(s.diapositive, esercizio.iniziale.diapositive),
    msgInvariato: `Prima cambia le diapositive con i pulsanti, poi premi «${etichettaVerifica}».`,
  });

  const strumenti = el('div', 'diapo-strumenti');
  strumenti.setAttribute('role', 'toolbar');
  strumenti.setAttribute('aria-label', 'Strumenti delle diapositive');
  const strumento = (testo, icona, azione) => {
    const b = bottone('diapo-strumento');
    b.append(iconaSpan(icona, 'diapo-icona'), el('span', '', testo));
    b.addEventListener('click', () => { if (!controllo.finito) { azione(); disegna(); } });
    strumenti.append(b);
    return b;
  };
  const bNuova = strumento('Nuova diapositiva', 'r-diapo-nuova', () => {
    const dove = sel + 1;
    stato.diapositive.splice(dove, 0, { id: 'nuova-' + (++nuove), layout: layoutNuova(stato.diapositive, sel), titolo: '' });
    sel = dove;
    menuLayout = false;
  });
  const bLayout = strumento('Layout', 'r-layout', () => { menuLayout = !menuLayout; });
  bLayout.setAttribute('aria-haspopup', 'true');
  const bSu = strumento('Sposta su', 'd-su', () => {
    const d = stato.diapositive;
    [d[sel - 1], d[sel]] = [d[sel], d[sel - 1]];
    sel--;
  });
  const bGiu = strumento('Sposta giù', 'd-giu', () => {
    const d = stato.diapositive;
    [d[sel + 1], d[sel]] = [d[sel], d[sel + 1]];
    sel++;
  });
  const bElimina = strumento('Elimina', 'd-elimina', () => {
    stato.diapositive.splice(sel, 1);
    sel = Math.min(sel, stato.diapositive.length - 1);
    menuLayout = false;
  });
  box.append(strumenti);

  const menu = el('div', 'diapo-layout-menu');
  menu.setAttribute('role', 'group');
  menu.setAttribute('aria-label', 'Layout');
  box.append(menu);

  const area = el('div', 'diapo-area');
  const elenco = el('div', 'diapo-elenco');
  elenco.setAttribute('role', 'group');
  elenco.setAttribute('aria-label', 'Diapositive');
  const grande = el('div', 'diapo-grande');
  area.append(elenco, grande);
  box.append(area);

  const azioni = el('div', 'pratico-azioni');
  const verifica = bottone('bottone bottone-acqua', etichettaVerifica);
  verifica.addEventListener('click', () => {
    if (controllo.finito) return;
    menuLayout = false;
    disegna();
    controllo.controlla(copia(stato));
  });
  // "Ricomincia": diapositive e selezione come all'apertura; non consuma tentativi (a esercizio finito e' spento).
  const ricomincia = bottone('bottone bottone-scuro', 'Ricomincia');
  ricomincia.addEventListener('click', () => {
    if (controllo.finito) return;
    stato.diapositive = copia(esercizio.iniziale.diapositive);
    sel = selIniziale;
    nuove = 0;
    menuLayout = false;
    controllo.pulisciAvviso();
    disegna();
  });
  azioni.append(ricomincia, verifica);
  box.append(azioni, controllo.zona);

  function disegna() {
    const d = stato.diapositive;
    const c = d[sel];
    bLayout.disabled = !c;
    bElimina.disabled = !c;
    bSu.disabled = !c || sel === 0;
    bGiu.disabled = !c || sel === d.length - 1;
    bLayout.setAttribute('aria-expanded', String(menuLayout && !!c));

    menu.replaceChildren();
    menu.hidden = !(menuLayout && c);
    if (menuLayout && c) {
      for (const l of LAYOUT) {
        const v = bottone('diapo-layout-voce' + (c.layout === l ? ' attuale' : ''));
        v.append(schema(l), el('span', '', l));
        v.setAttribute('aria-pressed', String(c.layout === l));
        v.addEventListener('click', () => {
          if (controllo.finito) return;
          c.layout = l;
          menuLayout = false;
          disegna();
        });
        menu.append(v);
      }
    }

    elenco.replaceChildren(...d.map((x, i) => {
      const m = bottone('diapo-miniatura');
      m.setAttribute('aria-pressed', String(i === sel));
      m.append(el('span', 'diapo-numero', String(i + 1)), schema(x.layout, x.layout === 'Vuota' && x.titolo === '' ? '' : x.titolo));
      m.addEventListener('click', () => {
        if (controllo.finito) return;
        sel = i;
        menuLayout = false;
        disegna();
      });
      return m;
    }));
    if (d.length === 0) elenco.append(el('p', 'diapo-vuoto', 'Nessuna diapositiva'));

    grande.replaceChildren();
    if (!c) {
      grande.className = 'diapo-grande vuota';
      grande.append(el('p', 'diapo-vuoto', 'Premi «Nuova diapositiva» per aggiungerne una.'));
      return;
    }
    grande.className = 'diapo-grande ' + CLASSE_LAYOUT[c.layout];
    grande.append(el('p', 'diapo-grande-nome', `Diapositiva ${sel + 1} · ${c.layout}`));
    const foglio = el('div', 'diapo-foglio');
    if (modificabile && haCasellaTitolo(c)) {
      const etichetta = el('label', 'solo-lettori', `Titolo della diapositiva ${sel + 1}`);
      etichetta.htmlFor = idInput;
      const input = el('input', 'diapo-titolo-input');
      input.id = idInput;
      input.type = 'text';
      input.setAttribute('inputmode', 'text');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('enterkeyhint', 'done');
      input.maxLength = 60;
      input.placeholder = 'Scrivi qui il titolo';
      input.value = c.titolo;
      input.addEventListener('input', () => {
        if (controllo.finito) return;
        c.titolo = input.value;
        const t = elenco.children[sel] && elenco.children[sel].querySelector('.diapo-mini-titolo');
        if (t) t.textContent = input.value;
      });
      input.addEventListener('keydown', ev => { if (ev.key === 'Enter') input.blur(); });
      foglio.append(etichetta, input);
    } else if (haCasellaTitolo(c)) {
      foglio.append(el('p', 'diapo-titolo-testo', c.titolo));
    } else {
      foglio.append(el('p', 'diapo-vuoto', 'Il layout «Vuota» non ha la casella del titolo.'));
    }
    if (c.layout === 'Diapositiva titolo') foglio.append(el('span', 'diapo-segnaposto sottotitolo'));
    if (c.layout === 'Titolo e contenuto') foglio.append(el('span', 'diapo-segnaposto contenuto'));
    grande.append(foglio);
  }

  disegna();
  radice.append(box);
  return box;
}
