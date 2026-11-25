// Interprete delle formule in stile Microsoft Excel in italiano. Funzione pura: non lancia mai eccezioni.
// Grammatica (precedenza dalla piu' bassa):
//   confronto := somma ( ( = | <> | < | > | <= | >= ) somma )*
//   somma     := prodotto ( ( + | - ) prodotto )*
//   prodotto  := potenza ( ( * | / ) potenza )*
//   potenza   := unario ( ^ unario )*          (a sinistra, come Excel: =2^3^2 fa 64, =-2^2 fa 4)
//   unario    := ( - | + ) unario | postfisso
//   postfisso := primario ( % )*
//   primario  := NUMERO | "TESTO" | RIF [ : RIF ] | NOME ( argomenti ) | ( confronto )
// I riferimenti possono avere $ (assoluti o misti: $B$2, B$2, $B2). Le virgolette tipografiche valgono come ".
// Gli argomenti si separano con ";". I numeri usano la virgola decimale (2,5).
// Gli intervalli (B2:B6) valgono solo come argomento diretto di una funzione.

const MAX_LUNGHEZZA = 200;
const MAX_PROFONDITA = 40;
const TOLLERANZA = 1e-9;

const INGLESI = { SUM: 'SOMMA', AVERAGE: 'MEDIA', IF: 'SE', COUNT: 'CONTA.NUMERI' };
const QUASI = { CONTA: 'CONTA.NUMERI', MEDIAN: 'MEDIA', SOMA: 'SOMMA', SOM: 'SOMMA' };

class ErroreFormula {
  constructor(messaggio) { this.messaggio = messaggio; }
}
const fallisci = m => { throw new ErroreFormula(m); };

// ---------- tokenizer
function tokenizza(testo) {
  const t = [];
  let i = 0;
  while (i < testo.length) {
    const c = testo[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '"') {
      let s = '';
      i++;
      for (;;) {
        if (i >= testo.length) fallisci('Manca una virgoletta di chiusura " alla fine del testo');
        if (testo[i] === '"') {
          if (testo[i + 1] === '"') { s += '"'; i += 2; continue; }
          i++;
          break;
        }
        s += testo[i++];
      }
      t.push({ tipo: 'testo', valore: s });
      continue;
    }
    const num = /^\d+(?:([.,])\d+)?/.exec(testo.slice(i));
    if (num) {
      if (num[1] === '.') fallisci('Il punto non si usa nei numeri: scrivi 1000 per mille, 2,5 per i decimali');
      t.push({ tipo: 'numero', valore: Number(num[0].replace(',', '.')) });
      i += num[0].length;
      continue;
    }
    // Riferimenti assoluti o misti ($B$2, B$2, $B2): il $ non cambia il valore, si toglie.
    const assoluto = /^\$?([A-Za-z]+)\$?(\d+)/.exec(testo.slice(i));
    if (assoluto && assoluto[0].includes('$')) {
      t.push({ tipo: 'nome', valore: (assoluto[1] + assoluto[2]).toUpperCase() });
      i += assoluto[0].length;
      continue;
    }
    const nome = /^[\p{L}][\p{L}\d.]*/u.exec(testo.slice(i));
    if (nome) {
      t.push({ tipo: 'nome', valore: nome[0].toUpperCase() });
      i += nome[0].length;
      continue;
    }
    const due = testo.slice(i, i + 2);
    if (due === '<=' || due === '>=' || due === '<>') { t.push({ tipo: 'op', valore: due }); i += 2; continue; }
    if ('+-*/^%()=<>;:,'.includes(c)) {
      if (c === ',') fallisci('In Excel in italiano gli argomenti si separano con ;');
      t.push({ tipo: 'op', valore: c });
      i++;
      continue;
    }
    fallisci(`Carattere non valido nella formula: ${c}`);
  }
  return t;
}

