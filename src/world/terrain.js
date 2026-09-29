// Terrain of a Dingjun-style field (render-only, built from the active map grid in map.js, once per battlefield):
// 定軍山 and every field re-dressed from it (漢水). Each field brings a PROFILE (cliff rise per piece, extra paving,
// beaten earth, scattering ranges, scorch); DINGJUN_PROFILE reproduces the original set exactly.
//  · ground: one textured plane over the whole 2 m grid, heights = ground(), vertex colours for dust drifts,
//    damp river banks, scorched earth, cliff-foot AO and bare rock on the high ground, a dry-grass map splatted in by
//    grassAt() and flagstone paving drawn in the shader (+ instanced wind-swayed tufts, voxel boulders at the cliff feet);
//  · cliffs: 2 m voxel rock columns on every node outside the walkable edge, stepped in 1 m courses — tall and sheer
//    along the pass (DW8's canyon stages), low ridges round the camp plateau, gentle hills round the ford, a drop on
//    the summit's rim (the vista). Only exposed faces are built, so a camera that slips inside a cliff sees through it;
//    they receive shadows but cast none (a 30 m wall would black out the whole pass floor under the low sun);
//  · rubble, pines on the heights, and layered hazy mountains with Dingjun's peak behind the summit.
import * as THREE from 'three';
import { makeRng, hash01 } from '../core/rng.js';
import { boxesGeometry, makeBuilder } from '../core/voxel.js';
import { hazeColor, SUN_DIR, SUN_AZ, NOISE_GLSL } from './sky.js';
import { TERRAIN as G, PIECE_IDS, ground, noise2, smooth, riverZ, routeDist, onProp, node, mapId, SUMMIT_H } from './map.js';
import { wrap } from '../crowd/crowd.js';

// ---------------------------------------------------------------- per-field profile
/**
 * What makes a field's terrain its own (everything else is shared):
 *   rise    { piece id: m } the rock climbs toward away from the walkable edge (× 0.65-1.35 ridge noise)
 *   column  (id, x, z, d, n) → m | undefined: a special column top (定軍山: the summit's rim and drop), else the rise
 *   skip    (x, z, id) → true: no column on this node (open water beside the field)
 *   pave    (x, z) → extra paving mask (plazas, squares); beaten (x, z) → grass multiplier (camps: beaten earth)
 *   tuftZ / rubbleX / rubbleZ  [lo, hi] scatter ranges; scorch (r) → extra [x, z, s] burnt ground (after the field fires)
 */
export const DINGJUN_PROFILE = {
  rise: { honjin: 5, ford: 9, mouth: 22, basin: 26, climb: 34, plaza: 3, gateway: 3, court: 3.5, ramp: 16, summit: 40 },
  column: (id, x, z, d, n) => (id === 'summit' && z < 212 ? (d < 3 ? SUMMIT_H + 1 : SUMMIT_H - Math.min(SUMMIT_H + 1, (d - 3) * (1.1 + n))) : undefined),   // rim, then the drop
  skip: (x, z, id) => id === 'ford' && Math.abs(z - riverZ(x)) < 7.5,        // the river cuts through the banks
  pave: (x, z) => {
    let m = 0;
    if (z > 76 && z < 140 && x > -30 && x < 5) m += 0.55;                      // plaza + courtyard: worn paving
    if (Math.hypot(x - 2, z - 194) < 13) m += 0.7;                             // summit parade ground
    if (Math.hypot(x, z + 140) < 11) m += 0.6;                                 // 本陣 square
    return m;
  },
  beaten: (x, z) => (z > 74 && z < 142 && x > -44 && x < 7 ? 0.15 : 1),        // the Wei camp: beaten earth
  tuftZ: [-160, 222], rubbleX: [-60, 60], rubbleZ: [-156, 215],
  scorch: (r) => {
    const out = [];
    for (let i = 0; i < 26; i++) out.push([r.range(-40, 40), r.range(-110, 200), r.range(0.5, 0.9)]);
    // burnt ground where the camp and the summit were fought over (courtyard, parade ground, round the beacon)
    out.push([-20, 132, 0.8], [-3, 116, 0.7], [-30, 121, 0.6], [-9, 186, 0.8], [13, 188, 0.7], [15, 215, 1.1], [-4, 176, 0.6]);
    return out;
  },
};

// the field being built (buildTerrain sets these from the active grid; the builders below read them)
let X0, Z0, S, NX, NZ, TOP, P;
const TOPS = {};                     // column tops per built field id (topAt)
const COL = -1.4;                    // a node grows a column this far outside the walk edge (its face then stands ≥ 0.4 m out)
/** Column top per grid node (m, 1 m courses), NaN where there is walkable ground / river. */
function columns() {
  const top = new Float32Array(NX * NZ).fill(NaN);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const k = i + j * NX, f = G.in[k];
    if (f > COL) continue;
    const x = X0 + i * S, z = Z0 + j * S, h = G.h[k], d = -f, id = PIECE_IDS[G.own[k]];
    if (P.skip(x, z, id)) continue;
    if (onProp(x, z)) continue;                                                  // a set piece's footprint (pavilion terrace, table)
    const n = noise2(x * 0.045, z * 0.045, 71);
    let t = P.column(id, x, z, d, n);
    if (t === undefined) t = h + Math.max(1.2, P.rise[id] * (0.65 + 0.7 * n) * (1 - Math.exp(-d / 7))) + (hash01(i, j, 5) - 0.5) * 1.2;
    t *= smooth(0, 30, Math.min(i, j, NX - 1 - i, NZ - 1 - j) * S);           // settle onto the outer plain at the grid rim
    top[k] = Math.round(t);
  }
  return top;
}
/** Point the builders at the active field (its grid and profile), its column tops computed on first use. */
function prepare(profile) {
  ({ x0: X0, z0: Z0, step: S, nx: NX, nz: NZ } = G);
  P = profile;
  TOP = TOPS[mapId()] || (TOPS[mapId()] = columns());
  TOP.nx = NX; TOP.x0 = X0; TOP.z0 = Z0;
}
prepare(DINGJUN_PROFILE);            // 定軍山 is active at import: dressing.js reads its tops while it builds
const DING_TOP = TOP;
/** Surface height at (x, z) including rock columns (props on the heights: watchtowers, pines, troops): the active
 *  field's columns when this module built it, else 定軍山's (the other sets place on walkable ground only). */
