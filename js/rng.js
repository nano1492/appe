// Numeri casuali con seme (mulberry32), per rendere i test ripetibili.

export function creaRng(seme) {
  let a = seme >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates su una copia: l'array originale non cambia.
export function mescola(array, rnd = Math.random) {
  const r = array.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// n elementi distinti (meno se l'array è più corto).
export function scegli(array, n, rnd = Math.random) {
  return mescola(array, rnd).slice(0, Math.max(0, n));
}
