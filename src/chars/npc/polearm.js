// Polearm boss set (NPC kit weapon class: ./kit.js header) — a two-handed pole of ≈ 3 m (shaft +Z, origin = the rear grip,
// the head ≈ 1.45 … 2.25 m along it, the blade on its local −X side: roll 90 turns it down, roll 0 out to the right):
// 張遼's 鉤鐮刀, 夏侯淵's great blade. A field commander's four blows, readable from across the summit:
//   sweep   coiled low, then two full turns with the pole out flat (circle 4.3 m, a hit every 8 sf)
//   chop    the pole heaved overhead, held a beat, smashed down ahead (lane 6.2 m)
//   charge  couched under the arm, a running ram with the blade leading, a thrust to finish (lane 9 m, 5.5 m lunge)
//   leap    a deep crouch, a leap onto the hero with the pole raised, a two-handed smash on landing (circle 4.4 m)
// idle: the pole grounded upright at his right side, left fist on the hip · taunt: whirled over his head, then levelled
// at the hero · hurt: knocked back, the pole flung wide (held through the stagger).
import { clip, P } from '../../hero/rig.js';

export const attacks = [
  { id: 'sweep', clip: 'sweep', windup: 32, active: 24, recover: 28, every: 8, dmg: 34, shape: 'circle', r: 4.3, range: [0, 4.3], weight: 5 },
  { id: 'chop', clip: 'chop', windup: 30, active: 8, recover: 30, every: 3, dmg: 44, shape: 'lane', w: 2.4, len: 6.2, lunge: 1.2, range: [0, 5.5], weight: 4 },
  { id: 'charge', clip: 'charge', windup: 26, active: 22, recover: 28, every: 4, dmg: 38, shape: 'lane', w: 2.2, len: 9, lunge: 5.5, range: [3, 10], weight: 3 },
  { id: 'leap', clip: 'leap', windup: 24, active: 32, recover: 32, dmg: 48, shape: 'leap', r: 4.4, len: 13, h: 2.6, range: [5.5, 14], weight: 2 },
];
// run: the pole trailed at the hip, head low behind; the left arm pumps free
export const carry = { spear: [-0.24, 1.02, -0.16, 180, 18, 90], gripR: 0.1, gripL: 0.6, lfree: 1, armL: [10, 0, 14, 85] };

// ---------------------------------------------------------------- poses (rig.js P specs)
const G = { hips: [0, 0.84, 0], hipsR: [4, -34, 0], spine: [6, -4, 0], chest: [2, -2, 0], head: [2, 8, 0], spear: [-0.26, 1.0, 0.04, 22, 20, 90], gripR: 0, gripL: 0.52 };
const CHAMB = { hips: [0, 0.8, -0.04], hipsR: [6, -60, 0], spine: [6, -14, 0], chest: [2, -20, 0], head: [0, 12, 0], spear: [-0.22, 1.08, -0.36, 0, 2, 90], gripL: 0.44 };
const JAB = (z, extra) => ({ hips: [0, 0.78, 0.22], hipsR: [8, -74, 0], spine: [6, -8, 0], chest: [2, -6, 0], head: [0, 10, 0], spear: [-0.08, 1.14, z, 0, 0, 90], gripL: 0.3, ...extra });
const TW = (hy, lean = 8, h = 0.8) => ({ hips: [0, h, 0.06], hipsR: [lean, hy, 0], spine: [lean, hy * 0.3, 0], chest: [lean * 0.6, hy * 0.45, 0], head: [0, -hy * 0.35, 0], gripL: 0.45 });
const UP = { hips: [0, 0.95, 0], hipsR: [-8, -10, 0], spine: [-8, 0, 0], chest: [-14, 0, 0], head: [-6, 0, 0], gripL: 0.5 };
const SMASH = { hips: [0, 0.62, 0.26], hipsR: [28, -12, 0], spine: [18, 0, 0], chest: [14, 0, 0], head: [10, 0, 0], gripL: 0.5 };
const STOMP = { hips: [0, 0.6, 0.1], hipsR: [22, -22, 0], spine: [14, -6, 0], chest: [10, -6, 0], head: [6, 0, 0], gripL: 0.45 };
const IDLE = { hips: [0, 0.88, 0], hipsR: [0, -8, 0], spine: [2, -2, 0], chest: [-4, -2, 0], head: [-4, 4, 0],
  footL: [0.2, 0.08, 0.12, 0, 18], footR: [-0.22, 0.08, -0.1, 0, -24],
  spear: [-0.36, 0.94, 0.14, 0, 88, 90], gripR: 0, gripL: 0.3, lfree: 1, armL: [12, 0, 52, 104] };
