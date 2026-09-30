// 關羽's moveset (def-kit moveset: src/chars/defkit.js header) — the 青龍偃月刀 as a heavy glaive: hands wide on the shaft
// (grip 0.62), big committed arcs carried by the whole body, every cut stepping in, the edge leading (kit.js edge lead),
// jade-green crescent waves off the heavy strokes. Data like src/hero/moves.js (+ proj windows); clips frame-keyed with
// the shared author (hero/anims/author.js), anchored to the hit windows.
//   N1 rising diagonal cut, low right → high left · N2 backhand waist sweep, left → right (the widest arc)
//   N3 stepping overhead cleave · N4 one full turn, the blade held out wide
//   N5 偃月: a vertical rising cut from the ground that throws a crescent wave
//   N6 the glaive whirled flat over his head (two turns), a hop, and a crashing cleave: a big crescent, rocks
//   C1 (neutral) 青龍斬: coil, the blade circled overhead, a crushing slam and a great crescent down the field (launch)
//   C2 (N1→) scooping launcher · C3 (N2→) advancing whirlwind (two turns) into a cleave that throws a crescent
//   C4 (N3→) coiled 250° sweep throwing a fan of three crescents
//   C5 (N4→) 飛斬: vault, the glaive whirled overhead in the air, plunge blade-first, then wrench it out of the earth (rocks)
//   C6 (N5→) 青龍昇天: a rising cut that launches, a double whirl overhead that flings a ring of eight crescents, then a
//        leaping crash — a towering crescent down the field and the ground erupting
//   dash 拖刀計: the blade dragged low behind him at a run (one hand), then ripped up · jump: slash ↘ · rising backhand ↗ ·
//   overhead cleave + a small crescent (3-hit air string) · jump charge: blade raised through the hang, plunge, a ring of
//   six crescents
// Musou 青龍偃月・天斬 (musou/scripted.js): 拖刀 charge (dragging the blade) · a cleave throwing a crescent · coil and
// CONTACT: the towering slash — a huge crescent and the green dragon rising off the blade (look.dragon, kit.js) · a wide
// cleave throwing three · a spinning sweep · the hop — FINISHER: the crash, a ring of twelve crescents.
import { spearAbout } from '../../hero/rig.js';
import { locoClips } from '../loco.js';

const ONCE = 99;
export const airChainMax = 6;
const CRES = (r, speed, life, extra) => ({ speed, life, r, kind: 'crescent', ...extra });