export function topAt(x, z) {
  const T = TOPS[mapId()] || DING_TOP, i = Math.round((x - T.x0) / S), j = Math.round((z - T.z0) / S);
  const t = i >= 0 && j >= 0 && i < T.nx && j < T.length / T.nx ? T[i + j * T.nx] : NaN;
  return Number.isNaN(t) ? ground(x, z) : t;
}

// ---------------------------------------------------------------- ground
/** Paving mask without the road itself (plazas, noise, broken patches), unclamped; the ford is a dirt track. The ground
 *  shader adds the road term from the interpolated route distance, so the road edge is exact on the 2 m grid. */
function paveBase(x, z) {
  if (Math.abs(z - riverZ(x)) < 9) return -9;
  // noise paving only grows out of the road (bulges joined to it): far from the route it left orphan flagstone islands
  let m = noise2(x * 0.07, z * 0.07, 5) * 1.3 - 0.62 - 1.2 * smooth(4, 9, routeDist(x, z));
  m += P.pave(x, z);
  const hole = noise2(x * 0.15, z * 0.15, 8);                                // broken patches of bare dust
  return m - Math.max(0, Math.min(1, (hole - 0.5) / 0.14)) * 1.0;
}
const roadTerm = (d) => 1.25 * Math.max(0, 1 - d / 3.4);
/** Paving mask 0..1: 1 = paved road / plaza, 0 = packed dirt. */
function paveMask(x, z) { return Math.max(0, Math.min(1, paveBase(x, z) + roadTerm(routeDist(x, z)))); }

