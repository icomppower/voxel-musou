// 諸葛亮's moveset (def-kit moveset: src/chars/defkit.js header) — the strategist never brawls: light gliding steps, the
// 白羽扇 flicked one-handed, the left hand open or held in a two-finger seal, every blow thrown as wind or light. Every
// normal throws readable wind blades (proj windows, kind 'wind': src/musou/scripted.js waves, drawn by chars/kitview.js);
// beams (`beam`) on N5 C1 C3 dash and the air finisher; C6 draws an 八陣 sigil on the ground ahead that binds and then
// detonates (`sigil` 1 / 2: drawn by ./fx.js). Data like src/hero/moves.js; clips frame-keyed with the shared author.
// Weapon axes: origin = the handle in his right hand, +Z out through the feathers (and the wind blade: ./model.js).
//   N1 rising flick low-right → high-left, a blade · N2 backhand flick, a blade · N3 wound far round, a wide flick: two blades
//   N4 a step back, the fan cocked by his ear, then thrown forward: three blades · N5 the fan raised overhead and brought
//   down: a beam of light (and two blades) · N6 a full turn with the fan held out: a ring of eight blades
//   C1 (neutral) he gathers light at the sky, then thrusts the fan: a long beam · C2 (N1→) whirlwind rising round him,
//   gold pillars (launcher) · C3 (N2→) retreating volley of blade pairs, then a beam · C4 (N3→) three turns, a ring of
//   blades every turn · C5 (N4→) the fan to the sky, two sweeps: light rains down in a fan ahead
//   C6 (N5→) 八陣: the fan flung down draws a trigram sigil on the ground 4.6 m ahead; those inside are held (flinch
//        ticks) while he holds the seal, then his palm drops and the sigil detonates in eight columns of light (launch)
//   dash: glides in throwing blades, then a beam · jump: flick ↓ · flick · the fan thrust down: a beam and three blades
//   (air string) · jump charge: the fan to the sky through the hang, lands in a ring of ten blades
// Musou 東風・八陣 (musou/scripted.js): the east wind rises round him and a vast 八卦 sigil opens under the field ·
// eight beams · light rains down marching ahead (CONTACT) · rings of blades · the seal — FINISHER: the sigil detonates,
// beams in twelve directions, a ring of sixteen blades and the shared ring wave.
import { locoClips } from '../loco.js';

const ONCE = 99;
export const airChainMax = 6;

/** A wind-blade window at frame f (proj overrides p, hit overrides h). */
const WB = (f, p = {}, h = {}) => ({ f: [f, f], every: ONCE, proj: { count: 1, speed: 24, life: 24, r: 1.25, kind: 'wind', ...p }, dmg: 11, kb: 'flinch', force: 3, hitstop: 0, ...h });
/** The fan's own short cut round him (the blade does the reaching). */
const CUT = (f, range, ang, dmg, kb, force, extra) => ({ f: [f, f + 2], every: ONCE, shape: 'arc', range, ang, dmg, kb, force, hitstop: 2, ...extra });
// C6: the sigil's square on the ground ahead (line box: off .. off + len, width across), r ≈ 3.1 m round 4.6 m ahead
export const SIGIL = { off: 1.5, len: 6.2, width: 6.2 };