// ---------- parser a discesa ricorsiva (produce un albero)
function analizzaTesto(corpo) {
  const tok = tokenizza(corpo);
  let p = 0;
  let profondita = 0;
  const guarda = () => tok[p];
  const eOp = (v) => tok[p] && tok[p].tipo === 'op' && tok[p].valore === v;
  const entra = () => { if (++profondita > MAX_PROFONDITA) fallisci('La formula è troppo complicata'); };
  const esci = () => { profondita--; };

  function confronto() {
    entra();
    let n = somma();
    while (guarda() && guarda().tipo === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(guarda().valore)) {
      const op = tok[p++].valore;
      n = { tipo: 'binario', op, a: n, b: somma() };
    }
    esci();
    return n;
  }
  function somma() {
    let n = prodotto();
    while (eOp('+') || eOp('-')) {
      const op = tok[p++].valore;
      n = { tipo: 'binario', op, a: n, b: prodotto() };
    }
    return n;
  }
  function prodotto() {
    let n = potenza();
    while (eOp('*') || eOp('/')) {
      const op = tok[p++].valore;
      n = { tipo: 'binario', op, a: n, b: potenza() };
    }
    return n;
  }
  // Come in Excel: ^ associa a sinistra (=2^3^2 fa 64) e il meno unario viene prima (=-2^2 fa 4).
  function potenza() {
    let n = unario();
    while (eOp('^')) {
      p++;
      n = { tipo: 'binario', op: '^', a: n, b: unario() };
    }
    return n;
  }
  function unario() {
    if (eOp('-') || eOp('+')) {
      const op = tok[p++].valore;
      entra();
      const n = unario();
      esci();
      return op === '-' ? { tipo: 'meno', a: n } : { tipo: 'piu', a: n };
    }
    let n = primario();
    while (eOp('%')) { p++; n = { tipo: 'percento', a: n }; }
    return n;
  }
  function riferimento(nome) {
    const m = /^([A-Z]+)(\d+)$/.exec(nome);
    if (!m) return null;
    const riga = Number(m[2]);
    if (m[1].length !== 1 || riga < 1 || riga > 99) fallisci(`Riferimento non valido: ${nome}`);
    return { col: m[1].charCodeAt(0) - 64, riga };
  }
  function primario() {
    const t = guarda();
    if (!t) fallisci('La formula è incompleta: manca qualcosa alla fine');
    if (t.tipo === 'numero') { p++; return { tipo: 'valore', valore: t.valore }; }
    if (t.tipo === 'testo') { p++; return { tipo: 'valore', valore: t.valore }; }
    if (t.tipo === 'nome') {
      p++;
      const rif = riferimento(t.valore);
      if (rif) {
        if (eOp(':')) {
          p++;
          const t2 = guarda();
          const rif2 = t2 && t2.tipo === 'nome' ? riferimento(t2.valore) : null;
          if (!rif2) fallisci('Dopo i due punti : serve una cella, ad esempio B2:B6');
          p++;
          return { tipo: 'intervallo', da: rif, a: rif2 };
        }
        return { tipo: 'cella', rif };
      }
      if (eOp('(')) {
        p++;
        return funzione(t.valore);
      }
      if (t.valore in INGLESI) fallisci(`In italiano si scrive ${INGLESI[t.valore]}`);
      fallisci(`I testi vanno scritti tra virgolette, ad esempio "${t.valore}". Se è una funzione, servono le parentesi`);
    }
    if (eOp('(')) {
      p++;
      entra();
      const n = confronto();
      esci();
      if (!eOp(')')) fallisci('Manca una parentesi chiusa )');
      p++;
      return n;
    }
    if (eOp(')')) fallisci('C\'è una parentesi chiusa ) di troppo o manca qualcosa prima');
    if (eOp(';')) fallisci('C\'è un ; fuori posto');
    fallisci(`C'è un simbolo ${t.valore} fuori posto`);
  }
  function funzione(nome) {
    if (nome in INGLESI) fallisci(`In italiano si scrive ${INGLESI[nome]}`);
    if (!(nome in FUNZIONI)) {
      fallisci(nome in QUASI ? `Funzione sconosciuta: ${nome}. Forse volevi ${QUASI[nome]}?` : `Funzione sconosciuta: ${nome}`);
    }
    entra();
    const argomenti = [];
    if (eOp(')')) fallisci(`Scrivi qualcosa tra le parentesi di ${nome}`);
    for (;;) {
      if (eOp(';') || eOp(')')) fallisci(`C'è un ; di troppo in ${nome}`);
      argomenti.push(confronto());
      if (eOp(';')) { p++; continue; }
      if (eOp(')')) { p++; break; }
      if (!guarda()) fallisci(`Manca una parentesi chiusa ) alla fine di ${nome}`);
      fallisci(`Gli argomenti di ${nome} si separano con ;`);
    }
    esci();
    return { tipo: 'funzione', nome, argomenti };
  }

  if (tok.length === 0) fallisci('Scrivi qualcosa dopo =');
  const albero = confronto();
  if (p < tok.length) {
    if (eOp(')')) fallisci('C\'è una parentesi chiusa ) di troppo');
    fallisci('C\'è qualcosa di troppo nella formula: forse manca un operatore come + o ;');
  }
  return albero;
}

