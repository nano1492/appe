// Suoni sintetizzati con Web Audio. Nessun file audio. Se l'audio non c'e' o fallisce, resta silenzio.
let audio = null;

// Note: [frequenza Hz, inizio s, durata s]
const SUONI = {
  giusto: { onda: 'triangle', volume: 0.18, note: [[660, 0, 0.1], [880, 0.09, 0.16]] },
  sbagliato: { onda: 'sawtooth', volume: 0.1, note: [[220, 0, 0.14], [165, 0.13, 0.22]] },
  livello: { onda: 'square', volume: 0.1, note: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.3]] },
  medaglia: { onda: 'triangle', volume: 0.18, note: [[784, 0, 0.12], [988, 0.12, 0.12], [1175, 0.24, 0.3]] },
  tocco: { onda: 'sine', volume: 0.12, note: [[520, 0, 0.05]] },
};

// L'AudioContext nasce al primo suono, che parte da un tocco dell'utente (regola di iOS).
function prendiAudio() {
  if (!audio) {
    const Classe = window.AudioContext || window.webkitAudioContext;
    if (!Classe) return null;
    audio = new Classe();
  }
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  return audio;
}

export function suona(tipo, ctx) {
  try {
    if (!ctx || !ctx.stato || !ctx.stato.impostazioni || ctx.stato.impostazioni.suoni !== true) return;
    const def = SUONI[tipo];
    if (!def) return;
    const a = prendiAudio();
    if (!a) return;
    const t0 = a.currentTime + 0.01;
    for (const [freq, inizio, durata] of def.note) {
      const osc = a.createOscillator();
      const guadagno = a.createGain();
      osc.type = def.onda;
      osc.frequency.value = freq;
      guadagno.gain.setValueAtTime(0.0001, t0 + inizio);
      guadagno.gain.exponentialRampToValueAtTime(def.volume, t0 + inizio + 0.01);
      guadagno.gain.exponentialRampToValueAtTime(0.0001, t0 + inizio + durata);
      osc.connect(guadagno);
      guadagno.connect(a.destination);
      osc.start(t0 + inizio);
      osc.stop(t0 + inizio + durata + 0.02);
    }
  } catch (e) {
    // niente audio: va bene cosi'
  }
}
