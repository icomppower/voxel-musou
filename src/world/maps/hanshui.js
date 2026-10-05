// 漢水 (Han River, 219 AD) laid out along +Z — the same 漢中 country and golden hour as 定軍山, re-dressed for Cao Cao's
// counter-attack after it: his grain depot on 北山, the basin where the Shu raiders are encircled, 趙雲's camp, and the
// bluff over the Han where his rearguard stands. Chapter V (story/hanshui.js).
//   北山糧屯  Beishan grain depot  z -162 …  -70   h 0     Cao's grain stacks (gates 'grain1'…'grain5': a shut gate is
//                                                         a standing stack, open = burnt; build() draws both); story start
//   包圍圈    the encirclement     z  -72 …   40   h 0→4   a basin (free-mode arena) closing to a 16 m chokepoint (z ≈ 26)
//   趙雲營    Zhao Yun's camp      z   42 …   98   h 4     palisade across its south face, gate 'campGate' at x 0 (build:
//                                                         two leaves that swing inward)
//   漢水岸    bluff over the Han   z   96 …  180   h 4→10  road up to the bluff; past its rim the ground falls to the river
// Format: ./index.js.
import * as THREE from 'three';
import { boxesGeometry, shade } from '../../core/voxel.js';
import { makeRng, hash01 } from '../../core/rng.js';
import { lit } from '../castle.js';
import { GATES } from '../map.js';

const CAMP_H = 4, BLUFF_H = 10;
/** Grain stack centres on 北山 (each a 3.2 m square gate). */
const GRAIN = [[-26, -132], [24, -124], [-18, -102], [20, -93], [-2, -84]];
const CAMP_Z = 44;                                         // the camp's south palisade / gate line

