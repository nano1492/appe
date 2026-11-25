// Service worker di ICDL Quest: mette in cache l'app cosi' funziona anche offline.
//
// QUANDO CAMBI I FILE DELL'APP:
// - ogni file che l'app usa (pagine, stile, js/**, icone, domande/*.json) deve stare in FILE_APP,
//   con percorso relativo (l'app vive in una sottocartella di GitHub Pages). Elenca solo file che
//   esistono: se un file manca, l'installazione della cache fallisce. tests/sw.test.js lo controlla.
// - quando un nuovo modulo di domande arriva (Task 14-20) aggiungi domande/<id>.json a FILE_APP
//   e aumenta VERSIONE: gli studenti vedranno la fascia "Nuove domande disponibili!".
//
// Strategia: su localhost/127.0.0.1 (sviluppo) prima la rete, poi la cache se sei offline,
// cosi' si vede sempre il codice nuovo. Altrove prima la cache, poi la rete.
// tests/ e tools/ non passano mai dalla cache. Si gestiscono solo le richieste GET dello stesso sito.
// Navigazioni non trovate in cache -> index.html (vedi dallaCache). In cache vanno solo risposte 200.
// Questo file gira come worker "classico": niente import/export.

const VERSIONE = "19";
const PREFISSO = 'icdl-quest-';
const CACHE = PREFISSO + VERSIONE;

const FILE_APP = /*FILE_APP*/[
  "./",
  "index.html",
  "style.css",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "js/app.js",
  "js/contesto.js",
  "js/aggiornamento.js",
  "js/router.js",
  "js/storage.js",
  "js/bank.js",
  "js/game.js",
  "js/review.js",
  "js/sessions.js",
  "js/rng.js",
  "js/sound.js",
  "js/icons.js",
  "js/esito.js",
  "js/mazzo.js",
  "js/timer.js",
  "js/esame.js",
  "js/profilo-dati.js",
  "js/screens/home.js",
  "js/screens/quiz.js",
  "js/screens/flashcard.js",
  "js/screens/esame.js",
  "js/screens/profilo.js",
  "js/screens/celebra.js",
  "js/screens/dialogo.js",
  "js/practice/index.js",
  "js/practice/comune.js",
  "js/practice/formula.js",
  "js/practice/recipes.js",
  "js/practice/sheet.js",
  "js/practice/editor.js",
  "js/practice/slides.js",
  "js/practice/toolbar.js",
  "domande/indice.json",
  "domande/computer-essentials.json",
  "domande/online-essentials.json",
  "domande/it-security.json",
  "domande/online-collaboration.json",
  "domande/word-processing.json",
  "domande/spreadsheets.json",
  "domande/presentation.json"
]/*FINE*/;

const BASE = new URL('./', self.location.href);
const SVILUPPO = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Ogni file si scarica con cache:"reload" (salta la cache HTTP del browser: GitHub Pages la tiene
// 10 minuti e subito dopo una pubblicazione si metterebbero in cache file vecchi).
// Tutto o niente: prima si scaricano tutti i file, poi si salvano; se uno manca l'installazione fallisce.
async function installa() {
  const scaricati = await Promise.all(FILE_APP.map(async percorso => {
    const indirizzo = new URL(percorso, BASE).href;
    const risposta = await fetch(new Request(indirizzo, { cache: 'reload' }));
    if (!risposta.ok) throw new Error(`Installazione: ${percorso} ha risposto ${risposta.status}`);
    return [indirizzo, risposta];
  }));
  const cache = await caches.open(CACHE);
  await Promise.all(scaricati.map(([indirizzo, risposta]) => cache.put(indirizzo, risposta)));
}

self.addEventListener('install', evento => {
  evento.waitUntil(installa());
});

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(nomi => Promise.all(nomi.filter(n => n.startsWith(PREFISSO) && n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// app.js lo manda quando lo studente tocca la fascia "Nuove domande disponibili!".
self.addEventListener('message', evento => {
  if (evento.data && evento.data.tipo === 'aggiorna') self.skipWaiting();
});

function daGestire(richiesta) {
  if (richiesta.method !== 'GET') return false;
  const url = new URL(richiesta.url);
  if (url.origin !== BASE.origin) return false;
  if (!url.pathname.startsWith(BASE.pathname)) return false;
  const relativo = url.pathname.slice(BASE.pathname.length);
  return !relativo.startsWith('tests/') && !relativo.startsWith('tools/');
}

// L'app e' una pagina sola (le schermate sono #hash): una NAVIGAZIONE dentro la cartella dell'app
// che non e' in cache (es. ./?source=pwa o un indirizzo vecchio) riceve index.html, cioe' "./".
// Le altre richieste (script, domande, immagini) non ricevono mai la pagina al posto del file.
async function dallaCache(richiesta) {
  const navigazione = richiesta.mode === 'navigate';
  const trovata = await caches.match(richiesta, { ignoreSearch: navigazione });
  if (trovata) return trovata;
  if (navigazione) return caches.match(new URL('./', BASE).href);
  return undefined;
}

async function salvaInCache(richiesta, risposta) {
  if (risposta && risposta.status === 200 && (risposta.type === 'basic' || risposta.type === 'default')) {
    const cache = await caches.open(CACHE);
    await cache.put(richiesta, risposta.clone());
  }
  return risposta;
}

async function primaLaRete(richiesta) {
  try {
    return await salvaInCache(richiesta, await fetch(richiesta));
  } catch (e) {
    const trovata = await dallaCache(richiesta);
    if (trovata) return trovata;
    throw e;
  }
}

async function primaLaCache(richiesta) {
  const trovata = await dallaCache(richiesta);
  if (trovata) return trovata;
  return salvaInCache(richiesta, await fetch(richiesta));
}

self.addEventListener('fetch', evento => {
  const richiesta = evento.request;
  if (!daGestire(richiesta)) return;
  evento.respondWith(SVILUPPO ? primaLaRete(richiesta) : primaLaCache(richiesta));
});