export function moves() {
  return {
    n1: { frames: 30, next: 'n2', charge: 'c2', cancel: 20, branch: 11, dodgeCancel: 11, steer: 6, lunge: [[2, 8, 0.35]],
      hits: [CUT(8, 2.5, 130, 8, 'flinch', 2, { sweep: 1 }), WB(9)] },
    n2: { frames: 30, next: 'n3', charge: 'c3', cancel: 20, branch: 11, dodgeCancel: 11, steer: 6, lunge: [[2, 8, 0.35]],
      hits: [CUT(8, 2.5, 130, 8, 'flinch', 2, { sweep: -1 }), WB(9)] },
    n3: { frames: 34, next: 'n4', charge: 'c4', cancel: 23, branch: 15, dodgeCancel: 15, steer: 6, lunge: [[3, 12, 0.45]],
      hits: [CUT(11, 2.6, 200, 9, 'push', 4, { sweep: -1 }), WB(12, { count: 2, spread: 34 })] },
    n4: { frames: 40, next: 'n5', charge: 'c5', cancel: 27, branch: 19, dodgeCancel: 19, steer: 6, lunge: [[0, 8, -0.7], [12, 17, 0.7]],
      hits: [{ f: [15, 17], every: ONCE, shape: 'line', len: 2.8, width: 1.4, dmg: 10, kb: 'push', force: 5, hitstop: 3 }, WB(15, { count: 3, spread: 44 })] },
    n5: { frames: 44, next: 'n6', charge: 'c6', cancel: 31, branch: 21, dodgeCancel: 21, steer: 6, lunge: [[4, 12, 0.3]],
      hits: [{ f: [18, 21], every: ONCE, shape: 'line', len: 9, width: 1.8, dmg: 17, kb: 'blow', force: 9, lift: 4, hitstop: 5, heavy: true, beam: true },
        WB(18, { count: 2, spread: 28, r: 1.1 })] },
    n6: { frames: 56, next: 'n1', charge: 'c1', cancel: 46, dodgeCancel: 32, steer: 6, lunge: [[6, 22, 0.6]], armor: true,
      hits: [{ f: [14, 24], sweep: 1, sweepN: 10, shape: 'circle', range: 2.9, dmg: 11, kb: 'push', force: 6, hitstop: 3 },
        WB(22, { count: 8, spread: 360, speed: 19 }, { dmg: 13, kb: 'blow', force: 8, lift: 4 })] },

    c1: { frames: 72, cancel: 64, dodgeCancel: 44, steer: 14, lunge: [[24, 30, -0.5]], armor: true,
      hits: [{ f: [30, 38], every: 3, shape: 'line', len: 13, width: 2.2, dmg: 11, kb: 'blow', force: 10, lift: 4, hitstop: 3, heavy: true, beam: true }] },
    c2: { frames: 64, cancel: 56, dodgeCancel: 36, steer: 10, armor: true,
      hits: [{ f: [20, 34], every: 5, shape: 'circle', range: 3.8, dmg: 10, kb: 'launch', force: 2, lift: 9, hitstop: 3, heavy: true, pillars: 8 }] },
    c3: { frames: 92, cancel: 84, dodgeCancel: 68, steer: 12, lunge: [[12, 54, -2.4]], armor: true,
      hits: [{ f: [14, 50], every: 6, proj: { count: 2, spread: 26, speed: 23, life: 24, r: 1.15, kind: 'wind' }, dmg: 8, kb: 'flinch', force: 3, hitstop: 0 },
        { f: [62, 64], every: ONCE, shape: 'line', len: 11, width: 2.4, dmg: 22, kb: 'blow', force: 12, lift: 5, hitstop: 6, heavy: true, beam: true }] },
    c4: { frames: 80, cancel: 72, dodgeCancel: 54, steer: 14, armor: true,
      hits: [{ f: [22, 46], every: 8, shape: 'circle', range: 3.4, dmg: 8, kb: 'spin', force: 5, lift: 2, hitstop: 2 },
        { f: [22, 42], every: 10, proj: { count: 8, spread: 360, speed: 18, life: 22, r: 1.15, kind: 'wind' }, dmg: 8, kb: 'spin', force: 4, lift: 2, hitstop: 0 }] },
    c5: { frames: 90, cancel: 82, dodgeCancel: 62, steer: 14, armor: true,
      hits: [{ f: [34, 36], every: ONCE, shape: 'arc', range: 8, ang: 130, dmg: 24, kb: 'launch', force: 3, lift: 10, hitstop: 7, heavy: true, rain: 7 },
        { f: [50, 52], every: ONCE, shape: 'arc', range: 9, ang: 150, dmg: 20, kb: 'blow', force: 10, lift: 6, hitstop: 5, heavy: true, rain: 8 }] },
    c6: { frames: 96, cancel: 88, dodgeCancel: 64, steer: 8, lunge: [[2, 12, -0.4]], armor: true,
      hits: [{ f: [18, 50], every: 8, shape: 'line', ...SIGIL, dmg: 4, kb: 'flinch', force: 1, hitstop: 0, sigil: 1 },
        { f: [58, 58], every: ONCE, shape: 'line', ...SIGIL, dmg: 30, kb: 'launch', force: 3, lift: 12, hitstop: 7, heavy: true, sigil: 2 }] },

    dash: { frames: 76, cancel: 68, dodgeCancel: 46, steer: 3, lunge: [[0, 34, 5.2, 'lin'], [34, 40, 0.6]],
      hits: [{ f: [8, 30], every: 11, proj: { count: 1, speed: 24, life: 20, r: 1.1, kind: 'wind' }, dmg: 8, kb: 'flinch', force: 3, hitstop: 0 },
        { f: [42, 46], every: ONCE, shape: 'line', len: 10, width: 2, dmg: 20, kb: 'blow', force: 11, lift: 4, hitstop: 5, heavy: true, beam: true }] },
    jatk: { frames: 24, air: true, hover: 2.8, next: 'ja2', charge: 'jc', cancel: 12, dodgeCancel: 99, steer: 3,
      hits: [CUT(5, 2.6, 160, 8, 'flinch', 2, { f: [5, 8], yMax: 4.5 }), WB(6, { y: 0.5, speed: 22, life: 20 })] },
    ja2: { frames: 24, air: true, hover: 2.8, next: 'ja3', charge: 'jc', cancel: 12, dodgeCancel: 99, steer: 3,
      hits: [CUT(5, 2.6, 160, 8, 'flinch', 2, { f: [5, 8], sweep: -1, yMax: 4.5 }), WB(6, { y: 0.5, speed: 22, life: 20 })] },
    ja3: { frames: 30, air: true, hover: 2.2, next: 'jatk', charge: 'jc', cancel: 18, dodgeCancel: 99, steer: 3,
      hits: [{ f: [10, 12], every: ONCE, shape: 'line', len: 7, width: 1.8, dmg: 16, kb: 'blow', force: 8, lift: 3, hitstop: 4, heavy: true, beam: true, yMax: 5 },
        WB(10, { count: 3, spread: 46, y: 0.3, speed: 22, life: 20 })] },
    // (jc: his own hang / landing timing — anims/locomotion.js reads the kit's jc)
    jc: { frames: 56, air: true, hover: 3, landFrame: 34, hang: [6, 30], plunge: [30, -60], cancel: 50, dodgeCancel: 40, steer: 12, armor: true,
      hits: [{ f: [34, 37], every: ONCE, shape: 'circle', range: 4.2, dmg: 18, kb: 'launch', force: 4, lift: 8, hitstop: 6, heavy: true },
        WB(34, { count: 10, spread: 360, speed: 19, life: 22, r: 1.2, y: 0.8 }, { dmg: 12, kb: 'launch', force: 4, lift: 6 })] },
  };
}

