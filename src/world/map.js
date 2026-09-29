// Battlefield contract (sim-safe: pure data + pure functions, no THREE). The map lane owns this file and the set in
// src/world/*; hero, crowd, story, HUD and camera only go through these exports.
//
// Two battlefields share this contract; useMap(id) swaps which one every export describes (the grids of each are built
// once, on first use, and cached). 定軍山 is the default and is active at import, so every module that builds from
// the map at load (terrain, river, dressing, castle) sees Dingjun. Swap only while the screen is covered (the loading
// card / an ink wipe): main.js does it through world.js createWorlds().use(id).
//
// 定軍山 (Mount Dingjun, 219 AD) laid out along +Z, ≈ 370 m from the Shu camp to the summit — the DW8 stage shape:
// a wide opening field, a narrowing valley with one chokepoint, a gate you break through, then the climb to the
// enemy commander on the high ground, who stands where the whole map can see him.
//   蜀軍本陣  Shu main camp       z -156 … -119   h 0    palisade, tents, 蜀 banners; story start
//   漢水渡口  Han River ford      z -120 …  -44   h 0    open plain cut by the river: three shallow crossings
//   山道      mountain pass       z  -52 …   80   h 1→12 valley mouth → basin (free-mode arena, origin) → climb →
//                                                        chokepoint (z ≈ 62, 14 m wide, barricade gate 'pass')
//   魏軍營寨  Wei fortified camp  z   76 …  140   h 12   plaza at the castle wall (face z = WALL_Z), gate passage at
//                                                        GATE_X (gate 'weiCamp'), courtyard behind it
//   (ramp)    switchback          z  134 …  180   h 12→28 up the west flank (barricade gate 'summit' at x ≈ -20)
//   定軍山頂  summit plateau      z  168 …  220   h 28   夏侯淵's command tent, drums, the great 夏侯 banner
//
// 赤壁 (Red Cliffs, 208 AD) — free battle only: a long shelf of shore along +Z at the foot of the red sandstone cliffs
// (−X, the 赤壁 inscription on their face), the Yangtze on the other hand (+X, toward the low sun) with Cao Cao's
// chained fleet (連環船) moored along it and burning, wooden piers running out to it.
//   聯軍登岸  Allied landing      z -120 …  -62   h 0.7  beached boats, 劉 / 孫 standards
//   赤壁江岸  Red Cliff shore     z  -60 …   60   h ≈1   the free-mode arena (origin), cliff foot with the inscription,
//                                                        two piers out to the fleet
//   曹軍水寨  Cao's naval camp    z   62 …  134   h 1.4  palisade, tents, the command tower (帥), a pier to the flagship
//
// 漢水 (Han River, 219 AD) — 第四章 only: the same 漢中 country as 定軍山 (its terrain builder and palette, terrain.js
// HANSHUI_PROFILE in hanshui.js), re-dressed for Cao Cao's counter-attack; the Han River at the far end under a bluff.
//   北山      Beishan grain depot  z -162 …  -70   h 0    Cao's grain stacks (five gates 'grain1'…'grain5': a
//                                                        closed gate is a standing stack, open = burnt)
//   包圍圈    the encirclement     z  -72 …   40   h 1→4  a basin closing to a 16 m chokepoint (z ≈ 26)
//   趙雲營    Zhao Yun's camp      z   42 …   98   h 4    palisade across its south face, gate 'campGate' at x 0
//   漢水岸    bluff over the Han   z   96 …  180   h 4→10 road up to the bluff; the river below it (+X, and north)
//
// Units: metres, +Z = "up the mountain" (camera yaw 0 looks along +Z). Sim y everywhere is HEIGHT ABOVE GROUND:
// ground(x, z) is only added by the render side (hero view, crowd view, camera focus, HUD tags, vfx), so every sim
// height test (airborne, hitbox yMax, enemy reach) keeps working on a slope.
// Walkable ground is a union of authored pieces (rects, ellipses, width-varying paths) rasterised once into a
// 1 m distance field (≈ metres inside the edge, negative outside); clampWalk() pushes points up its gradient, so the
// edge is the visible palisade / cliff foot / river bank, never an invisible circle. Heights come from the piece that
// owns the cell (flat plateaus, sloped paths), on a 2 m grid shared with the terrain mesh (src/world/terrain.js).
import { hash01 } from '../core/rng.js';

