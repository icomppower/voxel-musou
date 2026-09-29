// Voxel Guan Yu (關羽 雲長) on the shared rig, same build / scale / armour cut as Zhao Yun (src/hero/model.js bodyParts,
// recoloured): jade-green lamellar with gold plates over a dark bronze underlayer, green trim; the red face (a deep
// vermilion skin), black brows over narrow eyes, a green cloth hood with a gold band and a jade stone, and the long
// black beard (the 美髯公's beard: the long end hangs as a chain); the 青龍偃月刀 on the weapon joint — a dark green
// banded shaft with a gold butt, a gold dragon-head collar with jade eyes and a red mane, and the broad crescent blade
// (1.7–2.3 m along the shaft, curving up and back to a hooked point). Secondary (render-only): green cape, gold-edged
// apron, beard, the hood's two tails, a red tassel under the collar.
// Ported from the 關羽 Voxel Moveset artifact (the moveset study the Musou was sketched in).
import * as THREE from 'three';
import { vox, HV, C, bodyParts, buildBody, heroLook } from '../../hero/model.js';
import { bodyChains } from '../../hero/secondary.js';
import { shade } from '../../core/voxel.js';
import { hash01 } from '../../core/rng.js';

export const GC = {
  ...C,
  W: 0x2f6e46, W2: 0x1f4c30, Wh: 0x4e9466, S: 0xc9a049, Sd: 0x8a6a2c,                     // jade lamellar, gold plates
  G: 0x3a3226, Gd: 0x28231b, Gm: 0x4c4232, Gl: 0x8a7a5a,                                   // dark bronze underlayer
  T: 0x1c3a26, Td: 0x12281a, Tl: 0xe0b85a,                                                 // deep green trim, gold gem
  skin: 0xa8402e, skinD: 0x7e2c20, lip: 0x6a2018,                                         // the red face
  hair: 0x121014, hairH: 0x26222a, hairT: 0x1a171e,                                       // black hair and beard
  scarf: 0x2a6040, scarfD: 0x1a4029, scarfH: 0x3f8058,                                    // green hood
  shaft: 0x1e3526, shaftH: 0x2c4a36, band: 0xc9a049,
  cape: 0x2a6644, capeD: 0x1c4a30, emb: 0xc9a049,
  steel: 0xdfe6ee, steelD: 0x98a3b0, steelM: 0xbcc6d2,
};
const B = (a, b, c, paint) => ({ a, b, c, paint });
const Pt = (a, b, c) => ({ a, b, c, paint: true });
const md = (a, m) => ((a % m) + m) % m;

// ---------------------------------------------------------------- head (HV voxels, chin y 0, crown y 13; as Zhao Yun's)
function head() {
  const hairP = (x, y, z) => (md(x * 3 + z, 5) === 0 ? GC.hairH : md(x + y * 2, 7) === 0 ? GC.hairT : GC.hair);
  const hood = (x, y, z) => (md(x + z * 2, 4) === 0 ? GC.scarfD : md(y + x, 6) === 0 ? GC.scarfH : GC.scarf);
  const beard = (x, y, z) => (y <= -4 && md(x + z, 2) ? null : md(x * 2 + y, 5) === 0 ? GC.hairH : GC.hair);
  return [
    B([-3, 0, -2], [4, 2, 5], GC.skin),                               // jaw
    B([-4, 2, -4], [5, 10, 5], GC.skin),                              // skull / face
    B([-5, 5, -1], [6, 8, 1], GC.skinD),                              // ears
    B([-5, 2, -6], [6, 10, -2], hairP),                               // back hair
    B([-5, 5, -2], [-3, 10, 1], hairP), B([4, 5, -2], [6, 10, 1], hairP),   // temples
    B([-6, 9, -7], [7, 14, 6], hood), B([-5, 14, -6], [6, 15, 5], hood),     // green hood
    B([-6, 9, 5], [7, 10, 6], GC.S), B([-1, 9, 6], [2, 11, 7], GC.S), B([0, 10, 7], [1, 11, 8], GC.Tl),   // gold band, jade stone
    B([-2, 11, -8], [3, 14, -6], GC.scarfD),                          // the hood's knot at the back
    // heavy black brows, slanting up at the temples
    B([-4, 7, 5], [0, 8, 6], GC.hair), B([1, 7, 5], [5, 8, 6], GC.hair), B([-5, 8, 4], [-3, 9, 6], GC.hair), B([4, 8, 4], [6, 9, 6], GC.hair),
    // narrow phoenix eyes (丹鳳眼), lifted at the outer corners
    Pt([-3, 5, 4], [0, 6, 5], C.eye), Pt([1, 5, 4], [4, 6, 5], C.eye), Pt([-4, 6, 4], [-3, 7, 5], C.eye), Pt([4, 6, 4], [5, 7, 5], C.eye),
    Pt([-2, 5, 4], [-1, 6, 5], 0x3a2a20), Pt([2, 5, 4], [3, 6, 5], 0x3a2a20),
    Pt([-3, 4, 4], [0, 5, 5], GC.skinD), Pt([1, 4, 4], [4, 5, 5], GC.skinD),
    B([0, 3, 5], [1, 5, 7], GC.skin), Pt([0, 3, 6], [1, 4, 7], GC.skinD),   // nose
    // moustache, then the long beard (the long end is a chain), sideburns running into it
    B([-3, 2, 5], [4, 3, 7], GC.hair), B([-5, 0, 4], [-2, 3, 6], GC.hair), B([3, 0, 4], [6, 3, 6], GC.hair),
    B([-4, -5, -1], [5, 2, 6], beard),
    B([-5, 0, -2], [-4, 7, 3], hairP), B([5, 0, -2], [6, 7, 3], hairP),
  ];
}

