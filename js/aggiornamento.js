// Registra il service worker (sw.js) e mostra la fascia "Nuove domande disponibili!"
// quando una versione nuova e' pronta. Il tocco chiede al worker nuovo di attivarsi
// (skipWaiting) e, appena prende il controllo, la pagina si ricarica una volta sola.

export const TESTO_FASCIA = 'Nuove domande disponibili! Tocca per aggiornare';

export async function registraServiceWorker({
  contenitore = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined,
  host = document.body,
  documento = document,
  ricarica = () => window.location.reload(),
  attesaMs = 10000, // se dopo il tocco non succede niente entro questo tempo, la fascia si riattiva
} = {}) {
  if (!contenitore) return null;
  let registrazione;
  try {
    registrazione = await contenitore.register('./sw.js');
  } catch (e) {
    console.warn('Service worker non registrato', e);
    return null;
  }

  let richiesto = false;
  let ricaricato = false;
  let inAttesa = null;
  let bottone = null;
  let timer = null;

  // Scatta anche alla prima installazione (clients.claim): si ricarica solo se l'ha chiesto lo studente.
  contenitore.addEventListener('controllerchange', () => {
    if (!richiesto || ricaricato) return;
    ricaricato = true;
    ricarica();
  });

  function togli() {
    clearTimeout(timer);
    if (bottone) bottone.remove();
    bottone = null;
    inAttesa = null;
  }

  function mostra(worker) {
    inAttesa = worker;
    // Se diventa inutile (sostituito da uno piu' nuovo o installazione fallita) e nessun altro
    // ha preso il suo posto, la fascia sparisce: toccarla non servirebbe a niente.
    worker.addEventListener('statechange', () => {
      if (worker.state === 'redundant' && inAttesa === worker) togli();
    });
    if (bottone) { bottone.disabled = false; return; }
    bottone = host.ownerDocument.createElement('button');
    bottone.type = 'button';
    bottone.className = 'fascia-aggiorna';
    bottone.textContent = TESTO_FASCIA;
    bottone.addEventListener('click', () => {
      if (!inAttesa) return;
      richiesto = true;
      bottone.disabled = true;
      inAttesa.postMessage({ tipo: 'aggiorna' });
      clearTimeout(timer);
      const b = bottone;
      timer = setTimeout(() => { if (!ricaricato) b.disabled = false; }, attesaMs);
    });
    host.append(bottone);
  }

  function segui(nuovo) {
    if (!nuovo) return;
    const controlla = () => { if (nuovo.state === 'installed' && contenitore.controller) mostra(nuovo); };
    nuovo.addEventListener('statechange', controlla);
  }

  // Con un controller c'e' gia' una versione attiva: il worker installato e' un aggiornamento.
  if (registrazione.waiting && contenitore.controller) mostra(registrazione.waiting);
  segui(registrazione.installing);
  registrazione.addEventListener('updatefound', () => segui(registrazione.installing));

  // Un'app installata puo' restare aperta per giorni: quando torna in primo piano controlla se c'e' una versione nuova.
  documento.addEventListener('visibilitychange', () => {
    if (documento.visibilityState === 'visible' && registrazione.update) {
      registrazione.update().catch(() => {});
    }
  });
  return registrazione;
}