function groundTexture() {
  // 24 m tile of packed dusty earth: blotchy tone, patchy gravel and a few half-buried pebbles.
  const SZ = 1024, PX = SZ / 24;
  const c = document.createElement('canvas'); c.width = c.height = SZ;
  const g = c.getContext('2d');
  const r = makeRng(99);
  g.fillStyle = '#7e6a57'; g.fillRect(0, 0, SZ, SZ);                        // pale dust (low chroma: the warm sun and grade add the peach)
  for (let i = 0; i < 160; i++) {                                            // tone blotches (dust / damp)
    const x = r.int(0, SZ), y = r.int(0, SZ), rad = r.range(30, 110), light = r.chance(0.55);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, light ? 'rgba(214,186,160,0.42)' : 'rgba(50,38,36,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // gravel / grain (voxel-sized specks): clustered into gravelly patches with near-bare dust between, so the field has
  // macro structure instead of a uniform confetti
  for (let i = 0; i < 2600; i++) {
    const v = r.range(0.92, 1.08), q = r.int(2, 4);
    g.fillStyle = `rgb(${124 * v | 0},${106 * v | 0},${92 * v | 0})`;
    g.fillRect(r.int(0, SZ - 1), r.int(0, SZ - 1), q, q);
  }
  for (let k = 0; k < 70; k++) {
    const cx = r.int(0, SZ), cy = r.int(0, SZ), rad = r.range(24, 80);
    for (let i = 0; i < rad * 2.2; i++) {
      const a = r.range(0, 6.28), d = rad * Math.sqrt(r.next()), v = r.range(0.84, 1.14), q = r.int(2, 5);
      g.fillStyle = `rgb(${124 * v | 0},${106 * v | 0},${92 * v | 0})`;
      g.fillRect((cx + Math.cos(a) * d + SZ) % SZ, (cy + Math.sin(a) * d + SZ) % SZ, q, q);
    }
  }
  // a few half-buried pebbles, soft (the paving itself is drawn by the ground shader; no crack scribbles)
  for (let i = 0; i < 40; i++) {
    const w = r.range(0.15, 0.35) * PX, h = r.range(0.12, 0.28) * PX, x = r.int(0, SZ), y = r.int(0, SZ), v = r.range(0.92, 1.1);
    g.fillStyle = `rgb(${116 * v | 0},${102 * v | 0},${92 * v | 0})`; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,236,214,0.12)'; g.fillRect(x, y, w, 2);
    g.fillStyle = 'rgba(25,14,12,0.16)'; g.fillRect(x, y + h - 2, w, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;                                            // grain, not 10-20 px squares by the lens
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Dry golden-olive grass mask 0..1 on the open ground: gone on the road and the paving, trampled into patches where
 * the fight runs, lush on the river banks, bare in the Wei camp's plaza/courtyard. Also seeds the grass tufts.
 */
function grassAt(x, z) {
  const inside = G.in[node(x, z)] ?? -9;
  let g = smooth(0.2, 0.52, noise2(x * 0.05 + 13, z * 0.05 - 7, 41));
  g *= smooth(2.5, 7.5, routeDist(x, z)) * (1 - paveMask(x, z));
  if (inside > 5) g *= 0.5 + 0.5 * smooth(0.42, 0.7, noise2(x * 0.11, z * 0.11, 43));   // trampled where the fight runs
  const dz = Math.abs(z - riverZ(x));
  g = Math.max(g, (1 - smooth(8, 15, dz)) * smooth(4.4, 6.2, dz));              // lush banks, not in the water
  return g * P.beaten(x, z);
}

function grassTexture() {
  // 8 m tile of dry grass seen from above: olive ground cover, dense 1×3 texel blades in straw gold / sage / deep olive,
  // dark gaps. Alpha = a blade-height noise, used to break the grass/dirt edge into ragged tufts (not a smooth blend).
  const SZ = 256, c = document.createElement('canvas'); c.width = c.height = SZ;
  const g = c.getContext('2d'), r = makeRng(313);
  g.fillStyle = '#4c5030'; g.fillRect(0, 0, SZ, SZ);
  const COLS = ['#6c7040', '#7d7a44', '#5a6036', '#948648', '#454a2a', '#687244', '#a08e52'];   // olive, sage, a little straw
  for (let i = 0; i < 9000; i++) { g.fillStyle = COLS[r.int(0, COLS.length - 1)]; g.fillRect(r.int(0, SZ - 1), r.int(0, SZ - 1), 1, r.int(2, 4)); }
  // (a DataTexture, not the canvas: a canvas premultiplies, which would crush the colour under a low alpha)
  const d = new Uint8Array(g.getImageData(0, 0, SZ, SZ).data);
  for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) {
    const n = 0.5 * Math.sin(x * 0.19 + Math.sin(y * 0.13) * 2) * Math.sin(y * 0.23 + Math.sin(x * 0.11) * 2) + 0.5;
    d[(y * SZ + x) * 4 + 3] = Math.min(255, (n * 0.6 + hash01(x, y, 7) * 0.4) * 255);
  }
  const t = new THREE.DataTexture(d, SZ, SZ);
  t.generateMipmaps = true; t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** Ground splat: dirt map × vertex tone (drifts, AO, scorch, damp banks, rock dust) with the grass map blended in by
 *  aGrass, its edge broken by the grass alpha into ragged tufts, a world-space macro tone (warm dry drifts / cool damp
 *  hollows) so no tile repeats, and the paving: flagstone courses with tight dark joints, a worn crown and cart ruts,
 *  relief shaded toward the key light, fraying into the dirt stone by stone (aPave = [plaza/noise mask, road distance]).
 *  Shade, not geometry: the paving can never read as loose tiles, and costs no triangles. */
function splatMaterial(map, grass) {
  const m = new THREE.MeshStandardMaterial({ map, vertexColors: true, roughness: 0.96 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tGrass = { value: grass };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aGrass; attribute vec2 aPave; varying float vGrass; varying vec2 vGw; varying vec2 vPave;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrass = aGrass; vGw = position.xz; vPave = aPave;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D tGrass; varying float vGrass; varying vec2 vGw; varying vec2 vPave;
      ${NOISE_GLSL}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        // macro: sun-dried ochre drifts vs cooler, darker trampled earth, with defined (not smeared) edges and a
        // mid-scale mottling, so the 8-40 m band has value and hue separation instead of one beige
        float mN = dwNoise(vGw / 29.0) * 0.6 + dwNoise(vGw / 9.1 + 11.0) * 0.3 + dwNoise(vGw / 2.3 + 5.0) * 0.1;
        diffuseColor.rgb *= mix(vec3(0.72, 0.76, 0.84), vec3(1.12, 1.0, 0.84), smoothstep(0.4, 0.6, mN));
        vec4 gT = texture2D(tGrass, vGw / 8.0);
        float gF = texture2D(tGrass, vGw / 61.0 + 0.37).a;                       // macro: lusher / drier patches
        float gm = smoothstep(0.42, 0.58, vGrass + (gT.a - 0.5) * 0.55);
        vec3 grassC = gT.rgb * mix(vec3(0.82, 0.92, 0.7), vec3(1.05, 1.0, 0.72), gF);
        diffuseColor.rgb = mix(diffuseColor.rgb * (0.88 + 0.24 * gF), grassC, gm);
        // ---- paving
        float pRd = vPave.y, pM = vPave.x + 1.25 * max(0.0, 1.0 - pRd / 3.4);
        float pAa = max(fwidth(vGw.x), fwidth(vGw.y)) * 1.2;                    // m per pixel (outside the branch)
        if (pM > 0.15) {
          const float CH = 0.26;                                                 // course depth (m): small setts, not slabs
          vec2 pw = vGw + (vec2(dwNoise(vGw * 3.0), dwNoise(vGw * 3.0 + 5.3)) - 0.5) * 0.1;    // hand-cut: wobbly joints
          float row = floor(pw.y / CH), rh = dwHash(vec2(row, 7.7));
          float len = 0.28 + 0.22 * rh;                                          // stone length, per course
          float xs = pw.x / len + rh * 5.0;
          vec2 cell = vec2(floor(xs), row);
          float h1 = dwHash(cell), h2 = dwHash(cell + 31.7);
          vec2 f = vec2(fract(xs) * len, fract(pw.y / CH) * CH);                // metres inside the stone
          vec2 e2 = min(f, vec2(len, CH) - f);
          if (h1 > 0.78) e2.x = min(e2.x, abs(f.x - len * (0.35 + 0.3 * h2)));   // some stones split in two
          float ed = min(e2.x, e2.y);
          float far = smoothstep(0.02, 0.08, pAa);                               // far off: one worn paved tone, no moire
          float jw = 0.011 + 0.008 * h2;                                         // thin, sand-filled joints
          float stone = smoothstep(jw - pAa, jw + pAa, ed);
          // the edge: a connected, noisy boundary (low-frequency noise) that breaks into single stones only in a
          // narrow band, the joints there filling with sand (no loose rectangles out in the dirt)
          float pe = pM + (dwNoise(vGw * 0.45 + 3.1) - 0.5) * 0.5;
          float present = smoothstep(0.44, 0.56, pe + (h1 - 0.5) * 0.18);
          float sand = 1.0 - smoothstep(0.5, 0.9, pe);
          vec3 dirt = diffuseColor.rgb;
          vec3 sC = mix(vec3(0.19, 0.18, 0.17), vec3(0.23, 0.18, 0.145), h1) * (0.8 + 0.34 * h2);   // grey to warm-brown stones, close in value
          sC = mix(sC, dirt, 0.2 + 0.35 * dwNoise(vGw * 0.9 + h1 * 9.0));         // dust in the pores, patchy
          sC *= 1.0 + 0.16 * (1.0 - smoothstep(0.3, 1.5, pRd));                  // polished crown
          sC *= 1.0 - 0.24 * (1.0 - smoothstep(0.07, 0.24, abs(pRd - 1.0)));    // two cart ruts either side of it
          float bev = 0.045;                                                      // relief: lit toward the key light (+x, +z)
          float lit = min(1.0, 2.0 - smoothstep(0.0, bev, len - f.x) - smoothstep(0.0, bev, CH - f.y));
          float shd = min(1.0, 2.0 - smoothstep(0.0, bev, f.x) - smoothstep(0.0, bev, f.y));
          sC *= 1.0 + (0.12 * lit - 0.1 * shd) * (1.0 - far);
          sC = mix(sC, dirt, 0.45 * sand);                                        // dust-buried stones at the edge
          vec3 paved = mix(mix(sC * 0.72 + dirt * 0.12, dirt * 0.95, sand), sC, mix(stone, 0.9, far));   // joints: sand-dark, not black
          diffuseColor.rgb = mix(dirt, paved, present);
        }`);
  };
  return m;
}

function groundMesh(scorch) {
  const tex = groundTexture(), grass = grassTexture();
  const out = new THREE.Group();
  const W = (NX - 1) * S, D = (NZ - 1) * S;
  const geo = new THREE.PlaneGeometry(W, D, NX - 1, NZ - 1);
  geo.rotateX(-Math.PI / 2);
  geo.translate(X0 + W / 2, 0, Z0 + D / 2);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), gr = new Float32Array(p.count), pv = new Float32Array(p.count * 2);
  const nearRock = (i, j) => {                                                   // AO: ground at a cliff foot
    let n = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = i + di, jj = j + dj, kk = ii + jj * NX;
      if (ii >= 0 && jj >= 0 && ii < NX && jj < NZ && TOP[kk] > G.h[kk] + 1) n++;   // NaN compares false
    }
    return n;
  };
  for (let v = 0; v < p.count; v++) {
    const x = p.getX(v), z = p.getZ(v), i = Math.round((x - X0) / S), j = Math.round((z - Z0) / S), k = i + j * NX;
    const h = G.h[k], t = TOP[k];
    p.setY(v, Number.isNaN(t) ? h : Math.min(h, t) - 0.35);                  // under a rock column: tucked below its top
    const dust = noise2(x * 0.045 + 40, z * 0.045, 9);
    let kk = 1.04 + (dust - 0.5) * 0.85;                                       // broad dust drifts vs darker trampled earth
    let sc = 0;
    for (const [sx, sz, ss] of scorch) sc = Math.max(sc, Math.exp(-((x - sx) ** 2 + (z - sz) ** 2) / (9 * ss * ss)));
    kk *= 1 - 0.55 * sc;                                                       // scorched earth
    const wet = 1 - smooth(5, 11, Math.abs(z - riverZ(x)));                   // damp dark banks
    kk *= 1 - 0.3 * wet;
    kk *= 1 - 0.1 * (1 - smooth(0, 4.5, routeDist(x, z)));                    // the road: worn darker by the march
    kk *= 1 - 0.09 * Math.min(4, nearRock(i, j));                              // contact shadow at the cliff foot
    const rock = smooth(1, 6, h - 3 - z / 18) * (1 - smooth(-6, -1, G.in[k]) * 0.4);   // high ground: bare, cooler rock dust
    col[v * 3] = kk * (1.03 - 0.1 * wet - 0.08 * rock); col[v * 3 + 1] = kk * (1 - 0.02 * wet); col[v * 3 + 2] = kk * (0.94 + 0.04 * wet + 0.08 * rock);
    gr[v] = grassAt(x, z) * (1 - sc) * (1 - 0.6 * rock);
    pv[v * 2] = paveBase(x, z) - 1.5 * sc; pv[v * 2 + 1] = Math.min(12, routeDist(x, z));   // scorched earth: broken paving
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aGrass', new THREE.BufferAttribute(gr, 1));
  geo.setAttribute('aPave', new THREE.BufferAttribute(pv, 2));
  geo.computeVertexNormals();
  const t1 = tex.clone(); t1.needsUpdate = true; t1.repeat.set(W / 24, D / 24);
  const inner = new THREE.Mesh(geo, splatMaterial(t1, grass));
  inner.receiveShadow = true;
  inner.name = 'ground';
  out.add(inner);
  // the plain beyond the grid: dry grassland (the grass map, dimmed) under the haze
  const og = new THREE.PlaneGeometry(2400, 2400, 8, 8); og.rotateX(-Math.PI / 2);
  const t2 = grass.clone(); t2.needsUpdate = true; t2.repeat.set(2400 / 8, 2400 / 8);
  const outer = new THREE.Mesh(og, new THREE.MeshStandardMaterial({ map: t2, color: 0xc9bfa0, roughness: 0.97 }));
  outer.position.set(0, -0.6, 30);                                             // under the grid (its rim settles to 0)
  out.add(outer);
  return out;
}

/**
 * Grass tufts (one instanced mesh): two crossed quads with a pixel-art blade cutout, rooted where grassAt() is dense,
 * swaying in the valley wind in the vertex shader (GRASS_TIME, advanced by world.js). Normals point up on both faces so
 * they light like the ground they grow from, plus a gold translucency toward the sun. Never on the road or the water;
 * ≤ 0.7 m so nothing hides the fight.
 */
export const GRASS_TIME = { value: 0 };
function tufts() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 16;
  const g = cv.getContext('2d');
  for (let b = 0; b < 7; b++) {                                                 // blades: leaning, tapering
    const x0 = 1 + b * 2 + (b % 2), h = 9 + ((b * 5) % 7), lean = (b % 3) - 1;
    for (let y = 0; y < h; y++) {
      const t = y / h, x = Math.round(x0 + lean * t * t * 3);
      g.fillStyle = `rgb(${190 + 60 * t | 0},${190 + 50 * t | 0},${160 + 30 * t | 0})`;
      g.fillRect(x, 15 - y, y < h * 0.5 ? 2 : 1, 1);
    }
  }
  const map = new THREE.CanvasTexture(cv);
  // nearest up close (pixel blades), mipmapped far off + alpha-to-coverage on the 4× MSAA target: no sparkle at range
  map.magFilter = THREE.NearestFilter; map.minFilter = THREE.LinearMipmapLinearFilter; map.colorSpace = THREE.SRGBColorSpace;
  const q1 = new THREE.PlaneGeometry(1, 1), q2 = new THREE.PlaneGeometry(1, 1);
  q1.translate(0, 0.5, 0); q2.translate(0, 0.5, 0); q2.rotateY(Math.PI / 2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([...q1.attributes.position.array, ...q2.attributes.position.array], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([...q1.attributes.uv.array, ...q2.attributes.uv.array], 2));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from({ length: 8 }, () => [0, 1, 0]).flat(), 3));
  geo.setIndex([...q1.index.array, ...[...q2.index.array].map((i) => i + 4)]);
  const mat = new THREE.MeshStandardMaterial({ map, alphaTest: 0.2, alphaToCoverage: true, side: THREE.DoubleSide, roughness: 0.9 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = GRASS_TIME;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec2 gp = instanceMatrix[3].xz;
        transformed *= 1.0 - smoothstep(26.0, 42.0, distance(instanceMatrix[3].xyz, cameraPosition));   // far tufts: gone into the splat
        float gw = sin(uTime * 1.9 + gp.x * 0.21 + gp.y * 0.13) * 0.6 + sin(uTime * 3.3 + gp.x * 0.7) * 0.25 + 0.35;
        transformed.xz += vec2(0.75, 0.55) * gw * 0.22 * uv.y * uv.y;`);
    // DoubleSide flips the normal on back faces (faceDirection) → half the cards shaded black. Pin it to the ground's
    // up for both faces, and let backlit blades glow gold toward the low sun (thin-leaf translucency, stronger at the tip)
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform vec3 uSunW;`)
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
        normal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float gBack = pow(max(dot(normalize(-vViewPosition), normalize((viewMatrix * vec4(uSunW, 0.0)).xyz)), 0.0), 3.0);
        totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.5, 0.18) * (0.04 + 0.3 * gBack * vMapUv.y * vMapUv.y);`);
    sh.uniforms.uSunW = { value: SUN_DIR };
  };
  const r = makeRng(404), spots = [];
  for (let n = 0; n < 80000 && spots.length < 9000; n++) {
    const x = r.range(X0 + 4, X0 + (NX - 1) * S - 4), z = r.range(P.tuftZ[0], P.tuftZ[1]);
    const k = node(x, z);
    if (TOP[k] > G.h[k] || G.in[k] < -1.2 || Math.abs(z - riverZ(x)) < 4.8) continue;   // not in the rock or the water
    const gm = grassAt(x, z);
    if (r.next() > (gm - 0.35) * 2.2) continue;
    spots.push([x, z, gm]);
  }
  const mesh = new THREE.InstancedMesh(geo, mat, spots.length);
  const m = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler(), pp = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
  const TINTS = [0x868a6c, 0x9a9274, 0x7a8466, 0xa29676, 0x84886a];   // olive-sage, blue kept in: the warm sun + grade add the gold
  spots.forEach(([x, z, gm], i) => {
    const w = r.range(0.45, 0.8), hgt = r.range(0.32, 0.62) * (0.7 + 0.5 * gm);
    mesh.setMatrixAt(i, m.compose(pp.set(x, ground(x, z) - 0.03, z), qq.setFromEuler(e.set(0, r.range(0, 3.14), 0)), sc.set(w, hgt, w)));
    mesh.setColorAt(i, c.set(TINTS[r.int(0, TINTS.length - 1)]).multiplyScalar(r.range(0.8, 1.05)));
  });
  mesh.receiveShadow = true;
  mesh.name = 'grass';
  return mesh;
}

/** Voxel boulders at the cliff feet and along the field's edges: a stepped clump of 0.5 m blocks (base at y 0), seated
 *  on the lowest ground under its footprint and only on open nodes (never on a rock column, so none hangs off a
 *  terrace in front of a cliff face). Only outside the walkable edge. */
function boulders() {
  const r = makeRng(505), list = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const k = i + j * NX, f = G.in[k];
    if (f > -0.4 || f < -3.5 || !Number.isNaN(TOP[k]) || hash01(i, j, 91) > 0.2 || onProp(X0 + i * S, Z0 + j * S, 2)) continue;
    const x = X0 + i * S + r.range(-0.6, 0.6), z = Z0 + j * S + r.range(-0.6, 0.6);
    if (Math.abs(z - riverZ(x)) < 6) continue;
    list.push([x, z, r.range(0.5, 1.2) * (hash01(i, j, 92) < 0.15 ? 1.7 : 1)]);
  }
  const B = (x, y, z, w, h, d, v) => ({ s: [w, h, d], p: [x, y + h / 2, z], c: new THREE.Color(v, v, v).getHex() });
  const geo = boxesGeometry([
    B(-0.25, 0, -0.25, 0.5, 0.5, 0.5, 0.92), B(0.25, 0, -0.25, 0.5, 0.45, 0.5, 0.8), B(-0.25, 0, 0.25, 0.5, 0.4, 0.5, 0.86), B(0.25, 0, 0.25, 0.5, 0.5, 0.5, 0.74),
    B(-0.2, 0.5, -0.15, 0.5, 0.35, 0.55, 1.0), B(0.22, 0.45, 0.1, 0.4, 0.3, 0.45, 0.9), B(-0.05, 0.85, -0.1, 0.35, 0.18, 0.35, 1.06),
  ]);
  const mesh = new THREE.InstancedMesh(geo, stoneShade(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, flatShading: true }), 0.18, 0.28, 0, 0.6), list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
  const COLS = [0x806a5e, 0x6e5d55, 0x8c7a6a, 0x756a5a];
  list.forEach(([x, z, s], i) => {
    const hw = 0.55 * s, y = Math.min(ground(x - hw, z - hw), ground(x + hw, z - hw), ground(x - hw, z + hw), ground(x + hw, z + hw)) - 0.1 * s;
    mesh.setMatrixAt(i, m.compose(p.set(x, y, z), q.setFromAxisAngle(up, r.range(0, 6.28)), sc.set(s * r.range(0.95, 1.3), s * r.range(0.7, 1.0), s * r.range(0.95, 1.2))));
    mesh.setColorAt(i, c.set(COLS[r.int(0, 3)]).multiplyScalar(r.range(0.8, 1.1)));
  });
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.name = 'boulders';
  return mesh;
}