// ---------------------------------------------------------------- 青龍偃月刀 (weapon joint: shaft along +Z, rear grip at 0)
function glaiveGeo() {
  // shaft −0.8 … 1.56 m: dark green, gold bands every 0.32 m, gold butt cap and spike
  const shaft = vox([
    B([-1, -1, -40], [1, 1, 78], (x, y, z) => (md(z + 40, 16) === 0 ? GC.band : (z >> 1) & 1 ? GC.shaftH : GC.shaft)),
    ...Array.from({ length: 7 }, (_, k) => B([-2, -2, -37 + k * 16], [2, 2, -36 + k * 16], GC.band)),
    B([-2, -2, -43], [2, 2, -39], GC.S), B([-1, -1, -47], [1, 1, -43], GC.Sd),
  ], 0.02, { jitter: 0.04, ao: 0.3 });
  // gold dragon-head collar (1.5–1.72 m): snout, jaw, horns, jade eyes, a ragged red mane behind
  const g = GC.S, gd = shade(GC.S, 0.8);
  const collar = vox([
    B([-3, -3, 130], [3, 3, 133], g),
    B([-4, -4, 133], [4, 5, 142], (x, y, z) => (md(z + y, 3) === 0 ? gd : g)),
    B([-4, 3, 138], [4, 7, 143], g), B([-4, -5, 138], [4, -2, 142], gd),
    B([-5, 4, 133], [-3, 6, 136], 0x2fbf8a), B([3, 4, 133], [5, 6, 136], 0x2fbf8a),   // jade eyes
    B([-3, 6, 128], [-1, 9, 134], g), B([1, 6, 128], [3, 9, 134], g),                   // horns
    B([-4, -4, 125], [4, 4, 130], (x, y, z) => (hash01(x, y, z) < 0.25 ? null : hash01(y, z, x) < 0.3 ? 0xd8402c : 0xa82418)),   // red mane
  ], 0.012, { jitter: 0.05, ao: 0.35 });
  // the crescent blade: 1.7–2.3 m, the spine rising from the collar, the edge sweeping out to a hooked point
  const v = 0.012, z0 = Math.round(1.7 / v), z1 = Math.round(2.3 / v), L = z1 - z0, boxes = [];
  for (let z = z0; z < z1; z++) {
    const u = (z - z0) / L, lift = Math.round(14 * u * u), lo = (u < 0.15 ? -2 : -1) + lift;
    const hi = lift + Math.round(u < 0.82 ? 6 + 20 * Math.sin(u / 0.82 * Math.PI / 2) : 26 - 70 * (u - 0.82) ** 1.3);
    if (hi > lo) boxes.push(B([-1, lo, z], [1, hi, z + 1], (x, y) => (y >= hi - 2 ? GC.steel : y <= lo + 2 ? 0x2e7a50 : md(y + z, 9) === 0 ? GC.steelD : GC.steelM)));
  }
  boxes.push(B([-1, -5, z0 + 6], [1, -1, z0 + 10], GC.steelD), B([-1, -7, z0 + 9], [1, -4, z0 + 12], GC.steelM));   // back spur
  for (let k = 0; k < 6; k++) boxes.push(B([-1, 14 + k * 2, z1 - k], [1, 17 + k * 2, z1 - k + 1], GC.steel));        // hooked point
  const blade = vox(boxes, v, { jitter: 0.03, ao: 0.2 });
  return [shaft, collar, blade];
}

