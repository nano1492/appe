// Stato dell'app, salvataggio in localStorage e backup su file.
const CHIAVE = 'icdl-quest-v1';
export const CHIAVE_STATO = CHIAVE;
const ERRORE_BACKUP = 'Questo file non è un backup di ICDL Quest';

export function statoIniziale() {
  return {
    versione: 1,
    xp: 0,
    streak: { giorni: 0, ultimoGiorno: null },
    risposte: {},
    ripasso: {},
    medaglie: [],
    sfide: {},
    esami: [],
    flashcardViste: 0,
    esameInCorso: null,
    streakMigliore: 0,
    impostazioni: { suoni: true },
  };
}

function eOggetto(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

const ha = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// Tiene il valore solo se ha lo stesso tipo del valore di default.
function valido(valore, def) {
  if (Array.isArray(def)) return Array.isArray(valore);
  if (typeof def === 'number') return typeof valore === 'number' && Number.isFinite(valore);
  if (typeof def === 'boolean') return typeof valore === 'boolean';
  if (def === null) return valore === null || eOggetto(valore); // esameInCorso
  if (typeof def === 'object') return eOggetto(valore);
  return false;
}

// Costruisce lo stato dalle sole chiavi note, con controllo dei tipi.
// streak e impostazioni sono completati chiave per chiave.
function completa(parziale) {
  const stato = statoIniziale();
  for (const k of Object.keys(stato)) {
    if (k === 'streak' || k === 'impostazioni' || !ha(parziale, k)) continue;
    if (valido(parziale[k], stato[k])) stato[k] = parziale[k];
  }
  const s = ha(parziale, 'streak') && eOggetto(parziale.streak) ? parziale.streak : {};
  if (ha(s, 'giorni') && typeof s.giorni === 'number' && Number.isFinite(s.giorni)) stato.streak.giorni = s.giorni;
  if (ha(s, 'ultimoGiorno') && typeof s.ultimoGiorno === 'string') stato.streak.ultimoGiorno = s.ultimoGiorno;
  const i = ha(parziale, 'impostazioni') && eOggetto(parziale.impostazioni) ? parziale.impostazioni : {};
  if (ha(i, 'suoni') && typeof i.suoni === 'boolean') stato.impostazioni.suoni = i.suoni;
  return stato;
}

export function carica(storage) {
  try {
    if (storage === undefined) storage = window.localStorage;
    const testo = storage.getItem(CHIAVE);
    if (testo === null || testo === undefined) return { stato: statoIniziale(), persistente: true };
    try {
      const dati = JSON.parse(testo);
      if (!eOggetto(dati)) return { stato: statoIniziale(), persistente: true };
      return { stato: completa(dati), persistente: true };
    } catch (e) {
      return { stato: statoIniziale(), persistente: true };
    }
  } catch (e) {
    return { stato: statoIniziale(), persistente: false };
  }
}

export function salva(stato, storage) {
  try {
    if (storage === undefined) storage = window.localStorage;
    storage.setItem(CHIAVE, JSON.stringify(stato));
    return true;
  } catch (e) {
    return false;
  }
}

export function esportaBackup(stato, oggi) {
  return {
    nomeFile: `icdl-backup-${oggi}.json`,
    testo: JSON.stringify({ app: 'icdl-quest', versione: 1, creato: oggi, stato }, null, 2),
  };
}

export function importaBackup(testo) {
  try {
    const dati = JSON.parse(testo);
    if (!eOggetto(dati) || dati.app !== 'icdl-quest' || !eOggetto(dati.stato)) {
      return { ok: false, errore: ERRORE_BACKUP };
    }
    return { ok: true, stato: completa(dati.stato) };
  } catch (e) {
    return { ok: false, errore: ERRORE_BACKUP };
  }
}

export function scaricaFile(nomeFile, testo) {
  const blob = new Blob([testo], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function leggiFile(file) {
  if (file && typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const lettore = new FileReader();
    lettore.onload = () => resolve(String(lettore.result));
    lettore.onerror = () => reject(lettore.error);
    lettore.readAsText(file);
  });
}