/** Loose stone (instanced boxes: rubble, boulders): world-space chisel grain, a darker contact band toward the base
 *  (local y0 → y1) and a dusty, lifted top face, so a chunk reads as weathered masonry seated in the dirt instead of a
 *  flat-coloured box whose top goes black under the low sun. */
function stoneShade(mat, cell, amt, y0, y1, edges = false) {
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vStP; varying vec3 vStL; varying float vStY; varying float vStTop;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vStP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz; vStL = position; vStY = position.y; vStTop = step(0.6, normal.y);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vStP; varying vec3 vStL; varying float vStY; varying float vStTop;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 stC = floor(vStP / ${cell.toFixed(3)} + 0.25);
        float stH = fract(sin(dot(stC, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        vec3 stF = floor(vStP / ${(cell * 0.4).toFixed(3)} + 0.25);
        float stG = fract(sin(dot(stF, vec3(39.346, 11.135, 83.155))) * 43758.5453);
        diffuseColor.rgb *= (1.0 + (stH - 0.5) * ${amt.toFixed(3)}) * mix(0.62, 1.0, smoothstep(${y0.toFixed(3)}, ${y1.toFixed(3)}, vStY));
        // backlit sides get a warm dust bounce (they went black against the low sun); tops a dusty grey with a fine grain,
        // not flat tan card
        vec3 stTopC = mix(diffuseColor.rgb, vec3(0.4, 0.39, 0.37), 0.45) * (0.84 + 0.32 * stG);
        diffuseColor.rgb = mix(diffuseColor.rgb * 1.28 + vec3(0.03, 0.02, 0.01), stTopC, vStTop);
        ${edges ? `// edge wear on a unit box: chipped, paler arrises (second-largest local coordinate → distance to an edge)
        vec3 stA = abs(vStL); float stE = stA.x + stA.y + stA.z - max(stA.x, max(stA.y, stA.z)) - min(stA.x, min(stA.y, stA.z));
        diffuseColor.rgb *= 1.0 + 0.3 * smoothstep(0.36, 0.49, stE) * step(0.35, stG);` : ''}`);
  };
  // the parameters live inside the shader source: without a per-call key three would share one program (same callback text)
  mat.customProgramCacheKey = () => `stone|${cell}|${amt}|${y0}|${y1}|${edges}`;
  return mat;
}

// ---------------------------------------------------------------- cliffs
/** World-space voxel grain: every `cell` m texel of the surface gets its own ± amt/2 value (chiselled rock up close,
 *  averaged away by mips of distance/DoF). Non-instanced meshes. */
export function voxelGrain(mat, cell, amt) {
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGrainP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrainP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGrainP;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 gCell = floor(vGrainP / ${cell.toFixed(3)} + 0.25);                // + 0.25: faces sit on cell boundaries
        diffuseColor.rgb *= 1.0 + (fract(sin(dot(gCell, vec3(12.9898, 78.233, 37.719))) * 43758.5453) - 0.5) * ${amt.toFixed(3)};`);
  };
  return mat;
}

/**
 * Voxel mesher over TOP: a top quad per column and, on each side, the face down to the lower neighbour (or into the
 * ground beside it) in ≤ 2 m courses, so the strata banding lands on every course. Warm mauve-brown rock that the
 * haze carries into the mountains' tone; lighter dusty tops, a few mossy ones on the heights.
 */
function cliffs() {
  const vb = makeBuilder();
  // tops a shade darker than the valley dust (the low sun lights them flat-on: a paler top reads as snow)
  const c = new THREE.Color(), ROCK = new THREE.Color(0x735a50), DARK = new THREE.Color(0x4a3a37), TOPC = new THREE.Color(0x7d6656), MOSS = new THREE.Color(0x5a5a3c), GRASSY = new THREE.Color(0x6f6c3e);
  // ao: [bottom, top] brightness of a face quad (vertex order: bottom pair, top pair) — baked voxel AO: dark at the foot
  // of every face, a sunlit lip on the top course
  const quad = (a, b, cc, d, n, ao = [1, 1]) => vb.quad([a, b, cc, d], n, c.r, c.g, c.b, [ao[0], ao[0], ao[1], ao[1]]);
  const lowAt = (i, j) => {                                                    // neighbour's surface (outside the grid: below the plain)
    if (i < 0 || j < 0 || i >= NX || j >= NZ) return -2;
    const k = i + j * NX, t = TOP[k];
    return Number.isNaN(t) ? G.h[k] - 0.6 : t;
  };
  const SIDES = [[1, 0, [1, 0, 0]], [-1, 0, [-1, 0, 0]], [0, 1, [0, 0, 1]], [0, -1, [0, 0, -1]]];
  const hs = S / 2;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const k = i + j * NX, t = TOP[k];
    if (Number.isNaN(t)) continue;
    const x = X0 + i * S, z = Z0 + j * S, v = hash01(i, j, 17), rise = t - G.h[k];
    const grassy = noise2(x * 0.06 + 5, z * 0.06, 77) > 0.5;                 // patches of dry grass on the lower shelves
    c.copy(rise > 7 && v < 0.35 ? MOSS : grassy && rise < 14 ? GRASSY : TOPC).multiplyScalar(0.84 + v * 0.26);
    quad([x - hs, t, z + hs], [x + hs, t, z + hs], [x + hs, t, z - hs], [x - hs, t, z - hs], [0, 1, 0]);
    for (const [di, dj, n] of SIDES) {
      const lo = lowAt(i + di, j + dj);
      if (lo >= t) continue;
      // face corners: the edge shared with the neighbour, CCW seen from outside
      const ex = x + di * hs, ez = z + dj * hs, ax = dj ? -hs : 0, az = di ? hs : 0;
      const [p0x, p0z, p1x, p1z] = di > 0 || dj < 0 ? [ex + ax, ez - az, ex - ax, ez + az] : [ex - ax, ez + az, ex + ax, ez - az];
      for (let y1 = t; y1 > lo;) {
        const y0 = Math.max(lo, Math.ceil(y1 - 2));
        const band = 0.5 + 0.5 * Math.sin(y0 * 1.9 + noise2(x * 0.1, z * 0.1, 3) * 4);   // strata
        c.copy(ROCK).lerp(DARK, band * 0.55 + (y1 < t ? 0.1 : 0)).multiplyScalar(0.86 + hash01(i * 7 + di, j * 7 + dj, y0 | 0) * 0.2);
        quad([p0x, y0, p0z], [p1x, y0, p1z], [p1x, y1, p1z], [p0x, y1, p0z], n, [y0 <= lo ? 0.5 : 0.9, y1 >= t ? 1.14 : 1]);
        y1 = y0;
      }
    }
  }
  const m = new THREE.Mesh(vb.build(), voxelGrain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }), 0.5, 0.2));
  m.receiveShadow = true;
  m.name = 'cliffs';
  return m;
}

