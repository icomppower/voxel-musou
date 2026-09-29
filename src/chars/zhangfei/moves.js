// 張飛's moveset (def-kit moveset: src/chars/defkit.js header) — the 丈八蛇矛 in a brawler's hands: short brutal jabs, wild
// swings, shoulder charges and stomps, every blow paid for in hitstop. Data like src/hero/moves.js (+ roar / proj windows);
// clips are frame-keyed with the shared author (hero/anims/author.js), anchored to the hit windows.
//   N1 jab · N2 stepping gut thrust · N3 wild backhand sweep left → right · N4 shoulder charge, spear across the chest
//   N5 two-handed overhead smash · N6 the spear whirled over his head three times, a hop and a stomp that shakes the ground
//   C1 (neutral) 虎嘯: a roar that blasts back everything within 6.5 m, then a rising thrust launcher
//   C2 (N1→) lunging rising thrust · C3 (N2→) thrust flurry, then one huge thrust · C4 (N3→) two-turn spinning sweep
//   C5 (N4→) leap and stomp: rock eruption
//   C6 (N5→) 當陽一喝: the spear whirled up, its butt driven into the ground (the earth splits), then the roar that broke
//        Changban bridge — a blast, and a ring of shock waves rolling out 11 m (proj 'roar')
//   dash: lance charge, spear couched, ramming the line, into a thrust · jump: jab ↓ · wild sweep · overhead smash
//   (3-hit air string) · jump charge: spear raised, plunge, stomp (rocks)
// Musou 燕人咆哮 (musou/scripted.js): roar and shock ring · lance charge into the line (CONTACT) · a storm of thrusts ·
// one huge thrust · he whirls the spear up — FINISHER: the butt slammed into the ground, the earth erupts, a second roar ring.
import { locoClips } from '../loco.js';

const ONCE = 99;
export const airChainMax = 6;           // two full air strings per jump