export const WALL_Z = 100, GATE_X = -10;      // Dingjun castle wall face / gate centre (castle.js, dressing.js, HUD)
export const CAMP_H = 12, SUMMIT_H = 28;      // Dingjun plateau heights (m): the camp (castle set sits on it), the summit
export const WATER_Y = -0.2;                  // Han River surface (river bed: -0.45 at the fords, -1.4 in the pools)
export const YANGTZE_Y = 0.05;                // 赤壁: the Yangtze's surface (its bed falls to YANGTZE_BED off the bank)
const YANGTZE_BED = -2.6, YANGTZE_X = 16;     // 赤壁: everything off the walkable ground east of x = 16 is river
export const HAN_Y = -1.2;                    // 漢水: the river's surface under the bluff (its bed falls to HAN_BED)
const HAN_BED = -4.6;

/** The active battlefield: { id, name {zh, en}, zones, hq [x, z] (the enemy HQ the minimap pins), officers? (free-mode
 *  officer names), fleet? (赤壁's ships) }. Replaced in place by useMap(). */
export const MAP = {};

/** Zone record by id (undefined if unknown). */
export const zone = (id) => MAP.zones.find((q) => q.id === id);

/** Zone containing (x, z), or null (the ramp's upper bend belongs to none). */
export function zoneAt(x, z) {
  for (const q of MAP.zones) {
    if (q.r ? (x - q.x) ** 2 + (z - q.z) ** 2 <= q.r * q.r : Math.abs(x - q.x) <= q.w / 2 && Math.abs(z - q.z) <= q.d / 2) return q;
  }
  return null;
}