const HURT = { hips: [0, 0.8, -0.16], hipsR: [-14, -24, 6], spine: [-12, 0, 0], chest: [-14, 0, 0], head: [-20, 0, 0],
  footL: [0.2, 0.08, 0.1, 0, 18], footR: [-0.22, 0.08, -0.3, 0, -24],
  spear: [-0.36, 1.12, -0.06, -150, 36, 90], gripR: 0, gripL: 0.3, lfree: 1, armL: [-30, 0, 72, 40] };

export function clips(A, M) {
  const { clipF, lungeAt: lz, body, ft, hit } = A;
  const wide = (id, f) => ({ fL: [0.34, 0.08, lz(id, f) + 0.36, 0, 25], fR: [-0.34, 0.08, lz(id, f) - 0.28, 0, -50] });   // planted wide
  const out = {};
  // sweep: coil, two turns with the pole out flat, unwind
  { const [s, e] = hit('sweep'), F = M.sweep.frames;
    const sp = (f) => 720 * Math.min(1, Math.max(0, (f - s) / (e - s)));
    const SIDE = { hips: [0, 0.76, 0.04], hipsR: [6, -10, 0], spine: [6, -8, 0], chest: [2, -10, 0], head: [0, 0, 0], gripL: 0.32 };
    const keys = [[0, G], [s - 14, { ...TW(-48, 6, 0.74), spear: [-0.32, 0.96, 0.04, -120, -6, 0], ...wide('sweep', s - 14) }, 'out'],
      [s - 2, { ...TW(-56, 8, 0.72), spear: [-0.3, 0.98, 0.02, -128, -4, 0] }, 'io']];
    for (let f = s; f <= e; f += 3) keys.push([f, { ...SIDE, spin: sp(f), spear: [-0.3, 1.02, 0.24, -90, -4, 0] }, 'lin']);
    keys.push([e + 10, { ...SIDE, spin: 720, spear: [-0.3, 1.06, 0.2, -88, 0, 0] }, 'io'], [F, { ...G, spin: 720 }]);
    for (let f = s + 2, i = 0; f <= e; f += 4, i++) keys.push(ft(f, i % 2 ? body('sweep', f, sp(f), [0.26, 0.08, 0.3, 0, 15]) : null, i % 2 ? null : body('sweep', f, sp(f), [-0.28, 0.08, -0.24, 0, -35])));
    keys.push(ft(F, [0.17, 0.08, 0.3, 0, 15 + 720], [-0.2, 0.08, -0.26, 0, -30 + 720]));
    out.sweep = clipF('sweep', keys); }
  // chop: heaved overhead, a held beat of tension, smashed down; the recovery drags it back up to guard
  { const [s, e] = hit('chop'), F = M.chop.frames;
    out.chop = clipF('chop', [[0, G],
      [s - 16, { ...UP, spear: [-0.16, 1.66, -0.1, 0, 130, 90] }, 'out'],
      [s - 2, { ...UP, hips: [0, 0.98, 0.02], chest: [-18, 0, 0], spear: [-0.16, 1.74, -0.14, 0, 148, 90] }, 'io'],
      [s + 2, { ...SMASH, spear: [-0.12, 0.98, 0.52, 0, -34, 90], ...wide('chop', s + 2) }, 'snap'],
      [e + 12, { ...SMASH, hips: [0, 0.66, 0.24], spear: [-0.12, 1.0, 0.5, 0, -30, 90] }, 'io'], [F, G]]); }
  // charge: couched, crouched in the wind-up, strides through the ram, the thrust at its end
  { const [s, e] = hit('charge'), F = M.charge.frames;
    const couch = { hips: [0, 0.78, 0.16], hipsR: [22, -40, 0], spine: [10, -10, 0], chest: [8, -12, 0], head: [0, 12, 0], spear: [-0.2, 1.04, -0.2, 0, -2, 90], gripL: 0.46 };
    const keys = [[0, G], [s - 10, { ...couch, hips: [0, 0.7, 0.04], hipsR: [26, -44, 0] }, 'out'], [s, couch, 'in'], [e - 4, { ...couch, hips: [0, 0.8, 0.18] }]];
    for (let f = s + 3, j = 0; f < e - 2; f += 4, j ^= 1) {
      const z = lz('charge', f) + 0.3;
      keys.push(ft(f - 2, j ? null : [0.14, 0.3, z - 0.3, -20, 5], j ? [-0.14, 0.3, z - 0.3, -20, -5] : null), ft(f, j ? null : [0.14, 0.08, z, 0, 5], j ? [-0.14, 0.08, z, 0, -5] : null));
    }
    keys.push([e, { ...JAB(0.74), spear: [-0.04, 1.14, 0.74, 0, -2, 90], fL: [0.2, 0.08, lz('charge', e) + 0.7, 0, 10], fR: [-0.26, 0.08, lz('charge', e) - 0.42, 0, -60] }, 'snap'],
      [e + 12, JAB(0.66, { hips: [0, 0.8, 0.2] }), 'io'], [F, G]);
    out.charge = clipF('charge', keys); }
  // leap: crouch, up with the pole raised, the smash on landing
  { const [s, L] = hit('leap'), F = M.leap.frames;
    const air = (y) => ({ fL: [0.2, y, 0.25, -30, 15], fR: [-0.2, y - 0.1, -0.15, -20, -30] });
    out.leap = clipF('leap', [[0, G],
      [s - 6, { ...STOMP, hips: [0, 0.6, 0], spear: [-0.3, 1.0, -0.1, -20, 40, 90], ...wide('leap', s - 6) }, 'out'],
      [s + 4, { ...UP, hips: [0, 1.04, 0.1], spear: [-0.14, 1.8, 0, 0, 124, 90], ...air(0.55) }, 'out'],
      [L - 6, { ...UP, hips: [0, 1.02, 0.12], chest: [-18, 0, 0], spear: [-0.14, 1.82, -0.04, 0, 146, 90], ...air(0.5) }, 'io'],
      [L - 1, { ...SMASH, hips: [0, 0.9, 0.16], spear: [-0.12, 1.3, 0.4, 0, 20, 90], ...air(0.3) }, 'in'],
      [L, { ...STOMP, hips: [0, 0.54, 0.14], spear: [-0.16, 0.9, 0.44, 0, -46, 90], ...wide('leap', L) }, 'snap'],
      [L + 16, { ...STOMP, hips: [0, 0.62, 0.12], spear: [-0.16, 0.94, 0.44, 0, -40, 90] }, 'io'], [F, G]]); }
  out.idle = clip([[0, P(IDLE)], [0.5, P({ ...IDLE, hips: [0, 0.872, 0], chest: [-6, -2, 0], head: [-6, 4, 0] })], [1, P(IDLE)]], true);
  out.hurt = clip([[0, P(IDLE)], [0.3, P({ ...HURT, hips: [0, 0.76, -0.22], chest: [-20, 0, 0] }), 'out'], [1, P(HURT)]]);
  // taunt: the pole whirled over his head (one and a half turns), then levelled at the hero, chin up
  { const W = (a) => P({ ...IDLE, hips: [0, 0.9, 0], hipsR: [-4, 0, 0], chest: [-8, 0, 0], head: [-6, 0, 0], spear: [-0.06, 1.86, 0.04, a, 6, 0], gripL: 0.2, lfree: 1, armL: [-150, 0, -10, 20] });
    const POINT = { ...IDLE, hips: [0, 0.84, 0.06], hipsR: [4, -50, 0], spine: [4, -10, 0], chest: [-6, -14, 0], head: [-10, 0, 0],
      spear: [-0.14, 1.36, 0.34, 720, 6, 90], gripL: 0.34, lfree: 0 };   // (yaw 720: on round from the whirl)
    out.taunt = clip([[0, P(IDLE)], [0.14, W(-40), 'out'], [0.24, W(90), 'lin'], [0.34, W(220), 'lin'], [0.44, W(350), 'lin'], [0.54, W(480), 'lin'],
      [0.66, P(POINT), 'snap'], [0.88, P({ ...POINT, chest: [-10, -14, 0], head: [-14, 0, 0] }), 'io'], [1, P(POINT)]]); }
  return out;
}