export function moves() {
  return {
    n1: { frames: 30, next: 'n2', charge: 'c2', cancel: 19, branch: 10, dodgeCancel: 10, steer: 5, lunge: [[2, 9, 0.6]],
      hits: [{ f: [8, 10], every: ONCE, shape: 'line', len: 3.5, width: 1.3, dmg: 15, kb: 'flinch', force: 3.5, hitstop: 4 }] },
    n2: { frames: 32, next: 'n3', charge: 'c3', cancel: 21, branch: 12, dodgeCancel: 12, steer: 4, lunge: [[1, 10, 0.9]],
      hits: [{ f: [9, 11], every: ONCE, shape: 'line', len: 3.7, width: 1.5, dmg: 16, kb: 'flinch', force: 4.5, hitstop: 4 }] },
    n3: { frames: 38, next: 'n4', charge: 'c4', cancel: 26, branch: 18, dodgeCancel: 18, steer: 5, lunge: [[5, 13, 0.5]],
      hits: [{ f: [12, 16], sweep: -1, shape: 'arc', range: 3.4, ang: 200, dir: -20, dmg: 18, kb: 'push', force: 7.5, hitstop: 4 }] },
    n4: { frames: 42, next: 'n5', charge: 'c5', cancel: 30, branch: 21, dodgeCancel: 21, steer: 6, lunge: [[6, 19, 2.0]], armor: true,
      hits: [{ f: [13, 19], every: ONCE, shape: 'arc', range: 2.5, ang: 140, dmg: 19, kb: 'blow', force: 11, lift: 3.5, hitstop: 5 }] },
    n5: { frames: 44, next: 'n6', charge: 'c6', cancel: 32, branch: 22, dodgeCancel: 22, steer: 4, lunge: [[4, 17, 0.8]], armor: true,
      hits: [{ f: [17, 19], every: ONCE, shape: 'arc', range: 3.4, ang: 100, dmg: 23, kb: 'push', force: 7.5, hitstop: 6 }] },
    n6: { frames: 66, next: 'n1', charge: 'c1', cancel: 56, dodgeCancel: 48, steer: 6, lunge: [[10, 34, 0.8]], armor: true,
      hits: [{ f: [14, 34], every: 5, shape: 'circle', range: 3.3, dmg: 8, kb: 'flinch', force: 2, hitstop: 2 },
        { f: [45, 47], every: ONCE, shape: 'circle', range: 4.6, dmg: 28, kb: 'blow', force: 14, lift: 7, hitstop: 8, heavy: true, rocks: 10 }] },

    c1: { frames: 84, cancel: 76, dodgeCancel: 56, steer: 12, lunge: [[40, 48, 0.8]], armor: true,
      hits: [{ f: [20, 20], every: ONCE, shape: 'circle', range: 6.5, dmg: 8, kb: 'push', force: 11, lift: 2, hitstop: 6, heavy: true, roar: true },
        { f: [48, 52], every: ONCE, shape: 'arc', range: 3.8, ang: 150, dmg: 22, kb: 'launch', force: 2, lift: 11, hitstop: 6, heavy: true }] },
    c2: { frames: 60, cancel: 52, dodgeCancel: 30, steer: 10, lunge: [[10, 18, 1.4]], armor: true,
      hits: [{ f: [18, 21], every: ONCE, shape: 'line', len: 4.3, width: 2, dmg: 20, kb: 'launch', force: 3, lift: 11, hitstop: 6, heavy: true }] },
    c3: { frames: 92, cancel: 84, dodgeCancel: 70, steer: 10, lunge: [[12, 52, 1.2], [58, 62, 0.8]], armor: true,
      hits: [{ f: [12, 52], every: 4, shape: 'line', len: 4, width: 1.8, dmg: 5, kb: 'flinch', force: 1.5, hitstop: 1 },
        { f: [62, 64], every: ONCE, shape: 'line', len: 5.2, width: 2.6, dmg: 26, kb: 'blow', force: 14, lift: 5, hitstop: 8, heavy: true }] },
    c4: { frames: 80, cancel: 70, dodgeCancel: 50, steer: 14, lunge: [[20, 44, 1.0]], armor: true,
      hits: [{ f: [20, 44], every: 8, shape: 'circle', range: 4.1, dmg: 12, kb: 'spin', force: 6, lift: 3, hitstop: 3 }] },
    c5: { frames: 100, cancel: 92, dodgeCancel: 60, steer: 10, lunge: [[14, 40, 1.8]], armor: true, leap: [16, 12], plunge: [36, -30], landFrame: 42,
      hits: [{ f: [42, 45], every: ONCE, shape: 'circle', range: 5.4, dmg: 30, kb: 'blow', force: 15, lift: 8, hitstop: 8, heavy: true, yMax: 4.5, rocks: 16 }] },
    c6: { frames: 100, cancel: 90, dodgeCancel: 76, steer: 10, lunge: [[4, 16, 0.6]], armor: true,
      hits: [{ f: [32, 34], every: ONCE, shape: 'circle', range: 4.2, dmg: 18, kb: 'launch', force: 3, lift: 7, hitstop: 7, heavy: true, rocks: 12 },
        { f: [46, 46], every: ONCE, shape: 'circle', range: 7.5, dmg: 16, kb: 'blow', force: 13, lift: 4, hitstop: 8, heavy: true, roar: true },
        { f: [48, 48], every: ONCE, dmg: 20, kb: 'blow', force: 12, lift: 5, hitstop: 3, heavy: true,
          proj: { count: 14, spread: 360, speed: 22, life: 30, r: 2, y: 0.9, kind: 'roar' } }] },

    dash: { frames: 80, cancel: 72, dodgeCancel: 50, steer: 3, lunge: [[0, 42, 6.2, 'lin'], [42, 50, 1.6]],
      hits: [{ f: [4, 40], every: 8, shape: 'arc', range: 2.3, ang: 120, dmg: 10, kb: 'push', force: 8, hitstop: 3 },
        { f: [46, 49], every: ONCE, shape: 'line', len: 4.3, width: 2, dmg: 22, kb: 'blow', force: 12, lift: 4, hitstop: 6, heavy: true }] },
    jatk: { frames: 24, air: true, hover: 2.4, next: 'ja2', charge: 'jc', cancel: 12, dodgeCancel: 99, steer: 3,
      hits: [{ f: [5, 8], every: ONCE, shape: 'arc', range: 3.4, ang: 160, dmg: 13, kb: 'flinch', force: 3, hitstop: 3, yMax: 4.5 }] },
    ja2: { frames: 24, air: true, hover: 2.4, next: 'ja3', charge: 'jc', cancel: 12, dodgeCancel: 99, steer: 3,
      hits: [{ f: [6, 10], sweep: -1, shape: 'arc', range: 3.4, ang: 200, dmg: 14, kb: 'push', force: 6, hitstop: 3, yMax: 4.5 }] },
    ja3: { frames: 30, air: true, hover: 1.4, next: 'jatk', charge: 'jc', cancel: 18, dodgeCancel: 99, steer: 3,
      hits: [{ f: [9, 12], every: ONCE, shape: 'circle', range: 3.4, dmg: 22, kb: 'blow', force: 10, lift: 2, hitstop: 6, yMax: 5 }] },   // (not heavy: no ground quake metres under him)
    // (jc: his own hang / landing timing — anims/locomotion.js reads the kit's jc for the squash and glow)
    jc: { frames: 60, air: true, hover: 3, landFrame: 37, hang: [6, 33], plunge: [33, -82], cancel: 54, dodgeCancel: 42, steer: 12, armor: true,
      hits: [{ f: [37, 40], every: ONCE, shape: 'circle', range: 5, dmg: 26, kb: 'launch', force: 6, lift: 9, hitstop: 8, heavy: true, rocks: 12 }] },
  };
}