export function moves() {
  return {
    n1: { frames: 36, next: 'n2', charge: 'c2', cancel: 24, branch: 14, dodgeCancel: 14, steer: 5, lunge: [[3, 11, 0.5]],
      hits: [{ f: [10, 13], sweep: 1, shape: 'arc', range: 3.4, ang: 160, dir: 10, dmg: 16, kb: 'flinch', force: 3.5, hitstop: 4 }] },
    n2: { frames: 38, next: 'n3', charge: 'c3', cancel: 27, branch: 17, dodgeCancel: 17, steer: 5, lunge: [[4, 13, 0.6]],
      hits: [{ f: [12, 16], sweep: -1, shape: 'arc', range: 3.6, ang: 210, dir: -10, dmg: 17, kb: 'push', force: 6, hitstop: 4 }] },
    n3: { frames: 42, next: 'n4', charge: 'c4', cancel: 29, branch: 19, dodgeCancel: 19, steer: 4, lunge: [[3, 16, 1.1]],
      hits: [{ f: [15, 17], every: ONCE, shape: 'line', len: 4.2, width: 1.9, dmg: 19, kb: 'push', force: 6, hitstop: 5 }] },
    n4: { frames: 48, next: 'n5', charge: 'c5', cancel: 34, branch: 30, dodgeCancel: 30, steer: 5, lunge: [[4, 26, 1.2]], armor: true,
      hits: [{ f: [14, 28], sweep: -1, sweepN: 14, shape: 'circle', range: 3.7, dmg: 17, kb: 'push', force: 6, hitstop: 4 }] },
    n5: { frames: 52, next: 'n6', charge: 'c6', cancel: 36, branch: 24, dodgeCancel: 24, steer: 5, lunge: [[6, 18, 1.0]], armor: true,
      hits: [{ f: [18, 21], every: ONCE, shape: 'arc', range: 3.6, ang: 130, dmg: 24, kb: 'blow', force: 10, lift: 5, hitstop: 6, heavy: true },
        { f: [18, 18], every: ONCE, dmg: 18, kb: 'blow', force: 9, lift: 5, hitstop: 0, proj: CRES(2, 16, 28) }] },
    n6: { frames: 74, next: 'n1', charge: 'c1', cancel: 62, dodgeCancel: 52, steer: 6, lunge: [[8, 30, 0.6], [36, 48, 1.8]], armor: true,
      hits: [{ f: [14, 32], every: 6, shape: 'circle', range: 3.5, dmg: 8, kb: 'flinch', force: 2.5, hitstop: 2 },
        { f: [48, 50], every: ONCE, shape: 'line', len: 5, width: 2.6, dmg: 30, kb: 'blow', force: 13, lift: 6, hitstop: 8, heavy: true, rocks: 10 },
        { f: [48, 48], every: ONCE, dmg: 22, kb: 'blow', force: 10, lift: 6, hitstop: 0, proj: CRES(2.6, 17, 32) }] },

    c1: { frames: 78, cancel: 68, dodgeCancel: 42, steer: 14, lunge: [[21, 30, 0.9]], armor: true,
      hits: [{ f: [30, 33], every: ONCE, shape: 'line', len: 5.6, width: 2.8, dmg: 32, kb: 'blow', force: 11, lift: 7, hitstop: 8, heavy: true },
        { f: [30, 30], every: ONCE, dmg: 24, kb: 'launch', force: 3, lift: 10, hitstop: 0, proj: CRES(3, 17, 36) }] },
    c2: { frames: 60, cancel: 52, dodgeCancel: 30, steer: 10, lunge: [[9, 19, 0.7]], armor: true,
      hits: [{ f: [19, 23], every: ONCE, shape: 'arc', range: 3.8, ang: 150, dmg: 23, kb: 'launch', force: 2, lift: 12, hitstop: 6, heavy: true }] },
    c3: { frames: 94, cancel: 86, dodgeCancel: 74, steer: 10, lunge: [[14, 56, 3.0]], armor: true,
      hits: [{ f: [14, 56], every: 7, shape: 'circle', range: 3.9, dmg: 9, kb: 'spin', force: 5, lift: 3, hitstop: 2 },
        { f: [66, 69], every: ONCE, shape: 'line', len: 4.8, width: 2.4, dmg: 27, kb: 'blow', force: 14, lift: 6, hitstop: 7, heavy: true },
        { f: [66, 66], every: ONCE, dmg: 16, kb: 'blow', force: 9, lift: 5, hitstop: 0, proj: CRES(2.2, 16, 26) }] },
    c4: { frames: 82, cancel: 74, dodgeCancel: 46, steer: 12, lunge: [[20, 32, 0.8]], armor: true,
      hits: [{ f: [30, 34], sweep: 1, shape: 'arc', range: 4.2, ang: 250, dmg: 21, kb: 'blow', force: 10, lift: 4, hitstop: 6, heavy: true },
        { f: [32, 32], every: ONCE, dmg: 18, kb: 'blow', force: 9, lift: 5, hitstop: 0, proj: CRES(1.8, 16, 30, { count: 3, spread: 70 }) }] },
    c5: { frames: 100, cancel: 92, dodgeCancel: 62, steer: 10, lunge: [[12, 40, 1.8]], armor: true, leap: [16, 11], plunge: [36, -28], landFrame: 42,
      hits: [{ f: [24, 34], every: 5, shape: 'circle', range: 3.2, dmg: 7, kb: 'flinch', force: 2, hitstop: 1, yMax: 4.5 },
        { f: [42, 45], every: ONCE, shape: 'circle', range: 4.2, dmg: 22, kb: 'launch', force: 3, lift: 9, hitstop: 6, heavy: true, yMax: 4 },
        { f: [60, 63], every: ONCE, shape: 'arc', range: 5.2, ang: 160, dmg: 30, kb: 'blow', force: 14, lift: 7, hitstop: 8, heavy: true, yMax: 4.5, rocks: 16 }] },
    c6: { frames: 116, cancel: 106, dodgeCancel: 90, steer: 10, lunge: [[8, 20, 0.6], [56, 72, 1.6]], armor: true,
      hits: [{ f: [18, 21], every: ONCE, shape: 'line', len: 4.2, width: 2.4, dmg: 18, kb: 'launch', force: 2, lift: 10, hitstop: 6, heavy: true },
        { f: [32, 50], every: 6, shape: 'circle', range: 4, dmg: 9, kb: 'spin', force: 5, lift: 4, hitstop: 2, yMax: 4 },
        { f: [50, 50], every: ONCE, dmg: 14, kb: 'blow', force: 9, lift: 5, hitstop: 0, proj: CRES(1.8, 15, 24, { count: 8, spread: 360 }) },
        { f: [72, 75], every: ONCE, shape: 'line', len: 6.5, width: 3, dmg: 34, kb: 'blow', force: 15, lift: 7, hitstop: 9, heavy: true, rocks: 16 },
        { f: [72, 72], every: ONCE, dmg: 28, kb: 'blow', force: 12, lift: 7, hitstop: 0, proj: CRES(3.4, 18, 40) }] },

    dash: { frames: 82, cancel: 74, dodgeCancel: 52, steer: 3, lunge: [[0, 42, 5.8, 'lin'], [42, 50, 1.2]],
      hits: [{ f: [6, 40], every: 9, shape: 'line', len: 2.4, width: 2.6, off: 0.1, dmg: 9, kb: 'push', force: 7, hitstop: 2 },
        { f: [46, 50], every: ONCE, shape: 'arc', range: 4, ang: 180, dmg: 25, kb: 'launch', force: 4, lift: 10.5, hitstop: 7, heavy: true }] },
    jatk: { frames: 26, air: true, hover: 2.4, next: 'ja2', charge: 'jc', cancel: 14, dodgeCancel: 99, steer: 3,
      hits: [{ f: [7, 10], every: ONCE, shape: 'arc', range: 3.8, ang: 190, dmg: 14, kb: 'flinch', force: 3, hitstop: 3, yMax: 4.5 }] },
    ja2: { frames: 24, air: true, hover: 2.4, next: 'ja3', charge: 'jc', cancel: 13, dodgeCancel: 99, steer: 3,
      hits: [{ f: [6, 9], every: ONCE, shape: 'arc', range: 3.8, ang: 190, dmg: 15, kb: 'push', force: 5, hitstop: 3, yMax: 4.5 }] },
    ja3: { frames: 30, air: true, hover: 1.4, next: 'jatk', charge: 'jc', cancel: 18, dodgeCancel: 99, steer: 3,
      hits: [{ f: [9, 12], every: ONCE, shape: 'line', len: 4.4, width: 2.2, dmg: 22, kb: 'blow', force: 9, lift: 1, hitstop: 6, yMax: 5 },
        { f: [9, 9], every: ONCE, dmg: 14, kb: 'blow', force: 8, lift: 3, hitstop: 0, proj: CRES(1.6, 16, 18, { y: 0.5 }) }] },
    // (jc: his own hang / landing timing — anims/locomotion.js reads the kit's jc for the squash and glow)
    jc: { frames: 60, air: true, hover: 3, landFrame: 38, hang: [6, 34], plunge: [34, -80], cancel: 54, dodgeCancel: 42, steer: 12, armor: true,
      hits: [{ f: [38, 41], every: ONCE, shape: 'circle', range: 4.8, dmg: 26, kb: 'launch', force: 5, lift: 9, hitstop: 8, heavy: true, rocks: 8 },
        { f: [38, 38], every: ONCE, dmg: 14, kb: 'blow', force: 8, lift: 4, hitstop: 0, proj: CRES(1.6, 14, 20, { count: 6, spread: 360 }) }] },
  };
}

