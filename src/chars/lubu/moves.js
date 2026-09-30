// 呂布's moveset (def-kit moveset: src/chars/defkit.js header) — the 方天畫戟 as a storm: fast, wide, every normal in
// hyper armour, the big blows hurling crimson crescents (proj 'crescent' waves: musou/scripted.js). Data like
// src/hero/moves.js; clips frame-keyed with the shared author (hero/anims/author.js), anchored to the hit windows.
// Blade roll convention: the crescent leads its cut — roll −90 while the weapon's yaw grows (a right → left cut, a
// counter-clockwise spin), +90 while it shrinks, 180 on a downward chop, 0 (crescent up) on thrusts and rising cuts.
//   N1 fast cut right → left · N2 stepping backhand left → right · N3 rising diagonal (launch) · N4 hop and a full
//   spin in the air · N5 two turns on the ground · N6 leaping crush, the ground breaks, one crescent flies
//   C1 天下無雙 (neutral): the halberd raised one-handed over his head, then a 540° sweep throwing a fan of five
//   C2 (N1→) hopping uppercut launcher · C3 (N2→) piercing thrust that carries him 5 m through the line, a crescent
//   C4 (N3→) tornado: four turns carried forward, a last heavy turn · C5 (N4→) leaping impale: the point driven into
//   the ground, a ring of eight · C6 (N5→) 赤月狂瀾, the crimson crescent storm: the halberd whirled over his head three
//   turns, a ring of crescents off every turn (6, 7, 8), then brought down in a huge cross cut that looses a fan of five
//   great ones
//   dash: halberd trailing, rushing through, a spinning cut + crescent · jump: cross cut · reverse cut · air spin (ring
//   of four) · jump charge: raised through the hang, a plunge, impaled landing, a ring of six
// Musou 天下無雙・神鬼亂舞 (musou/scripted.js): three zig-zag charges, a crescent off each — CONTACT: a wide cut and a fan
// of three — tornado, the crescent storm, a leap — FINISHER: impaled, twelve crimson crescents in a ring.
import { locoClips } from '../loco.js';

const ONCE = 99;
export const airChainMax = 6;
const CR = (p, h = {}) => ({ f: [p.f, p.f], every: ONCE, dmg: 22, kb: 'blow', force: 11, lift: 5, hitstop: 0, ...h,
  proj: { speed: 22, life: 26, r: 2.0, kind: 'crescent', ...p, f: undefined } });