export default {
  id: 'hanshui',
  name: { zh: '漢水', en: 'Han River' },
  grid: [-112, -190, 112, 236],
  pieces: [
    { id: 'depot', rect: [-46, -162, 46, -70], h: 0, edge: 3, rise: 8 },
    { id: 'neck', path: [[0, -72, 16, 0], [0, -52, 15, 0.6]], edge: 2, rise: 16 },
    { id: 'ring', ell: [0, -18, 36, 34], h: (x, z) => 0.6 + Math.max(0, z + 52) / 50, edge: 3, rise: 22 },
    { id: 'choke', path: [[0, 12, 12, 1.8], [0, 26, 8, 3.2], [0, 40, 10, CAMP_H]], edge: 1.5, rise: 28 },
    { id: 'camp', rect: [-30, 42, 30, 98], h: CAMP_H, rise: 3 },
    { id: 'road', path: [[0, 96, 10, CAMP_H], [4, 112, 11, 6.5], [8, 126, 13, BLUFF_H]], edge: 1.5, rise: 12 },
    { id: 'bluff', ell: [10, 152, 32, 28], h: BLUFF_H, edge: 2, rise: 5, drop: 1e9 },   // a rim all round, then the fall to the Han
  ],
  // the camp palisade either side of its gate; the command tent, drum stand and watchtower (solid set pieces)
  carve: [[-31, 42.5, -6, 45.5], [6, 42.5, 31, 45.5]],
  props: [[-22, 70, -12, 80], [9, 64, 13, 68], [21, 50, 25, 54]],
  zones: [
    { id: 'beishan', name: { zh: '北山糧屯', en: 'Beishan Grain Depot' }, x: 0, z: -116, w: 96, d: 92 },
    { id: 'pass', name: { zh: '包圍圈', en: 'The Encirclement' }, x: 0, z: -16, w: 80, d: 108 },
    { id: 'camp', name: { zh: '趙雲營', en: "Zhao Yun's Camp" }, x: 0, z: 70, w: 64, d: 56 },
    { id: 'bank', name: { zh: '漢水岸', en: 'Bluff over the Han' }, x: 8, z: 140, w: 80, d: 80 },
  ],
  route: [[0, -150], [0, -110], [0, -72], [0, -40], [0, -10], [0, 14], [0, 30], [0, CAMP_Z], [0, 70], [0, 96], [4, 112], [8, 126], [10, 150]],
  gates: {
    ...Object.fromEntries(GRAIN.map(([x, z], k) => [`grain${k + 1}`, { rect: [x - 1.6, z - 1.6, x + 1.6, z + 1.6], name: { zh: '糧堆', en: 'Grain Stack' } }])),
    campGate: { rect: [-6, CAMP_Z - 1.5, 6, CAMP_Z + 1.5], name: { zh: '營門', en: 'Camp Gate' } },
  },
  anchors: { ...Object.fromEntries(GRAIN.map((p, k) => [`grain${k + 1}`, p])), gate: [0, CAMP_Z] },
  // story: at the foot of 北山 facing the depot; free: the basin of the encirclement
  spawn: { story: { x: 0, z: -154, yaw: 0, tilt: -0.05 }, free: { x: 0, z: -18, yaw: 0 } },
  // the Han beyond the bluff: open water across the far end, no fords
  water: { along: 'x', c: (x) => 200 + 4 * Math.sin(x * 0.03), dc: (x) => 0.12 * Math.cos(x * 0.03), hw: 14, bed: [2.6, 2.6], fords: [], stones: 12, y: -0.4 },
  sky: {}, fog: [36, 330], post: {},
  light: { key: [4, -140] },
  terrain: {
    pave: (x, z) => (x > -28 && x < 28 && z > 48 && z < 96 ? 0.35 : 0),                      // the camp's parade ground
    bare: (x, z) => (x > -31 && x < 31 && z > 42 && z < 98) || Math.hypot(x, z + 110) < 34,  // camp, depot floor
    rock: (h, x, z) => h - 0.6 - Math.max(0, z + 52) / 50,
    scorch: { n: 18, area: [-36, -150, 36, 150], spots: GRAIN.map(([x, z]) => [x, z, 0.9]) },
    rubble: [-50, -160, 50, 176],
    pines: [-176, 40],
    mountains: { peakA: -0.6, peak: 30 },
  },
  fires: [[-40, -150, 1.1], [38, -80, 1.0], [-30, -30, 1.2], [30, 4, 1.1], [-26, 110, 1.0]],
  lightSites: [[-4, 2.2, 50, 26, 10], [4, 2.2, 50, 26, 10], [0, 2.2, 80, 24, 10], [20, 2.2, 70, 24, 10], [4, 2.2, 146, 26, 10], [18, 2.2, 170, 26, 10],
    [4, 2.2, -140, 26, 10], [-12, 2.2, -92, 26, 10], ...GRAIN.map(([x, z]) => [x, 1.6, z, 40, 14])],
  hq: [10, 160],

  dress(k) {
    const { r, mats, props } = k;
    const cao = k.banner('曹', { bg: '#1c1414', fg: '#d8b060', border: '#7d2a1f', w: 160, h: 320, seed: 21 });
    const zhao = k.banner('趙', { bg: '#e8e0cc', fg: '#1d3a6a', border: '#2f5a8a', w: 128, h: 256, seed: 31 });
    // ---- 北山: carts, supplies, Cao's standards, tents and braziers round the stacks (the stacks themselves: build)
    for (const [x, z, yaw] of [[-34, -140, 0.4], [32, -136, -0.5], [-8, -118, 1.4], [30, -104, 2.2], [-34, -92, 0.9]]) k.cart(x, z, yaw);
    k.supplies(-12, -140, 0.3, 6); k.supplies(12, -108, -0.4, 5); k.supplies(-30, -112, 0.8, 5);
    k.standard(-38, -124, 1.1, cao); k.standard(36, -116, 1.0, mats.foe); k.standard(-10, -76, 0.9, mats.foe); k.standard(14, -74, 0.9, cao);
    for (const [x, z] of [[-6, -128], [10, -96]]) k.tent(x, z, 0.2, 0x6a5a4a);
    k.lamp(4, -140, 0.5); k.lamp(-12, -92, 0.5);
    GRAIN.forEach(([x, z], i) => k.fire(x, k.ground(x, z) + 0.9, z, 1.5, true, `grain${i + 1}`));   // burns once its gate is open
    // ---- the encirclement: Wei standards round the rim, towers over the chokepoint
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.3, x = Math.sin(a) * 34, z = -18 + Math.cos(a) * 32;
      if (Math.abs(x) < 16 && Math.abs(z + 18) > 26) continue;                 // keep the road mouths clear
      k.standard(x, z, r.range(1, 1.15), r.chance(0.2) ? mats.pennant : mats.foe);
    }
    k.tower(-14, 22, 5.5, 1.3); k.tower(14, 30, 6, 1.35);
    // ---- 趙雲營: palisade with the gate in its south face, gate towers, watchtower, command tent, tents, drums
    k.palisade([[-31, CAMP_Z], [-7, CAMP_Z]]); k.palisade([[7, CAMP_Z], [31, CAMP_Z]]);
    k.palisade([[-31, CAMP_Z], [-31, 98]]); k.palisade([[31, CAMP_Z], [31, 98]]);
    k.tower(-8.6, CAMP_Z, 6, 1.5, mats.allyFlag); k.tower(8.6, CAMP_Z, 6, 1.5, mats.allyFlag); k.tower(23, 52, 8, 1.6, mats.allyFlag);
    { const x = -17, z = 75, gy = k.ground(x, z), L = k.local(x, gy, z, 0);
      for (let q = 0; q < 6; q++) L(0, 0.4 + q * 0.75, 0, [9.6 * (1 - q * 0.15), 0.8, 9.4 * (1 - q * 0.12)], shade(0xe0d6bc, 1 - q * 0.05));
      L(0, 5.6, 0, [0.3, 2.4, 0.3], 0x3a2618);
      k.lantern(x + 5.2, gy + 2.4, z - 5.2); k.lantern(x - 5.2, gy + 2.4, z - 5.2); }
    for (let z = 58; z <= 92; z += 11) { k.tent(-26, z, 0, 0x7a6e5a); k.tent(26, z + 4, 0.05, 0x7a6e5a); }
    k.drum(11, 66, Math.PI); k.drum(-4, 88, Math.PI * 0.8);
    k.shieldRack(14, 84, -1.4); k.supplies(-8, 94, 0.2, 5);
    k.standard(-12, 50, 1.3, zhao, 11, [0, 20]); k.standard(12, 50, 1.1, mats.ally, 9.4, [0, 20]); k.standard(-20, 88, 0.9, mats.ally); k.standard(18, 96, 1.0, zhao);
    for (const [x, z] of [[-4, 50], [4, 50], [0, 80], [20, 70]]) k.lamp(x, z, 0.5);
    // ---- the bluff over the Han: Cao's rearguard standards, supplies abandoned in the retreat
    k.standard(0, 158, 1.4, cao, 12, [8, 120]); k.standard(22, 150, 1.0, mats.foe, 8.5, [8, 120]); k.standard(-8, 140, 0.9, mats.foe);
    k.cart(16, 132, 0.5, true); k.cart(-10, 164, 1.9, true); k.supplies(24, 162, -0.6, 5);
    k.lamp(4, 146, 0.55); k.lamp(18, 170, 0.55);
    k.reeds();
    // ---- the field: wrecks, arrows, debris, torch posts up the road
    k.wrecks();
    k.arrows([-40, -150, 40, 40]);
    k.debris([-44, -160, 44, 176]);
    k.torchPosts(-70, 40);
    // reserves off the walkable ground: Wei on the hills round the ring and over the river, Shu behind the camp
    for (const [x, z, f] of [[-58, -30, 1.4], [58, -10, -1.4], [-54, 20, 1.6], [56, 30, -1.6], [-40, 226, Math.PI], [30, 228, Math.PI]]) k.formation('foe', x, z, f, r.int(9, 14), r.int(4, 7));
    for (const [x, z, f] of [[-48, 70, 1.5], [48, 80, -1.5]]) k.formation('ally', x, z, f, r.int(8, 12), r.int(4, 6));
    k.aftermath({ fallen: [[-40, 40, -150, -74, 18], [-34, 34, -50, 20, 22], [-20, 30, 120, 175, 10]],
      standards: [8, -40, -150, 40, 170], dust: { n: 26, area: [-46, -150, 46, 40] } });
    k.farFires([[-74, -120], [72, -80], [-80, 10], [76, 60], [-70, 150], [60, 190]]);
  },

  // the grain stacks (a standing sack pile while the gate is shut, a charred heap once it is open) and the camp gate's
  // two leaves hinged on the gate towers (swing inward as 'campGate' opens)
  build(root, k) {
    const stacks = GRAIN.map(([x, z], i) => {
      const gy = k.ground(x, z), R = makeRng(900 + i), yaw = R.range(-0.4, 0.4), out = {};
      for (const burn of [false, true]) {
        const b = [], c = Math.cos(yaw), s = Math.sin(yaw);
        const L = (lx, ly, lz, sz, col) => b.push({ s: sz, p: [x + lx * c + lz * s, gy + ly, z - lx * s + lz * c], r: [0, yaw, 0], c: col });
        L(0, 0.12, 0, [3.4, 0.24, 3.4], burn ? 0x241814 : 0x5a4030);                // plank floor
        for (let lv = 0; lv < 4; lv++) {
          const n = 4 - lv, sz = 0.78;
          for (let a = 0; a < n; a++) for (let q = 0; q < n; q++) {
            const h = 0.52 * (burn ? (lv < 2 ? 0.6 : 0) : 1);
            if (!h) continue;
            const v = hash01(a + i * 7, q, lv), col = burn ? (v < 0.25 ? 0x5a2410 : 0x2a1c16) : shade(0xb89a5c, 0.84 + v * 0.3);
            L((a - (n - 1) / 2) * sz, 0.24 + lv * 0.5 + h / 2, (q - (n - 1) / 2) * sz, [sz * 0.94, h, sz * 0.94], col);
          }
        }
        if (!burn) L(0, 2.45, 0, [2.2, 0.16, 2.2], 0x7a6a44);                       // straw cover
        const m = new THREE.Mesh(boxesGeometry(b), lit());
        m.castShadow = m.receiveShadow = true; m.name = `grain${i + 1}${burn ? '-burnt' : ''}`;
        root.add(m);
        out[burn ? 'burnt' : 'fresh'] = m;
      }
      return { id: `grain${i + 1}`, ...out };
    });
    const doors = [-1, 1].map((sd) => {
      const b = [];
      for (let q = 0; q < 6; q++) b.push({ s: [0.9, 3.6 + (q % 2) * 0.3, 0.3], p: [sd * -(0.5 + q), 1.8, 0], c: shade(0x5a3e28, 0.9 + (q % 3) * 0.06) });
      b.push({ s: [6, 0.3, 0.2], p: [sd * -3, 1.0, -0.2], c: 0x3a2618 }, { s: [6, 0.3, 0.2], p: [sd * -3, 2.8, -0.2], c: 0x3a2618 });
      const m = new THREE.Mesh(boxesGeometry(b), lit());
      m.position.set(sd * 6, k.ground(0, CAMP_Z), CAMP_Z); m.castShadow = m.receiveShadow = true; m.name = 'camp-door';
      root.add(m);
      return m;
    });
    let open = 1;
    return {
      update(dt) {
        for (const g of stacks) { const b = !!GATES[g.id]?.open; g.fresh.visible = !b; g.burnt.visible = b; }
        open += ((GATES.campGate?.open ? 1 : 0) - open) * Math.min(1, dt * 3);
        doors[0].rotation.y = -1.45 * open; doors[1].rotation.y = 1.45 * open;
      },
    };
  },
};