// ---------------------------------------------------------------- layout helpers
// smooth 2D value noise from the stable hash (no RNG state) — also used by the terrain/dressing builders
function vnoise(x, z, seed) {
  const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash01(xi, zi, seed), b = hash01(xi + 1, zi, seed), c = hash01(xi, zi + 1, seed), d = hash01(xi + 1, zi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const noise2 = (x, z, seed = 1) => vnoise(x, z, seed) * 0.62 + vnoise(x * 2.3 + 7, z * 2.3 + 3, seed + 1) * 0.38;
export const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
function rectIn(r, x, z) {
  const dx = Math.max(r[0] - x, x - r[2]), dz = Math.max(r[1] - z, z - r[3]);
  return dx > 0 || dz > 0 ? -Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) : -Math.max(dx, dz);
}

// ---------------------------------------------------------------- 定軍山
// Walkable pieces. rect [x0, z0, x1, z1] | ell [cx, cz, rx, rz] | path [[x, z, half width, height], …] (heights and
// widths interpolate along it). h: plateau height (number) or (x, z) → m; edge: boundary wobble (m) for natural edges.
// The piece whose inside value is largest owns a cell (its height wins there), so pieces at different heights must
// only touch where their heights agree (path ends).
// Han River: centreline z(x), deep pools between the shallow crossings (x ranges)
const dingRiverZ = (x) => -86 + 5 * Math.sin(x * 0.055 + 0.6);
const DING_FORDS = [[-30, -18], [-6, 6], [18, 30]];
const fordIn = (x) => { let v = -1e9; for (const [a, b] of DING_FORDS) v = Math.max(v, Math.min(x - a, b - x)); return v; };   // > 0 inside a crossing
// non-walkable cut-outs [x0, z0, x1, z1]: the 本陣 front palisade either side of its gate; 夏侯淵's pavilion platform
// on the summit (stair, balustrade and step braziers included: 1.2 m of stone nobody may walk through); the Wei camp
// courtyard's command table with its stools and brazier (dressing.js: solid set pieces, not walk-through decals)
const DING_PROPS = [[-4.8, 201.8, 12.8, 214.8], [-6.5, 127.6, -1.5, 132.4]];
const DINGJUN = {
  map: {
    id: 'dingjun',
    name: { zh: '定軍山', en: 'Mount Dingjun' },
    hq: [4, 208],
    // zone: { id, name {zh, en}, x, z, and r (circle) or w, d (axis-aligned rect: width along X, depth along Z) }
    zones: [
      { id: 'honjin', name: { zh: '蜀軍本陣', en: 'Shu Main Camp' }, x: 0, z: -138, w: 52, d: 40 },
      { id: 'ford', name: { zh: '漢水渡口', en: 'Han River Ford' }, x: 0, z: -81, w: 96, d: 74 },
      { id: 'pass', name: { zh: '山道', en: 'Mountain Pass' }, x: 0, z: 16, w: 84, d: 124 },
      { id: 'camp', name: { zh: '魏軍營寨', en: 'Wei Fortified Camp' }, x: -16, z: 123, w: 76, d: 90 },
      { id: 'summit', name: { zh: '定軍山頂', en: 'Dingjun Summit' }, x: 2, z: 194, r: 34 },
    ],
  },
  bounds: [-112, -178, 112, 238],
  pieces: [
    { id: 'honjin', rect: [-24, -156, 24, -119], h: 0 },
    { id: 'ford', rect: [-44, -120, 44, -44], h: 0, edge: 3 },
    { id: 'mouth', path: [[0, -52, 15, 0], [0, -30, 15, 1.2]], edge: 2 },
    { id: 'basin', ell: [0, 0, 38, 36], h: (x, z) => 3 + z / 18, edge: 3 },
    { id: 'climb', path: [[0, 28, 13, 4.6], [7, 44, 11, 7], [4, 55, 7.5, 9], [2, 64, 7, 10.2], [-5, 72, 11, 11.4], [-10, 80, 14, 12]], edge: 1.5 },
    { id: 'plaza', rect: [-29, 76, 4, 96.5], h: CAMP_H },
    { id: 'gateway', rect: [GATE_X - 3.4, 95, GATE_X + 3.4, 111], h: CAMP_H },
    { id: 'court', rect: [-42, 110, 5, 140], h: CAMP_H },
    { id: 'ramp', path: [[-30, 133, 6, CAMP_H], [-41, 145, 6, 13.5], [-45, 159, 6, 18], [-33, 171, 6, 23], [-17, 176.5, 6, 26.5], [-6, 180, 7, SUMMIT_H]] },
    { id: 'summit', ell: [2, 194, 26, 26], h: SUMMIT_H, edge: 1.5 },
  ],
  props: DING_PROPS,
  carve: [[-25, -121.5, -9, -117.5], [9, -121.5, 25, -117.5], ...DING_PROPS],
  riverZ: dingRiverZ,
  fords: DING_FORDS,
  /** River cut on the evaluated cell: deep pools are not walkable, the bed (and the banks) sink. */
  cut(E, x, z) {
    const dz = Math.abs(z - dingRiverZ(x)), fi = fordIn(x);
    E.s = Math.min(E.s, Math.max(dz - 4.5, fi));
    E.h -= (1 - smooth(3.5, 7.5, dz)) * (1.4 + (0.45 - 1.4) * smooth(-2, 2, fi));   // river bed (also cuts the banks)
  },
  water: (x, z) => Math.abs(z - dingRiverZ(x)) < 6.5,
  /** Main road through every zone (render: paving, road dust, minimap trail). [x, z] */
  route: [[0, -150], [0, -118], [0, -86], [0, -46], [0, 0], [0, 28], [7, 44], [4, 55], [2, 64], [-5, 72], [-10, 84], [GATE_X, 104],
    [GATE_X, 118], [-22, 128], [-30, 133], [-41, 145], [-45, 159], [-33, 171], [-17, 176.5], [-6, 180], [2, 192]],
  gates: {
    pass: { rect: [-14, 59.5, 20, 62.5], open: true, name: { zh: '山道柵', en: 'Pass Barricade' } },
    weiCamp: { rect: [GATE_X - 7, 99.5, GATE_X + 7, 102.5], open: true, name: { zh: '營寨門', en: 'Camp Gate' } },
    summit: { rect: [-21.5, 166, -18.5, 186], open: true, name: { zh: '山頂柵', en: 'Summit Barricade' } },
  },
  // story: at the head of the Shu ranks just inside the 蜀軍本陣 gate, facing the ford through it (tilt: camera pitch
  // offset, rad — levelled a little so the gate towers, standards and the valley fill the top of the first frame, not
  // the paving); free: the pass basin (the origin, where the free-mode army forms up around him)
  spawn: (mode) => (mode === 'story' ? { x: 0, z: -127, yaw: 0, tilt: -0.09 } : { x: 0, z: 0, yaw: 0, tilt: 0 }),
};

// ---------------------------------------------------------------- 赤壁
// Cao Cao's chained fleet: rows of warships moored bow to stern up the river, planked and chained together, the
// columns nearest the shore burning. Pure data (deterministic): the world (chibi.js) builds them, the HUD draws them.
// ship: { x, z, yaw, len, w, burn (0 intact · 1 burning · 2 burnt out), sink (m below the waterline), tow (column k) }
const CHIBI_FLEET = [];
{
  const COLS = [72, 93, 114, 136, 160];
  COLS.forEach((cx, k) => {
    for (let z = -98 + (k % 2) * 15, i = 0; z <= 172; z += 30, i++) {
      const h = hash01(k * 17 + 3, i * 11 + 5, 91), h2 = hash01(k * 5 + 1, i * 7 + 2, 92);
      const burn = k < 2 ? (h < 0.72 ? 1 : h < 0.9 ? 2 : 0) : k < 4 ? (h < 0.45 ? 1 : h < 0.6 ? 2 : 0) : (h < 0.3 ? 1 : 0);
      CHIBI_FLEET.push({ x: cx + (h2 - 0.5) * 2.5, z: z + (h - 0.5) * 3, yaw: (h2 - 0.5) * 0.08, len: 22, w: 7, burn, sink: burn === 2 ? 0.7 : 0, tow: k });
    }
  });
}
// Huang Gai's fire boats (火船): small boats driven into the front of the fleet, burning end to end.
const CHIBI_FIREBOATS = [[60, -76, 0.5], [58, -22, -0.35], [62, 64, 0.3], [59, 142, -0.2], [64, 94, 0.55]];
const CHIBI_SOLID = [[-32, 82.4, -7.6, 85.6], [7.6, 82.4, 30, 85.6], [-28, 88, -20, 131], [17.5, 88, 25, 104], [-5, 114, 5, 124], [9, 115, 13, 119]];
const CHIBI = {
  map: {
    id: 'chibi',
    name: { zh: '赤壁', en: 'Red Cliffs' },
    hq: [0, 118],
    officers: [{ zh: '曹仁', en: 'CAO REN' }, { zh: '張遼', en: 'ZHANG LIAO' }, { zh: '蔡瑁', en: 'CAI MAO' }, { zh: '張允', en: 'ZHANG YUN' }],
    fleet: CHIBI_FLEET,
    fireboats: CHIBI_FIREBOATS,
    zones: [
      { id: 'landing', name: { zh: '聯軍登岸', en: 'Allied Landing' }, x: 2, z: -91, w: 64, d: 58 },
      { id: 'shore', name: { zh: '赤壁江岸', en: 'Red Cliff Shore' }, x: 2, z: 0, w: 124, d: 124 },
      { id: 'stockade', name: { zh: '曹軍水寨', en: "Cao Cao's Naval Camp" }, x: 0, z: 100, w: 120, d: 76 },
    ],
  },
  bounds: [-128, -140, 128, 176],
  pieces: [
    { id: 'landing', rect: [-26, -120, 30, -64], h: 0.7, edge: 3 },
    { id: 'neck', path: [[2, -70, 22, 0.7], [2, -38, 26, 0.9]], edge: 2.5 },
    { id: 'shore', ell: [2, 0, 40, 46], h: (x) => 0.9 - x * 0.015, edge: 3 },
    // the cliff foot under the inscription: a straight edge (x = -38), so the face above it stands flat and readable
    { id: 'foot', rect: [-38, -4, -18, 30], h: 1.45 },
    { id: 'north', path: [[2, 36, 24, 0.9], [0, 66, 22, 1.2], [-1, 86, 24, 1.4]], edge: 2.5 },
    { id: 'stockade', rect: [-30, 84, 28, 134], h: 1.4, edge: 1 },
    { id: 'pier1', path: [[34, -14, 3, 0.5], [44, -12, 3, 0.9], [66, -8, 3, 0.9]] },
    { id: 'pier2', path: [[34, 20, 3, 0.5], [44, 21, 3, 0.9], [66, 22, 3, 0.9]] },
    { id: 'pier3', path: [[22, 110, 3.2, 1.4], [66, 112, 3.2, 1.4]] },
  ],
  // solid set pieces in the stockade (chibi.js): the palisade either side of its gate (and the gate towers on its
  // ends), the rows of tents, the command tower, the drum stand beside it. Also kept clear of rock columns (props).
  props: CHIBI_SOLID,
  carve: CHIBI_SOLID,
  riverZ: () => 1e9,
  fords: [],
  /** Off the walkable ground on the river side, the bank shelves off into the Yangtze. */
  cut(E, x) {
    if (x > YANGTZE_X && E.s < 0) E.h -= smooth(0, 7, -E.s) * (E.h - YANGTZE_BED);
  },
  water: (x, z) => x > YANGTZE_X && walkIn(x, z) < 0.3,
  // the road the Shu allies follow: landing → shore → the stockade gate → the command tower
  route: [[2, -112], [2, -80], [2, -40], [0, 0], [0, 40], [-1, 70], [-1, 90], [0, 108]],
  gates: {},
  // story (第二章): at the allied landing, facing up the shore; free: the shore arena under the cliffs
  spawn: (mode) => (mode === 'story' ? { x: 2, z: -100, yaw: 0, tilt: 0 } : { x: 0, z: 0, yaw: 0, tilt: 0 }),
};

// ---------------------------------------------------------------- 漢水
// Grain stacks on 北山 (centres; each a 3.2 m square gate), the camp palisade either side of its gate, and the camp's
// solid set pieces (command tent, drum stand, watchtower).
export const HAN_GRAIN = [[-26, -132], [24, -124], [-18, -102], [20, -93], [-2, -84]];
const HAN_SOLID = [[-31, 42.5, -6, 45.5], [6, 42.5, 31, 45.5], [-22, 70, -12, 80], [9, 64, 13, 68], [21, 50, 25, 54]];
/** 漢水's river side: east of the bluff road and north of the bluff (off the walkable ground there, the bank falls to
 *  the river bed; the terrain grows no rock over it). */
export const hanRiver = (x, z) => (x > 40 && z > 100) || z > 178;
const HANSHUI = {
  map: {
    id: 'hanshui',
    name: { zh: '漢水', en: 'Han River' },
    hq: [10, 160],
    zones: [
      { id: 'beishan', name: { zh: '北山糧屯', en: 'Beishan Grain Depot' }, x: 0, z: -116, w: 96, d: 92 },
      { id: 'pass', name: { zh: '包圍圈', en: 'The Encirclement' }, x: 0, z: -16, w: 80, d: 108 },
      { id: 'camp', name: { zh: '趙雲營', en: "Zhao Yun's Camp" }, x: 0, z: 70, w: 64, d: 56 },
      { id: 'bank', name: { zh: '漢水岸', en: 'Bluff over the Han' }, x: 8, z: 140, w: 80, d: 80 },
    ],
  },
  bounds: [-112, -190, 112, 204],
  pieces: [
    { id: 'depot', rect: [-46, -162, 46, -70], h: 0, edge: 3 },
    { id: 'neck', path: [[0, -72, 16, 0], [0, -52, 15, 0.6]], edge: 2 },
    { id: 'ring', ell: [0, -18, 36, 34], h: (x, z) => 0.6 + Math.max(0, z + 52) / 50, edge: 3 },
    { id: 'choke', path: [[0, 12, 12, 1.8], [0, 26, 8, 3.2], [0, 40, 10, 4]], edge: 1.5 },
    { id: 'camp', rect: [-30, 42, 30, 98], h: 4 },
    { id: 'road', path: [[0, 96, 10, 4], [4, 112, 11, 6.5], [8, 126, 13, 9.2]], edge: 1.5 },
    { id: 'bluff', ell: [10, 152, 32, 28], h: 10, edge: 2 },
  ],
  props: HAN_SOLID,
  carve: HAN_SOLID,
  riverZ: () => 1e9,
  fords: [],
  /** Off the walkable ground on the river side the bank falls away under the bluff to the river bed. */
  cut(E, x, z) {
    if (hanRiver(x, z) && E.s < 0) E.h -= smooth(0, 6, -E.s) * (E.h - HAN_BED);
  },
  water: (x, z) => hanRiver(x, z) && ground(x, z) < HAN_Y + 0.3,   // the bluff's lip is dry ground, 11 m over the river
  route: [[0, -150], [0, -110], [0, -72], [0, -40], [0, -10], [0, 14], [0, 30], [0, 44], [0, 70], [0, 96], [4, 112], [8, 126], [10, 150]],
  gates: {
    ...Object.fromEntries(HAN_GRAIN.map(([x, z], k) => [`grain${k + 1}`, { rect: [x - 1.6, z - 1.6, x + 1.6, z + 1.6], open: true, name: { zh: '糧堆', en: 'Grain stack' } }])),
    campGate: { rect: [-6, 42.5, 6, 45.5], open: true, name: { zh: '營門', en: 'Camp Gate' } },
  },
  // story: at the foot of 北山, facing the depot; free: the middle of the depot
  spawn: (mode) => (mode === 'story' ? { x: 0, z: -154, yaw: 0, tilt: 0 } : { x: 0, z: -110, yaw: 0, tilt: 0 }),
};

const LAYOUTS = { dingjun: DINGJUN, chibi: CHIBI, hanshui: HANSHUI };
/** Battlefields a free battle can be fought on, in menu order (ids of LAYOUTS). */
export const MAP_IDS = Object.keys(LAYOUTS);
/** Name of a battlefield by id, without switching to it (menus). */
export const mapInfo = (id) => (LAYOUTS[id] || DINGJUN).map;

// ---------------------------------------------------------------- active layout (live bindings, swapped by useMap)
let L = DINGJUN;
/** Piece ids of the active layout, by owner index (TERRAIN.own). */
export const PIECE_IDS = [];
/** Main road of the active layout. [x, z] */
export const ROUTE = [];
/** 定軍山's ford crossings (x ranges); empty elsewhere. */
export const FORDS = [];
/** River centreline z(x) of the active layout (far away where there is no crossing river). */
export const riverZ = (x) => L.riverZ(x);
/** Open water at (x, z): the Han River's channel / the Yangtze (render: water colour; arrows fly over it). */
export const isWater = (x, z) => L.water(x, z);
/** Render side: (x, z) lies under a solid set piece's cut-out (± pad m): no rock columns / boulders grow there. */
export const onProp = (x, z, pad = 1) => L.props.some((r) => x > r[0] - pad && x < r[2] + pad && z > r[1] - pad && z < r[3] + pad);

let ROUTE_S = [];
/** Road point nearest (x, z): d = distance (m), s = its arc length (m), p = [x, z]. Returns a shared object. */
const _rn = { d: 0, s: 0, p: [0, 0] };
export function routeNear(x, z) {
  _rn.d = 1e9;
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const [ax, az] = ROUTE[i], [bx, bz] = ROUTE[i + 1], ex = bx - ax, ez = bz - az;
    const t = Math.min(1, Math.max(0, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez))), e = Math.hypot(x - ax - ex * t, z - az - ez * t);
    if (e < _rn.d) { _rn.d = e; _rn.s = ROUTE_S[i] + t * (ROUTE_S[i + 1] - ROUTE_S[i]); _rn.p[0] = ax + ex * t; _rn.p[1] = az + ez * t; }
  }
  return _rn;
}
/** Distance (m) from (x, z) to the main road. */
export const routeDist = (x, z) => routeNear(x, z).d;
/** Arc length (m) along the road of the road point nearest (x, z). */
export const routeS = (x, z) => routeNear(x, z).s;
/** Road point at arc length s (clamped to the road's ends). Returns a shared [x, z]. */
const _rp = [0, 0];
export function routeAt(s) {
  let i = 0;
  while (i < ROUTE.length - 2 && ROUTE_S[i + 1] < s) i++;
  const t = Math.min(1, Math.max(0, (s - ROUTE_S[i]) / (ROUTE_S[i + 1] - ROUTE_S[i])));
  _rp[0] = ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * t; _rp[1] = ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * t;
  return _rp;
}