export const entry = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4', c6: 'n5', ja2: 'jatk', ja3: 'ja2' };
// run: the glaive levelled at the hip in both hands, blade forward and low
export const carry = { run: { spear: [-0.26, 0.98, -0.16, 16, 12, 0], gripR: 0, gripL: 0.62, lfree: 0 } };

// ---------------------------------------------------------------- poses (P specs; the edge = weapon +y, kit.js rolls it
// onto the swing)
const GR = 0.62;                                                  // left hand far up the shaft
const G = { hips: [0, 0.85, 0], hipsR: [4, -28, 0], spine: [6, -6, 0], chest: [2, -6, 0], head: [2, 10, 0], spear: [-0.27, 1.02, 0.02, 26, 26, 0], gripR: 0, gripL: GR };
/** Torso turned hy° (+ left), leaning `lean`°, pelvis at h. */
const tw = (hy, lean = 6, h = 0.82, dz = 0.06) => ({ hips: [0, h, dz], hipsR: [lean, hy, 0], spine: [lean, hy * 0.3, 0], chest: [lean * 0.6, hy * 0.42, 0],
  head: [2, -hy * 0.25, 0], gripL: GR });
const HIGH = { hips: [0, 0.95, 0.02], hipsR: [-8, -8, 0], spine: [-8, 0, 0], chest: [-12, 0, 0], head: [-6, 0, 0], gripL: GR };
const CLEAVE = { hips: [0, 0.62, 0.28], hipsR: [28, -8, 0], spine: [18, 0, 0], chest: [14, 0, 0], head: [10, 0, 0], gripL: GR };
const OUT = { hips: [0, 0.78, 0.04], hipsR: [6, 12, 0], spine: [6, 8, 0], chest: [2, 12, 0], head: [0, 0, 0], gripL: GR };   // blade out left (spins)
const CROUCH = { hips: [0, 0.64, 0.12], hipsR: [22, 22, 0], spine: [16, 8, 0], chest: [12, 10, 0], head: [4, 0, 0], gripL: GR };   // coiled for a rising cut
const RISE = { hips: [0, 0.9, 0.22], hipsR: [-6, -6, 0], spine: [-4, 0, 0], chest: [-10, 0, 0], head: [-6, 0, 0], gripL: GR };
const LEFT = [0.1, 1.08, 0.28, 94, -4, 0], DOWN = [-0.12, 0.93, 0.54, 0, -40, 0], OVER = [-0.17, 1.68, -0.08, 0, 140, 0];
const N1END = { ...tw(40, -4, 0.86), spear: [0.06, 1.42, 0.2, 58, 54, 0] };
const N2END = { ...tw(-56, 6, 0.82), spear: [-0.36, 1.12, 0.02, -120, 6, 0] };
const N3END = { ...CLEAVE, hips: [0, 0.68, 0.26], spear: [-0.12, 0.95, 0.52, 0, -34, 0] };
/** The glaive whirled flat over his head: the shaft turns about a point between the hands. */
const whirl = (a, y = 1.9, elev = 4) => spearAbout([0, y, 0.04], a, elev, 0, 0.31);
const AIRF = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };   // air string legs
const BEARD = { lfree: 1, armL: [-20, -60, 30, 115] };                                   // left hand stroking the beard