export const entry = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4', c6: 'n5', ja2: 'jatk', ja3: 'ja2' };

// ---------------------------------------------------------------- poses (fan = the weapon channels, one-handed)
// fan positions [x, y, z, yaw, elev, roll] (roll 0: the fan's face to the side, 90: to the front)
const F = {
  rest: [-0.24, 0.9, 0.18, -14, 62, 60],       // upright before the right of his chest, below the chin
  lowR: [-0.44, 0.94, -0.02, -105, -12, 0],   // cocked low at the right hip
  highL: [0.16, 1.5, 0.26, 100, 34, 0],       // swept up to the left
  thru: [-0.14, 1.26, 0.46, 4, 10, 0],        // flat through the front
  backL: [0.1, 1.3, 0.2, 100, 20, 180],       // cocked across to the left
  endR: [-0.5, 1.16, 0.06, -118, 2, 180],     // follow-through to the right
  ear: [-0.3, 1.52, -0.12, -20, 60, 90],      // cocked by his ear
  cast: [-0.12, 1.34, 0.52, 0, 8, 90],        // thrust out, the face to the foe
  over: [-0.16, 1.76, -0.1, 0, 136, 90],      // raised over his head
  down: [-0.18, 1.1, 0.48, 0, -18, 90],       // brought down before him
  side: [0.14, 1.22, 0.34, 88, 0, 0],         // held out to the left (turns)
  sky: [-0.1, 1.84, 0.12, 0, 100, 90],        // pointed at the sky
  aim: [-0.2, 1.36, 0.0, 0, 18, 90],          // drawn back
};
// left arm FK [pitch, twist, out, elbow]
const LA = {
  sash: [-22, 0, 14, 100],     // the hand before his waist, at ease
  seal: [-62, -20, 10, 128],   // two-finger seal before his face
  palm: [-80, -10, -6, 12],    // arm out at the foe, palm open
  sky: [-155, 0, -14, 18],     // raised to the sky
  wide: [-40, 0, 70, 30],      // flung out for balance
  press: [-50, 0, 8, 20],      // palm pressed down before him (the sigil's trigger)
};
const fan = (spear, armL = LA.sash) => ({ spear, gripR: 0, gripL: 0.3, lfree: 1, armL });
/** Upright body: turn° (+ = to his left), pelvis height, forward lean°, pelvis forward (head keeps the target). */
const bd = (turn = 0, drop = 0.88, lean = 2, fwd = 0.02) => ({ hips: [0, drop, fwd], hipsR: [lean, turn, 0], spine: [lean, turn * 0.3, 0],
  chest: [lean * 0.5, turn * 0.4, 0], head: [0, -turn * 0.35, 0] });