export const entry = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4', c6: 'n5', ja2: 'jatk', ja3: 'ja2' };
// run: the spear carried trailing at the hip, blade low behind; left arm pumps free
export const carry = { run: { spear: [-0.24, 1.02, -0.16, 180, 18, 90], gripR: 0.1, gripL: 0.6, lfree: 1, armL: [10, 0, 14, 85] } };

// ---------------------------------------------------------------- poses (P specs; spear roll 90 = the wavy blade edge-on)
const G = { hips: [0, 0.84, 0], hipsR: [4, -34, 0], spine: [6, -4, 0], chest: [2, -2, 0], head: [2, 8, 0], spear: [-0.26, 1.0, 0.04, 22, 20, 90], gripR: 0, gripL: 0.52 };
const CHAMB = { hips: [0, 0.8, -0.04], hipsR: [6, -60, 0], spine: [6, -14, 0], chest: [2, -20, 0], head: [0, 12, 0], spear: [-0.22, 1.08, -0.36, 0, 2, 90], gripL: 0.44 };
const JAB = (z, extra) => ({ hips: [0, 0.78, 0.22], hipsR: [8, -74, 0], spine: [6, -8, 0], chest: [2, -6, 0], head: [0, 10, 0], spear: [-0.08, 1.14, z, 0, 0, 90], gripL: 0.3, ...extra });
const TW = (hy, lean = 8, h = 0.8) => ({ hips: [0, h, 0.06], hipsR: [lean, hy, 0], spine: [lean, hy * 0.3, 0], chest: [lean * 0.6, hy * 0.45, 0], head: [0, -hy * 0.35, 0], gripL: 0.45 });
const UP = { hips: [0, 0.95, 0], hipsR: [-8, -10, 0], spine: [-8, 0, 0], chest: [-14, 0, 0], head: [-6, 0, 0], gripL: 0.5 };
const SMASH = { hips: [0, 0.62, 0.26], hipsR: [28, -12, 0], spine: [18, 0, 0], chest: [14, 0, 0], head: [10, 0, 0], gripL: 0.5 };
const STOMP = { hips: [0, 0.6, 0.1], hipsR: [22, -22, 0], spine: [14, -6, 0], chest: [10, -6, 0], head: [6, 0, 0], gripL: 0.45 };
// the roar: chest thrown out, head back, spear flung out to his right, left fist raised and open
const ROAR = { hips: [0, 0.8, -0.06], hipsR: [-12, -12, 0], spine: [-10, 0, 0], chest: [-20, 0, 0], head: [-30, 0, 0],
  spear: [-0.42, 1.02, 0.08, -45, 58, 90], gripL: 0.3, lfree: 1, armL: [-25, 0, 75, 45] };
const AIRF = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };   // air string legs