export function clips(A, M) {
  const { clipF, lungeAt: lz, body, ft, hit } = A;
  const wide = (id, f, fwd = 0) => ({ fL: [0.32, 0.08, lz(id, f) + 0.42 + fwd, 0, 22], fR: [-0.32, 0.08, lz(id, f) - 0.3 + fwd * 0.3, 0, -48] });
  /** Feet stepping round under a spin sp(f) (every 4 frames from s to e, alternating), then settled at F turned by `end`°. */
  const turnFeet = (id, s, e, sp, end) => {
    const k = [];
    for (let f = s + 2, i = 0; f <= e; f += 4, i++) k.push(ft(f, i % 2 ? body(id, f, sp(f), [0.26, 0.08, 0.3, 0, 15]) : null, i % 2 ? null : body(id, f, sp(f), [-0.28, 0.08, -0.24, 0, -35])));
    const F = M[id].frames;
    k.push(ft(F, [0.17, 0.08, 0.3 + lz(id, F), 0, 15 + end], [-0.2, 0.08, -0.26 + lz(id, F), 0, -30 + end]));
    return k;
  };
  const out = {};
  // N1 rising diagonal cut
  { const [s, e] = hit('n1'), F = M.n1.frames, c = M.n1.cancel;
    out.n1 = clipF('n1', [[0, G],
      [s - 6, { ...tw(-56, 10, 0.76), spear: [-0.34, 0.8, -0.06, -84, -34, 0], ...wide('n1', s - 6) }, 'out'],
      [s - 1, { ...tw(-24, 6, 0.78), spear: [-0.28, 0.95, 0.2, -34, -12, 0] }, 'in'],
      [s + 1, { ...tw(14, 0, 0.82), spear: [-0.08, 1.2, 0.36, 14, 24, 0] }, 'lin'],
      [e + 2, { ...tw(46, -6, 0.86), spear: [0.08, 1.46, 0.22, 64, 58, 0] }, 'out'],
      [c, N1END, 'io'], [F, G]]); }
  // N2 backhand waist sweep left → right
  { const [s, e] = hit('n2'), F = M.n2.frames, c = M.n2.cancel;
    out.n2 = clipF('n2', [[0, N1END],
      [s - 5, { ...tw(62, 8, 0.78), spear: [0.16, 1.1, 0.08, 128, 6, 0], ...wide('n2', s - 5) }, 'io'],
      [s - 1, { ...tw(30, 8, 0.78), spear: [0.06, 1.06, 0.3, 66, 0, 0] }, 'lin'],
      [s + 1, { ...tw(0, 8, 0.78), spear: [-0.12, 1.05, 0.36, 2, -2, 0] }, 'lin'],
      [s + 3, { ...tw(-32, 8, 0.78), spear: [-0.3, 1.06, 0.22, -62, -2, 0] }, 'lin'],
      [e + 2, { ...tw(-62, 6, 0.8), spear: [-0.38, 1.1, 0.0, -126, 4, 0], ...wide('n2', e + 2) }, 'out'],
      [c, N2END, 'io'], [F, G]]); }
  // N3 stepping overhead cleave
  { const [s] = hit('n3'), F = M.n3.frames, c = M.n3.cancel;
    out.n3 = clipF('n3', [[0, N2END],
      [s - 8, { ...HIGH, spear: [-0.18, 1.62, -0.04, -10, 128, 0] }, 'out'],
      [s - 2, { ...HIGH, hips: [0, 0.97, 0.06], chest: [-16, 0, 0], spear: [-0.18, 1.7, -0.1, 0, 146, 0] }, 'io'],
      [s, { ...CLEAVE, hips: [0, 0.78, 0.18], hipsR: [12, -8, 0], spine: [10, 0, 0], chest: [8, 0, 0], spear: [-0.15, 1.32, 0.38, 0, 36, 0] }, 'in'],
      [s + 1, { ...CLEAVE, spear: DOWN, ...wide('n3', s + 1) }, 'snap'],
      [c, N3END, 'io'], [F, G]]); }
  // N4 one full turn, the blade out wide on his left (spin −360: it sweeps left → right in front)
  { const [s, e] = hit('n4'), F = M.n4.frames, c = M.n4.cancel;
    const sp = (f) => -360 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const keys = [[0, N3END], [s - 6, { ...tw(40, 4, 0.8), spear: [0.12, 1.12, 0.2, 112, 2, 0], ...wide('n4', s - 6) }, 'out']];
    for (let f = s; f <= e; f += 2) keys.push([f, { ...OUT, spin: sp(f), spear: LEFT }, 'lin']);
    keys.push([e + 3, { ...OUT, spin: -372, spear: [0.12, 1.1, 0.24, 98, 0, 0] }, 'out'],
      [c, { ...OUT, spin: -360, spear: [0.12, 1.1, 0.24, 96, 2, 0] }, 'io'], [F, { ...G, spin: -360 }], ...turnFeet('n4', s, e, sp, -360));
    out.n4 = clipF('n4', keys); }
  // N5 偃月: crouched, the blade low in front — a vertical rising cut to overhead
  { const [s] = hit('n5'), F = M.n5.frames, c = M.n5.cancel;
    out.n5 = clipF('n5', [[0, G],
      [s - 7, { ...CROUCH, spear: [-0.2, 0.66, 0.3, -10, -40, 0], ...wide('n5', s - 7) }, 'out'],
      [s - 2, { ...CROUCH, hips: [0, 0.62, 0.14], spear: [-0.2, 0.64, 0.32, -6, -44, 0] }, 'io'],
      [s, { ...RISE, spear: [-0.12, 1.16, 0.42, 0, 30, 0] }, 'snap'],
      [s + 5, { ...HIGH, hips: [0, 0.98, 0.2], chest: [-16, 0, 0], head: [-10, 0, 0], spear: [-0.12, 1.7, 0.14, 0, 112, 0] }, 'out'],
      [c, { ...HIGH, spear: [-0.14, 1.66, 0.08, 0, 118, 0] }, 'io'], [F, G]]); }
  // N6 the whirl overhead (two turns), the hop, the crash
  { const [s] = hit('n6', 0), [s2] = hit('n6', 1), F = M.n6.frames, c = M.n6.cancel;
    const keys = [[0, { ...HIGH, spear: [-0.14, 1.66, 0.08, 0, 118, 0] }], [s - 4, { ...HIGH, spear: whirl(20, 1.86, 6) }, 'out']];
    for (let k = 0; k <= 9; k++) keys.push([s + k * 2, { ...HIGH, hips: [0, 0.88, 0.04], spear: whirl(-k * 80) }, 'lin']);
    keys.push([s2 - 8, { ...HIGH, hips: [0, 1.08, 0.1], spear: [-0.17, 1.7, -0.1, -720, 142, 0], fL: [0.22, 0.4, lz('n6', s2 - 8) + 0.3, -30, 15] }, 'out'],
      [s2 - 3, { ...HIGH, hips: [0, 1.12, 0.2], chest: [-16, 0, 0], spear: [-0.17, 1.74, -0.12, -720, 150, 0] }, 'io'],
      [s2 + 1, { ...CLEAVE, hips: [0, 0.58, 0.3], spear: [-0.1, 0.9, 0.56, -720, -44, 0], ...wide('n6', s2 + 1) }, 'snap'],
      [c, { ...CLEAVE, hips: [0, 0.64, 0.28], spear: [-0.1, 0.92, 0.56, -720, -40, 0] }, 'io'],
      [F, { ...G, spear: [-0.27, 1.02, 0.02, 26 - 720, 26, 0] }]);
    out.n6 = clipF('n6', keys); }
  // C1 青龍斬: coil low right, circle the blade overhead, the slam
  { const [s] = hit('c1'), F = M.c1.frames, c = M.c1.cancel;
    out.c1 = clipF('c1', [[0, G],
      [8, { ...tw(-62, 10, 0.76), spear: [-0.36, 0.94, -0.2, -158, 10, 0], ...wide('c1', 8) }, 'out'],
      [14, { ...tw(-66, 12, 0.74), spear: [-0.36, 0.95, -0.22, -162, 12, 0] }, 'io'],
      [21, { ...HIGH, hips: [0, 0.9, 0], chest: [-12, -10, 0], spear: [-0.2, 1.7, -0.1, -70, 118, 0] }, 'io'],
      [s - 3, { ...HIGH, chest: [-16, 0, 0], spear: [-0.16, 1.76, -0.1, 0, 150, 0] }, 'io'],
      [s, { ...CLEAVE, hips: [0, 0.58, 0.32], hipsR: [30, -6, 0], spine: [20, 0, 0], chest: [16, 0, 0], spear: [-0.1, 0.9, 0.6, 0, -42, 0], ...wide('c1', s, 0.2) }, 'snap'],
      [s + 14, { ...CLEAVE, hips: [0, 0.6, 0.3], spear: [-0.1, 0.92, 0.6, 0, -40, 0] }, 'io'],
      [c, { ...CLEAVE, hips: [0, 0.7, 0.24], spear: [-0.12, 1.0, 0.5, 0, -26, 0] }, 'io'], [F, G]]); }
  // C2 scooping launcher
  { const [s] = hit('c2'), F = M.c2.frames, c = M.c2.cancel;
    const low = { hips: [0, 0.66, 0.12], hipsR: [20, -30, 0], spine: [14, -10, 0], chest: [8, -10, 0], head: [0, 0, 0], spear: [-0.3, 0.68, 0.22, -22, -46, 0], gripL: GR };
    out.c2 = clipF('c2', [[0, N1END],
      [9, { ...low, ...wide('c2', 9) }, 'out'],
      [s - 1, { ...low, hips: [0, 0.63, 0.14], spear: [-0.3, 0.66, 0.24, -24, -50, 0] }, 'io'],
      [s + 1, { hips: [0, 0.94, 0.22], hipsR: [-8, 10, 0], spine: [-6, 4, 0], chest: [-12, 10, 0], head: [-10, 0, 0], spear: [-0.1, 1.38, 0.36, 6, 72, 0], gripL: GR }, 'snap'],
      [s + 7, { ...HIGH, hips: [0, 0.98, 0.2], chest: [-14, 10, 0], head: [-14, 0, 0], spear: [-0.1, 1.72, 0.1, 0, 112, 0] }, 'out'],
      [c, { ...HIGH, hips: [0, 0.94, 0.12], spear: [-0.14, 1.66, 0.04, 0, 118, 0] }, 'io'], [F, G]]); }
  // C3 advancing whirlwind (two turns), then the cleave
  { const [s, e] = hit('c3', 0), [s2] = hit('c3', 1), F = M.c3.frames, c = M.c3.cancel;
    const sp = (f) => -720 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const keys = [[0, N2END], [s - 6, { ...tw(52, 4, 0.8), spear: [0.12, 1.2, 0.2, 112, 10, 0] }, 'out']];
    for (let f = s; f <= e; f += 3) keys.push([f, { ...OUT, hips: [0, 0.76, 0.04], spin: sp(f), spear: LEFT }, 'lin']);
    keys.push([s2 - 5, { ...HIGH, spin: -720, spear: [-0.18, 1.66, -0.05, 0, 134, 0] }, 'out'],
      [s2 + 1, { ...CLEAVE, spin: -720, spear: DOWN, ...wide('c3', s2 + 1) }, 'snap'],
      [c, { ...N3END, spin: -720 }, 'io'], [F, { ...G, spin: -720 }], ...turnFeet('c3', s, e, sp, -720));
    out.c3 = clipF('c3', keys); }
  // C4 coiled far right, a 250° sweep right → left throwing three crescents
  { const [s, e] = hit('c4'), F = M.c4.frames, c = M.c4.cancel;
    out.c4 = clipF('c4', [[0, N3END],
      [14, { ...tw(-76, 10, 0.74), spear: [-0.3, 1.1, -0.15, -152, 14, 0], ...wide('c4', 14) }, 'out'],
      [s - 4, { ...tw(-80, 12, 0.72), spear: [-0.3, 1.1, -0.16, -156, 16, 0] }, 'io'],
      [s, { ...tw(-30, 8, 0.76), spear: [-0.3, 1.08, 0.1, -80, 0, 0] }, 'in'],
      [s + 2, { ...tw(10, 6, 0.76), spear: [-0.12, 1.08, 0.34, 0, -2, 0] }, 'lin'],
      [e, { ...tw(52, 4, 0.78), spear: [0.1, 1.1, 0.25, 100, 2, 0] }, 'lin'],
      [e + 6, { ...tw(72, 2, 0.8), spear: [0.16, 1.15, 0.1, 152, 8, 0], ...wide('c4', e + 6) }, 'out'],
      [c, { ...tw(68, 2, 0.82), spear: [0.14, 1.14, 0.12, 146, 8, 0] }, 'io'], [F, G]]); }
  // C5 飛斬: vault, whirl in the air, plunge blade-first, wrench it up out of the earth
  { const [s1] = hit('c5', 1), [s2] = hit('c5', 2), F = M.c5.frames, c = M.c5.cancel;
    const air = (f, y = 0.55) => ({ fL: [0.18, y, lz('c5', f) + 0.25, -30, 15], fR: [-0.18, y - 0.05, lz('c5', f) - 0.1, -20, -30] });
    const keys = [[0, G],
      [10, { hips: [0, 0.66, 0], hipsR: [14, -10, 0], spine: [12, 0, 0], chest: [8, 0, 0], head: [0, 0, 0], spear: [-0.28, 0.98, -0.14, 0, 36, 0], gripL: GR }, 'out'],
      [18, { ...HIGH, hips: [0, 1.0, 0.1], spear: whirl(0, 1.9), ...air(18) }, 'out']];
    for (let k = 0; k <= 5; k++) keys.push([24 + k * 2, { ...HIGH, hips: [0, 1.0, 0.1], spear: whirl(-k * 72, 1.92), ...air(24 + k * 2) }, 'lin']);
    keys.push([38, { ...HIGH, hips: [0, 1.04, 0.14], chest: [-16, 0, 0], spear: [-0.17, 1.72, -0.1, -360, 146, 0], ...air(38, 0.45) }, 'io'],
      [s1, { ...CLEAVE, hips: [0, 0.56, 0.3], spear: [-0.1, 0.86, 0.56, -360, -60, 0], ...wide('c5', s1) }, 'snap'],
      [s2 - 5, { ...CLEAVE, hips: [0, 0.54, 0.3], spear: [-0.1, 0.84, 0.56, -360, -62, 0] }, 'io'],
      [s2 + 1, { ...RISE, hips: [0, 0.92, 0.22], chest: [-14, 0, 0], head: [-8, 0, 0], spear: [-0.12, 1.42, 0.4, -360, 50, 0] }, 'snap'],
      [c, { ...HIGH, spear: [-0.14, 1.62, 0.1, -360, 112, 0] }, 'io'], [F, { ...G, spear: [-0.27, 1.02, 0.02, 26 - 360, 26, 0] }]);
    out.c5 = clipF('c5', keys); }
  // C6 青龍昇天: rising launch cut · double whirl overhead, a ring of crescents flung off it · the hop and the crash
  { const [s] = hit('c6', 0), [w0, w1] = hit('c6', 1), [s3] = hit('c6', 3), F = M.c6.frames, c = M.c6.cancel;
    const keys = [[0, { ...HIGH, spear: [-0.14, 1.66, 0.08, 0, 118, 0] }],
      [8, { ...CROUCH, spear: [-0.22, 0.64, 0.32, -8, -42, 0], ...wide('c6', 8) }, 'out'],
      [s - 1, { ...CROUCH, hips: [0, 0.6, 0.14], spear: [-0.22, 0.62, 0.34, -6, -46, 0] }, 'io'],
      [s + 1, { ...RISE, spear: [-0.12, 1.2, 0.42, 0, 34, 0] }, 'snap'],
      [s + 8, { ...HIGH, hips: [0, 0.98, 0.18], chest: [-16, 0, 0], head: [-12, 0, 0], spear: [-0.12, 1.74, 0.12, 0, 110, 0] }, 'out'],
      [w0 - 1, { ...HIGH, spear: whirl(0, 1.92, 6) }, 'io']];
    for (let k = 0; k <= 9; k++) keys.push([w0 + k * 2, { ...HIGH, hips: [0, 0.9, 0.04], spear: whirl(-k * 80, 1.92) }, 'lin']);
    keys.push([w1 + 8, { ...HIGH, hips: [0, 1.06, 0.1], spear: [-0.17, 1.7, -0.1, -720, 140, 0], fL: [0.22, 0.4, lz('c6', w1 + 8) + 0.3, -30, 15] }, 'out'],
      [s3 - 4, { ...HIGH, hips: [0, 1.14, 0.22], chest: [-18, 0, 0], head: [-10, 0, 0], spear: [-0.17, 1.76, -0.12, -720, 152, 0] }, 'io'],
      [s3 + 1, { ...CLEAVE, hips: [0, 0.54, 0.34], hipsR: [32, -6, 0], spine: [22, 0, 0], chest: [18, 0, 0], spear: [-0.1, 0.86, 0.62, -720, -46, 0], ...wide('c6', s3 + 1, 0.2) }, 'snap'],
      [s3 + 24, { ...CLEAVE, hips: [0, 0.56, 0.32], spear: [-0.1, 0.88, 0.62, -720, -44, 0] }, 'io'],
      [c, { ...CLEAVE, hips: [0, 0.7, 0.24], spear: [-0.12, 1.0, 0.5, -720, -26, 0] }, 'io'],
      [F, { ...G, spear: [-0.27, 1.02, 0.02, 26 - 720, 26, 0] }]);
    out.c6 = clipF('c6', keys); }
  // dash 拖刀計: running with the blade dragged low behind in his right hand, the left arm pumping; planted, ripped up
  { const [s2] = hit('dash', 1), F = M.dash.frames, c = M.dash.cancel;
    const run = { hips: [0, 0.8, 0.12], hipsR: [18, -30, 0], spine: [8, -8, 0], chest: [8, -10, 0], head: [0, 8, 0], spear: [-0.34, 0.86, -0.3, -168, -14, 0],
      gripL: GR, lfree: 1, armL: [30, 0, 16, 80] };
    const keys = [[0, G], [4, run, 'out'], [40, { ...run, hips: [0, 0.78, 0.14], armL: [-20, 0, 16, 90] }]];
    for (let f = 5, j = 0; f < 44; f += 5, j ^= 1) {                     // a stride every 5 frames just ahead of the root
      const z = lz('dash', f) + 0.3;
      keys.push(ft(f - 2.5, j ? null : [0.14, 0.3, z - 0.3, -20, 5], j ? [-0.14, 0.3, z - 0.3, -20, -5] : null), ft(f, j ? null : [0.14, 0.08, z, 0, 5], j ? [-0.14, 0.08, z, 0, -5] : null));
    }
    keys.push([s2 - 3, { hips: [0, 0.64, 0.2], hipsR: [22, -36, 0], spine: [14, -10, 0], chest: [8, -12, 0], head: [0, 0, 0], spear: [-0.34, 0.7, 0.08, -36, -40, 0], gripL: GR,
      lfree: 0, ...wide('dash', s2 - 3) }, 'in'],
      [s2 + 1, { hips: [0, 0.94, 0.24], hipsR: [-8, 20, 0], spine: [-6, 6, 0], chest: [-12, 16, 0], head: [-10, 0, 0], spear: [0, 1.46, 0.3, 30, 74, 0], gripL: GR }, 'snap'],
      [c, { ...HIGH, hips: [0, 0.92, 0.16], spear: [-0.1, 1.64, 0.1, 10, 112, 0] }, 'io'], [F, G]);
    out.dash = clipF('dash', keys); }
  // air string: jatk high right → low left · ja2 rising backhand low left → high right · ja3 overhead cleave
  const A0 = { hips: [0, 0.95, 0.04], hipsR: [6, 10, 0], ...AIRF, spear: [0, 1.04, 0.26, 40, -24, 0], gripL: GR };
  const A1 = { hips: [0, 0.97, 0.02], hipsR: [-4, -20, 0], ...AIRF, spear: [-0.26, 1.46, 0.08, -50, 45, 0], gripL: GR };
  { const [s, e] = hit('jatk'), F = M.jatk.frames;
    out.jatk = clipF('jatk', [[0, { hips: [0, 0.95, 0], ...AIRF, spear: [-0.2, 1.2, -0.1, 30, 30, 0], gripL: GR }],
      [s - 2, { hips: [0, 0.98, 0], hipsR: [-4, -45, 0], chest: [-8, -20, 0], ...AIRF, spear: [-0.3, 1.52, -0.05, -72, 50, 0], gripL: GR }, 'out'],
      [e, { hips: [0, 0.95, 0.06], hipsR: [12, 30, 0], chest: [14, 20, 0], ...AIRF, spear: [0.08, 1.0, 0.3, 62, -40, 0], gripL: GR }, 'in'], [F, A0]]); }
  { const [s, e] = hit('ja2'), F = M.ja2.frames;
    out.ja2 = clipF('ja2', [[0, A0],
      [s - 2, { hips: [0, 0.96, 0], hipsR: [8, 40, 0], chest: [10, 24, 0], ...AIRF, spear: [0.1, 0.9, 0.2, 82, -40, 0], gripL: GR }, 'out'],
      [e, { hips: [0, 0.98, 0.04], hipsR: [-8, -40, 0], chest: [-12, -24, 0], head: [-6, 0, 0], ...AIRF, spear: [-0.3, 1.56, 0.1, -72, 55, 0], gripL: GR }, 'in'], [F, A1]]); }
  { const [s] = hit('ja3'), F = M.ja3.frames;
    out.ja3 = clipF('ja3', [[0, A1],
      [s - 3, { ...HIGH, hips: [0, 1.0, 0], ...AIRF, spear: [-0.18, 1.84, -0.06, 0, 150, 0] }, 'out'],
      [s + 1, { ...CLEAVE, hips: [0, 0.9, 0.16], ...AIRF, spear: [-0.12, 1.0, 0.5, 0, -50, 0] }, 'snap'],
      [F, { ...CLEAVE, hips: [0, 0.92, 0.12], ...AIRF, spear: [-0.12, 1.04, 0.48, 0, -40, 0] }]]); }
  // jump charge: blade raised through the hang, the plunge, a cleave into the ground on landing
  { const L = M.jc.landFrame, F = M.jc.frames, D = M.jc.plunge[0], c = M.jc.cancel;
    const air = (y) => ({ fL: [0.16, y, 0.14, -30, 10], fR: [-0.18, y - 0.08, -0.12, 20, -20] });
    const land = { ...CLEAVE, hips: [0, 0.6, 0.26], spear: [-0.1, 0.9, 0.52, 0, -50, 0], fL: [0.3, 0.08, 0.5, 0, 25], fR: [-0.3, 0.08, -0.3, 0, -50] };
    out.jc = clipF('jc', [[0, { hips: [0, 0.95, 0], ...air(0.36), spear: [-0.2, 1.2, -0.1, 30, 30, 0], gripL: GR }],
      [5, { ...HIGH, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.18, 1.8, 0, 0, 140, 0] }, 'out'],
      [D - 1, { ...HIGH, hips: [0, 1.0, 0.04], ...air(0.5), spear: [-0.18, 1.84, -0.04, 0, 150, 0] }],
      [L - 1, { ...CLEAVE, hips: [0, 0.96, 0.16], ...air(0.4), spear: [-0.12, 1.36, 0.4, 0, 10, 0] }, 'in'],
      [L, land, 'snap'],
      [c, { ...land, hips: [0, 0.68, 0.22], spear: [-0.1, 0.94, 0.5, 0, -40, 0] }, 'io'], [F, G]]); }
  // locomotion: the glaive planted upright at his right side, blade turned out, the left hand stroking his beard
  Object.assign(out, locoClips({
    idle: { hips: [0, 0.9, 0], hipsR: [0, -14, 0], spine: [2, -2, 0], chest: [-4, -4, 0], head: [-2, 4, 0],
      footL: [0.2, 0.08, 0.18, 0, 16], footR: [-0.22, 0.08, -0.16, 0, -24], spear: [-0.3, 0.98, 0.1, 0, 84, 90], gripR: 0, gripL: GR, ...BEARD },
    breath: { hips: [0, 0.894, 0], chest: [-6, -4, 0], armL: [-18, -60, 30, 111] },
    takeoff: { hips: [0, 0.98, 0], hipsR: [-6, -10, 0], chest: [-6, 5, 0], head: [-6, 0, 0], spear: [-0.3, 1.1, -0.12, -150, 20, 0], gripL: GR },
    apex: { hips: [0, 0.95, 0], hipsR: [-6, -8, 0], chest: [-8, 0, 0], head: [0, 0, 0], spear: [-0.18, 1.62, -0.05, 0, 118, 0], gripL: GR },
    fall: { hips: [0, 0.95, 0], hipsR: [-8, 0, 0], chest: [-8, 0, 0], head: [10, 0, 0], spear: [-0.36, 1.3, 0.1, -100, 20, 0], gripL: GR },
    land: { hips: [0, 0.6, 0.08], hipsR: [28, -10, 0], spine: [12, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], footL: [0.28, 0.08, 0.34, 0, 18], footR: [-0.28, 0.08, -0.24, 0, -36],
      spear: [-0.2, 0.92, 0.4, 0, -28, 0], gripL: GR },
    hurt: { hips: [0, 0.86, -0.12], hipsR: [-16, -30, 6], spine: [-12, 0, 0], chest: [-10, 0, 0], head: [-18, 0, 0], spear: [-0.3, 1.1, -0.1, -20, 60, 0], gripL: GR },
  }));
  return out;
}