function preparaFormula(formula) {
  if (typeof formula !== 'string' || formula.trim() === '') fallisci('Scrivi una formula, ad esempio =SOMMA(B2:B6)');
  const f = formula.trim().replace(/[“”„«»]/g, '"');
  if (f.length > MAX_LUNGHEZZA) fallisci('La formula è troppo lunga');
  if (f[0] !== '=') fallisci('Le formule iniziano con =');
  return analizzaTesto(f.slice(1));
}

// ---------- valutazione
const VUOTO = { vuoto: true };
const eVuoto = v => v === VUOTO;

function leggiCella(celle, rif) {
  const nome = String.fromCharCode(64 + rif.col) + rif.riga;
  const v = celle[nome];
  if (v === undefined || v === null || v === '') return VUOTO;
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallisci('#NUM!');
  if (typeof v === 'boolean' || typeof v === 'string') return v;
  return VUOTO;
}

function celleIntervallo(celle, da, a) {
  const out = [];
  const [c1, c2] = [Math.min(da.col, a.col), Math.max(da.col, a.col)];
  const [r1, r2] = [Math.min(da.riga, a.riga), Math.max(da.riga, a.riga)];
  for (let c = c1; c <= c2; c++) for (let r = r1; r <= r2; r++) out.push(leggiCella(celle, { col: c, riga: r }));
  return out;
}

function comeNumero(v) {
  if (eVuoto(v)) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return fallisci('#VALORE!');
}

// Valori per SOMMA, MEDIA, MIN, MAX, CONTA.NUMERI: da intervalli e celle si prendono solo i numeri;
// gli argomenti scritti direttamente devono essere numeri (VERO/FALSO valgono 1/0).
function numeriArgomenti(argomenti, celle, conta) {
  const out = [];
  for (const arg of argomenti) {
    if (arg.tipo === 'intervallo' || arg.tipo === 'cella') {
      const valori = arg.tipo === 'intervallo' ? celleIntervallo(celle, arg.da, arg.a) : [leggiCella(celle, arg.rif)];
      for (const v of valori) if (typeof v === 'number') out.push(v);
    } else {
      const v = calcola(arg, celle);
      if (typeof v === 'number') out.push(v);
      else if (!conta) out.push(comeNumero(v));
    }
  }
  return out;
}

const FUNZIONI = {
  SOMMA: (a, c) => numeriArgomenti(a, c).reduce((s, x) => s + x, 0),
  MEDIA: (a, c) => {
    const n = numeriArgomenti(a, c);
    return n.length === 0 ? fallisci('#DIV/0!') : n.reduce((s, x) => s + x, 0) / n.length;
  },
  MIN: (a, c) => { const n = numeriArgomenti(a, c); return n.length ? Math.min(...n) : 0; },
  MAX: (a, c) => { const n = numeriArgomenti(a, c); return n.length ? Math.max(...n) : 0; },
  'CONTA.NUMERI': (a, c) => numeriArgomenti(a, c, true).length,
  SE: (a, c) => {
    if (a.length < 2 || a.length > 3) fallisci('SE vuole 3 parti: SE(condizione;se vero;se falso)');
    const cond = calcola(a[0], c);
    let vero;
    if (typeof cond === 'boolean') vero = cond;
    else if (typeof cond === 'number') vero = cond !== 0;
    else if (eVuoto(cond)) vero = false;
    else fallisci('#VALORE!');
    if (vero) return calcola(a[1], c);
    return a.length === 3 ? calcola(a[2], c) : false;
  },
};

// Ordine di Excel nei confronti tra tipi diversi: numeri < testi < VERO/FALSO.
function confronta(x, y) {
  if (eVuoto(x)) x = typeof y === 'string' ? '' : typeof y === 'boolean' ? false : 0;
  if (eVuoto(y)) y = typeof x === 'string' ? '' : typeof x === 'boolean' ? false : 0;
  const rango = v => (typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2);
  if (rango(x) !== rango(y)) return rango(x) - rango(y);
  if (typeof x === 'string') {
    const a = x.toLocaleUpperCase('it'), b = y.toLocaleUpperCase('it');
    return a < b ? -1 : a > b ? 1 : 0;
  }
  const a = Number(x), b = Number(y);
  return Math.abs(a - b) < TOLLERANZA ? 0 : a < b ? -1 : 1;
}

