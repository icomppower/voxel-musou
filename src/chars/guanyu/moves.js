// Guan Yu's moveset: the glaive string and charge ported from the 關羽 Voxel Moveset artifact (data format:
// src/hero/moves.js header; clips: src/hero/rig.js P / clip, keyed in normalised move time). Everything else in the kit
// (N4–N6, C2–C6, dash, jump attack / charge, locomotion) is Zhao Yun's spear set on the same weapon joint (kit.js) until
// Guan Yu gets his own.
// The string is heavier than Zhao Yun's: hits ≈ 30 sf apart instead of 25, wider arcs, a heavy whirlwind on N2.
//   N1 拖刀逆斬 rising drag cut: the blade trails low on the right, then rips up across the body (push)
//   N2 橫掃千軍 whirlwind sweep: a full turn with the blade at waist height (blow, heavy)
//   N3 回刀斬  backhand return: the blade swings back right → left (push); the string then loops to N1
//   C1 青龍劈 azure dragon cleave (charge from neutral): the glaive high overhead, a step and an overhead cleave that
//              splits the ground in a line (slam + rocks), then a short launch around the impact
// Charges off the string borrow Zhao Yun's C2 / C3 / C4 (N1 / N2 / N3 → C).
import { P, clip, STANCE } from '../../hero/rig.js';
import { prepMoves } from '../../hero/moveset.js';

const ONCE = 99;
export const GY_MOVES = prepMoves({
  n1: { frames: 40, next: 'n2', charge: 'c2', cancel: 28, dodgeCancel: 16, steer: 6, lunge: [[4, 14, 0.6]],
    hits: [{ f: [12, 16], every: ONCE, shape: 'arc', range: 3, ang: 150, dir: 10, dmg: 16, kb: 'push', force: 5, hitstop: 4, sweep: 1 }] },
  n2: { frames: 52, next: 'n3', charge: 'c3', cancel: 40, dodgeCancel: 30, steer: 4, lunge: [[6, 24, 0.9]],
    hits: [{ f: [14, 28], every: ONCE, shape: 'circle', range: 3.3, dmg: 20, kb: 'blow', force: 9, lift: 2, hitstop: 5, heavy: true, sweep: 1 }] },
  n3: { frames: 38, next: 'n1', charge: 'c4', cancel: 28, dodgeCancel: 18, steer: 5, lunge: [[3, 12, 0.5]],
    hits: [{ f: [11, 15], every: ONCE, shape: 'arc', range: 3, ang: 160, dir: 0, dmg: 15, kb: 'push', force: 6, hitstop: 4, sweep: -1 }] },
  c1: { frames: 78, cancel: 66, dodgeCancel: 52, steer: 10, armor: true, lunge: [[30, 38, 1.2, 'lin']],
    hits: [{ f: [36, 38], every: ONCE, shape: 'line', len: 4.2, width: 1.4, dmg: 34, kb: 'slam', force: 4, lift: 6, hitstop: 8, heavy: true, rocks: 6 },
      { f: [44, 46], every: ONCE, shape: 'circle', range: 3.2, dmg: 10, kb: 'launch', lift: 5, hitstop: 3 }] },
});

// Guan Yu's stance: the glaive carried on the right, blade up and out, left hand low on the shaft
export const GY_STANCE = { ...STANCE, spear: [-0.26, 0.92, -0.06, 22, 42, -20], gripL: 0.62 };
export const K = (t, spec, e) => [t, P({ ...GY_STANCE, ...spec }), e];

