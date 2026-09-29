// Battlefield of 漢水 (Han River, 219 AD) — 第四章 (layout, walkable ground and gates: map.js HANSHUI). The same 漢中
// country and golden hour as 定軍山, built by the same terrain builder (terrain.js) from its own profile, re-dressed:
// Cao Cao's grain depot on 北山 (the stacks are gates: standing while shut, charred and burning once opened), the basin
// where 黃忠 is encircled, 趙雲's camp behind its palisade and gate, and the bluff over the Han at the far end (the
// river drawn with 赤壁's water shader). Render-only: reads the gate states, never touches sim state.
import * as THREE from 'three';
import { SUN_DIR, SKY_UP } from './sky.js';
import { buildTerrain, GRASS_TIME } from './terrain.js';
import { TERRAIN as G, GATES, HAN_GRAIN, HAN_Y, ground, smooth, walkIn, hanRiver, routeNear } from './map.js';
import { boxesGeometry, shade } from '../core/voxel.js';
import { makeRng, hash01 } from '../core/rng.js';
import { lit, watchtower, figureGeometry, paperLantern } from './castle.js';
import { bannerTexture, bannerMat, cloth, animateCloth, fireSystem, palisade, cart, brazier, drum, supplies, shieldRack, fallenGeometry, local } from './dressing.js';
import { WATER_VS, WATER_FS, NF } from './chibi.js';
import { lensClear } from '../camera/occlusion.js';

const LIGHT_DIR = new THREE.Vector3(0.5, 0.58, 0.64).normalize();   // as Dingjun's key
const SHADOW_BOX = 34;
// burning wrecks near the walkable edges (scorched ground under them): [x, z, scale]
const FIELD_FIRES = [[-40, -150, 1.1], [38, -80, 1.0], [-30, -30, 1.2], [30, 4, 1.1], [-26, 110, 1.0]];

/** 漢水's terrain profile (terrain.js): low ridges round the depot, the encirclement's steep shoulders, the camp on a
 *  low shelf, and no rock over the river (the bank falls away under the bluff). */
const HANSHUI_PROFILE = {
  rise: { depot: 8, neck: 16, ring: 22, choke: 28, camp: 3, road: 12, bluff: 5 },
  column: () => undefined,
  skip: (x, z) => hanRiver(x, z),
  pave: (x, z) => (x > -28 && x < 28 && z > 48 && z < 96 ? 0.35 : 0),     // the camp's worn parade ground
  beaten: (x, z) => (x > -31 && x < 31 && z > 42 && z < 98 ? 0.25 : Math.hypot(x, z + 110) < 34 ? 0.55 : 1),   // camp, depot
  tuftZ: [-176, 196], rubbleX: [-50, 50], rubbleZ: [-160, 176],
  scorch: (r) => {
    const out = [];
    for (let i = 0; i < 18; i++) out.push([r.range(-36, 36), r.range(-150, 150), r.range(0.5, 0.9)]);
    return out;
  },
};