export function clips(A, M) {
  const { clipF, lungeAt: lz, body, ft, hit } = A;
  const step = (id, f, dz = 0) => ({ fL: [0.2, 0.08, lz(id, f) + 0.7 + dz, 0, 10], fR: [-0.26, 0.08, lz(id, f) - 0.42, 0, -60] });   // lunge stance
  const wide = (id, f) => ({ fL: [0.34, 0.08, lz(id, f) + 0.36, 0, 25], fR: [-0.34, 0.08, lz(id, f) - 0.28, 0, -50] });           // planted wide
  const out = {};
  // N1 jab · N2 stepping gut thrust (chambered high, driven down and through)
  { const [s, e] = hit('n1'), F = M.n1.frames, c = M.n1.cancel;
    out.n1 = clipF('n1', [[0, G], [s - 4, CHAMB, 'out'], [s, { ...JAB(0.62), ...step('n1', s) }, 'snap'], [e + 3, JAB(0.6), 'io'],
      [c, { ...JAB(0.42), hips: [0, 0.82, 0.16] }, 'io'], [F, G]]); }
  { const [s, e] = hit('n2'), F = M.n2.frames, c = M.n2.cancel;
    out.n2 = clipF('n2', [[0, G],
      [s - 5, { ...CHAMB, hips: [0, 0.86, -0.06], chest: [-4, -24, 0], spear: [-0.2, 1.34, -0.32, 0, 14, 90] }, 'out'],
      [s, { ...JAB(0.72, { hips: [0, 0.72, 0.32], spine: [12, -8, 0], chest: [8, -6, 0], spear: [-0.04, 1.08, 0.74, 0, -8, 90] }), ...step('n2', s, 0.08) }, 'snap'],
      [e + 3, JAB(0.7, { hips: [0, 0.74, 0.3], spine: [10, -8, 0] }), 'io'],
      [c, { ...JAB(0.46), hips: [0, 0.8, 0.2] }, 'io'], [F, G]]); }
  // N3 wild backhand sweep left → right, blade flat
  { const [s, e] = hit('n3'), F = M.n3.frames, c = M.n3.cancel;
    out.n3 = clipF('n3', [[0, G],
      [s - 5, { ...TW(62, 6), spear: [0.12, 1.2, 0.0, 142, 10, 0], ...wide('n3', s - 5) }, 'out'],
      [s - 1, { ...TW(36, 8, 0.78), spear: [0.06, 1.12, 0.2, 82, 0, 0] }, 'lin'],
      [s + 1, { ...TW(4, 8, 0.78), spear: [-0.12, 1.1, 0.34, 10, -4, 0] }, 'lin'],
      [s + 3, { ...TW(-32, 8, 0.78), spear: [-0.28, 1.1, 0.24, -62, -4, 0] }, 'lin'],
      [e + 2, { ...TW(-62, 6), spear: [-0.36, 1.16, 0.0, -128, 4, 0] }, 'out'],
      [c, { ...TW(-56, 6, 0.82), spear: [-0.34, 1.16, 0.02, -122, 6, 0] }, 'io'], [F, G]]); }
  // N4 shoulder charge: the spear across his chest, the whole body rammed forward
  { const [s, e] = hit('n4'), F = M.n4.frames, c = M.n4.cancel;
    const ram = { hips: [0, 0.76, 0.3], hipsR: [22, 32, 0], spine: [14, 20, 0], chest: [10, 26, 0], head: [0, -30, 0], spear: [-0.12, 1.28, 0.28, 92, 8, 90], gripL: 0.5 };
    out.n4 = clipF('n4', [[0, G],
      [s - 6, { ...ram, hips: [0, 0.8, 0.0], hipsR: [10, 42, 0], spear: [-0.14, 1.24, 0.1, 98, 10, 90] }, 'out'],
      [s, { ...ram, ...step('n4', s) }, 'in'],
      [e, { ...ram, hips: [0, 0.72, 0.36], ...step('n4', e) }, 'lin'],
      [c, { ...ram, hips: [0, 0.8, 0.24] }, 'io'], [F, G]]); }
  // N5 two-handed overhead smash
  { const [s] = hit('n5'), F = M.n5.frames, c = M.n5.cancel;
    out.n5 = clipF('n5', [[0, G],
      [s - 8, { ...UP, spear: [-0.16, 1.66, -0.1, 0, 130, 90] }, 'out'],
      [s - 2, { ...UP, hips: [0, 0.97, 0.04], spear: [-0.16, 1.72, -0.12, 0, 144, 90] }, 'io'],
      [s + 1, { ...SMASH, spear: [-0.12, 0.98, 0.52, 0, -34, 90], ...wide('n5', s + 1) }, 'snap'],
      [c, { ...SMASH, hips: [0, 0.7, 0.22], spear: [-0.12, 1.0, 0.5, 0, -30, 90] }, 'io'], [F, G]]); }
  // N6 the spear whirled over his head (three turns), a hop, the stomp
  { const [s] = hit('n6', 0), [s2] = hit('n6', 1), F = M.n6.frames, c = M.n6.cancel;
    const whirl = (f, a) => [f, { hips: [0, 0.86, 0.04], hipsR: [-4, 0, 0], spine: [-6, 0, 0], chest: [-8, 0, 0], head: [-6, 0, 0],
      spear: [-0.06, 1.95, 0.02, a, 6, 0], gripL: 0.2, lfree: 1, armL: [-150, 0, -10, 20] }, 'lin'];
    const keys = [[0, G], whirl(s - 4, -60)];
    for (let k = 0; k <= 10; k++) keys.push(whirl(s + k * 2, k * 108));
    keys.push([s2 - 5, { ...UP, hips: [0, 1.02, 0.04], spear: [-0.14, 1.74, 0, 1080, 124, 0], fL: [0.2, 0.42, lz('n6', s2 - 5) + 0.3, -30, 15] }, 'out'],
      [s2, { ...STOMP, spear: [-0.16, 0.98, 0.46, 1080, -40, 90], ...wide('n6', s2) }, 'snap'],
      [c, { ...STOMP, hips: [0, 0.66, 0.1], spear: [-0.16, 1.0, 0.44, 1080, -34, 90] }, 'io'],
      [F, { ...G, spear: [-0.26, 1.0, 0.04, 22 + 1080, 20, 90] }]);
    out.n6 = clipF('n6', keys); }
  // C1 虎嘯, then the rising thrust
  { const [r] = hit('c1', 0), [s] = hit('c1', 1), F = M.c1.frames, c = M.c1.cancel;
    out.c1 = clipF('c1', [[0, G],
      [r - 8, { ...STOMP, hips: [0, 0.74, 0.02], spear: [-0.36, 1.0, 0.0, -30, 40, 90], lfree: 0.6, armL: [0, 0, 60, 60], ...wide('c1', r - 8) }, 'out'],
      [r, ROAR, 'snap'],
      [r + 16, { ...ROAR, chest: [-22, 0, 0], head: [-34, 0, 0] }, 'io'],
      [s - 6, { ...STOMP, hips: [0, 0.64, 0.14], spear: [-0.3, 0.72, 0.2, -10, -40, 90] }, 'io'],
      [s + 1, { hips: [0, 0.94, 0.24], hipsR: [-8, -40, 0], spine: [-8, -10, 0], chest: [-14, -8, 0], head: [-12, 0, 0], spear: [-0.1, 1.4, 0.4, 0, 60, 90], gripL: 0.34 }, 'snap'],
      [s + 8, { ...UP, hips: [0, 0.96, 0.2], spear: [-0.1, 1.72, 0.14, 0, 100, 90] }, 'out'],
      [c, { ...UP, spear: [-0.12, 1.66, 0.06, 0, 106, 90] }, 'io'], [F, G]]); }
  // C2 lunging rising thrust
  { const [s] = hit('c2'), F = M.c2.frames, c = M.c2.cancel;
    out.c2 = clipF('c2', [[0, G],
      [s - 8, { ...CHAMB, hips: [0, 0.7, 0], spear: [-0.22, 0.86, -0.3, 0, -20, 90] }, 'out'],
      [s, { ...JAB(0.56), hips: [0, 0.86, 0.3], chest: [-8, -8, 0], spear: [-0.06, 1.3, 0.56, 0, 38, 90], ...step('c2', s) }, 'snap'],
      [s + 8, { ...JAB(0.44), hips: [0, 0.94, 0.26], chest: [-12, -8, 0], spear: [-0.06, 1.5, 0.44, 0, 64, 90] }, 'out'],
      [c, { ...JAB(0.4), hips: [0, 0.9, 0.2], spear: [-0.08, 1.44, 0.4, 0, 56, 90] }, 'io'], [F, G]]); }
  // C3 thrust flurry, then the big one
  { const [s, e] = hit('c3', 0), [s2] = hit('c3', 1), F = M.c3.frames, c = M.c3.cancel;
    const keys = [[0, G], [s - 4, CHAMB, 'out'], ft(s, ...Object.values(step('c3', s)))];
    for (let f = s, k = 0; f < e; f += 4, k++) {
      const y = 1.06 + ((k * 7) % 3) * 0.08, yaw = ((k * 5) % 3 - 1) * 10;
      keys.push([f, JAB(0.6, { spear: [-0.08, y, 0.6, yaw, 0, 90] }), 'snap'], [f + 2, { ...CHAMB, hips: [0, 0.82, 0.06], spear: [-0.16, 1.12, -0.1, 0, 2, 90] }, 'in']);
    }
    keys.push([s2 - 5, { ...CHAMB, hips: [0, 0.82, -0.06], chest: [4, -32, 0], spear: [-0.26, 1.12, -0.44, 0, 2, 90] }, 'out'],
      [s2, { ...JAB(0.74), hips: [0, 0.72, 0.36], spear: [-0.02, 1.14, 0.76, 0, -2, 90], ...step('c3', s2, 0.1) }, 'snap'],
      [c, JAB(0.7, { hips: [0, 0.78, 0.3] }), 'io'], [F, G]);
    out.c3 = clipF('c3', keys); }
  // C4 two-turn spinning sweep, spear held out wide
  { const [s, e] = hit('c4'), F = M.c4.frames, c = M.c4.cancel;
    const sp = (f) => 720 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const SIDE = { hips: [0, 0.76, 0.04], hipsR: [6, -10, 0], spine: [6, -8, 0], chest: [2, -10, 0], head: [0, 0, 0], gripL: 0.32 };
    const keys = [[0, G], [s - 6, { ...TW(-40, 6, 0.78), spear: [-0.32, 1.1, 0.1, -100, 0, 0] }, 'out']];
    for (let f = s; f <= e; f += 3) keys.push([f, { ...SIDE, spin: sp(f), spear: [-0.3, 1.02, 0.24, -90, -4, 0] }, 'lin']);
    keys.push([c, { ...SIDE, spin: 720, spear: [-0.3, 1.06, 0.2, -88, 0, 0] }, 'io'], [F, { ...G, spin: 720 }]);
    for (let f = s + 2, i = 0; f <= e; f += 4, i++) keys.push(ft(f, i % 2 ? body('c4', f, sp(f), [0.26, 0.08, 0.3, 0, 15]) : null, i % 2 ? null : body('c4', f, sp(f), [-0.28, 0.08, -0.24, 0, -35])));
    keys.push(ft(F, [0.17, 0.08, 0.3 + lz('c4', F), 0, 15 + 720], [-0.2, 0.08, -0.26 + lz('c4', F), 0, -30 + 720]));
    out.c4 = clipF('c4', keys); }
  // C5 leap and stomp
  { const [s] = hit('c5'), F = M.c5.frames, c = M.c5.cancel, L = M.c5.landFrame;
    const air = (f, y = 0.55) => ({ fL: [0.2, y, lz('c5', f) + 0.25, -30, 15], fR: [-0.2, y - 0.1, lz('c5', f) - 0.15, -20, -30] });
    out.c5 = clipF('c5', [[0, G],
      [12, { ...STOMP, hips: [0, 0.64, 0], spear: [-0.3, 1.0, -0.1, -20, 40, 90] }, 'out'],
      [18, { ...UP, hips: [0, 1.04, 0.1], spear: [-0.14, 1.8, 0, 0, 120, 90], lfree: 1, armL: [-150, 0, -20, 30], ...air(18) }, 'out'],
      [L - 3, { ...UP, hips: [0, 1.0, 0.16], spear: [-0.14, 1.6, 0.2, 0, 60, 90], ...air(L - 3, 0.4) }, 'in'],
      [s, { ...STOMP, hips: [0, 0.54, 0.14], spear: [-0.16, 0.9, 0.44, 0, -46, 90], ...wide('c5', s) }, 'snap'],
      [c, { ...STOMP, hips: [0, 0.62, 0.12], spear: [-0.16, 0.94, 0.44, 0, -40, 90] }, 'io'], [F, G]]); }
  // C6 當陽一喝: whirl the spear up, drive the butt into the ground (vertical, blade up), inhale on it — and ROAR
  { const [b] = hit('c6', 0), [r] = hit('c6', 1), F = M.c6.frames, c = M.c6.cancel;
    const PL = [-0.04, 0.88, 0.5, 360, 90, 90], grip = { gripR: 0.08, gripL: 0.44 };          // upright, the butt in the ground
    const hold = { hips: [0, 0.74, 0.12], hipsR: [12, -18, 0], spine: [8, -4, 0], chest: [6, -4, 0], head: [4, 0, 0], spear: PL, ...grip };
    out.c6 = clipF('c6', [[0, G],
      [8, { ...TW(40, 4, 0.86), spear: [0.02, 1.5, 0.0, 120, 40, 0] }, 'out'],                                   // swung up round the left
      [16, { ...UP, hips: [0, 0.98, 0.06], spear: [-0.1, 1.9, 0.0, 250, 20, 0], lfree: 0.3 }, 'lin'],             // whirled over the head
      [24, { ...UP, hips: [0, 1.02, 0.1], chest: [-18, 0, 0], head: [-14, 0, 0], spear: [-0.04, 1.5, 0.46, 360, 90, 90], ...grip,
        fL: [0.24, 0.24, lz('c6', 24) + 0.5, -20, 15] }, 'out'],                                                 // hoisted upright, lead knee up
      [b, { ...hold, ...wide('c6', b) }, 'snap'],                                                                // the butt driven down
      [b + 6, { ...hold, hips: [0, 0.72, 0.14] }, 'io'],
      [r - 4, { ...hold, hips: [0, 0.8, 0.06], hipsR: [-2, -16, 0], chest: [-6, 0, 0], head: [8, 0, 0] }, 'in'],   // inhale over it
      [r, { ...ROAR, hips: [0, 0.78, 0.0], spear: PL, ...grip, lfree: 1, armL: [-40, 0, 80, 30] }, 'snap'],
      [r + 26, { ...ROAR, hips: [0, 0.8, 0.0], chest: [-24, 0, 0], head: [-36, 0, 0], spear: PL, ...grip, lfree: 1, armL: [-50, 0, 85, 25] }, 'io'],
      [c, { ...hold, hips: [0, 0.8, 0.1], spear: [-0.2, 0.96, 0.3, 380, 40, 90], gripR: 0, gripL: 0.5 }, 'io'],
      [F, { ...G, spear: [-0.26, 1.0, 0.04, 22 + 360, 20, 90] }]]); }
  // dash: lance charge, spear couched under the arm, running strides, then the thrust
  { const [s2] = hit('dash', 1), F = M.dash.frames, c = M.dash.cancel;
    const couch = { hips: [0, 0.8, 0.14], hipsR: [20, -40, 0], spine: [10, -10, 0], chest: [8, -12, 0], head: [0, 12, 0], spear: [-0.2, 1.06, -0.2, 0, -4, 90], gripL: 0.46 };
    const keys = [[0, G], [4, couch, 'out'], [40, { ...couch, hips: [0, 0.78, 0.16] }]];
    for (let f = 5, j = 0; f < 42; f += 5, j ^= 1) {
      const z = lz('dash', f) + 0.3;
      keys.push(ft(f - 2.5, j ? null : [0.14, 0.3, z - 0.3, -20, 5], j ? [-0.14, 0.3, z - 0.3, -20, -5] : null), ft(f, j ? null : [0.14, 0.08, z, 0, 5], j ? [-0.14, 0.08, z, 0, -5] : null));
    }
    keys.push([s2 - 2, { ...CHAMB, hips: [0, 0.8, 0.1] }, 'in'], [s2, { ...JAB(0.72), spear: [-0.04, 1.14, 0.72, 0, -2, 90], ...step('dash', s2) }, 'snap'],
      [c, JAB(0.6, { hips: [0, 0.8, 0.2] }), 'io'], [F, G]);
    out.dash = clipF('dash', keys); }
  // air string: jatk downward jab · ja2 wild horizontal sweep · ja3 two-handed overhead smash
  { const [s, e] = hit('jatk'), F = M.jatk.frames;
    out.jatk = clipF('jatk', [
      [0, { hips: [0, 0.95, 0], ...AIRF, spear: [-0.2, 1.2, -0.1, 30, 30, 90] }],
      [s - 2, { hips: [0, 0.98, -0.04], hipsR: [0, -50, 0], chest: [-6, -20, 0], ...AIRF, spear: [-0.2, 1.3, -0.3, 0, 10, 90], gripL: 0.4 }, 'out'],
      [e, { hips: [0, 0.94, 0.1], hipsR: [14, -60, 0], chest: [12, -10, 0], ...AIRF, spear: [-0.08, 1.0, 0.5, 0, -40, 90], gripL: 0.3 }, 'snap'],
      [F, { hips: [0, 0.95, 0.04], ...AIRF, spear: [-0.1, 1.04, 0.3, 0, -20, 90], gripL: 0.35 }]]); }
  { const [s, e] = hit('ja2'), F = M.ja2.frames;
    out.ja2 = clipF('ja2', [
      [0, { hips: [0, 0.95, 0.04], ...AIRF, spear: [-0.1, 1.04, 0.3, 0, -20, 90], gripL: 0.35 }],
      [s - 2, { ...TW(62, 4, 0.96), ...AIRF, spear: [0.12, 1.2, 0.0, 142, 10, 0] }, 'out'],
      [e, { ...TW(-62, 6, 0.96), ...AIRF, spear: [-0.36, 1.16, 0.0, -128, 4, 0] }, 'in'],
      [F, { ...TW(-52, 4, 0.96), ...AIRF, spear: [-0.34, 1.16, 0.02, -122, 6, 0] }]]); }
  { const [s] = hit('ja3'), F = M.ja3.frames;
    out.ja3 = clipF('ja3', [
      [0, { ...TW(-52, 4, 0.96), ...AIRF, spear: [-0.34, 1.16, 0.02, -122, 6, 0] }],
      [s - 3, { ...UP, hips: [0, 1.0, 0], ...AIRF, spear: [-0.16, 1.8, -0.1, 0, 142, 90] }, 'out'],
      [s + 1, { ...SMASH, hips: [0, 0.92, 0.16], ...AIRF, spear: [-0.12, 1.0, 0.5, 0, -40, 90] }, 'snap'],
      [F, { ...SMASH, hips: [0, 0.94, 0.12], ...AIRF, spear: [-0.12, 1.02, 0.48, 0, -34, 90] }]]); }
  // jump charge: spear raised through the hang, plunge, stomp landing
  { const L = M.jc.landFrame, F = M.jc.frames, D = M.jc.plunge[0], c = M.jc.cancel;
    const air = (y) => ({ fL: [0.16, y, 0.14, -30, 10], fR: [-0.18, y - 0.08, -0.12, 20, -20] });
    const land = { ...STOMP, hips: [0, 0.54, 0.14], spear: [-0.16, 0.9, 0.44, 0, -46, 90], fL: [0.34, 0.08, 0.36, 0, 25], fR: [-0.34, 0.08, -0.28, 0, -50] };
    out.jc = clipF('jc', [
      [0, { hips: [0, 0.95, 0], ...air(0.36), spear: [-0.2, 1.2, -0.1, 30, 30, 90] }],
      [5, { ...UP, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.12, 1.84, 0, 0, 120, 90], lfree: 1, armL: [-150, 0, -20, 30] }, 'out'],
      [D - 1, { ...UP, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.12, 1.86, 0, 0, 128, 90], lfree: 1, armL: [-150, 0, -20, 30] }],
      [L - 1, { ...SMASH, hips: [0, 0.96, 0.14], ...air(0.4), spear: [-0.12, 1.4, 0.36, 0, 10, 90] }, 'in'],
      [L, land, 'snap'],
      [c, { ...land, hips: [0, 0.62, 0.12], spear: [-0.16, 0.94, 0.44, 0, -40, 90] }, 'io'], [F, G]]); }
  // locomotion: at ease with the spear shouldered, left fist on the hip; take-off / apex / fall / land / hurt
  Object.assign(out, locoClips({
    idle: { hips: [0, 0.86, 0], hipsR: [2, -12, 0], spine: [2, -2, 0], chest: [-4, -4, 0], head: [-4, 6, 0],
      footL: [0.25, 0.08, 0.2, 0, 22], footR: [-0.27, 0.08, -0.18, 0, -32], spear: [-0.22, 1.38, 0.14, 175, 28, 90], gripR: 0, gripL: 0.3, lfree: 1, armL: [12, 0, 52, 104] },
    breath: { hips: [0, 0.852, 0], chest: [-2, -4, 0], head: [-6, 6, 0] },
    takeoff: { hips: [0, 0.98, 0], hipsR: [-6, -10, 0], chest: [-6, 5, 0], head: [-6, 0, 0], spear: [-0.2, 1.3, 0.0, 170, 30, 90], gripL: 0.3, lfree: 1, armL: [0, 0, 60, 60] },
    apex: { hips: [0, 0.95, 0], hipsR: [-8, 0, 0], chest: [-12, 0, 0], head: [-8, 0, 0], spear: [-0.12, 1.84, 0, 0, 120, 90], gripL: 0.5, lfree: 1, armL: [-150, 0, -20, 30] },
    fall: { hips: [0, 0.95, 0], hipsR: [-10, 0, 0], chest: [-8, 0, 0], head: [16, 0, 0], spear: [-0.5, 1.3, 0.1, -110, 10, 90], gripL: 0.3, lfree: 1, armL: [0, 0, 100, 14] },
    land: { ...STOMP, spear: [-0.16, 0.98, 0.46, 0, -40, 90], footL: [0.34, 0.08, 0.36, 0, 25], footR: [-0.34, 0.08, -0.28, 0, -50] },
    hurt: { hips: [0, 0.82, -0.12], hipsR: [-16, -20, 6], spine: [-12, 0, 0], chest: [-12, 0, 0], head: [-20, 0, 0], spear: [-0.22, 1.2, -0.1, 170, 40, 90], gripL: 0.3, lfree: 1, armL: [-30, 0, 70, 40] },
  }));
  return out;
}

