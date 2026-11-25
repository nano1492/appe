// Router basato su #hash. analizzaHash e' pura (testabile senza DOM).
import { icona } from './icons.js';

const schermate = new Map();

// Rotte previste ma non ancora costruite: mostrano "In arrivo!" finche' un'attivita' successiva le registra.
const IN_ARRIVO = ['flashcard'];

export function analizzaHash(hash) {
  let t = typeof hash === 'string' ? hash : '';
  if (t.startsWith('#')) t = t.slice(1);
  const q = t.indexOf('?');
  if (q !== -1) t = t.slice(0, q);
  const pezzi = t.split('/').filter(p => p !== '').map(p => {
    try { return decodeURIComponent(p); } catch (e) { return p; }
  });
  if (pezzi.length === 0) return { nome: 'home', parametri: [] };
  return { nome: pezzi[0].toLowerCase(), parametri: pezzi.slice(1) };
}

export function registra(nome, render) {
  schermate.set(nome, render);
}

function elemento(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo !== undefined) e.textContent = testo;
  return e;
}

function schermataInArrivo(ctx, parametri, radice) {
  const s = elemento('section', 'schermata centrata');
  const razzo = elemento('div', 'grande-icona');
  razzo.innerHTML = icona('razzo');
  const bottone = elemento('button', 'bottone bottone-acqua', 'Torna alla mappa');
  bottone.type = 'button';
  bottone.addEventListener('click', () => ctx.vai('#/home'));
  s.append(razzo, elemento('h1', 'titolo', 'In arrivo!'), elemento('p', 'secondario', 'Questa parte è ancora in costruzione.'), bottone);
  radice.append(s);
}

function schermataErrore(ctx, radice) {
  const s = elemento('section', 'schermata centrata');
  const bottone = elemento('button', 'bottone bottone-acqua', 'Torna alla mappa');
  bottone.type = 'button';
  bottone.addEventListener('click', () => ctx.vai('#/home'));
  s.append(elemento('h1', 'titolo', 'Ops! Qualcosa è andato storto.'), bottone);
  radice.append(s);
}

export function mostra(ctx, hash, radice) {
  const { nome, parametri } = analizzaHash(hash);
  let render = schermate.get(nome);
  if (!render && IN_ARRIVO.includes(nome)) render = schermataInArrivo;
  if (!render) {
    ctx.vai('#/home');
    return;
  }
  radice.replaceChildren();
  try {
    render(ctx, parametri, radice);
  } catch (e) {
    console.warn('Errore nella schermata', nome, e);
    radice.replaceChildren();
    schermataErrore(ctx, radice);
  }
  window.scrollTo(0, 0);
  const titolo = radice.querySelector('h1');
  if (titolo) {
    titolo.tabIndex = -1;
    titolo.focus({ preventScroll: true });
  }
}

export function avvia(ctx) {
  const radice = document.getElementById('app');
  const aggiorna = () => mostra(ctx, window.location.hash, radice);
  window.addEventListener('hashchange', aggiorna);
  if (!window.location.hash) window.location.hash = '#/home';
  else aggiorna();
}