/** 漢水, built under `scene` into its own group: { root, fires, update(dt, focus, game) } (world.js contract). */
export function createHanshui(scene) {
  const root = new THREE.Group(); root.name = 'world-hanshui';
  scene.add(root);
  const r = makeRng(219);
  const { x0: X0, z0: Z0, step: S, nx: NX, nz: NZ } = G, GH = G.h;

  // ---- lights: Dingjun's rig (one shadowed sun, rim, sky fill, three firelights + a key by the depot)
  const hemi = new THREE.HemisphereLight(0x9cafd4, 0x9a7a5c, 2.2);
  const sun = new THREE.DirectionalLight(0xffcf9a, 4.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 2;
  Object.assign(sun.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 160 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  const rim = new THREE.DirectionalLight(0xffa060, 1.6);
  rim.position.copy(SUN_DIR).multiplyScalar(100);
  const fill = new THREE.DirectionalLight(0xffb27a, 0);                 // Dingjun's summit fill: kept (light count), unused
  root.add(hemi, sun, sun.target, rim, fill, fill.target);

  buildTerrain(root, FIELD_FIRES, HANSHUI_PROFILE);

  // ---- the Han River under the bluff (赤壁's water shader over a depth grid of this field)
  const fireU = Array.from({ length: NF }, () => new THREE.Vector4(0, 0, 0, 0));
  const uTime = { value: 0 };
  {
    const data = new Uint8Array(NX * NZ * 4);
    for (let k = 0; k < NX * NZ; k++) data[k * 4] = Math.max(0, Math.min(255, (HAN_Y - GH[k]) / 3 * 255));
    const dt = new THREE.DataTexture(data, NX, NZ);
    dt.magFilter = dt.minFilter = THREE.LinearFilter; dt.needsUpdate = true;
    const uni = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime, uFire: { value: fireU }, tDepth: { value: dt },
      uGrid: { value: new THREE.Vector4(X0 - S / 2, Z0 - S / 2, 1 / (S * NX), 1 / (S * NZ)) },
      uSun: { value: SUN_DIR }, uSkyUp: { value: SKY_UP }, uSunCol: { value: new THREE.Color(1.0, 0.72, 0.4) }, uDeep: { value: new THREE.Color(0x14201a) } };
    const water = new THREE.Mesh(new THREE.PlaneGeometry(NX * S, NZ * S).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      vertexShader: WATER_VS, fragmentShader: WATER_FS, uniforms: uni, transparent: true, premultipliedAlpha: true, depthWrite: false, fog: true,
    }));
    water.position.set(X0 + (NX - 1) * S / 2, HAN_Y, Z0 + (NZ - 1) * S / 2);
    water.renderOrder = 0.5; water.frustumCulled = false; water.name = 'han-river';
    root.add(water);
  }

  // ---- props
  const props = [], lanterns = [], fires = [], cloths = [], figures = [], emberSpots = [];
  const mat = {
    wei: bannerMat(bannerTexture('魏', { bg: '#7d2a1f', fg: '#1a0d0a', border: '#4a1712', seed: 3 })),
    cao: bannerMat(bannerTexture('曹', { bg: '#1c1414', fg: '#d8b060', border: '#7d2a1f', w: 160, h: 320, seed: 21 })),
    shu: bannerMat(bannerTexture('蜀', { bg: '#2f7a36', fg: '#f1e6c8', border: '#17391b', seed: 5 })),
    zhao: bannerMat(bannerTexture('趙', { bg: '#e8e0cc', fg: '#1d3a6a', border: '#2f5a8a', w: 128, h: 256, seed: 31 })),
  };
  const addCloth = (m, w, h, kind, x, y, z, yaw) => {
    const c = cloth(m, w, h, kind, r.range(0, 6.28));
    c.position.set(x, y, z); c.rotation.y = yaw;
    root.add(c); cloths.push(c);
  };
  /** Standard on a pole with a crossbar, the cloth facing `face` [x, z] (default: the road). */
  const standard = (x, z, m, s = 1, face = routeNear(x, z).p) => {
    const P = 8.5 * s, W = 2.3 * s, Hc = 4.3 * s, gy = ground(x, z), yaw = Math.atan2(face[0] - x, face[1] - z) + r.range(-0.3, 0.3);
    props.push({ s: [0.2 * s, P, 0.2 * s], p: [x, gy + P / 2, z], c: 0x3b2a1e });
    const cx = Math.cos(yaw), cz = -Math.sin(yaw);
    props.push({ s: [W + 0.3, 0.14, 0.14], p: [x + cx * W / 2, gy + P - 0.3, z + cz * W / 2], r: [0, yaw, 0], c: 0x3b2a1e });
    addCloth(m, W, Hc, 'hang', x, gy + P - 0.35, z, yaw);
  };
  const tent = (x, z, yaw, col, w = 5, d = 6) => {
    const gy = ground(x, z);
    for (let k = 0; k < 5; k++) props.push({ s: [w * (1 - k * 0.19), 0.7, d], p: [x, gy + 0.35 + k * 0.7, z], r: [0, yaw, 0], c: shade(col, 1 - k * 0.04) });
    props.push({ s: [0.2, 4.6, 0.2], p: [x, gy + 2.3, z], c: 0x3a2618 });
  };

  // ---- 北山: the grain stacks (a sack pile on a plank floor; charred once its gate is open), carts, Cao's standards
  const grain = HAN_GRAIN.map(([x, z], k) => {
    const gy = ground(x, z), fresh = [], burnt = [], R = makeRng(900 + k);
    for (const [b, burn] of [[fresh, false], [burnt, true]]) {
      const L = local(b, x, gy, z, R.range(-0.4, 0.4));
      L(0, 0.12, 0, [3.4, 0.24, 3.4], burn ? 0x241814 : 0x5a4030);                        // plank floor
      for (let lv = 0; lv < 4; lv++) {
        const n = 4 - lv, sz = 0.78;
        for (let a = 0; a < n; a++) for (let c = 0; c < n; c++) {
          const lx = (a - (n - 1) / 2) * sz, lz = (c - (n - 1) / 2) * sz, h = 0.52 * (burn ? (lv < 2 ? 0.6 : 0) : 1);
          if (!h) continue;
          const col = burn ? (hash01(a + k * 7, c, lv) < 0.25 ? 0x5a2410 : 0x2a1c16) : shade(0xb89a5c, 0.84 + hash01(a + k * 7, c, lv) * 0.3);
          L(lx, 0.24 + lv * 0.5 + h / 2, lz, [sz * 0.94, h, sz * 0.94], col);
        }
      }
      if (!burn) L(0, 2.45, 0, [2.2, 0.16, 2.2], 0x7a6a44);                             // straw cover
    }
    fires.push([x, gy + 0.9, z, 1.5, true, `grain${k + 1}`]);
    emberSpots.push([x, z]);
    const fm = new THREE.Mesh(boxesGeometry(fresh), lit()), bm = new THREE.Mesh(boxesGeometry(burnt), lit());
    fm.castShadow = bm.castShadow = true; fm.receiveShadow = bm.receiveShadow = true;
    fm.name = `grain${k + 1}`; bm.name = `grain${k + 1}-burnt`;
    root.add(fm, bm);
    return { id: `grain${k + 1}`, fm, bm };
  });
  for (const [x, z, yaw] of [[-34, -140, 0.4], [32, -136, -0.5], [-8, -118, 1.4], [30, -104, 2.2], [-34, -92, 0.9]]) cart(props, r, x, z, yaw);
  supplies(props, r, -12, -140, 0.3); supplies(props, r, 12, -108, -0.4, 5); supplies(props, r, -30, -112, 0.8, 5);
  standard(-38, -124, mat.cao, 1.1); standard(36, -116, mat.wei); standard(-10, -76, mat.wei, 0.9); standard(14, -74, mat.cao, 0.9);
  for (const [x, z] of [[-6, -128], [10, -96]]) tent(x, z, 0.2, 0x6a5a4a);
  for (const [x, z] of [[4, -140], [-12, -92]]) { fires.push(brazier(props, x, z, 0.5)); emberSpots.push([x, z]); }

  // ---- 趙雲營: palisade with the gate in its south face, gate towers, tents, watchtower, drums, 趙 / 蜀 standards
  palisade(props, r, [[-31, 44], [-7, 44]]); palisade(props, r, [[7, 44], [31, 44]]);
  palisade(props, r, [[-31, 44], [-31, 98]]); palisade(props, r, [[31, 44], [31, 98]]);
  for (const [x, z, H, s] of [[-8.6, 44, 6, 1.5], [8.6, 44, 6, 1.5], [23, 52, 8, 1.6]]) {
    const tb = [], gy = ground(x, z);
    watchtower(tb, x, z, H, s);
    for (const bx of tb) bx.p[1] += gy;
    props.push(...tb);
    figures.push([x, gy + H + 0.4, z, Math.PI]);
  }
  // the gate: two leaves hinged on the towers (swing inward as the gate opens)
  const doors = [-1, 1].map((sd) => {
    const b = [], L = local(b, 0, 0, 0, 0);
    for (let k = 0; k < 6; k++) L(sd * -(0.5 + k), 1.8, 0, [0.9, 3.6 + (k % 2) * 0.3, 0.3], shade(0x5a3e28, 0.9 + (k % 3) * 0.06));
    L(sd * -3, 1.0, -0.2, [6, 0.3, 0.2], 0x3a2618); L(sd * -3, 2.8, -0.2, [6, 0.3, 0.2], 0x3a2618);
    const m = new THREE.Mesh(boxesGeometry(b), lit());
    m.position.set(sd * 6, ground(0, 44), 44); m.castShadow = true; m.receiveShadow = true; m.name = 'camp-door';
    root.add(m);
    return m;
  });
  { // command tent (solid [-22, 70, -12, 80]) and the camp's rows of tents
    const x = -17, z = 75, gy = ground(x, z), L = local(props, x, gy, z, 0);
    for (let k = 0; k < 6; k++) L(0, 0.4 + k * 0.75, 0, [9.6 * (1 - k * 0.15), 0.8, 9.4 * (1 - k * 0.12)], shade(0xe0d6bc, 1 - k * 0.05));
    L(0, 5.6, 0, [0.3, 2.4, 0.3], 0x3a2618);
    paperLantern(lanterns, x + 5.2, gy + 2.4, z - 5.2); paperLantern(lanterns, x - 5.2, gy + 2.4, z - 5.2);
  }
  for (let z = 58; z <= 92; z += 11) { tent(-26, z, 0, 0x7a6e5a); tent(26, z + 4, 0.05, 0x7a6e5a); }
  drum(props, 11, 66, Math.PI); drum(props, -4, 88, Math.PI * 0.8);
  shieldRack(props, r, 14, 84, -1.4); supplies(props, r, -8, 94, 0.2, 5);
  standard(-12, 50, mat.zhao, 1.3, [0, 20]); standard(12, 50, mat.shu, 1.1, [0, 20]); standard(-20, 88, mat.shu, 0.9); standard(18, 96, mat.zhao, 1.0);
  for (const [x, z] of [[-4, 50], [4, 50], [0, 80], [20, 70]]) { fires.push(brazier(props, x, z, 0.5)); emberSpots.push([x, z]); }

  // ---- the bluff over the Han: Cao's rearguard standards, a lookout, supplies abandoned in the retreat
  standard(0, 158, mat.cao, 1.4, [8, 120]); standard(22, 150, mat.wei, 1.0, [8, 120]); standard(-8, 140, mat.wei, 0.9);
  cart(props, r, 16, 132, 0.5, true); cart(props, r, -10, 164, 1.9, true); supplies(props, r, 24, 162, -0.6, 5);
  for (const [x, z] of [[4, 146], [18, 170]]) { fires.push(brazier(props, x, z, 0.55)); emberSpots.push([x, z]); }

  // the fallen of the raid and the ring (a few, off the road)
  const dead = [];
  for (let i = 0; i < 400 && dead.length < 40; i++) {
    const x = r.range(-40, 40), z = r.range(-150, 40);
    if (walkIn(x, z) > 2 && routeNear(x, z).d > 5) dead.push([x, z, r.range(0, 6.28)]);
  }

  // ---- merge
  {
    const pm = new THREE.Mesh(boxesGeometry(props), lensClear(lit(), 2.5));
    pm.castShadow = true; pm.receiveShadow = true; pm.name = 'han-props';
    const lm = new THREE.Mesh(boxesGeometry(lanterns), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.4, 1.4, 1.4) }));
    lm.name = 'han-lanterns';
    root.add(pm, lm);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    const fg = new THREE.InstancedMesh(figureGeometry(0x2f7a36, 0x2a2e26), lit(), figures.length);
    figures.forEach(([x, y, z, yaw], i) => fg.setMatrixAt(i, M.compose(p.set(x, y, z), q.setFromEuler(e.set(0, yaw, 0)), one)));
    fg.castShadow = true; fg.name = 'han-lookouts';
    const dm = new THREE.InstancedMesh(fallenGeometry(), lit(), dead.length);
    dead.forEach(([x, z, yaw], i) => dm.setMatrixAt(i, M.compose(p.set(x, ground(x, z) - 0.02, z), q.setFromEuler(e.set(0, yaw, 0)), one)));
    dm.receiveShadow = true; dm.name = 'han-fallen';
    root.add(fg, dm);
  }

  // ---- fire: flames, embers, smoke (dressing.js fireSystem; a grain stack's fire burns once its gate is open)
  const updateFire = fireSystem(root, fires, ground);
  const SITES = fires.map(([x, y, z, s, , g]) => ({ x, y: y + 1.2, z, i: 26 * Math.min(1.6, s), d: 10 + 3 * s, g, k: 0 }));
  const NEAR = [null, null, null, null];
  const fireLights = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xff8a3a, 0, 11, 2); root.add(l); return l; });
  const key = new THREE.PointLight(0xff8a3a, 20, 11, 2);
  key.position.set(4, ground(4, -140) + 2.2, -140); key.name = 'han-key';
  root.add(key);

  const open = { campGate: 1 }, tmp = new THREE.Vector3();
  let t = 0;
  return {
    root,
    fires: emberSpots.map(([x, z]) => ({ position: new THREE.Vector3(x, 0, z) })),
    update(dt, focus) {
      t += dt;
      uTime.value = t;
      GRASS_TIME.value = t;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      sun.target.position.copy(tmp);
      sun.position.copy(LIGHT_DIR).multiplyScalar(70).add(tmp);
      for (const c of cloths) animateCloth(c, t);
      updateFire(t);
      for (const g of grain) { const b = GATES[g.id].open; g.fm.visible = !b; g.bm.visible = b; }
      open.campGate += ((GATES.campGate.open ? 1 : 0) - open.campGate) * Math.min(1, dt * 3);
      doors[0].rotation.y = -1.45 * open.campGate; doors[1].rotation.y = 1.45 * open.campGate;
      for (const s of SITES) s.k = s.g && !GATES[s.g].open ? 1e9 : Math.hypot(s.x - focus.x, s.z - focus.z);
      for (let n = 0; n < 4; n++) {
        let best = null;
        for (const s of SITES) if (!s.used && (!best || s.k < best.k)) best = s;
        best.used = true; NEAR[n] = best;
      }
      for (let n = 0; n < 3; n++) {
        const b = NEAR[n], l = fireLights[n], fl = 0.93 + Math.sin(t * (13 + n * 3.1) + n) * 0.17 + Math.sin(t * 7.3 + n * 2) * 0.13;
        l.position.set(b.x, b.y, b.z); l.distance = b.d;
        l.intensity = b.i * fl * (1 - smooth(26, 40, b.k)) * smooth(0, 6, NEAR[3].k - b.k);
      }
      for (const s of SITES) s.used = false;
      key.intensity = 20 + Math.sin(t * 22.3 + 3) * 4 + Math.sin(t * 7.3 + 6) * 3;
    },
  };
}