export function createGyModel(rig) {
  const mat = heroLook(new THREE.MeshStandardMaterial({ color: new THREE.Color(0.85, 0.85, 0.85), vertexColors: true, roughness: 0.6, metalness: 0.08, flatShading: true }));
  const body = bodyParts(GC);
  // gold belt plaque with two gems
  body.parts.hips.push(B([-3, -1, 5], [3, 4, 7], GC.S), Pt([-2, 2, 6], [-1, 3, 7], GC.Tl), Pt([1, 2, 6], [2, 3, 7], GC.Tl), Pt([-1, 0, 6], [1, 1, 7], GC.Sd));
  const { meshes, add } = buildBody(rig, mat, body, head());
  const [shaft, collar, blade] = glaiveGeo();
  add(rig.joints.weapon, shaft, 'glaive');
  add(rig.joints.weapon, collar, 'collar', heroLook(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.55, flatShading: true }), 0.25, 0.6));
  add(rig.joints.weapon, blade, 'blade', new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.6, flatShading: true, emissive: 0xd8ffe8, emissiveIntensity: 0.07 }));
  return { meshes, material: mat };
}

// ---------------------------------------------------------------- secondary chain segments
const capeSeg = (i, n) => {
  const w = Math.round(6 + i * 3 / (n - 1)), last = i === n - 1;
  const col = (x, y) => (last && y === -7 && hash01(x, i, 5) < 0.45 ? null : last && (y === -5 || y === -4) ? GC.emb
    : (x + y * 3 + i * 7) % 11 === 0 || x === -w || x === w - 1 ? GC.capeD : GC.cape);
  const edge = (x) => x === -w || x === w - 1 || (i >= 3 && (x === -w + 1 || x === w - 2));
  return vox([B([-w, -7, 0], [w, 0, 1], (x, y) => (edge(x) ? null : col(x, y))), B([-w, -7, -1], [w, 0, 0], (x, y) => (edge(x) ? col(x, y) : null))],
    0.025, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
};
const apronSeg = (i, n) => vox([B([-3, -5, 0], [3, 0, 1], (x, y) => (i === n - 1 && y === -5 ? (x % 2 ? null : GC.S) : x === -3 || x === 2 ? GC.S : GC.W))],
  0.025, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.2 });
const beardSeg = (i, n) => {
  const w = Math.max(1, 4 - Math.floor(i * 0.7)), last = i === n - 1;
  return vox([B([-w, last ? -6 : -4, -1], [w, 0, 2], (x, y, z) => (last && y < -3 && hash01(x, z, i) < 0.5 ? null : md(x * 2 + y + i, 5) === 0 ? GC.hairH : GC.hair))],
    HV, { jitter: 0.06, ao: 0.3 });
};
const hoodTailSeg = () => vox([B([-1, -7, 0], [1, 0, 1], (x, y) => (y === -7 ? GC.S : GC.scarfD))], 0.016, { off: [0, 0, -0.5], jitter: 0.03, ao: 0.15 });
const tasselSeg = () => vox([B([-1, -4, -1], [1, 0, 1], 0xb8281a)], 0.012, { jitter: 0.1, ao: 0.2 });

export function createGySecondary(scene, rig, mat) {
  const j = rig.joints, body = bodyChains(scene, rig, mat, capeSeg, apronSeg), { add } = body;
  // the long beard: a stiff, heavy chain from under the chin, resting on the chest
  add(j.head, { anchor: [0, -5 * HV, 3 * HV], rest: [0, -1, 0.25], n: 5, len: 0.06, stiff: 0.22, drag: 0.2, wind: 0.5, face: [0, 0, 1], cone: 50, sway: 0.08,
    seg: beardSeg, hit: [['chest', 0.035]] });
  for (const sx of [-1, 1]) {                                        // the hood's two tails
    add(j.head, { anchor: [sx * 1.5 * HV, 12 * HV, -8 * HV], rest: [sx * 0.25, -0.6, -1], n: 3, len: 0.1, stiff: 0.03, drag: 0.06, wind: 2.2, cone: 110, sway: 0.5,
      seg: hoodTailSeg, hit: ['head'] });
  }
  for (let k = 0; k < 4; k++) {                                      // red tassel under the dragon collar
    const a = k * Math.PI / 2, ox = Math.cos(a) * 0.016, oy = Math.sin(a) * 0.016;
    add(j.weapon, { anchor: [ox, oy, 1.52], rest: [ox * 12, oy * 4 - 1, -0.35], n: 3, len: 0.05, stiff: 0.05, drag: 0.12, wind: 0.8, cone: 130, sway: 0.15,
      face: [1, 0, 0], seg: tasselSeg });
  }
  return body;
}