const REST = { ...bd(-14, 0.88, 1), head: [-2, 8, 0], ...fan(F.rest) };
const AIRF = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };

export function clips(A, M) {
  const { clipF, lungeAt: lz, body, ft, hit } = A;
  const step = (id, f, fwd = 0.4) => ({ fL: [0.18, 0.08, lz(id, f) + 0.3 + fwd, 0, 12], fR: [-0.2, 0.08, lz(id, f) - 0.26, 0, -30] });
  const out = {};
  /** A flick: cocked (s − 5), through (s + 1, snap), follow-through (e + 4), held to the cancel, back to rest. */
  const flick = (id, from, to, ta, tb, arm = LA.sash) => {
    const [s, e] = hit(id), Fr = M[id].frames, c = M[id].cancel;
    return clipF(id, [[0, REST],
      [s - 5, { ...bd(ta, 0.86, 3), ...fan(F[from], arm) }, 'out'],
      [s + 1, { ...bd(0, 0.84, 6), ...fan(F.thru, arm), ...step(id, s + 1) }, 'snap'],
      [e + 4, { ...bd(tb, 0.87, 3), ...fan(F[to], LA.wide) }, 'out'],
      [c, { ...bd(tb * 0.8, 0.88, 2), ...fan(F[to], LA.wide) }, 'io'],
      [Fr, REST]]);
  };
  out.n1 = flick('n1', 'lowR', 'highL', -38, 34);
  out.n2 = flick('n2', 'backL', 'endR', 36, -38, LA.wide);
  out.n3 = flick('n3', 'backL', 'endR', 58, -40, LA.wide);                                // wound far round, the widest sweep
  // N4 a step back, the fan cocked by his ear and the seal raised, then thrown forward
  { const [s] = hit('n4'), Fr = M.n4.frames, c = M.n4.cancel;
    out.n4 = clipF('n4', [[0, REST],
      [8, { ...bd(-18, 0.84, -4), ...fan(F.ear, LA.seal), fL: [0.2, 0.08, lz('n4', 8) + 0.2, 0, 12], fR: [-0.22, 0.08, lz('n4', 8) - 0.42, 0, -30] }, 'out'],
      [s - 2, { ...bd(-24, 0.82, 0), ...fan([-0.32, 1.56, -0.18, -24, 70, 90], LA.seal) }, 'io'],
      [s, { ...bd(-6, 0.8, 8), hips: [0, 0.8, 0.18], ...fan(F.cast, LA.palm), ...step('n4', s, 0.5) }, 'snap'],
      [c, { ...bd(-6, 0.84, 6), hips: [0, 0.84, 0.12], ...fan(F.cast, LA.palm) }, 'io'], [Fr, REST]]); }
  // N5 the fan raised overhead, the left hand to the sky, brought down: the beam
  { const [s] = hit('n5'), Fr = M.n5.frames, c = M.n5.cancel;
    out.n5 = clipF('n5', [[0, REST],
      [s - 9, { ...bd(0, 0.92, -6), ...fan(F.over, LA.sky) }, 'out'],
      [s - 2, { ...bd(0, 0.94, -9), ...fan([-0.16, 1.8, -0.12, 0, 146, 90], LA.sky) }, 'io'],
      [s, { ...bd(0, 0.82, 10), ...fan(F.down, LA.palm), ...step('n5', s, 0.3) }, 'snap'],
      [c, { ...bd(0, 0.84, 8), ...fan(F.down, LA.palm) }, 'io'], [Fr, REST]]); }
  // N6 a full turn, the fan held out; the ring of blades leaves at the end of it; he rises, fan to the sky
  { const [s, e] = hit('n6'), Fr = M.n6.frames, c = M.n6.cancel;
    const sp = (f) => 360 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const keys = [[0, REST], [s - 5, { ...bd(-30, 0.86, 4), ...fan(F.lowR, LA.wide) }, 'out']];
    for (let f = s; f <= e; f += 2) keys.push([f, { ...bd(0, 0.84, 4), spin: sp(f), ...fan(F.side, LA.wide) }, 'lin']);
    keys.push([e + 6, { ...bd(0, 0.9, -4), spin: 360, ...fan(F.sky, LA.sky) }, 'out'], [c, { ...bd(0, 0.9, -2), spin: 360, ...fan(F.sky, LA.sky) }, 'io'],
      [Fr, { ...REST, spin: 360 }]);
    for (let f = s + 2, i = 0; f <= e; f += 4, i++) keys.push(ft(f, i % 2 ? body('n6', f, sp(f), [0.2, 0.08, 0.26, 0, 12]) : null, i % 2 ? null : body('n6', f, sp(f), [-0.22, 0.08, -0.22, 0, -30])));
    keys.push(ft(Fr, [0.17, 0.08, 0.3 + lz('n6', Fr), 0, 15 + 360], [-0.2, 0.08, -0.26 + lz('n6', Fr), 0, -30 + 360]));
    out.n6 = clipF('n6', keys); }
  // C1 light gathered at the sky, the fan drawn back, then thrust out: the long beam, held
  { const [s, e] = hit('c1'), Fr = M.c1.frames, c = M.c1.cancel;
    out.c1 = clipF('c1', [[0, REST],
      [10, { ...bd(0, 0.9, -4), ...fan(F.sky, LA.seal) }, 'out'],
      [22, { ...bd(-28, 0.84, 0), ...fan(F.aim, LA.palm), fL: [0.24, 0.08, 0.5, 0, 12], fR: [-0.24, 0.08, -0.36, 0, -40] }, 'io'],
      [s, { ...bd(-18, 0.8, 8), hips: [0, 0.8, 0.14], ...fan(F.cast, LA.palm) }, 'snap'],
      [e + 6, { ...bd(-18, 0.82, 8), hips: [0, 0.82, 0.12], ...fan([-0.14, 1.38, 0.54, 0, 8, 90], LA.palm) }, 'io'],
      [c, { ...bd(-16, 0.86, 4), ...fan(F.cast, LA.palm) }, 'io'], [Fr, REST]]); }
  // C2 whirlwind: swept low round him, turning up into the fan raised to the sky
  { const [s, e] = hit('c2'), Fr = M.c2.frames, c = M.c2.cancel;
    out.c2 = clipF('c2', [[0, REST],
      [s - 6, { ...bd(40, 0.8, 8), ...fan([0.1, 0.96, 0.24, 100, -20, 0], LA.wide) }, 'out'],
      [s, { ...bd(0, 0.86, 0), spin: 180, ...fan(F.side, LA.wide) }, 'lin'],
      [s + 6, { ...bd(0, 0.92, -6), spin: 360, ...fan(F.sky, LA.sky) }, 'out'],
      [e, { ...bd(0, 0.94, -8), spin: 360, ...fan([-0.12, 1.88, 0.14, 0, 100, 90], LA.sky) }, 'io'],
      [c, { ...bd(0, 0.9, -4), spin: 360, ...fan(F.sky, LA.sky) }, 'io'], [Fr, { ...REST, spin: 360 }],
      ft(s + 3, null, body('c2', s + 3, 180, [-0.22, 0.08, -0.22, 0, -30])), ft(s + 6, body('c2', s + 6, 360, [0.2, 0.08, 0.26, 0, 12]), null),
      ft(Fr, [0.17, 0.08, 0.3, 0, 15 + 360], [-0.2, 0.08, -0.26, 0, -30 + 360])]); }
  // C3 retreating volley: alternating flicks as he steps back, then the beam
  { const [s, e] = hit('c3', 0), [s2] = hit('c3', 1), Fr = M.c3.frames, c = M.c3.cancel;
    const keys = [[0, REST], [s - 4, { ...bd(-30, 0.86, -2), ...fan(F.lowR, LA.wide) }, 'out']];
    for (let f = s, k = 0; f < e; f += 6, k++) {
      keys.push([f + 1, { ...bd(0, 0.86, 2), ...fan(F.thru, LA.wide) }, 'snap'], [f + 4, { ...bd(k & 1 ? -30 : 30, 0.86, -2), ...fan(k & 1 ? F.lowR : F.backL, LA.wide) }, 'io']);
      keys.push(ft(f + 3, k & 1 ? null : [0.18, 0.08, lz('c3', f + 3) + 0.2, 0, 12], k & 1 ? [-0.2, 0.08, lz('c3', f + 3) - 0.4, 0, -30] : null));
    }
    keys.push([s2 - 4, { ...bd(-24, 0.84, 0), ...fan(F.aim, LA.palm) }, 'io'], [s2, { ...bd(-16, 0.8, 8), ...fan(F.cast, LA.palm) }, 'snap'],
      [c, { ...bd(-16, 0.84, 6), ...fan(F.cast, LA.palm) }, 'io'], [Fr, REST]);
    out.c3 = clipF('c3', keys); }
  // C4 three turns with the fan held out, a ring of blades off each
  { const [s, e] = hit('c4'), Fr = M.c4.frames, c = M.c4.cancel;
    const sp = (f) => 1080 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const keys = [[0, REST], [s - 6, { ...bd(-30, 0.86, 2), ...fan(F.lowR, LA.wide) }, 'out']];
    for (let f = s; f <= e; f += 3) keys.push([f, { ...bd(0, 0.86, 2), spin: sp(f), ...fan(F.side, LA.wide) }, 'lin']);
    keys.push([c, { ...bd(0, 0.88, 0), spin: 1080, ...fan(F.sky, LA.sky) }, 'io'], [Fr, { ...REST, spin: 1080 }]);
    for (let f = s + 2, i = 0; f <= e; f += 4, i++) keys.push(ft(f, i % 2 ? body('c4', f, sp(f), [0.2, 0.08, 0.26, 0, 12]) : null, i % 2 ? null : body('c4', f, sp(f), [-0.22, 0.08, -0.22, 0, -30])));
    keys.push(ft(Fr, [0.17, 0.08, 0.3, 0, 15 + 1080], [-0.2, 0.08, -0.26, 0, -30 + 1080]));
    out.c4 = clipF('c4', keys); }
  // C5 the fan raised to the sky, two sweeps down: the light rains
  { const [s1] = hit('c5', 0), [s2] = hit('c5', 1), Fr = M.c5.frames, c = M.c5.cancel;
    out.c5 = clipF('c5', [[0, REST],
      [18, { ...bd(0, 0.92, -8), ...fan(F.sky, LA.sky), fL: [0.2, 0.08, 0.3, 0, 12], fR: [-0.22, 0.08, -0.3, 0, -30] }, 'out'],
      [s1 - 3, { ...bd(0, 0.94, -10), ...fan([-0.12, 1.9, 0.1, 0, 110, 90], LA.sky) }, 'io'],
      [s1, { ...bd(-10, 0.84, 6), ...fan(F.down, LA.palm) }, 'snap'],
      [s2 - 4, { ...bd(10, 0.9, -6), ...fan(F.over, LA.sky) }, 'io'],
      [s2, { ...bd(10, 0.82, 8), ...fan(F.down, LA.palm) }, 'snap'],
      [c, { ...bd(6, 0.86, 4), ...fan(F.down, LA.palm) }, 'io'], [Fr, REST]]); }
  // C6 八陣: the fan swept up, the seal raised; flung down (the sigil drawn ahead); he holds the seal over it while it
  // binds, draws the fan back — and presses his palm down: it detonates
  { const [s] = hit('c6', 0), [d] = hit('c6', 1), Fr = M.c6.frames, c = M.c6.cancel;
    const hold = { ...bd(-12, 0.84, 2), ...fan([-0.26, 1.2, 0.26, -30, 40, 90], LA.seal) };
    out.c6 = clipF('c6', [[0, REST],
      [8, { ...bd(24, 0.9, -4), ...fan(F.over, LA.seal) }, 'out'],
      [s - 2, { ...bd(0, 0.93, -8), ...fan([-0.14, 1.86, -0.06, 0, 124, 90], LA.seal) }, 'io'],
      [s, { ...bd(0, 0.8, 12), hips: [0, 0.8, 0.14], ...fan(F.down, LA.seal), ...step('c6', s, 0.3) }, 'snap'],
      [s + 10, hold, 'out'],
      [d - 8, { ...hold, ...bd(-20, 0.86, -2), ...fan(F.aim, LA.seal) }, 'io'],
      [d, { ...bd(-6, 0.78, 12), hips: [0, 0.78, 0.12], ...fan(F.endR, LA.press) }, 'snap'],
      [c, { ...bd(-6, 0.82, 8), ...fan(F.endR, LA.press) }, 'io'], [Fr, REST]]); }
  // dash: glides in low, the fan trailing, a flick at each blade; then the beam
  { const [s2] = hit('dash', 1), Fr = M.dash.frames, c = M.dash.cancel;
    const glide = { ...bd(-10, 0.84, 10), ...fan([-0.42, 1.1, -0.2, -150, 20, 0], [-10, 0, 40, 60]) };
    const keys = [[0, REST], [5, glide, 'out'], [34, { ...glide, hips: [0, 0.82, 0.04] }]];
    for (const f of [8, 19, 30]) keys.push([f, { ...glide, ...bd(0, 0.84, 8), ...fan(F.thru, [-10, 0, 40, 60]) }, 'snap'], [f + 5, glide, 'io']);
    for (let f = 6, j = 0; f < 36; f += 6, j ^= 1) {
      const z = lz('dash', f) + 0.28;
      keys.push(ft(f - 3, j ? null : [0.14, 0.24, z - 0.3, -20, 5], j ? [-0.14, 0.24, z - 0.3, -20, -5] : null), ft(f, j ? null : [0.14, 0.08, z, 0, 5], j ? [-0.14, 0.08, z, 0, -5] : null));
    }
    keys.push([s2 - 4, { ...bd(-24, 0.84, 0), ...fan(F.aim, LA.palm) }, 'in'], [s2, { ...bd(-16, 0.8, 8), ...fan(F.cast, LA.palm), ...step('dash', s2, 0.4) }, 'snap'],
      [c, { ...bd(-16, 0.84, 6), ...fan(F.cast, LA.palm) }, 'io'], [Fr, REST]);
    out.dash = clipF('dash', keys.sort((a, b) => a[0] - b[0])); }
  // air string: jatk flick right → left · ja2 flick left → right · ja3 the fan thrust down: beam and blades
  { const [s, e] = hit('jatk'), Fr = M.jatk.frames;
    out.jatk = clipF('jatk', [[0, { ...bd(0, 0.95, 0), ...AIRF, ...fan(F.thru) }],
      [s - 2, { ...bd(-30, 0.98, -4), ...AIRF, ...fan(F.lowR, LA.wide) }, 'out'],
      [e, { ...bd(20, 0.95, 12), ...AIRF, ...fan([0.1, 1.1, 0.4, 60, -30, 0], LA.wide) }, 'snap'],
      [Fr, { ...bd(10, 0.95, 4), ...AIRF, ...fan(F.thru) }]]); }
  { const [s, e] = hit('ja2'), Fr = M.ja2.frames;
    out.ja2 = clipF('ja2', [[0, { ...bd(10, 0.95, 4), ...AIRF, ...fan(F.thru) }],
      [s - 2, { ...bd(30, 0.98, -4), ...AIRF, ...fan(F.backL, LA.wide) }, 'out'],
      [e, { ...bd(-20, 0.95, 12), ...AIRF, ...fan([-0.34, 1.0, 0.36, -30, -40, 0], LA.wide) }, 'snap'],
      [Fr, { ...bd(-10, 0.95, 4), ...AIRF, ...fan(F.thru) }]]); }
  { const [s] = hit('ja3'), Fr = M.ja3.frames;
    out.ja3 = clipF('ja3', [[0, { ...bd(-10, 0.95, 4), ...AIRF, ...fan(F.thru) }],
      [s - 4, { ...bd(0, 1.0, -8), ...AIRF, ...fan(F.sky, LA.sky) }, 'out'],
      [s, { ...bd(0, 0.94, 16), ...AIRF, ...fan([-0.14, 1.1, 0.46, 0, -30, 90], LA.palm) }, 'snap'],
      [Fr, { ...bd(0, 0.95, 10), ...AIRF, ...fan([-0.14, 1.12, 0.44, 0, -24, 90], LA.palm) }]]); }
  // jump charge: the fan to the sky through the hang, down on landing: the ring of blades
  { const L = M.jc.landFrame, Fr = M.jc.frames, D = M.jc.plunge[0], c = M.jc.cancel;
    const air = (y) => ({ fL: [0.16, y, 0.14, -30, 10], fR: [-0.18, y - 0.08, -0.12, 20, -20] });
    const land = { ...bd(0, 0.7, 14), ...fan(F.down, LA.press), fL: [0.26, 0.08, 0.36, 0, 20], fR: [-0.26, 0.08, -0.3, 0, -40] };
    out.jc = clipF('jc', [[0, { ...bd(0, 0.95, 0), ...air(0.36), ...fan(F.thru) }],
      [5, { ...bd(0, 1.0, -8), ...air(0.5), ...fan(F.sky, LA.seal) }, 'out'],
      [D - 1, { ...bd(0, 1.0, -8), ...air(0.5), ...fan([-0.12, 1.86, 0.14, 0, 104, 90], LA.seal) }],
      [L, land, 'snap'],
      [c, { ...land, hips: [0, 0.76, 0.02] }, 'io'], [Fr, REST]]); }
  // locomotion: at ease, the fan upright before his chest, the left hand at his waist; a slow wave of the fan as he breathes
  Object.assign(out, locoClips({
    idle: { ...REST, footL: [0.2, 0.08, 0.16, 0, 16], footR: [-0.22, 0.08, -0.16, 0, -26] },
    breath: { hips: [0, 0.875, 0.02], chest: [-2, -6, 0], head: [-3, 8, 0], spear: [-0.23, 0.91, 0.19, -8, 66, 60] },
    takeoff: { ...bd(0, 0.98, -4), ...fan(F.thru, LA.wide) },
    apex: { ...bd(0, 0.95, -6), ...fan(F.sky, LA.sky) },
    fall: { ...bd(0, 0.95, -8), head: [14, 0, 0], ...fan(F.side, LA.wide) },
    land: { ...bd(0, 0.72, 12), ...fan(F.down, LA.press), footL: [0.24, 0.08, 0.3, 0, 18], footR: [-0.24, 0.08, -0.26, 0, -36] },
    hurt: { ...bd(-20, 0.84, -14), head: [-18, 0, 0], ...fan([-0.36, 1.2, -0.06, -60, 40, 0], [-30, 0, 70, 40]) },
  }));
  return out;
}
// run: the fan held up before his chest, the left arm free (the run's swing); roll: the fan tucked in
export const carry = { run: fan([-0.2, 1.1, 0.16, -10, 70, 90], LA.sash), roll: fan([-0.2, 1.0, 0.1, -10, 60, 90], [-30, 0, 20, 110]) };