/** Voxel pines on the rock tops (instanced trunk + three tiers): Dingjun's wooded shoulders, thicker toward the summit. */
function pines() {
  const spots = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const k = i + j * NX, t = TOP[k];
    if (Number.isNaN(t) || t - G.h[k] < 5 || hash01(i, j, 23) > 0.07 + 0.05 * smooth(60, 200, Z0 + j * S)) continue;
    spots.push([X0 + i * S + (hash01(i, j, 24) - 0.5) * 1.2, t, Z0 + j * S + (hash01(i, j, 25) - 0.5) * 1.2, 0.8 + hash01(i, j, 26) * 0.7]);
  }
  const g = new THREE.BoxGeometry(1, 1, 1);
  const trunkM = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: 0x3e2a1e, roughness: 0.95 }), spots.length);
  const leafM = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), spots.length * 3);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  spots.forEach(([x, y, z, k], n) => {
    q.setFromEuler(e.set(0, hash01(n, 3) * 1.6, 0));
    trunkM.setMatrixAt(n, m.compose(p.set(x, y + 1.2 * k, z), q, s.set(0.35 * k, 2.4 * k, 0.35 * k)));
    for (let t = 0; t < 3; t++) {
      const w = (2.6 - t * 0.75) * k;
      leafM.setMatrixAt(n * 3 + t, m.compose(p.set(x, y + (2.0 + t * 1.25) * k, z), q, s.set(w, 1.3 * k, w)));
      leafM.setColorAt(n * 3 + t, c.set(0x3f4a34).multiplyScalar(0.8 + t * 0.1 + hash01(n, t) * 0.2));
    }
  });
  const grp = new THREE.Group();
  grp.add(trunkM, leafM);
  grp.name = 'pines';
  return grp;
}