const E = { s: 0, h: 0, o: 0 };               // evalPieces out: inside value, height, owner index
function evalPieces(Lay, x, z) {
  E.s = -1e9;
  const P0 = Lay.pieces;
  for (let k = 0; k < P0.length; k++) {
    const p = P0[k];
    let s, h = 0;
    if (p.rect) s = rectIn(p.rect, x, z);
    else if (p.ell) { const [cx, cz, rx, rz] = p.ell; s = (1 - Math.hypot((x - cx) / rx, (z - cz) / rz)) * Math.min(rx, rz); }
    else {
      s = -1e9;
      const P = p.path;
      for (let i = 0; i < P.length - 1; i++) {
        const [ax, az, aw, ah] = P[i], [bx, bz, bw, bh] = P[i + 1];
        const ex = bx - ax, ez = bz - az, t = Math.min(1, Math.max(0, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez)));
        const v = aw + (bw - aw) * t - Math.hypot(x - ax - ex * t, z - az - ez * t);
        if (v > s) { s = v; h = ah + (bh - ah) * t; }
      }
    }
    if (p.edge) s += p.edge * (noise2(x * 0.09 + k * 31, z * 0.09, 40 + k) - 0.5) * 2;
    if (s > E.s) { E.s = s; E.o = k; E.h = p.rect || p.ell ? (typeof p.h === 'function' ? p.h(x, z) : p.h) : h; }
  }
  for (const r of Lay.carve) E.s = Math.min(E.s, -rectIn(r, x, z));
  Lay.cut(E, x, z);
}