// ---------------------------------------------------------------- 真・無雙 燕人咆哮 (musou/scripted.js)
const MU = (dmg, kb, force, lift, extra) => ({ shape: 'circle', range: 5, dmg, kb, force, lift, hitstop: 0, yMax: 5, ...extra });
const ROAR_RING = (n, dmg) => ({ dmg, kb: 'blow', force: 12, lift: 5, hitstop: 0, heavy: true, proj: { count: n, spread: 360, speed: 24, life: 32, r: 2.2, y: 0.9, kind: 'roar' } });
export const musou = {
  act: { ...ROAR, hips: [0, 0.82, -0.04], head: [-20, 0, 0] },
  act2: { ...ROAR, chest: [-24, 0, 0], head: [-36, 0, 0], armL: [-40, 0, 85, 30] },
  face: { hips: [0, 0.9, 0], hipsR: [0, -24, 0], spine: [2, -6, 0], chest: [-4, -8, 0], head: [-6, -18, 0], spear: [-0.3, 1.1, 0.1, 20, 70, 90], gripL: 0.3, lfree: 1, armL: [-30, 0, 60, 70] },
  ready: { ...STOMP, spear: [-0.36, 1.0, 0.0, -30, 40, 90], lfree: 0.6, armL: [0, 0, 60, 60] },
  // roar (100-112) · lance charge (112-130) · CONTACT: rammed into the line, thrust storm (132-156) · huge thrust (160) ·
  // the spear whirled up (166-176) · FINISHER: the butt slammed down (c6's plant), the second roar ring
  seq: [[100, 112, 'c1', 0.12, 0.36], [112, 130, 'dash', 0.05, 0.5], [130, 132, 'dash', 0.55, 0.6], [132, 156, 'c3', 0.14, 0.56],
    [156, 166, 'c3', 0.62, 0.74], [166, 176, 'c6', 0.08, 0.32]],
  fin: ['c6', 0.33, 0.62],
  travel: [[112, 130, 6], [132, 156, 1.6], [156, 162, 1.0]],
  hits: [[104, MU(10, 'blow', 13, 4, { range: 8, heavy: true, hitstop: 4 })],
    [114, MU(10, 'push', 8, 2, { shape: 'arc', range: 2.6, ang: 130 }), 0, 3, 130],
    [132, MU(16, 'blow', 11, 4, { shape: 'line', len: 5, width: 3.4, heavy: true, hitstop: 3 })],
    [134, MU(7, 'flinch', 3, 1, { shape: 'line', len: 7, width: 3.4 }), 0, 3, 156],
    [160, MU(34, 'blow', 16, 6, { shape: 'line', len: 11, width: 4.4, heavy: true })]],
  proj: [[104, ROAR_RING(14, 8)]],
  fx: [[104, 'roar', 10], [132, 'crack', 4, 2.5], [160, 'aura', 4, 3]],
  finFx: [['slam', 12], ['rocks', 12], ['roar', 12]],
  finProj: [ROAR_RING(18, 12)],
};