export function moves() {
  return {
    n1: { frames: 30, next: 'n2', charge: 'c2', cancel: 19, branch: 11, dodgeCancel: 11, steer: 5, lunge: [[2, 9, 0.6]], armor: true,
      hits: [{ f: [8, 11], sweep: 1, shape: 'arc', range: 3.8, ang: 170, dir: 15, dmg: 19, kb: 'flinch', force: 4, hitstop: 4 }] },
    n2: { frames: 30, next: 'n3', charge: 'c3', cancel: 20, branch: 12, dodgeCancel: 12, steer: 4, lunge: [[1, 9, 1.0]], armor: true,
      hits: [{ f: [8, 11], sweep: -1, shape: 'arc', range: 3.8, ang: 170, dir: -15, dmg: 19, kb: 'flinch', force: 4, hitstop: 4 }] },
    n3: { frames: 34, next: 'n4', charge: 'c4', cancel: 23, branch: 14, dodgeCancel: 14, steer: 5, lunge: [[4, 12, 0.6]], armor: true,
      hits: [{ f: [9, 12], every: ONCE, shape: 'arc', range: 3.7, ang: 150, dmg: 21, kb: 'launch', force: 3, lift: 8, hitstop: 5 }] },
    n4: { frames: 40, next: 'n5', charge: 'c5', cancel: 29, branch: 24, dodgeCancel: 24, steer: 5, lunge: [[4, 20, 1.6]], armor: true,
      hits: [{ f: [12, 22], sweep: 1, sweepN: 10, shape: 'circle', range: 3.9, dmg: 19, kb: 'push', force: 7, hitstop: 4, yMax: 4 }] },
    n5: { frames: 46, next: 'n6', charge: 'c6', cancel: 34, branch: 30, dodgeCancel: 30, steer: 5, lunge: [[6, 30, 1.4]], armor: true,
      hits: [{ f: [10, 30], every: 6, shape: 'circle', range: 4.0, dmg: 12, kb: 'spin', force: 5, lift: 2, hitstop: 2 }] },
    n6: { frames: 56, next: 'n1', charge: 'c1', cancel: 46, dodgeCancel: 28, steer: 6, lunge: [[4, 19, 2.2]], armor: true,
      hits: [{ f: [20, 22], every: ONCE, shape: 'circle', range: 4.2, dmg: 36, kb: 'blow', force: 15, lift: 6, hitstop: 8, heavy: true, rocks: 8 },
        CR({ f: 20, r: 2.4, life: 28 }, { dmg: 24 })] },

    c1: { frames: 88, cancel: 80, dodgeCancel: 58, steer: 14, lunge: [[30, 48, 1.0]], armor: true,
      hits: [{ f: [30, 46], sweep: -1, sweepN: 16, shape: 'circle', range: 4.8, dmg: 28, kb: 'blow', force: 13, lift: 5, hitstop: 7, heavy: true },
        CR({ f: 40, count: 5, spread: 120, r: 2.3, life: 32 }, { dmg: 24 })] },
    c2: { frames: 58, cancel: 50, dodgeCancel: 30, steer: 10, lunge: [[10, 18, 0.9]], armor: true,
      hits: [{ f: [17, 20], every: ONCE, shape: 'arc', range: 3.9, ang: 150, dmg: 24, kb: 'launch', force: 2, lift: 12, hitstop: 6, heavy: true }] },
    c3: { frames: 72, cancel: 64, dodgeCancel: 42, steer: 12, lunge: [[16, 30, 5.4, 'lin'], [30, 34, 0.4]], armor: true,
      hits: [{ f: [16, 30], every: 3, shape: 'line', len: 2.8, width: 2.6, dmg: 12, kb: 'blow', force: 9, lift: 3, hitstop: 1 },
        { f: [31, 33], every: ONCE, shape: 'line', len: 4.6, width: 2.2, dmg: 26, kb: 'blow', force: 14, lift: 5, hitstop: 7, heavy: true },
        CR({ f: 31, r: 2.3, speed: 24 })] },
    c4: { frames: 92, cancel: 84, dodgeCancel: 76, steer: 10, lunge: [[16, 64, 2.0]], armor: true,
      hits: [{ f: [16, 64], every: 6, shape: 'circle', range: 4.3, dmg: 11, kb: 'spin', force: 6, lift: 3, hitstop: 2 },
        { f: [68, 70], every: ONCE, shape: 'circle', range: 4.8, dmg: 28, kb: 'blow', force: 14, lift: 6, hitstop: 8, heavy: true }] },
    c5: { frames: 96, cancel: 88, dodgeCancel: 60, steer: 10, lunge: [[12, 34, 1.8]], armor: true, leap: [14, 12], plunge: [30, -30], landFrame: 36,
      hits: [{ f: [36, 39], every: ONCE, shape: 'circle', range: 5.2, dmg: 32, kb: 'launch', force: 5, lift: 10, hitstop: 8, heavy: true, yMax: 4.5, rocks: 14 },
        CR({ f: 36, count: 8, spread: 360, speed: 17, life: 22, r: 1.8 }, { dmg: 18 })] },
    c6: { frames: 110, cancel: 100, dodgeCancel: 84, steer: 12, lunge: [[4, 16, 0.5], [74, 82, 1.4]], armor: true,
      hits: [{ f: [20, 62], every: 6, shape: 'circle', range: 4.2, dmg: 10, kb: 'spin', force: 5, lift: 3, hitstop: 2 },
        CR({ f: 26, count: 6, spread: 360, speed: 18, life: 24 }, { dmg: 16, force: 9, lift: 4 }),
        CR({ f: 40, count: 7, spread: 360, speed: 18, life: 24 }, { dmg: 16, force: 9, lift: 4 }),
        CR({ f: 54, count: 8, spread: 360, speed: 18, life: 24 }, { dmg: 16, force: 9, lift: 4 }),
        { f: [80, 82], every: ONCE, shape: 'arc', range: 4.6, ang: 150, dmg: 34, kb: 'blow', force: 16, lift: 7, hitstop: 8, heavy: true },
        CR({ f: 80, count: 5, spread: 70, r: 3.0, speed: 26, life: 34 }, { dmg: 28, force: 14, lift: 6 })] },

    dash: { frames: 80, cancel: 72, dodgeCancel: 50, steer: 3, lunge: [[0, 40, 6.2, 'lin'], [40, 52, 1.6]],
      hits: [{ f: [6, 38], every: 10, shape: 'line', len: 2.6, width: 2.6, dmg: 10, kb: 'push', force: 7, hitstop: 2 },
        { f: [44, 52], sweep: 1, sweepN: 8, shape: 'circle', range: 4.2, dmg: 24, kb: 'blow', force: 12, lift: 4, hitstop: 5, heavy: true },
        CR({ f: 48 }, { dmg: 20 })] },
    jatk: { frames: 24, air: true, hover: 2.6, next: 'ja2', charge: 'jc', cancel: 12, dodgeCancel: 99, steer: 3,
      hits: [{ f: [5, 9], every: ONCE, shape: 'arc', range: 4, ang: 220, dmg: 15, kb: 'flinch', force: 3, hitstop: 3, yMax: 4.5 }] },
    ja2: { frames: 24, air: true, hover: 2.6, next: 'ja3', charge: 'jc', cancel: 12, dodgeCancel: 99, steer: 3,
      hits: [{ f: [5, 9], every: ONCE, shape: 'arc', range: 4, ang: 220, dmg: 15, kb: 'flinch', force: 3, hitstop: 3, yMax: 4.5 }] },
    ja3: { frames: 30, air: true, hover: 2.2, next: 'jatk', charge: 'jc', cancel: 18, dodgeCancel: 99, steer: 3,
      hits: [{ f: [6, 16], sweep: 1, sweepN: 10, shape: 'circle', range: 4.2, dmg: 20, kb: 'blow', force: 11, lift: 4, hitstop: 4, yMax: 5 },
        CR({ f: 12, count: 4, spread: 360, speed: 18, life: 16, r: 1.5 }, { dmg: 14, force: 8, lift: 3 })] },
    // (jc: his own hang / landing timing — anims/locomotion.js reads the kit's jc for the squash and glow)
    jc: { frames: 58, air: true, hover: 3, landFrame: 37, hang: [6, 33], plunge: [33, -82], cancel: 52, dodgeCancel: 42, steer: 12, armor: true,
      hits: [{ f: [37, 40], every: ONCE, shape: 'circle', range: 5.2, dmg: 28, kb: 'launch', force: 6, lift: 9, hitstop: 8, heavy: true, rocks: 10 },
        CR({ f: 37, count: 6, spread: 360, speed: 15, life: 18, r: 1.6 }, { dmg: 16 })] },
  };
}