// ---------------------------------------------------------------- 真・無雙 東風・八陣 (musou/scripted.js)
const MU = (dmg, kb, force, lift, extra) => ({ shape: 'circle', range: 5, dmg, kb, force, lift, hitstop: 0, yMax: 5, ...extra });
const RING = (n, dmg, extra) => ({ every: ONCE, proj: { count: n, spread: 360, speed: 19, life: 26, r: 1.3, kind: 'wind' }, dmg, kb: 'spin', force: 5, lift: 3, hitstop: 0, ...extra });
export const musou = {
  act: { hips: [0, 0.9, 0], hipsR: [-4, -10, 0], spine: [-6, 0, 0], chest: [-10, -8, 0], head: [-16, -6, 0], ...fan(F.sky, LA.seal) },
  act2: { hips: [0, 0.92, 0], hipsR: [-6, -10, 0], spine: [-8, 0, 0], chest: [-14, -8, 0], head: [-26, -6, 0], ...fan([-0.08, 1.9, 0.08, 0, 96, 90], LA.sky) },
  face: { hips: [0, 0.9, 0], hipsR: [0, -20, 0], spine: [2, -6, 0], chest: [0, -8, 0], head: [4, -18, 0], ...fan([-0.18, 1.28, 0.26, -14, 66, 90], LA.sash) },
  ready: { ...bd(-16, 0.86, 2), ...fan(F.aim, LA.palm) },
  // the east wind rises: whirlwind, the vast sigil opens (100-116) · a full turn: eight beams (116-132) · CONTACT: the
  // light rains down marching ahead (132-150) · three turns: rings of blades (150-166) · the seal raised (166-176) ·
  // FINISHER: the fan flung down, the palm pressed — the sigil detonates
  seq: [[100, 116, 'c2', 0.25, 0.65], [116, 132, 'n6', 0.2, 0.75], [132, 150, 'c5', 0.2, 0.62], [150, 166, 'c4', 0.25, 0.65], [166, 176, 'c6', 0.06, 0.22]],
  fin: ['c6', 0.55, 0.9],
  travel: [[132, 150, 3], [150, 166, 1]],
  hits: [[104, MU(10, 'launch', 3, 8), 0, 4, 116],
    [124, MU(22, 'blow', 11, 5, { range: 12, heavy: true, hitstop: 3 })],
    [134, MU(16, 'launch', 3, 10, { range: 3 }), 6, 4, 150],
    [150, MU(9, 'spin', 6, 3, { range: 7 }), 0, 4, 166],
    [168, MU(4, 'flinch', 1, 0, { range: 11 }), 0, 4, 176]],
  proj: [[152, RING(10, 12)], [158, RING(10, 12)], [164, RING(10, 12)]],
  fx: [[100, 'bagua', 12], [104, 'aura', 5], [124, 'beams', 8], [134, 'rain', 2.4, 4], [138, 'rain', 2.4, 7], [142, 'rain', 2.4, 10], [146, 'rain', 2.4, 13]],
  finFx: [['baguaBurst', 12], ['beams', 12]],
  finProj: [RING(16, 20, { proj: { count: 16, spread: 360, speed: 21, life: 34, r: 1.6, kind: 'wind' }, kb: 'blow', force: 10, lift: 6 })],
};