// ---------------------------------------------------------------- grids (built once per layout, deterministic)
// One 2 m grid: walk inside value FIELD (bilinear: the edge lands within ≈ 0.1 m), height HGT, owner piece OWN.
const HS = 2;
let GX0 = 0, GZ0 = 0, HNX = 1, HNZ = 1, HGT = null, OWN = null, FIELD = null;
function buildGrid(Lay) {
  const [x0, z0, x1, z1] = Lay.bounds, nx = (x1 - x0) / HS + 1, nz = (z1 - z0) / HS + 1;
  const h = new Float32Array(nx * nz), own = new Uint8Array(nx * nz), fld = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { evalPieces(Lay, x0 + i * HS, z0 + j * HS); h[i + j * nx] = E.h; own[i + j * nx] = E.o; fld[i + j * nx] = E.s; }
  // seams where two pieces meet at slightly different heights: two passes of a masked blur (only neighbours within
  // 1.5 m of the cell join in), so path feet fan into their plateaus while retaining walls between levels stay sharp
  const tmp = new Float32Array(h.length);
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const c = h[i + j * nx];
      let s = 0, n = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
        const v = h[ii + jj * nx];
        if (Math.abs(v - c) < 1.5) { s += v; n++; }
      }
      tmp[i + j * nx] = s / n;
    }
    h.set(tmp);
  }
  const rs = Lay.route.map(() => 0);
  for (let i = 1; i < Lay.route.length; i++) rs[i] = rs[i - 1] + Math.hypot(Lay.route[i][0] - Lay.route[i - 1][0], Lay.route[i][1] - Lay.route[i - 1][1]);
  return { x0, z0, x1, z1, nx, nz, h, own, in: fld, routeS: rs };
}
/** Render-side read-only view of the active terrain grid (terrain mesh, cliffs, minimap). in: walk inside value (m).
 *  The object is kept and refilled by useMap(). */