export const entry = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4', c6: 'n5', ja2: 'jatk', ja3: 'ja2' };
// run: the halberd trailing low behind him in the right hand, the crescent out; the left arm pumps free
export const carry = { run: { spear: [-0.3, 0.98, -0.22, 192, 8, 90], gripR: 0, gripL: 0.5, lfree: 1, armL: [16, 0, 26, 50] } };

// ---------------------------------------------------------------- poses (P specs)
const G = { hips: [0, 0.84, 0], hipsR: [4, -30, 0], spine: [6, -6, 0], chest: [2, -4, 0], head: [2, 10, 0], spear: [-0.26, 1.0, 0.02, 24, 14, 0], gripR: 0, gripL: 0.55 };
const TW = (hy, lean = 8, h = 0.8) => ({ hips: [0, h, 0.06], hipsR: [lean, hy, 0], spine: [lean, hy * 0.3, 0], chest: [lean * 0.6, hy * 0.45, 0], head: [0, -hy * 0.35, 0], gripL: 0.5 });
const UP = { hips: [0, 0.96, 0], hipsR: [-8, -12, 0], spine: [-8, 0, 0], chest: [-14, 0, 0], head: [-8, 0, 0], gripL: 0.5 };
const CRUSH = { hips: [0, 0.6, 0.28], hipsR: [26, -10, 0], spine: [18, 0, 0], chest: [14, 0, 0], head: [10, 0, 0], gripL: 0.5 };
const SIDE = { hips: [0, 0.76, 0.04], hipsR: [6, 10, 0], spine: [6, 8, 0], chest: [2, 10, 0], head: [0, 0, 0], gripL: 0.36 };
const CHAMB = { hips: [0, 0.78, -0.06], hipsR: [8, -62, 0], spine: [6, -14, 0], chest: [2, -22, 0], head: [0, 14, 0], spear: [-0.22, 1.1, -0.38, 0, 2, 0], gripL: 0.42 };
const JAB = (z, extra) => ({ hips: [0, 0.76, 0.26], hipsR: [8, -74, 0], spine: [8, -8, 0], chest: [4, -6, 0], head: [0, 12, 0], spear: [-0.06, 1.12, z, 0, -2, 0], gripL: 0.28, ...extra });
// the halberd raised high in the right hand alone, the left arm flung out: 天下無雙
const HIGH = { hips: [0, 0.92, 0], hipsR: [-6, -30, 0], spine: [-6, -8, 0], chest: [-10, -12, 0], head: [-12, 6, 0],
  spear: [-0.36, 1.6, 0.1, 0, 88, 90], gripR: 0, gripL: 0.4, lfree: 1, armL: [-10, 0, 72, 24] };
const AIRF = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };   // air string legs
// whirling over his head (C6): the halberd flat above the crown in the right hand, the left arm up and out
const WHIRL = (a) => ({ hips: [0, 0.84, 0.04], hipsR: [-4, 0, 0], spine: [-6, 0, 0], chest: [-10, 0, 0], head: [-10, 0, 0],
  spear: [-0.04, 1.96, 0.02, a, 6, -90], gripR: 0, gripL: 0.2, lfree: 1, armL: [-150, 0, -12, 24] });

