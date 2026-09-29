// Fine-voxel building blocks for def-kit officers (src/chars/defkit.js, hero/model.js buildDef). A fine body voxel is FV
// = 0.0125 m, half of Zhao Yun's V, and every part is authored CENTRED on its joint (no odd-width offset), +x = the
// officer's left, +z = forward, limbs hang along −y. Joint extents in FV: hips ≈ [-12,-10,-8]..[12,6,8], spine -6..16,
// chest -4..21 (shoulders at ±19), neck -2..6, upper arm 2..-24, forearm 0..-22, hand ±4 round the joint, thigh 2..-36,
// shin 0..-35, foot y -7..2 (the sole sits 0.08 m under the ankle), z -5..15 (toe forward). Colours come from the
// officer's palette; boxes are hero/model.js B / P boxes.
import { B, P, md } from '../hero/model.js';

export const FV = 0.0125;

/** Bare fist round the hand joint: knuckle ridge, finger creases, thumb over the front on the inner side (sx −1 right,
 *  +1 left). */
export function hand(sx, skin, skinD) {
  return [
    B([-4, -4, -3], [4, 4, 4], skin),
    P([-4, -4, 3], [4, 4, 4], (x, y) => (md(y, 2) ? skinD : skin)),    // finger creases on the knuckle face
    B([-4, 1, -4], [4, 3, -3], skinD),                                  // knuckle ridge on the back of the hand
    B([sx > 0 ? -5 : 4, -3, 0], [sx > 0 ? -4 : 5, 2, 4], skin),         // thumb, wrapped round the grip (inner side)
  ];
}

/** Gloved fist: the hand in leather c with a flared cuff. */
export function glove(sx, c, cuff) {
  return [...hand(sx, c, cuff), B([-5, 2, -5], [5, 5, 5], cuff)];
}

/** Bare, muscled upper arm: round deltoid cap, biceps bulging forward, triceps behind, the groove under the deltoid;
 *  band = [c, dark, light] armlet above the elbow (or null). */
export function bareArm({ skin, skinD, skinH }, band) {
  const sk = (x, y, z) => (z > 2 && y < -7 && y > -17 ? skinH : x > 3 || z < -3 ? skinD : skin);
  return [
    B([-4, -24, -4], [4, 2, 4], sk),
    B([-5, -5, -5], [5, 3, 5], sk),                                    // deltoid
    B([-4, -17, 3], [4, -7, 6], sk),                                   // biceps
    B([-4, -16, -6], [4, -6, -3], skinD),                              // triceps
    P([-5, -6, -5], [5, -5, 6], skinD),                                // deltoid groove
    ...(band ? [B([-5, -21, -5], [5, -17, 5], band[0]), P([-5, -21, -5], [5, -20, 5], band[1]), P([-5, -18, -5], [5, -17, 5], band[2])] : []),
  ];
}

/** Forearm with a bracer over its lower two thirds ([c, dark, light]: banded, a light rim at both ends, an optional ridge). */
export function bracer(skin, [c, d, l], ridge = true) {
  return [
    B([-4, -22, -4], [4, 0, 4], skin),
    B([-5, -20, -5], [5, -4, 5], (x, y, z) => (md(y, 4) === 0 ? d : md(x + z - y, 7) === 0 ? l : c)),
    B([-6, -20, -6], [6, -18, 6], l), B([-6, -6, -6], [6, -4, 6], l),
    ...(ridge ? [B([-1, -18, 5], [1, -6, 6], l)] : []),
  ];
}

/** Boot: foot block, toe cap (or a curled toe), a sole plate and an optional trim band round the top. */
export function boot(c, cd, sole, { curl = false, trim = null } = {}) {
  return [
    B([-6, -7, -5], [6, 2, 12], c),
    ...(curl ? [B([-4, -5, 12], [4, 0, 16], c), B([-3, -3, 16], [3, 1, 18], cd), B([-2, 0, 17], [2, 3, 19], cd)]
      : [B([-5, -7, 12], [5, -1, 15], c), P([-5, -3, 12], [5, -1, 15], cd)]),
    P([-6, -7, -5], [6, -6, 19], sole),
    ...(trim ? [P([-6, 1, -5], [6, 2, 12], trim)] : []),
  ];
}

/** A head feature on both sides of the face: x range [a, b) on the +x side and its mirror (head voxels are centred on
 *  column 0 by buildBody's −0.5 offset). */
export function symH(a, b, y0, y1, z0, z1, c, paint = true) {
  return [{ a: [a, y0, z0], b: [b, y1, z1], c, paint }, { a: [-b + 1, y0, z0], b: [-a + 1, y1, z1], c, paint }];
}