export const TERRAIN = { x0: 0, z0: 0, x1: 0, z1: 0, step: HS, nx: 0, nz: 0, h: null, own: null, in: null };
/** Index of the grid node nearest (x, z) (no bounds check). */
export const node = (x, z) => Math.round((x - GX0) / HS) + Math.round((z - GZ0) / HS) * HNX;

function bilerp(g, x, z) {
  let fx = (x - GX0) / HS, fz = (z - GZ0) / HS;
  fx = Math.min(HNX - 1.001, Math.max(0, fx)); fz = Math.min(HNZ - 1.001, Math.max(0, fz));
  const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = i + j * HNX;
  return (g[k] * (1 - u) + g[k + 1] * u) * (1 - v) + (g[k + HNX] * (1 - u) + g[k + HNX + 1] * u) * v;
}

/** Walk inside value (m, < 0 outside) ignoring gates — render side (minimap, dressing placement). */
export const walkIn = (x, z) => bilerp(FIELD, x, z);

/** Terrain height (m) at (x, z): render-side offset only (see header). Bilinear on the 2 m grid. */
export const ground = (x, z) => bilerp(HGT, x, z);

// ---------------------------------------------------------------- gates (sim state: set from story.reset / step)
// A closed gate is a thin rect cut out of the walkable area, wider than the corridor it spans, so anyone caught in
// it is pushed out through its nearest long face (never sideways into the corridor wall). Render: world.js swings the
// castle doors / collapses and burns the barricades when a gate opens. All open by default; spawnPoint() (battle
// start) resets them, so the story closes what it needs in its reset(). The active layout's gates (赤壁 has none).
export const GATES = {};
let GATE_LIST = [];
/** Open / close a gate by id (定軍山 'pass' | 'weiCamp' | 'summit'; 漢水 'grain1'…'grain5' | 'campGate'). Sim: call
 *  from story.reset / story.step only. */
