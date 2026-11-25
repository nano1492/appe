// Schermata "Profilo": livello, medaglie, statistiche, suoni, backup, azzeramento e fonti.
// I testi delle domande/fonti arrivano da JSON: si inseriscono SOLO con textContent.
import { icona } from '../icons.js';
import { el } from './home.js';
import { conferma } from './dialogo.js';
import { livelloDa, nomeLivello, giornoLocale } from '../game.js';
import { esportaBackup, importaBackup, scaricaFile, leggiFile, statoIniziale } from '../storage.js';
import { urlUfficiale } from '../bank.js';
import { statistiche, elencoMedaglie, testoDettaglio } from '../profilo-dati.js';

const NOTA_FONTI = 'Le domande sono scritte sugli argomenti del syllabus ufficiale ICDL, non sono domande d\'esame ufficiali.';
const INFO_APP = 'ICDL Quest — nessun account, nessuna pubblicità: i tuoi dati restano solo su questo dispositivo.';
const SUGGERIMENTO_BACKUP = 'Il file di backup finisce nella cartella Download (su iPhone: «File»).';

function icon(nome, classe = 'pillola-icona') {
  const s = el('span', classe);
  s.innerHTML = icona(nome);
  return s;
}

function bottone(classe, testo, nomeIcona) {
  const b = el('button', classe);
  b.type = 'button';
  if (nomeIcona) b.append(icon(nomeIcona));
  b.append(document.createTextNode(testo));
  return b;
}

const numero = n => n.toLocaleString('it-IT');