export function clips(A, M) {
  const { clipF, lungeAt: lz, body, ft, hit } = A;
  const wide = (id, f, fwd = 0) => ({ fL: [0.33, 0.08, lz(id, f) + 0.4 + fwd, 0, 22], fR: [-0.33, 0.08, lz(id, f) - 0.3, 0, -48] });
  const step = (id, f, dz = 0) => ({ fL: [0.2, 0.08, lz(id, f) + 0.72 + dz, 0, 10], fR: [-0.26, 0.08, lz(id, f) - 0.42, 0, -60] });
  const spinFeet = (id, from, to, sp, every = 4) => {
    const k = [];
    for (let f = from, i = 0; f <= to; f += every, i++) k.push(ft(f, i % 2 ? body(id, f, sp(f), [0.26, 0.08, 0.3, 0, 15]) : null, i % 2 ? null : body(id, f, sp(f), [-0.28, 0.08, -0.24, 0, -35])));
    return k;
  };
  const endSpin = (id, F, deg) => ft(F, [0.17, 0.08, 0.3 + lz(id, F), 0, 15 + deg], [-0.2, 0.08, -0.26 + lz(id, F), 0, -30 + deg]);
  const ramp = (s, e, deg) => (f) => deg * Math.min(1, Math.max(0, (f - s) / (e - s)));
  const out = {};

  // N1 fast cut right → left, blade at the hip, crescent leading
  { const [s, e] = hit('n1'), F = M.n1.frames, c = M.n1.cancel;
    out.n1 = clipF('n1', [[0, G],
      [s - 4, { ...TW(-58, 6), spear: [-0.34, 1.16, -0.04, -125, 8, -90], ...wide('n1', s - 4) }, 'out'],
      [s, { ...TW(-14, 8, 0.78), spear: [-0.2, 1.1, 0.3, -35, 0, -90] }, 'lin'],
      [s + 2, { ...TW(24, 8, 0.78), spear: [0.0, 1.1, 0.32, 40, 0, -90] }, 'lin'],
      [e + 2, { ...TW(58, 5, 0.8), spear: [0.14, 1.14, 0.18, 118, 4, -90] }, 'out'],
      [c, { ...TW(52, 5, 0.82), spear: [0.12, 1.14, 0.18, 112, 6, -90] }, 'io'], [F, G]]); }
  // N2 backhand left → right, stepping in
  { const [s, e] = hit('n2'), F = M.n2.frames, c = M.n2.cancel;
    out.n2 = clipF('n2', [[0, G],
      [s - 4, { ...TW(58, 6), spear: [0.14, 1.16, 0.1, 125, 6, 90] }, 'out'],
      [s, { ...TW(16, 8, 0.76), spear: [0.0, 1.1, 0.32, 30, 0, 90], ...wide('n2', s, 0.1) }, 'lin'],
      [s + 2, { ...TW(-24, 8, 0.76), spear: [-0.2, 1.1, 0.3, -45, 0, 90] }, 'lin'],
      [e + 2, { ...TW(-62, 6, 0.8), spear: [-0.34, 1.14, 0.02, -128, 4, 90] }, 'out'],
      [c, { ...TW(-56, 6, 0.82), spear: [-0.32, 1.14, 0.04, -122, 6, 90] }, 'io'], [F, G]]); }
  // N3 rising diagonal: low left → high right, the body lifting with it
  { const [s, e] = hit('n3'), F = M.n3.frames, c = M.n3.cancel;
    out.n3 = clipF('n3', [[0, G],
      [s - 5, { ...TW(42, 14, 0.72), spear: [0.06, 0.8, 0.1, 72, -42, 45], ...wide('n3', s - 5) }, 'out'],
      [s, { ...TW(0, 4, 0.82), spear: [-0.1, 1.12, 0.34, 0, 12, 45] }, 'in'],
      [e + 2, { ...TW(-42, -10, 0.92), spear: [-0.3, 1.52, 0.16, -62, 62, 45] }, 'out'],
      [c, { ...TW(-38, -8, 0.9), spear: [-0.3, 1.48, 0.14, -58, 58, 45] }, 'io'], [F, G]]); }
  // N4 hop and a full counter-clockwise turn in the air, the halberd held out to his right
  { const [s, e] = hit('n4'), F = M.n4.frames, c = M.n4.cancel, sp = ramp(s, e, 360), up = (f) => Math.sin(Math.PI * Math.min(1, Math.max(0, (f - s) / (e - s))));
    const air = (f, y) => ({ fL: [0.18, y, lz('n4', f) + 0.2, -30, 15 + sp(f)], fR: [-0.18, y - 0.1, lz('n4', f) - 0.12, -20, -30 + sp(f)] });
    const keys = [[0, G], [s - 5, { ...TW(-42, 8, 0.72), spear: [-0.3, 1.1, 0.1, -110, 4, -90], ...wide('n4', s - 5) }, 'out']];
    for (let f = s; f <= e; f += 2) keys.push([f, { ...SIDE, hipsR: [6, -10, 0], chest: [2, -10, 0], hips: [0, 0.8 + 0.42 * up(f), 0.06], spin: sp(f), spear: [-0.3, 1.06, 0.28, -90, -6, -90], ...air(f, 0.3 + 0.42 * up(f)) }, 'lin']);
    keys.push([e + 3, { ...SIDE, hipsR: [6, -10, 0], hips: [0, 0.7, 0.06], spin: 360, spear: [-0.3, 1.08, 0.26, -92, -2, -90], ...wide('n4', e + 3) }, 'in'],
      [c, { ...SIDE, hipsR: [6, -10, 0], spin: 360, spear: [-0.3, 1.1, 0.24, -92, 0, -90] }, 'io'], [F, { ...G, spin: 360 }], endSpin('n4', F, 360));
    out.n4 = clipF('n4', keys); }
  // N5 two turns on the ground, the halberd out wide and low
  { const [s, e] = hit('n5'), F = M.n5.frames, c = M.n5.cancel, sp = ramp(s, e, 720);
    const keys = [[0, G], [s - 5, { ...TW(-42, 6, 0.76), spear: [-0.32, 1.08, 0.08, -100, 0, -90] }, 'out']];
    for (let f = s; f <= e; f += 2) keys.push([f, { ...SIDE, hipsR: [6, -10, 0], chest: [2, -10, 0], spin: sp(f), spear: [-0.3, 1.02, 0.26, -90, -6, -90] }, 'lin']);
    keys.push([c, { ...SIDE, hipsR: [6, -10, 0], spin: 720, spear: [-0.3, 1.06, 0.22, -88, 0, -90] }, 'io'], [F, { ...G, spin: 720 }],
      ...spinFeet('n5', s + 2, e, sp, 3), endSpin('n5', F, 720));
    out.n5 = clipF('n5', keys); }
  // N6 leaping crush: crouch, up with the halberd back over his head, down onto the point of impact
  { const [s] = hit('n6'), F = M.n6.frames, c = M.n6.cancel;
    out.n6 = clipF('n6', [[0, G],
      [7, { hips: [0, 0.68, 0], hipsR: [16, -20, 0], spine: [12, 0, 0], chest: [6, -6, 0], head: [0, 6, 0], spear: [-0.3, 1.0, -0.2, -10, 30, 180], gripL: 0.5, ...wide('n6', 7) }, 'out'],
      [13, { ...UP, hips: [0, 1.42, 0.3], spear: [-0.16, 2.0, 0, 0, 142, 180], fL: [0.2, 0.56, lz('n6', 13) + 0.3, -30, 15], fR: [-0.2, 0.5, lz('n6', 13) - 0.1, -20, -30] }, 'out'],
      [17, { ...UP, hips: [0, 1.16, 0.4], spear: [-0.16, 1.88, 0, 0, 156, 180], fL: [0.24, 0.3, lz('n6', 17) + 0.4, -20, 15], fR: [-0.24, 0.25, lz('n6', 17) - 0.2, -10, -30] }, 'io'],
      [s, { ...CRUSH, hips: [0, 0.56, 0.3], spear: [-0.1, 0.9, 0.55, 0, -46, 180], ...wide('n6', s) }, 'snap'],
      [c, { ...CRUSH, hips: [0, 0.62, 0.28], spear: [-0.1, 0.92, 0.55, 0, -42, 180] }, 'io'], [F, G]]); }

  // C1 天下無雙: the halberd raised high one-handed (the taunt), wound back, then a 540° clockwise sweep
  { const [s, e] = hit('c1'), F = M.c1.frames, c = M.c1.cancel, sp = ramp(s, e, -540);
    const keys = [[0, G], [12, HIGH, 'out'], [22, { ...HIGH, chest: [-14, -14, 0], head: [-16, 8, 0], spear: [-0.38, 1.66, 0.1, 0, 92, 90] }, 'io'],
      [s - 3, { ...TW(48, 10, 0.72), spear: [0.12, 1.12, 0.14, 122, 4, 90], ...wide('c1', s - 3) }, 'in']];
    for (let f = s; f <= e; f += 2) keys.push([f, { ...SIDE, hips: [0, 0.72, 0.04], spin: sp(f), spear: [0.06, 1.04, 0.3, 90, -6, 90] }, 'lin']);
    keys.push([e + 4, { ...SIDE, hips: [0, 0.7, 0.04], spin: -560, spear: [0.1, 1.08, 0.26, 100, 0, 90] }, 'out'],
      [c, { ...SIDE, spin: -540, spear: [0.1, 1.1, 0.24, 96, 2, 90] }, 'io'], [F, { ...G, spin: -540 }],
      ...spinFeet('c1', s + 2, e, sp, 4), endSpin('c1', F, -540));
    out.c1 = clipF('c1', keys); }
  // C2 hopping uppercut: sunk low, the blade trailing behind on his right, then everything thrown upward
  { const [s] = hit('c2'), F = M.c2.frames, c = M.c2.cancel;
    out.c2 = clipF('c2', [[0, G],
      [s - 7, { hips: [0, 0.64, 0.1], hipsR: [22, -32, 0], spine: [14, -10, 0], chest: [8, -12, 0], head: [0, 10, 0], spear: [-0.3, 0.68, 0.18, -20, -48, 0], gripL: 0.5, ...wide('c2', s - 7) }, 'out'],
      [s + 1, { hips: [0, 1.12, 0.22], hipsR: [-10, 10, 0], spine: [-8, 4, 0], chest: [-14, 10, 0], head: [-12, 0, 0], spear: [-0.12, 1.5, 0.36, 5, 76, 0], gripL: 0.5,
        fL: [0.22, 0.3, lz('c2', s + 1) + 0.3, -20, 15], fR: [-0.22, 0.26, lz('c2', s + 1) - 0.1, -10, -30] }, 'snap'],
      [s + 8, { ...UP, hips: [0, 0.94, 0.2], spear: [-0.1, 1.8, 0.1, 0, 112, 0], ...wide('c2', s + 8) }, 'out'],
      [c, { ...UP, spear: [-0.12, 1.7, 0.04, 0, 116, 0] }, 'io'], [F, G]]); }
  // C3 piercing thrust: chambered deep, then driven through the line at a run, one last lunge
  { const [s, e] = hit('c3', 0), [s2] = hit('c3', 1), F = M.c3.frames, c = M.c3.cancel;
    out.c3 = clipF('c3', [[0, G],
      [s - 6, { ...CHAMB, ...wide('c3', s - 6) }, 'out'],
      [s - 1, { ...CHAMB, hips: [0, 0.74, -0.1], chest: [4, -30, 0] }, 'io'],
      [s + 2, { ...JAB(0.66, { hips: [0, 0.74, 0.32], spine: [14, -8, 0] }), fL: [0.2, 0.3, lz('c3', s + 2) + 0.6, -20, 10], fR: [-0.26, 0.26, lz('c3', s + 2) - 0.4, 20, -60] }, 'snap'],
      [e, { ...JAB(0.7, { hips: [0, 0.72, 0.32], spine: [14, -8, 0] }), fL: [0.2, 0.08, lz('c3', e) + 0.7, 0, 10], fR: [-0.26, 0.08, lz('c3', e) - 0.42, 0, -60] }, 'lin'],
      [s2 + 1, { ...JAB(0.8, { hips: [0, 0.7, 0.38], spine: [16, -6, 0] }), ...step('c3', s2 + 1, 0.1) }, 'snap'],
      [c, JAB(0.66, { hips: [0, 0.78, 0.28] }), 'io'], [F, G]]); }
  // C4 tornado: raised high, then four counter-clockwise turns carried forward, a last low turn
  { const [s, e] = hit('c4', 0), [s2] = hit('c4', 1), F = M.c4.frames, c = M.c4.cancel, sp = ramp(s, e, 1440);
    const keys = [[0, G], [s - 6, { ...HIGH, spear: [-0.36, 1.7, 0.1, 0, 100, 90] }, 'out']];
    for (let f = s; f <= e; f += 3) keys.push([f, { ...SIDE, hipsR: [6, -10, 0], chest: [2, -10, 0], hips: [0, 0.78, 0.04], spin: sp(f), spear: [-0.3, 1.2, 0.3, -90, 10, -90] }, 'lin']);
    keys.push([s2, { ...SIDE, hipsR: [8, -10, 0], hips: [0, 0.66, 0.04], spin: 1500, spear: [-0.3, 1.0, 0.3, -92, -8, -90], ...wide('c4', s2) }, 'snap'],
      [c, { ...SIDE, hipsR: [6, -10, 0], spin: 1440, spear: [-0.3, 1.04, 0.26, -92, -2, -90] }, 'io'], [F, { ...G, spin: 1440 }],
      ...spinFeet('c4', s + 2, e, sp, 4), endSpin('c4', F, 1440));
    out.c4 = clipF('c4', keys); }
  // C5 leaping impale: crouch, up with the halberd back over his head, the point driven down into the ground
  { const [s] = hit('c5'), F = M.c5.frames, c = M.c5.cancel, L = M.c5.landFrame;
    const air = (f, y = 0.55) => ({ fL: [0.18, y, lz('c5', f) + 0.25, -30, 15], fR: [-0.18, y - 0.1, lz('c5', f) - 0.1, -20, -30] });
    const IMP = { ...CRUSH, hips: [0, 0.56, 0.26], spear: [-0.08, 1.14, 0.46, 0, -76, 180], gripL: 0.42 };
    out.c5 = clipF('c5', [[0, G],
      [10, { hips: [0, 0.64, 0], hipsR: [14, -10, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [0, 6, 0], spear: [-0.28, 1.0, -0.15, 0, 40, 180], gripL: 0.5, ...wide('c5', 10) }, 'out'],
      [16, { ...UP, hips: [0, 1.0, 0.1], spear: [-0.16, 1.8, 0, 0, 150, 180], ...air(16) }, 'out'],
      [L - 4, { ...UP, hips: [0, 1.0, 0.1], spear: [-0.12, 1.94, 0.1, 0, 172, 180], ...air(L - 4) }, 'io'],
      [L - 1, { ...CRUSH, hips: [0, 0.96, 0.2], spear: [-0.1, 1.5, 0.4, 0, -50, 180], ...air(L - 1, 0.4) }, 'in'],
      [s, { ...IMP, ...wide('c5', s) }, 'snap'],
      [c, { ...IMP, hips: [0, 0.62, 0.24] }, 'io'], [F, G]]); }
  // C6 赤月狂瀾: halberd hoisted and whirled flat over his head (three turns, a ring of crescents off each), then pulled
  // down high right → low left into the great cross cut
  { const [w0, w1] = hit('c6', 0), [x] = hit('c6', 4), F = M.c6.frames, c = M.c6.cancel;
    const keys = [[0, G],
      [10, { ...TW(-36, 4, 0.82), spear: [-0.3, 1.4, 0.0, -60, 40, -90], ...wide('c6', 10) }, 'out'],
      [w0 - 4, { ...WHIRL(-40) }, 'out']];
    for (let f = w0; f <= w1; f += 2) keys.push([f, WHIRL(-40 + (f - w0) * 1080 / (w1 - w0)), 'lin']);
    keys.push([x - 10, { ...UP, hips: [0, 0.98, 0.04], hipsR: [-8, -40, 0], chest: [-16, -20, 0], spear: [-0.34, 1.9, -0.06, -40 + 1080, 128, 180], gripL: 0.46 }, 'out'],
      [x - 3, { ...UP, hips: [0, 1.0, 0.1], hipsR: [-10, -46, 0], chest: [-18, -24, 0], spear: [-0.3, 1.96, 0.0, -34 + 1080, 150, 180], gripL: 0.46 }, 'io'],
      [x, { ...CRUSH, hipsR: [26, 20, 0], chest: [14, 16, 0], spear: [0.06, 1.0, 0.44, 30 + 1080, -30, 180], ...wide('c6', x, 0.1) }, 'snap'],
      [x + 3, { ...CRUSH, hipsR: [26, 34, 0], chest: [14, 24, 0], spear: [0.16, 0.9, 0.3, 64 + 1080, -40, 180] }, 'out'],
      [c, { ...CRUSH, hips: [0, 0.66, 0.24], hipsR: [20, 30, 0], spear: [0.14, 0.92, 0.3, 60 + 1080, -36, 180] }, 'io'],
      [F, { ...G, spear: [-0.26, 1.0, 0.02, 24 + 1080, 14, 0] }]);
    out.c6 = clipF('c6', keys); }

  // dash: the halberd trailing at a run, then a spinning cut
  { const [s2, e2] = hit('dash', 1), F = M.dash.frames, c = M.dash.cancel, sp = ramp(s2, e2, 360);
    const run = { hips: [0, 0.8, 0.14], hipsR: [18, -30, 0], spine: [10, -8, 0], chest: [8, -10, 0], head: [0, 10, 0], spear: [-0.32, 0.96, -0.26, 192, 6, 90], gripL: 0.5, lfree: 1, armL: [30, 0, 30, 60] };
    const keys = [[0, G], [4, run, 'out'], [38, { ...run, hips: [0, 0.78, 0.16] }]];
    for (let f = 5, j = 0; f < 40; f += 5, j ^= 1) {
      const z = lz('dash', f) + 0.3;
      keys.push(ft(f - 2.5, j ? null : [0.14, 0.3, z - 0.3, -20, 5], j ? [-0.14, 0.3, z - 0.3, -20, -5] : null), ft(f, j ? null : [0.14, 0.08, z, 0, 5], j ? [-0.14, 0.08, z, 0, -5] : null));
    }
    keys.push([s2 - 2, { ...TW(-46, 10, 0.74), spear: [-0.32, 1.1, 0.12, -120, 2, -90] }, 'in']);
    for (let f = s2; f <= e2; f += 2) keys.push([f, { ...SIDE, hipsR: [6, -10, 0], chest: [2, -10, 0], spin: sp(f), spear: [-0.3, 1.04, 0.3, -90, -6, -90] }, 'lin']);
    keys.push([c, { ...SIDE, hipsR: [6, -10, 0], spin: 360, spear: [-0.3, 1.1, 0.24, -96, 2, -90] }, 'io'], [F, { ...G, spin: 360 }], ...spinFeet('dash', s2 + 2, e2, sp, 3), endSpin('dash', F, 360));
    out.dash = clipF('dash', keys); }
  // air string: cross cut right → left · reverse cut · a full turn (a ring of four)
  { const [s, e] = hit('jatk'), F = M.jatk.frames;
    out.jatk = clipF('jatk', [
      [0, { hips: [0, 0.95, 0], ...AIRF, spear: [-0.2, 1.2, -0.1, -30, 30, -90] }],
      [s - 2, { hips: [0, 0.98, 0], hipsR: [-4, -45, 0], chest: [-8, -20, 0], ...AIRF, spear: [-0.3, 1.5, -0.05, -70, 50, -90], gripL: 0.5 }, 'out'],
      [e, { hips: [0, 0.95, 0.06], hipsR: [12, 30, 0], chest: [14, 20, 0], ...AIRF, spear: [0.08, 1.0, 0.3, 60, -40, -90], gripL: 0.5 }, 'in'],
      [F, { hips: [0, 0.95, 0.04], hipsR: [6, 10, 0], ...AIRF, spear: [0, 1.04, 0.26, 40, -24, -90], gripL: 0.5 }]]); }
  { const [s, e] = hit('ja2'), F = M.ja2.frames;
    out.ja2 = clipF('ja2', [
      [0, { hips: [0, 0.95, 0.04], hipsR: [6, 10, 0], ...AIRF, spear: [0, 1.04, 0.26, 40, -24, 90], gripL: 0.5 }],
      [s - 2, { hips: [0, 0.98, 0], hipsR: [-4, 45, 0], chest: [-8, 20, 0], ...AIRF, spear: [0.1, 1.5, -0.05, 70, 50, 90], gripL: 0.5 }, 'out'],
      [e, { hips: [0, 0.95, 0.06], hipsR: [12, -30, 0], chest: [14, -20, 0], ...AIRF, spear: [-0.3, 1.0, 0.3, -60, -40, 90], gripL: 0.5 }, 'in'],
      [F, { hips: [0, 0.95, 0.04], hipsR: [6, -10, 0], ...AIRF, spear: [-0.2, 1.04, 0.26, -40, -24, 90], gripL: 0.5 }]]); }
  { const [s, e] = hit('ja3'), F = M.ja3.frames, sp = ramp(s, e, 360);
    const k = [[0, { hips: [0, 0.95, 0.04], hipsR: [6, -10, 0], ...AIRF, spear: [-0.2, 1.04, 0.26, -40, -24, -90], gripL: 0.5 }],
      [s - 2, { ...TW(-46, 6, 0.96), ...AIRF, spear: [-0.32, 1.1, 0.12, -120, 2, -90] }, 'out']];
    for (let f = s; f <= e; f += 2) k.push([f, { ...SIDE, hipsR: [6, -10, 0], chest: [2, -10, 0], hips: [0, 0.96, 0.04], spin: sp(f), ...AIRF, spear: [-0.3, 1.04, 0.3, -90, -6, -90] }, 'lin']);
    k.push([F, { ...SIDE, hipsR: [6, -10, 0], hips: [0, 0.96, 0.04], spin: 360, ...AIRF, spear: [-0.3, 1.08, 0.26, -96, 0, -90] }]);
    out.ja3 = clipF('ja3', k); }
  // jump charge: raised back over his head through the hang, the plunge, impaled on landing
  { const L = M.jc.landFrame, F = M.jc.frames, D = M.jc.plunge[0], c = M.jc.cancel;
    const air = (y) => ({ fL: [0.16, y, 0.14, -30, 10], fR: [-0.18, y - 0.08, -0.12, 20, -20] });
    const land = { ...CRUSH, hips: [0, 0.56, 0.24], spear: [-0.08, 1.14, 0.46, 0, -76, 180], gripL: 0.42, fL: [0.32, 0.08, 0.4, 0, 22], fR: [-0.32, 0.08, -0.3, 0, -48] };
    out.jc = clipF('jc', [
      [0, { hips: [0, 0.95, 0], ...air(0.36), spear: [-0.2, 1.2, -0.1, 30, 30, 0] }],
      [5, { ...UP, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.16, 1.8, 0, 0, 150, 180] }, 'out'],
      [D - 1, { ...UP, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.14, 1.9, 0.04, 0, 170, 180] }],
      [L - 1, { ...CRUSH, hips: [0, 0.96, 0.14], ...air(0.4), spear: [-0.1, 1.44, 0.36, 0, -56, 180] }, 'in'],
      [L, land, 'snap'],
      [c, { ...land, hips: [0, 0.64, 0.22] }, 'io'], [F, G]]); }
  // locomotion: at ease — the halberd planted upright at his right, the crescent out, left fist on his hip, chin up
  Object.assign(out, locoClips({
    idle: { hips: [0, 0.9, 0], hipsR: [-2, -18, 0], spine: [-2, -4, 0], chest: [-6, -6, 0], head: [-10, 12, 0],
      footL: [0.21, 0.08, 0.2, 0, 16], footR: [-0.23, 0.08, -0.2, 0, -32], spear: [-0.38, 0.95, 0.12, 0, 88, 90], gripR: 0, gripL: 0.3, lfree: 1, armL: [12, 0, 52, 104] },
    breath: { hips: [0, 0.892, 0], chest: [-4, -6, 0], head: [-12, 12, 0] },
    takeoff: { hips: [0, 0.98, 0], hipsR: [-6, -10, 0], chest: [-6, 5, 0], head: [-6, 0, 0], spear: [-0.32, 1.1, -0.2, 192, 10, 90], gripL: 0.5, lfree: 1, armL: [0, 0, 60, 60] },
    apex: { hips: [0, 0.95, 0], hipsR: [-8, 0, 0], chest: [-12, 0, 0], head: [-8, 0, 0], spear: [-0.16, 1.8, 0, 0, 140, 180], gripL: 0.5 },
    fall: { hips: [0, 0.95, 0], hipsR: [-10, 0, 0], chest: [-8, 0, 0], head: [16, 0, 0], spear: [-0.6, 1.36, 0.05, -115, 8, -90], gripL: 0.3, lfree: 1, armL: [0, 0, 100, 14] },
    land: { ...CRUSH, hips: [0, 0.6, 0.24], spear: [-0.1, 1.0, 0.5, 0, -40, 180], footL: [0.32, 0.08, 0.4, 0, 22], footR: [-0.32, 0.08, -0.3, 0, -48] },
    hurt: { hips: [0, 0.86, -0.12], hipsR: [-16, -30, 6], spine: [-12, 0, 0], chest: [-10, 0, 0], head: [-18, 0, 0], spear: [-0.36, 1.1, -0.1, -20, 70, 90], gripL: 0.3, lfree: 1, armL: [-30, 0, 70, 40] },
  }));
  return out;
}