export function setGate(id, open) { if (GATES[id]) GATES[id].open = !!open; }

/** Make battlefield `id` ('dingjun' | 'chibi' | 'hanshui') the one every export describes (its grids are built on first use).
 *  Only while the screen is covered: the sim and every render module read the new field from the next call on.
 *  Returns the active id. */
export function useMap(id) {
  const next = LAYOUTS[id] || DINGJUN;
  if (next === L && TERRAIN.h) return L.map.id;
  L = next;
  const g = L.grid || (L.grid = buildGrid(L));
  GX0 = g.x0; GZ0 = g.z0; HNX = g.nx; HNZ = g.nz; HGT = g.h; OWN = g.own; FIELD = g.in;
  Object.assign(TERRAIN, { x0: g.x0, z0: g.z0, x1: g.x1, z1: g.z1, nx: g.nx, nz: g.nz, h: g.h, own: g.own, in: g.in });
  PIECE_IDS.length = 0; PIECE_IDS.push(...L.pieces.map((p) => p.id));
  ROUTE.length = 0; ROUTE.push(...L.route); ROUTE_S = g.routeS;
  FORDS.length = 0; FORDS.push(...L.fords);
  for (const k in GATES) delete GATES[k];
  Object.assign(GATES, L.gates); GATE_LIST = Object.values(GATES);
  for (const k in MAP) delete MAP[k];
  Object.assign(MAP, L.map);
  return L.map.id;
}
/** Id of the active battlefield. */
export const mapId = () => L.map.id;