// ---------------------------------------------------------------- 真・無雙 青龍偃月・天斬 (musou/scripted.js)
const MU = (dmg, kb, force, lift, extra) => ({ shape: 'circle', range: 5, dmg, kb, force, lift, hitstop: 0, yMax: 5, ...extra });
const WAVE = (proj, dmg = 24) => ({ every: ONCE, dmg, kb: 'blow', force: 10, lift: 6, hitstop: 0, proj: { speed: 20, life: 30, r: 2.6, kind: 'crescent', ...proj } });
const IDLE = { hips: [0, 0.9, 0], hipsR: [0, -14, 0], spine: [2, -2, 0], chest: [-6, -4, 0], head: [-8, 4, 0], spear: [-0.3, 0.98, 0.1, 0, 84, 90], gripR: 0, gripL: GR, ...BEARD };
export const musou = {
  act: IDLE,                                                                  // stroking the beard …
  act2: { ...IDLE, chest: [-10, -4, 0], head: [-16, 0, 0], armL: [-28, -60, 30, 118] },   // … and he lifts his eyes
  face: { hips: [0, 0.9, 0], hipsR: [0, -20, 0], spine: [2, -6, 0], chest: [-2, -8, 0], head: [4, -18, 0], spear: [-0.3, 1.0, 0.1, 0, 84, 90], gripR: 0, gripL: GR,
    lfree: 1, armL: [-40, 10, 40, 30] },
  ready: { hips: [0, 0.8, 0.12], hipsR: [18, -30, 0], spine: [8, -8, 0], chest: [8, -10, 0], head: [0, 8, 0], spear: [-0.34, 0.86, -0.3, -168, -14, 0], gripL: GR,
    lfree: 1, armL: [30, 0, 16, 80] },
  // 拖刀 charge (100-112) · cleave throwing a crescent (112-124) · coil, CONTACT 132: the towering slash (a huge crescent,
  // the dragon rises) · wide cleave throwing three (140-152) · spinning sweep (152-166) · the hop (166-176) · FINISHER: the
  // crash, a ring of twelve crescents
  seq: [[100, 112, 'dash', 0.05, 0.5], [112, 124, 'n3', 0.12, 0.62], [124, 132, 'c1', 0.14, 0.38], [132, 140, 'c1', 0.38, 0.6],
    [140, 152, 'n2', 0.12, 0.75], [152, 166, 'n4', 0.2, 0.8], [166, 176, 'n6', 0.55, 0.66]],
  fin: ['n6', 0.66, 1],
  travel: [[100, 112, 6], [112, 118, 1.0], [140, 146, 0.8], [152, 166, 1.2], [166, 176, 1.2]],
  hits: [[106, MU(10, 'push', 8, 2, { shape: 'line', len: 3, width: 3 }), 0, 3, 112],
    [118, MU(26, 'launch', 4, 10, { shape: 'line', len: 8, width: 4 })],
    [132, MU(42, 'blow', 12, 8, { shape: 'line', len: 13, width: 5.5, heavy: true, hitstop: 4 })],
    [138, MU(18, 'blow', 10, 6, { shape: 'arc', range: 9, ang: 240 })],
    [144, MU(24, 'blow', 11, 6, { shape: 'arc', range: 7, ang: 220 })],
    [152, MU(12, 'spin', 6, 4, { range: 5.5 }), 0, 3, 165]],
  proj: [[118, WAVE({})], [132, WAVE({ r: 4.2, speed: 19, life: 42 }, 30)], [144, WAVE({ count: 3, spread: 70 })]],
  fx: [[132, 'slam', 7, 2.5], [132, 'aura', 5, 2]],
  finFx: [['slam', 12], ['rocks', 12], ['aura', 8]],
  finProj: [WAVE({ count: 12, spread: 360, speed: 18, life: 34, r: 2.4 })],
};