// ---------------------------------------------------------------- rubble
/** Clusters of loose voxel rubble over the walkable field: broken paving, masonry chunks and charred planks, < 0.4 m. */
function rubble() {
  const r = makeRng(17), list = [];
  const COLS = [0x6a5e56, 0x5e544e, 0x74685e, 0x564a44, 0x6e6660, 0x3a2a22];
  for (let k = 0; k < 420 && list.length < 2400; k++) {
    const cx = r.range(P.rubbleX[0], P.rubbleX[1]), cz = r.range(P.rubbleZ[0], P.rubbleZ[1]);
    const f = G.in[node(cx, cz)];
    if (f < 0.5 || routeDist(cx, cz) < 3 || Math.abs(cz - riverZ(cx)) < 6) continue;   // on the field, off the road and the water
    const n = r.int(3, 10), spread = r.range(0.6, 1.6), gy = ground(cx, cz);
    for (let i = 0; i < n; i++) {
      const sz = r.range(0.08, 0.26) * (i === 0 ? 1.25 : 1), wood = r.chance(0.12);                 // broken setts and chips, not blocks
      const sx = wood ? sz * 3 : sz * r.range(0.8, 1.3), sy = wood ? 0.08 : sz * r.range(0.35, 0.7), szz = wood ? 0.14 : sz * r.range(0.8, 1.3);
      list.push({ p: [cx + r.range(-spread, spread) * (i ? 1 : 0.2), gy + sy * (wood ? 0.45 : r.range(0.05, 0.3)), cz + r.range(-spread, spread) * (i ? 1 : 0.2)], s: [sx, sy, szz],   // half sunk into the dirt
        r: [r.range(-0.25, 0.25), r.range(0, 3.14), r.range(-0.25, 0.25)], c: wood ? COLS[5] : COLS[r.int(0, 4)], v: r.range(0.85, 1.1) });
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), stoneShade(new THREE.MeshStandardMaterial({ roughness: 0.92, flatShading: true }), 0.07, 0.3, -0.5, 0.3, true), list.length);
  mesh.name = 'rubble';
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
  list.forEach((b, i) => {
    mesh.setMatrixAt(i, m.compose(p.set(...b.p), q.setFromEuler(e.set(...b.r)), sc.set(...b.s)));
    mesh.setColorAt(i, c.set(b.c).multiplyScalar(b.v));
  });
  mesh.receiveShadow = true;
  return mesh;
}

