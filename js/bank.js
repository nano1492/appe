// Caricamento e validazione dei file di domande (domande/*.json).
import { RICETTE } from './practice/recipes.js';

const DOMINI_UFFICIALI = ['icdl.org', 'aicanet.it', 'icdl.it'];

const eTesto = v => typeof v === 'string' && v.trim() !== '';
const eOggetto = v => v !== null && typeof v === 'object' && !Array.isArray(v);

export function urlUfficiale(url) {
  if (typeof url !== 'string' || !url.startsWith('https://')) return false;
  let u;
  try { u = new URL(url); } catch (e) { return false; }
  if (u.protocol !== 'https:' || u.username || u.password) return false;
  const h = u.hostname.toLowerCase();
  return DOMINI_UFFICIALI.some(d => h === d || h.endsWith('.' + d));
}

// Restituisce l'elenco degli errori (in italiano); vuoto se il modulo è valido.
export function validaModulo(json) {
  const err = [];
  if (!eOggetto(json)) return ['Il file del modulo non è un oggetto JSON valido.'];
  const mod = eTesto(json.modulo) ? json.modulo : '(senza id)';

  for (const c of ['modulo', 'nome', 'traduzione', 'colore', 'icona']) {
    if (!eTesto(json[c])) err.push(`Modulo ${mod}: manca il campo "${c}".`);
  }

  const f = json.fonte;
  if (!eOggetto(f)) {
    err.push(`Modulo ${mod}: manca la "fonte".`);
  } else {
    for (const c of ['documento', 'versione', 'url']) {
      if (!eTesto(f[c])) err.push(`Modulo ${mod}: manca fonte.${c}.`);
    }
    if (eTesto(f.url) && !urlUfficiale(f.url)) {
      err.push(`Modulo ${mod}: fonte non ufficiale (${f.url}). Sono ammessi solo https con icdl.org, aicanet.it o icdl.it.`);
    }
  }

  const visti = new Set();
  const controllaId = (q, dove) => {
    if (!eOggetto(q)) { err.push(`Modulo ${mod}: ${dove} non valida.`); return null; }
    if (!eTesto(q.id)) { err.push(`Modulo ${mod}: ${dove} senza id.`); return null; }
    if (visti.has(q.id)) err.push(`Modulo ${mod}: id duplicato ${q.id}.`);
    visti.add(q.id);
    return q.id;
  };

  if (!Array.isArray(json.domande)) {
    err.push(`Modulo ${mod}: manca l'elenco "domande".`);
  } else {
    json.domande.forEach((q, i) => {
      const id = controllaId(q, `la domanda numero ${i + 1}`);
      if (id === null) return;
      for (const c of ['argomento', 'spiegazione']) {
        if (!eTesto(q[c])) err.push(`Domanda ${id}: manca il campo "${c}".`);
      }
      if (q.tipo === 'scelta' || q.tipo === 'vf') {
        if (!eTesto(q.testo)) err.push(`Domanda ${id}: manca il testo.`);
      }
      if (q.tipo === 'scelta') {
        if (!Array.isArray(q.risposte) || q.risposte.length !== 4 || !q.risposte.every(eTesto)) {
          err.push(`Domanda ${id}: servono esattamente 4 risposte.`);
        }
        if (!Number.isInteger(q.giusta) || q.giusta < 0 || q.giusta > 3) {
          err.push(`Domanda ${id}: "giusta" deve essere un numero da 0 a 3.`);
        }
      } else if (q.tipo === 'vf') {
        if (typeof q.giusta !== 'boolean') err.push(`Domanda ${id}: "giusta" deve essere vero o falso.`);
      } else if (q.tipo === 'pratico') {
        if (!eTesto(q.ricetta)) err.push(`Domanda ${id}: manca la ricetta.`);
        else if (!Object.prototype.hasOwnProperty.call(RICETTE, q.ricetta)) err.push(`Domanda ${id}: ricetta sconosciuta "${q.ricetta}".`);
        if (q.parametri !== undefined && !eOggetto(q.parametri)) err.push(`Domanda ${id}: "parametri" non valido.`);
      } else {
        err.push(`Domanda ${id}: tipo sconosciuto.`);
      }
    });
  }

  if (json.flashcard !== undefined) {
    if (!Array.isArray(json.flashcard)) {
      err.push(`Modulo ${mod}: "flashcard" deve essere un elenco.`);
    } else {
      json.flashcard.forEach((c, i) => {
        const id = controllaId(c, `la flashcard numero ${i + 1}`);
        if (id === null) return;
        if (!eTesto(c.fronte) || !eTesto(c.retro)) err.push(`Flashcard ${id}: servono "fronte" e "retro".`);
      });
    }
  }
  return err;
}

// Di default legge i file relativi alla radice del sito, da qualunque pagina.
const fetchPredefinito = url => fetch(new URL('../' + url, import.meta.url));

export async function caricaBanca(fetchFn = fetchPredefinito) {
  const moduli = [];
  const errori = [];
  let indice;
  try {
    const r = await fetchFn('domande/indice.json');
    if (!r.ok) throw new Error('stato ' + r.status);
    indice = await r.json();
    if (!Array.isArray(indice) || !indice.every(eTesto)) throw new Error('formato non valido');
  } catch (e) {
    return { moduli: [], errori: ['Non riesco a leggere l\'elenco dei moduli (domande/indice.json).'] };
  }
  for (const id of indice) {
    try {
      const r = await fetchFn(`domande/${id}.json`);
      if (!r.ok) throw new Error('stato ' + r.status);
      const json = await r.json();
      const problemi = validaModulo(json);
      if (problemi.length === 0 && json.modulo !== id) {
        problemi.push(`Modulo ${id}: l'id nel file ("${json.modulo}") non coincide con il nome del file.`);
      }
      if (problemi.length) errori.push(...problemi.map(p => p.includes(id) ? p : `Modulo ${id}: ${p}`));
      else moduli.push(json);
    } catch (e) {
      errori.push(`Modulo ${id}: non riesco a caricarlo (file mancante o rovinato).`);
    }
  }
  return { moduli, errori };
}