function walkD(x, z) {
  let d = bilerp(FIELD, x, z);
  for (const g of GATE_LIST) if (!g.open) { const o = -rectIn(g.rect, x, z); if (o < d) d = o; }
  return d;
}

/** Keep a sim position on walkable ground, `pad` metres clear of the edge / closed gates (negative pad: allowed that
 *  far outside). Returns a shared [x, z] (copy it if you keep it). Newton steps up the distance field's gradient. */
const _out = [0, 0], EPS = 0.5;
export function clampWalk(x, z, pad = 0) {
  for (let k = 0; k < 8; k++) {
    const d = walkD(x, z);
    if (d >= pad) break;
    const gx = walkD(x + EPS, z) - walkD(x - EPS, z), gz = walkD(x, z + EPS) - walkD(x, z - EPS), g2 = gx * gx + gz * gz;
    if (g2 < 1e-6) { x += 0.37; continue; }                                  // flat spot (medial axis of a cut): nudge
    // step along the unit gradient by the deficit, ≤ 3 m per iteration: a Newton step (deficit / |∇d|) blew up to tens
    // of metres where the field is nearly flat (thin closed gates, river banks) and teleported soldiers across the map
    const s = Math.min(pad - d + 0.01, 3) / Math.sqrt(g2);
    x += gx * s; z += gz * s;
  }
  _out[0] = x; _out[1] = z;
  return _out;
}

/** Arrows (sim): true where a closed gate (≤ 4 m), the castle wall, a palisade or a cliff (≤ 6 m) stands at (x, z) at
 *  height y above ground. Open water (the Han River's pools, the Yangtze) is off the walk field but never blocks. */
export function blocksArrow(x, z, y) {
  if (y > 6) return false;
  if (y < 4) for (const g of GATE_LIST) if (!g.open && rectIn(g.rect, x, z) > -0.3) return true;
  return walkIn(x, z) < -0.6 && !L.water(x, z);
}

/** Where the hero starts on the active battlefield: { x, z, yaw, tilt } (see each layout's spawn). Battle start: also
 *  resets every gate to open. */
export function spawnPoint(mode) {
  for (const g of GATE_LIST) g.open = true;
  return L.spawn(mode);
}

useMap('dingjun');