export const GY_CLIPS = {
  idle: clip([K(0, {}), K(0.5, { hips: [0, 0.89, 0], chest: [5, 8, 0] }), K(1, {})], true),
  n1: clip([
    K(0, {}),
    K(0.22, { hips: [0, 0.8, -0.06], hipsR: [0, -48, 0], spine: [8, -16, 0], chest: [8, -22, 0], head: [4, 20, 0], spear: [-0.3, 0.72, -0.08, -150, -18, 20], gripL: 0.5, footL: [0.2, 0.08, 0.42, 0, 10] }, 'out'),
    K(0.28, { hips: [0, 0.79, -0.06], hipsR: [0, -52, 0], spine: [8, -18, 0], chest: [10, -26, 0], head: [4, 22, 0], spear: [-0.3, 0.7, -0.1, -158, -20, 20], gripL: 0.5, footL: [0.22, 0.08, 0.5, 0, 10] }, 'io'),
    K(0.36, { hips: [0, 0.84, 0.18], hipsR: [4, -4, 0], spine: [2, 0, 0], chest: [0, 2, 0], head: [0, 0, 0], spear: [-0.18, 1, 0.24, -10, 10, -40], gripL: 0.52, footL: [0.24, 0.08, 0.7, 0, 15] }, 'lin'),
    K(0.46, { hips: [0, 0.9, 0.28], hipsR: [-6, 44, 0], spine: [-6, 14, 0], chest: [-10, 22, 0], head: [-8, 20, 0], spear: [0.06, 1.42, 0.3, 70, 52, -60], gripL: 0.56, footL: [0.24, 0.08, 0.72, 0, 20], footR: [-0.22, 0.14, -0.1, 30, -20] }, 'out'),
    K(0.7, { hips: [0, 0.88, 0.28], hipsR: [-4, 40, 0], spine: [-4, 12, 0], chest: [-8, 18, 0], head: [-6, 16, 0], spear: [0.04, 1.36, 0.28, 74, 56, -60], gripL: 0.56, footL: [0.24, 0.08, 0.72, 0, 20], footR: [-0.22, 0.08, -0.06, 0, -20] }, 'io'),
    K(1, {}),
  ]),
  n2: clip([
    K(0, {}),
    K(0.2, { hips: [0, 0.82, 0], hipsR: [0, -60, 0], spine: [6, -20, 0], chest: [4, -26, 0], head: [0, 10, 0], spear: [-0.3, 1.06, -0.1, -120, 4, 90], gripL: 0.46, footL: [0.26, 0.08, 0.5, 0, 15] }, 'out'),
    K(0.3, { hips: [0, 0.8, 0.1], hipsR: [0, -10, 0], spine: [4, 0, 0], chest: [2, 0, 0], head: [0, 0, 0], spin: 60, spear: [-0.1, 1.1, 0.2, 40, 2, 90], gripL: 0.42, footL: [0.26, 0.08, 0.5, 0, 15] }, 'in'),
    K(0.42, { hips: [0, 0.8, 0.1], hipsR: [0, 10, 0], spine: [4, 6, 0], chest: [2, 8, 0], head: [0, 0, 0], spin: 180, spear: [-0.04, 1.1, 0.22, 70, 2, 90], gripL: 0.42, footL: [0.26, 0.08, 0.5, 0, 15] }, 'lin'),
    K(0.54, { hips: [0, 0.8, 0.1], hipsR: [0, 10, 0], spine: [4, 6, 0], chest: [2, 8, 0], head: [0, 0, 0], spin: 300, spear: [-0.04, 1.08, 0.22, 74, 0, 90], gripL: 0.42, footL: [0.26, 0.08, 0.5, 0, 15] }, 'lin'),
    K(0.64, { hips: [0, 0.72, 0.12], hipsR: [8, 30, 0], spine: [10, 10, 0], chest: [6, 14, 0], head: [2, -10, 0], spin: 360, spear: [0.02, 0.96, 0.24, 96, -8, 90], gripL: 0.44, footL: [0.3, 0.08, 0.56, 0, 20], footR: [-0.28, 0.08, -0.3, 0, -40] }, 'out'),
    K(0.85, { hips: [0, 0.74, 0.12], hipsR: [8, 28, 0], spine: [10, 10, 0], chest: [6, 12, 0], head: [2, -10, 0], spin: 360, spear: [0.02, 0.98, 0.24, 94, -6, 90], gripL: 0.44, footL: [0.3, 0.08, 0.56, 0, 20], footR: [-0.28, 0.08, -0.3, 0, -40] }, 'io'),
    K(1, { spin: 360 }),
  ]),
  n3: clip([
    K(0, {}),
    K(0.26, { hips: [0, 0.84, 0.02], hipsR: [0, 50, 0], spine: [6, 16, 0], chest: [4, 22, 0], head: [0, -14, 0], spear: [0.02, 1.04, 0.1, 110, 2, -90], gripL: 0.46, footL: [0.22, 0.08, 0.5, 0, 20] }, 'out'),
    K(0.3, { hips: [0, 0.83, 0.02], hipsR: [0, 54, 0], spine: [6, 18, 0], chest: [4, 24, 0], head: [0, -14, 0], spear: [0.02, 1.02, 0.08, 116, 0, -90], gripL: 0.46, footL: [0.22, 0.08, 0.52, 0, 20] }, 'io'),
    K(0.36, { hips: [0, 0.8, 0.2], hipsR: [4, 0, 0], spine: [4, 0, 0], chest: [2, 0, 0], head: [0, 0, 0], spear: [-0.1, 1, 0.3, 10, -2, 90], gripL: 0.46, footL: [0.24, 0.08, 0.72, 0, 20] }, 'lin'),
    K(0.46, { hips: [0, 0.78, 0.26], hipsR: [8, -56, 0], spine: [6, -18, 0], chest: [4, -26, 0], head: [2, 10, 0], spear: [-0.3, 0.96, 0.1, -118, -6, 90], gripL: 0.46, footL: [0.26, 0.08, 0.76, 0, 20], footR: [-0.26, 0.1, -0.2, 20, -50] }, 'out'),
    K(0.72, { hips: [0, 0.8, 0.26], hipsR: [8, -50, 0], spine: [6, -16, 0], chest: [4, -22, 0], head: [2, 8, 0], spear: [-0.3, 0.98, 0.1, -112, -4, 90], gripL: 0.46, footL: [0.26, 0.08, 0.76, 0, 20], footR: [-0.26, 0.08, -0.22, 0, -50] }, 'io'),
    K(1, {}),
  ]),
  c1: clip([
    K(0, {}),
    K(0.3, { hips: [0, 0.96, -0.04], hipsR: [-6, -8, 0], spine: [-8, -4, 0], chest: [-14, -6, 0], head: [-10, 0, 0], spear: [-0.12, 1.66, -0.02, 0, 140, 180], gripL: 0.46, footL: [0.2, 0.12, 0.4, -10, 10] }, 'out'),
    K(0.42, { hips: [0, 0.98, -0.06], hipsR: [-8, -8, 0], spine: [-10, -4, 0], chest: [-16, -6, 0], head: [-12, 0, 0], spear: [-0.12, 1.7, -0.04, 0, 150, 180], gripL: 0.46, footL: [0.2, 0.2, 0.46, -14, 10] }, 'io'),
    K(0.47, { hips: [0, 0.82, 0.3], hipsR: [10, -6, 0], spine: [12, -2, 0], chest: [14, -4, 0], head: [10, 0, 0], spear: [-0.12, 1.4, 0.3, 0, 40, 180], gripL: 0.5, footL: [0.22, 0.08, 0.86, 0, 10], footR: [-0.22, 0.08, -0.34, 0, -30] }, 'in'),
    K(0.5, { hips: [0, 0.66, 0.4], hipsR: [22, -8, 0], spine: [18, -2, 0], chest: [20, -4, 0], head: [16, 0, 0], spear: [-0.12, 0.96, 0.48, 0, -24, 180], gripL: 0.52, footL: [0.22, 0.08, 0.9, 0, 10], footR: [-0.24, 0.08, -0.4, 0, -30] }, 'lin'),
    K(0.72, { hips: [0, 0.66, 0.4], hipsR: [20, -8, 0], spine: [16, -2, 0], chest: [18, -4, 0], head: [12, 0, 0], spear: [-0.12, 0.94, 0.48, 0, -26, 180], gripL: 0.52, footL: [0.22, 0.08, 0.9, 0, 10], footR: [-0.24, 0.08, -0.4, 0, -30] }, 'io'),
    K(1, {}),
  ]),
};
