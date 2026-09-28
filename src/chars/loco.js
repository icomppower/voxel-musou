// Locomotion clips of a def-kit officer (src/chars/defkit.js) from a few full poses of his own (rig.js P specs: his
// stance, weapon and arms), on the time bases of the shared ones (src/hero/anims/locomotion.js LOCO_CLIPS, which fill in
// the dodge; run / roll are procedural, with his carry overlay):
//   idle     breathing loop (0.5 = idle + breath)
//   air      t 0 take-off (stretched) · 0.22 tuck · 0.55 apex · 1 falling at jumpV (legs reaching down)
//   airFall  after an air string: 0.5 (vy 0) → 1, legs gathering under him
//   land     squash, then up into his idle (LOCO.landFrames)       hurt   0.25 = the recoil, back to idle by 1
// The legs of the air poses are shared (Zhao Yun's); the officer's specs give the body, weapon and arms.
import { P, clip } from '../hero/rig.js';

const AIR = [
  [0, { footL: [0.13, 0.0, 0.02, 55, 10], footR: [-0.14, 0.05, -0.14, 60, -15] }],
  [0.22, { footL: [0.15, 0.5, 0.22, 20, 10], footR: [-0.16, 0.36, -0.02, 40, -15] }, 'out'],
  [0.55, { footL: [0.15, 0.42, 0.2, 10, 10], footR: [-0.16, 0.3, -0.06, 30, -15] }],
  [1, { footL: [0.16, 0.12, 0.22, -5, 10], footR: [-0.18, 0.16, -0.2, 15, -20] }],
];
const FALL = [{ footL: [0.16, 0.36, 0.16, 20, 12], footR: [-0.17, 0.26, -0.12, 30, -15] },
  { footL: [0.17, 0.14, 0.16, 5, 12], footR: [-0.18, 0.18, -0.14, 15, -15] }];

/** { idle, breath (delta at the loop's middle), takeoff, apex, fall, land, hurt } pose specs → { idle, air, airFall, land, hurt } */
export function locoClips({ idle, breath = {}, takeoff, apex, fall, land, hurt }) {
  const lift = (s, dy) => ({ ...s, hips: [s.hips[0], s.hips[1] + dy, s.hips[2]] });
  return {
    idle: clip([[0, P(idle)], [0.5, P({ ...idle, ...breath })], [1, P(idle)]], true),
    air: clip(AIR.map(([t, legs, e], i) => [t, P({ ...(i ? apex : takeoff), ...legs }), e])),
    airFall: clip([[0.5, P({ ...fall, ...FALL[0] })], [1, P({ ...lift(fall, 0.02), ...FALL[1] })]]),
    land: clip([[0, P(land)], [0.4, P(lift(land, 0.04)), 'out'], [1, P(idle)]]),
    hurt: clip([[0, P(idle)], [0.25, P(hurt), 'out'], [1, P(idle)]]),
  };
}