function calcola(n, celle) {
  switch (n.tipo) {
    case 'valore': return n.valore;
    case 'cella': return leggiCella(celle, n.rif);
    case 'intervallo': return fallisci('Gli intervalli come B2:B6 si usano dentro una funzione, ad esempio =SOMMA(B2:B6)');
    case 'meno': return -comeNumero(calcola(n.a, celle));
    case 'piu': return comeNumero(calcola(n.a, celle));
    case 'percento': return comeNumero(calcola(n.a, celle)) / 100;
    case 'funzione': return FUNZIONI[n.nome](n.argomenti, celle);
    case 'binario': {
      const a = calcola(n.a, celle);
      const b = calcola(n.b, celle);
      if (['+', '-', '*', '/', '^'].includes(n.op)) {
        const x = comeNumero(a), y = comeNumero(b);
        if (n.op === '+') return x + y;
        if (n.op === '-') return x - y;
        if (n.op === '*') return x * y;
        if (n.op === '^') {
          if (x === 0 && y < 0) fallisci('#DIV/0!');
          if (x === 0 && y === 0) fallisci('#NUM!');
          const r = Math.pow(x, y);
          return Number.isFinite(r) ? r : fallisci('#NUM!');
        }
        return y === 0 ? fallisci('#DIV/0!') : x / y;
      }
      const c = confronta(a, b);
      return { '=': c === 0, '<>': c !== 0, '<': c < 0, '>': c > 0, '<=': c <= 0, '>=': c >= 0 }[n.op];
    }
    default: return fallisci('Formula non valida');
  }
}

function esegui(fn) {
  try {
    return fn();
  } catch (e) {
    if (e instanceof ErroreFormula) return { ok: false, errore: e.messaggio };
    return { ok: false, errore: 'Formula non valida' };
  }
}

export function valuta(formula, celle) {
  return esegui(() => {
    const albero = preparaFormula(formula);
    const c = celle && typeof celle === 'object' ? celle : {};
    let v = calcola(albero, c);
    if (eVuoto(v)) v = 0;
    if (typeof v === 'boolean') v = v ? 'VERO' : 'FALSO';
    if (typeof v === 'number' && !Number.isFinite(v)) return { ok: false, errore: '#NUM!' };
    return { ok: true, valore: v };
  });
}

// Nomi (in maiuscolo) delle funzioni usate nella formula; [] se la formula non si legge.
export function funzioniUsate(formula) {
  const r = esegui(() => ({ ok: true, albero: preparaFormula(formula) }));
  if (!r.ok) return [];
  const nomi = new Set();
  const visita = n => {
    if (!n || typeof n !== 'object') return;
    if (n.tipo === 'funzione') { nomi.add(n.nome); n.argomenti.forEach(visita); }
    if (n.a) visita(n.a);
    if (n.b) visita(n.b);
  };
  visita(r.albero);
  return [...nomi];
}

// Celle e intervalli usati, in ordine, come {da, a} con da in alto a sinistra (una cella sola: da === a).
// [] se la formula non si legge.
export function riferimentiUsati(formula) {
  const r = esegui(() => ({ ok: true, albero: preparaFormula(formula) }));
  if (!r.ok) return [];
  const nome = (col, riga) => String.fromCharCode(64 + col) + riga;
  const out = [];
  const visita = n => {
    if (!n || typeof n !== 'object') return;
    if (n.tipo === 'cella') out.push({ da: nome(n.rif.col, n.rif.riga), a: nome(n.rif.col, n.rif.riga) });
    else if (n.tipo === 'intervallo') {
      out.push({
        da: nome(Math.min(n.da.col, n.a.col), Math.min(n.da.riga, n.a.riga)),
        a: nome(Math.max(n.da.col, n.a.col), Math.max(n.da.riga, n.a.riga)),
      });
    } else if (n.tipo === 'funzione') n.argomenti.forEach(visita);
    else { visita(n.a); visita(n.b); }
  };
  visita(r.albero);
  return out;
}

// true se la formula contiene almeno un riferimento a una cella o a un intervallo.
export function usaRiferimenti(formula) {
  const r = esegui(() => ({ ok: true, albero: preparaFormula(formula) }));
  if (!r.ok) return false;
  const visita = n => {
    if (!n || typeof n !== 'object') return false;
    if (n.tipo === 'cella' || n.tipo === 'intervallo') return true;
    if (n.tipo === 'funzione') return n.argomenti.some(visita);
    return visita(n.a) || visita(n.b);
  };
  return visita(r.albero);
}

export function stessoValore(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < TOLLERANZA;
  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim().toLocaleUpperCase('it') === b.trim().toLocaleUpperCase('it');
  }
  return false;
}

// Solo per mostrare: al massimo 4 decimali, virgola decimale. Il valore vero resta a piena precisione.
export function formattaValore(v) {
  if (typeof v !== 'number') return String(v);
  const r = Math.round(v * 10000) / 10000;
  return String(Object.is(r, -0) ? 0 : r).replace('.', ',');
}
