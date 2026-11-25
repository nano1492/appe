// Avvio dell'app: carica stato e domande, registra le schermate, avvia il router.
import { creaContesto, collegaSincronizzazione } from './contesto.js';
import { caricaBanca } from './bank.js';
import { registra, avvia, mostra } from './router.js';
import { renderHome, renderModulo, el } from './screens/home.js';
import { renderQuiz } from './screens/quiz.js';
import { renderFlashcard } from './screens/flashcard.js';
import { renderEsame } from './screens/esame.js';
import { renderProfilo } from './screens/profilo.js';
import { registraServiceWorker } from './aggiornamento.js';

const radice = document.getElementById('app');

async function avviaApp() {
  const ctx = creaContesto();

  let banca = { moduli: [], errori: [] };
  try {
    banca = await caricaBanca();
  } catch (e) {
    console.warn('Caricamento delle domande non riuscito', e);
  }
  if (banca.errori.length) console.warn('Problemi nel caricamento delle domande:', banca.errori);
  ctx.banca = banca;

  if (banca.moduli.length === 0) {
    const s = el('section', 'schermata centrata');
    const b = el('button', 'bottone bottone-acqua', 'Riprova');
    b.type = 'button';
    b.addEventListener('click', () => window.location.reload());
    s.append(el('p', 'titolo', 'Non riesco a caricare le domande. Controlla la connessione e riprova.'), b);
    radice.replaceChildren(s);
    return;
  }

  registra('home', renderHome);
  registra('modulo', renderModulo);
  registra('quiz', renderQuiz);
  registra('flashcard', renderFlashcard);
  registra('esame', renderEsame);
  registra('profilo', renderProfilo);
  // Un'altra copia aperta (scheda o app installata) ha salvato: si rilegge lo stato e si ridisegna.
  // Si collega prima di avvia(), cosi' il suo controllo arriva prima di quelli delle schermate.
  collegaSincronizzazione(ctx, { ridisegna: () => mostra(ctx, window.location.hash, radice) });
  avvia(ctx);
}

if (radice) {
  avviaApp();
  // Service worker: app offline e fascia "Nuove domande disponibili!" (dopo il caricamento, per non rallentarlo).
  if (document.readyState === 'complete') registraServiceWorker();
  else window.addEventListener('load', () => registraServiceWorker(), { once: true });
}