// ---------------------------------------------------------------- distant mountains
// periodic 1D value noise around the horizon ring
function ringNoise(n, seed) {
  const r = makeRng(seed), vals = Array.from({ length: n }, () => r.next());
  return (a) => {
    const f = ((a / (Math.PI * 2)) % 1 + 1) % 1 * n, i = Math.floor(f), t = f - i, u = t * t * (3 - 2 * t);
    return vals[i % n] * (1 - u) + vals[(i + 1) % n] * u;
  };
}

/**
 * Three rings of jagged mountains round the middle of the map (0, MZ), faceted (flat triangles) with baked light and
 * haze so they need no fog and blend into the sky at their base. Peaks stay low in angle (≈ 2-7°) so the gameplay
 * camera still sees sky above them — except Dingjun's own peak on the first ring, straight up the valley (bearing
 * PEAK_A, just right of the sunset saddle): the dark shoulder every zone looks toward, the summit's backdrop.
 * Blue-leaning mauve: the post grade warms them onto the concept's #7e7384–#898197.
 */
const MZ = 30, PEAK_A = -0.1;
function mountains() {
  const layers = [
    { r: 330, lo: 8, hi: 40, col: 0x474a5c, haze: 0.3, seed: 3, peak: 34 },
    { r: 480, lo: 16, hi: 64, col: 0x53576e, haze: 0.44, seed: 7, peak: 0 },
    { r: 680, lo: 30, hi: 112, col: 0x646b8a, haze: 0.58, seed: 13, peak: 0 },
  ];
  const pos = [], cols = [];
  const A = 420, L = new THREE.Vector3(SUN_DIR.x, 0.6, SUN_DIR.z).normalize();   // the low sun: north faces backlit
  const tmpC = new THREE.Color(), hz = new THREE.Color(), base = new THREE.Color(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3(), cen = new THREE.Vector3();
  for (const ly of layers) {
    const n1 = ringNoise(11, ly.seed), n2 = ringNoise(29, ly.seed + 1), n3 = ringNoise(83, ly.seed + 2), n4 = ringNoise(190, ly.seed + 3);
    const ridge = (a) => {
      const v = n1(a) * 0.5 + n2(a) * 0.3 + n3(a) * 0.14 + n4(a) * 0.06;
      const da = wrap(a - SUN_AZ), dp = wrap(a - PEAK_A);                  // a saddle where the sun sets: the disc stays clear
      return (ly.lo + (ly.hi - ly.lo) * Math.pow(Math.max(0, v - 0.18) / 0.82, 1.7)) * (1 - 0.8 * Math.exp(-((da / 0.2) ** 2))) + ly.peak * Math.exp(-((dp / 0.09) ** 2)) * (0.85 + 0.3 * n4(a));
    };
    // radial profile rows: [radius offset, height fraction, jitter]
    const rows = [[-70, -0.1, 0], [-34, 0.42, 0.18], [0, 1, 0], [40, 0.66, 0.2], [110, 0.15, 0]];
    // voxel-stepped: A flat-topped bins round the ring, heights in `step` m courses; column k runs bin k >> 1 from
    // edge (k + 1) >> 1, so neighbouring bins meet in a vertical riser (a stepped silhouette, not a smooth cone)
    const step = ly.hi / 9;
    const vtx = (k, ri) => {
      const bin = (k >> 1) % A, a = (((k + 1) >> 1) / A) * Math.PI * 2, [dr, fh, jit] = rows[ri];
      const rr = ly.r + dr + (hash01(((k + 1) >> 1) % A, ri, ly.seed) - 0.5) * 16;   // per edge: a riser stands vertical
      const hh = ridge(((bin + 0.5) / A) * Math.PI * 2) * fh + (hash01(bin * 3, ri, ly.seed + 9) - 0.5) * jit * (ly.hi * 0.5);
      return [Math.sin(a) * rr, Math.round(hh / step) * step, MZ + Math.cos(a) * rr];
    };
    base.set(ly.col);
    for (let k = 0; k < 2 * A; k++) for (let ri = 0; ri < rows.length - 1; ri++) {
      const a = vtx(k, ri), b = vtx(k + 1, ri), c = vtx(k + 1, ri + 1), d = vtx(k, ri + 1);
      for (const tri of [[a, b, c], [a, c, d]]) {
        e1.set(tri[1][0] - tri[0][0], tri[1][1] - tri[0][1], tri[1][2] - tri[0][2]);
        e2.set(tri[2][0] - tri[0][0], tri[2][1] - tri[0][1], tri[2][2] - tri[0][2]);
        n.crossVectors(e2, e1);
        if (n.lengthSq() < 1e-8) continue;                                     // flat riser between equal bins
        n.normalize();
        if (n.y < 0) n.negate();
        cen.set((tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3, (tri[0][2] + tri[1][2] + tri[2][2]) / 3);
        const lit = 0.55 + 0.85 * Math.max(0, n.dot(L));
        const hf = Math.max(0, Math.min(1, cen.y / ly.hi));
        tmpC.copy(base).multiplyScalar(lit * (0.9 + hf * 0.25));
        hazeColor(e1.set(cen.x, cen.y, cen.z - MZ).normalize(), hz);
        tmpC.lerp(hz, Math.min(1, ly.haze + (1 - hf) * 0.22));
        for (const v of tri) { pos.push(v[0], v[1], v[2]); cols.push(tmpC.r, tmpC.g, tmpC.b); }
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.computeBoundingSphere();
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
  m.renderOrder = -0.5;
  return m;
}

/** The active field's terrain under `scene`. fieldFires: [x, z, scale] burning wrecks (their ground is scorched);
 *  profile: the field's PROFILE (default 定軍山's). */
export function buildTerrain(scene, fieldFires, profile = DINGJUN_PROFILE) {
  prepare(profile);
  const r = makeRng(61), scorch = fieldFires.map(([x, z, s]) => [x, z, s]);
  scorch.push(...P.scorch(r));
  scene.add(groundMesh(scorch), cliffs(), pines(), rubble(), tufts(), boulders(), mountains());
}