export function renderProfilo(ctx, parametri, radice, avvisoIniziale) {
  const disegna = (avviso) => renderProfilo(ctx, parametri, radice, avviso);
  const s = el('section', 'schermata profilo');

  // ---------- intestazione
  const indietro = el('button', 'bottone-icona indietro');
  indietro.type = 'button';
  indietro.setAttribute('aria-label', 'Torna alla mappa');
  indietro.innerHTML = icona('indietro');
  indietro.addEventListener('click', () => ctx.vai('#/home'));

  const xp = Number.isFinite(ctx.stato.xp) ? ctx.stato.xp : 0;
  const { livello } = livelloDa(xp);
  const testa = el('header', 'profilo-testa');
  const avatar = el('div', 'profilo-avatar');
  avatar.innerHTML = icona('astronauta');
  const h = el('h1', 'titolo', nomeLivello(livello));
  testa.append(avatar, h, el('div', 'secondario', `Livello ${livello} · ${numero(xp)} XP`));
  s.append(indietro, testa);

  // ---------- esito delle operazioni (errori e conferme)
  const avviso = el('p', 'profilo-avviso');
  avviso.tabIndex = -1;
  const mostraAvviso = (testo, errore) => {
    avviso.textContent = testo;
    avviso.classList.toggle('errore', !!errore);
    avviso.setAttribute('role', errore ? 'alert' : 'status');
    avviso.hidden = !testo;
  };
  mostraAvviso(avvisoIniziale || '', false);

  // ---------- medaglie
  const medaglie = elencoMedaglie(ctx.stato);
  const prese = medaglie.filter(m => m.conquistata).length;
  const sezM = el('section', 'profilo-sezione');
  sezM.append(el('h2', 'esame-sottotitolo', `Medaglie ${prese} / ${medaglie.length}`));
  const griglia = el('div', 'medaglie');
  const dettaglio = el('p', 'medaglia-dettaglio secondario', 'Tocca una medaglia per vedere come si ottiene.');
  dettaglio.setAttribute('role', 'status');
  const bottoniM = [];
  for (const m of medaglie) {
    const b = el('button', 'medaglia' + (m.conquistata ? '' : ' bloccata'));
    b.type = 'button';
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-label', `${m.nome}, ${m.conquistata ? 'conquistata' : 'ancora da conquistare'}`);
    const tondo = el('span', 'medaglia-tondo');
    tondo.innerHTML = icona(m.conquistata ? m.icona : 'lucchetto');
    b.append(tondo, el('span', 'medaglia-nome', m.nome));
    b.addEventListener('click', () => {
      for (const x of bottoniM) x.setAttribute('aria-expanded', String(x === b));
      dettaglio.textContent = testoDettaglio(m);
    });
    bottoniM.push(b);
    griglia.append(b);
  }
  sezM.append(griglia, dettaglio);

  // ---------- statistiche
  const st = statistiche(ctx.stato);
  const sezS = el('section', 'profilo-sezione');
  sezS.append(el('h2', 'esame-sottotitolo', 'Le tue statistiche'));
  const blocchi = el('div', 'statistiche');
  const dati = [
    [st.giuste, 'Risposte giuste'],
    [st.streak, 'Giorni di fila'],
    [st.streakMigliore, 'Record giorni di fila'],
    [st.simulazioniSuperate, 'Simulazioni superate'],
    [st.flashcardViste, 'Flashcard viste'],
  ];
  for (const [v, e] of dati) {
    const d = el('div', 'dato');
    d.append(el('div', 'dato-valore', numero(v)), el('div', 'dato-etichetta', e));
    blocchi.append(d);
  }
  sezS.append(blocchi);

  // ---------- suoni
  const sezI = el('section', 'profilo-sezione');
  const riga = el('div', 'impostazione');
  const etichetta = el('span', 'impostazione-testo', 'Suoni');
  etichetta.id = 'etichetta-suoni';
  const sw = el('button', 'interruttore');
  sw.type = 'button';
  sw.setAttribute('role', 'switch');
  sw.setAttribute('aria-labelledby', 'etichetta-suoni');
  const aggiornaSw = () => sw.setAttribute('aria-checked', String(ctx.stato.impostazioni && ctx.stato.impostazioni.suoni === true));
  sw.append(el('span', 'interruttore-pallino'));
  aggiornaSw();
  sw.addEventListener('click', () => {
    const acceso = !(ctx.stato.impostazioni && ctx.stato.impostazioni.suoni === true);
    ctx.stato = { ...ctx.stato, impostazioni: { ...(ctx.stato.impostazioni || {}), suoni: acceso } };
    ctx.salva();
    aggiornaSw();
  });
  riga.append(etichetta, sw);
  sezI.append(riga);

  // ---------- backup
  const sezB = el('section', 'profilo-sezione');
  sezB.append(el('h2', 'esame-sottotitolo', 'I tuoi progressi'));
  const azioni = el('div', 'azioni profilo-azioni');
  const salvaBtn = bottone('bottone bottone-acqua', 'Salva progressi', 'download');
  const caricaBtn = bottone('bottone bottone-scuro', 'Carica progressi', 'upload');
  const input = el('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.hidden = true;
  input.setAttribute('aria-label', 'Scegli il file di backup');
  input.tabIndex = -1;

  salvaBtn.addEventListener('click', () => {
    const { nomeFile, testo } = esportaBackup(ctx.stato, giornoLocale(new Date()));
    if (ctx.scarica) ctx.scarica(nomeFile, testo);
    else scaricaFile(nomeFile, testo);
  });
  caricaBtn.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    let testo;
    try {
      testo = await leggiFile(file);
    } catch (e) {
      input.value = '';
      if (!s.isConnected) return;
      mostraAvviso('Non riesco a leggere il file.', true);
      return;
    }
    input.value = ''; // si puo' scegliere due volte lo stesso file
    if (!s.isConnected) return; // si e' cambiata schermata mentre si leggeva
    const r = importaBackup(testo);
    if (!r.ok) { mostraAvviso(r.errore, true); return; }
    mostraAvviso('', false);
    const si = await conferma(radice, { testo: 'Sostituire i progressi attuali?', si: 'Sostituisci', no: 'Annulla' });
    if (!si || !s.isConnected) return;
    ctx.stato = r.stato;
    ctx.salva();
    disegna('Progressi caricati!');
  });
  azioni.append(salvaBtn, caricaBtn, input);
  sezB.append(azioni, el('p', 'secondario', SUGGERIMENTO_BACKUP), avviso);

  // ---------- azzera
  const azzera = bottone('bottone bottone-scuro profilo-azzera', 'Azzera tutto');
  azzera.addEventListener('click', async () => {
    const uno = await conferma(radice, {
      titolo: 'Azzerare tutto?',
      testo: 'Perderai XP, medaglie e progressi. Se vuoi tenerli, prima salva un backup.',
      si: 'Azzera', no: 'Annulla',
    });
    if (!uno) return;
    const due = await conferma(radice, { testo: 'Sei proprio sicuro? Non si può annullare.', si: 'Sì, azzera tutto', no: 'Annulla' });
    if (!due) return;
    ctx.stato = statoIniziale();
    ctx.salva();
    ctx.vai('#/home');
  });
  sezB.append(azzera);

  // ---------- fonti
  const sezF = el('section', 'profilo-sezione fonti');
  sezF.append(el('h2', 'esame-sottotitolo', 'Fonti delle domande'), el('p', 'secondario', NOTA_FONTI));
  const moduli = ctx.banca && Array.isArray(ctx.banca.moduli) ? ctx.banca.moduli : [];
  for (const m of moduli) {
    const f = m && m.fonte && typeof m.fonte === 'object' ? m.fonte : {};
    const voce = el('div', 'fonte');
    voce.append(el('div', 'fonte-nome', String(m.nome || '')), el('div', 'secondario', `${f.documento || ''} · versione ${f.versione || ''}`));
    if (urlUfficiale(f.url)) {
      const a = el('a', 'fonte-link', 'Apri il documento ufficiale');
      a.href = f.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      voce.append(a);
    }
    sezF.append(voce);
  }

  s.append(sezM, sezS, sezI, sezB, sezF, el('p', 'secondario profilo-info', INFO_APP));
  radice.replaceChildren(s);
  if (avvisoIniziale) avviso.focus({ preventScroll: true });
}