// ---------------------------------------------------------------- 真・無雙 天下無雙・神鬼亂舞 (musou/scripted.js)
// three zig-zag charges, a crescent off each · CONTACT (132): a wide cut and a fan of three · the tornado · the crescent
// storm whirled overhead (two rings) · a leap — FINISHER (176): the point impaled, twelve crimson crescents in a ring
const MU = (dmg, kb, force, lift, extra) => ({ shape: 'circle', range: 5, dmg, kb, force, lift, hitstop: 0, yMax: 5, ...extra });
const CRES = (dmg, p) => ({ every: ONCE, dmg, kb: 'blow', force: 12, lift: 5, hitstop: 0, proj: { speed: 24, life: 30, r: 2.6, kind: 'crescent', ...p } });
export const musou = {
  act: HIGH,
  act2: { ...HIGH, chest: [-16, -14, 0], head: [-20, 8, 0], armL: [-20, 0, 80, 16] },
  face: { hips: [0, 0.9, 0], hipsR: [0, -24, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [2, -22, 0], spear: [-0.3, 1.2, 0.12, 20, 70, 90], gripL: 0.4, lfree: 1, armL: [-30, 0, 60, 70] },
  ready: CHAMB,
  seq: [[100, 110, 'c3', 0.2, 0.42], [110, 112, 'c3', 0.1, 0.2], [112, 122, 'c3', 0.2, 0.42], [122, 124, 'c3', 0.1, 0.2], [124, 132, 'c3', 0.2, 0.42],
    [132, 136, 'n1', 0.25, 0.5], [136, 148, 'c4', 0.17, 0.7], [148, 164, 'c6', 0.18, 0.56], [164, 176, 'c5', 0.1, 0.37]],
  fin: ['c5', 0.375, 0.95],
  turn: [[100, 38], [111, -76], [123, 76], [132, -38]],
  travel: [[100, 110, 6.5], [112, 122, 6.5], [124, 132, 5.5], [136, 148, 2], [164, 176, 1.6]],
  hits: [[100, MU(12, 'blow', 11, 4, { shape: 'line', len: 3, width: 3.6 }), 0, 2, 131],
    [132, MU(26, 'blow', 13, 5, { shape: 'arc', range: 6.5, ang: 220, heavy: true, hitstop: 3 })],
    [137, MU(12, 'spin', 7, 4, { range: 5.8 }), 0, 3, 147],
    [150, MU(10, 'spin', 6, 3, { range: 5 }), 0, 4, 163]],
  proj: [[104, CRES(24, {})], [116, CRES(24, {})], [127, CRES(24, {})],
    [132, CRES(28, { count: 3, spread: 70, r: 3.0, life: 34 })],
    [152, CRES(18, { count: 7, spread: 360, r: 2.0, speed: 20, life: 24 })], [159, CRES(18, { count: 8, spread: 360, r: 2.0, speed: 20, life: 24 })]],
  fx: [[100, 'crack', 3], [132, 'aura', 5]],
  finFx: [['slam', 13], ['rocks', 12], ['crack', 5]],
  finProj: [CRES(28, { count: 12, spread: 360, speed: 18, life: 36, r: 2.6 })],
};
