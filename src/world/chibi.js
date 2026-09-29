// Battlefield of 赤壁 (Red Cliffs, 208 AD) — the free-battle stage beside 定軍山 (layout, walkable ground and the fleet
// data: map.js CHIBI). The same golden hour as Dingjun, the low sun now straight over the Yangtze: Cao Cao's chained
// fleet (連環船) moored up the river in rows, bow to stern, the columns nearest the shore on fire from Huang Gai's fire
// boats, their smoke leaning downwind; the fight on the shelf of shore under the red sandstone cliffs, 赤壁 cut into
// the face above the cliff foot; wooden piers out to the burning ships; the allied landing (劉 / 孫) to the south and
// Cao's naval stockade (水寨) with its command tower (帥) to the north.
// Built into its own group, only while map.js describes 赤壁 (world.js createWorlds builds it on first use).
// Render-only: never touches sim state; all animation is a pure function of render time.
import * as THREE from 'three';
import { SUN_DIR, SKY_UP, HAZE, NOISE_GLSL } from './sky.js';
import { TERRAIN as G, PIECE_IDS, MAP, ground, noise2, smooth, walkIn, routeDist, routeNear, onProp, YANGTZE_Y } from './map.js';
import { boxesGeometry, makeBuilder, shade } from '../core/voxel.js';
import { makeRng, hash01 } from '../core/rng.js';
import { lit, watchtower, pagoda, figureGeometry, paperLantern } from './castle.js';
import { bannerTexture, bannerMat, cloth, animateCloth, fireSystem, palisade, cart, brazier, drum, supplies, shieldRack, fallenGeometry, local } from './dressing.js';
import { voxelGrain } from './terrain.js';
import { lensClear } from '../camera/occlusion.js';

const LIGHT_DIR = new THREE.Vector3(0.5, 0.58, 0.64).normalize();   // as Dingjun's key: hard shadows toward the lens
const SHADOW_BOX = 34;
const RIVER_X = 16;                  // east of this, off the walkable ground, is the Yangtze (map.js)
const FACE = { x: -39, z0: -2, z1: 28, top: 44 };   // the inscription face: flat, x = -39, z -2 … 28 (the 'foot' piece below it)
const NF = 16;                       // fires reflected in the water (nearest the focus)

// ---------------------------------------------------------------- textures
/** 赤壁 cut into the rock and filled with red: two big brush glyphs, top to bottom, on a transparent card. */
function inscriptionTexture() {
  const W = 256, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.font = `bold ${Math.round(W * 0.84)}px "Xingkai SC","STXingkai","Kaiti SC","STKaiti","KaiTi","Songti SC",serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  [['赤', 0.27], ['壁', 0.73]].forEach(([ch, v]) => {
    g.fillStyle = 'rgba(30,8,4,0.85)'; g.fillText(ch, W / 2 + 5, H * v + 6);      // the cut: a dark shadowed edge
    g.fillStyle = '#a02c1a'; g.fillText(ch, W / 2, H * v);                           // the paint
  });
  // weathering: flaked paint, rock grain showing through
  const r = makeRng(208);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${r.range(0.2, 0.7)})`; g.fillRect(r.int(0, W), r.int(0, H), r.int(1, 5), r.int(1, 4)); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Junk sail: battened canvas (tan; burnt: charred, holed, ragged hem). The mast edge is u = 0 (cloth()). */
function sailTexture(burnt, seed) {
  const t = bannerTexture(burnt ? '' : '曹', burnt ? { bg: '#3a2a22', fg: '#000', border: null, w: 128, h: 192, seed }
    : { bg: '#b39870', fg: '#6a1c12', border: null, w: 128, h: 192, tatter: false, seed });
  const c = t.image, g = c.getContext('2d'), r = makeRng(seed + 5);
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = burnt ? 'rgba(10,6,4,0.8)' : 'rgba(60,40,26,0.75)';
  for (let y = 12; y < c.height; y += c.height / 7) g.fillRect(0, y, c.width, 4);            // battens
  if (burnt) {
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(r.int(10, 118), r.int(20, 180), r.range(6, 22), 0, 7); g.fill(); }
    for (let x = 0; x < c.width; x += 8) g.fillRect(x, c.height * r.range(0.45, 0.8), 8, c.height);   // burnt away from the hem
  }
  t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------- the Yangtze
const WATER_VS = /* glsl */`
  varying vec3 vWp;
  #include <fog_pars_vertex>
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWp = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const WATER_FS = /* glsl */`
  uniform float uTime; uniform vec3 uSun, uSunCol, uSkyUp, uDeep; uniform vec4 uFire[${NF}]; uniform sampler2D tDepth; uniform vec4 uGrid;
  varying vec3 vWp;
  ${NOISE_GLSL}
  #include <fog_pars_fragment>
  vec2 slope(vec2 p, float k) {                                   // d(noise)/dp at scale k (per metre)
    float e = 0.3, n = dwNoise(p * k);
    return vec2(dwNoise((p + vec2(e, 0.0)) * k) - n, dwNoise((p + vec2(0.0, e)) * k) - n) / e;
  }
  void main() {
    vec2 q = vWp.xz;
    float dep = texture2D(tDepth, (q - uGrid.xy) * uGrid.zw).r * 3.0;   // m of water over the bed (3 m and deeper saturate)
    vec2 f = vec2(0.0, -uTime * 0.6);                                     // the current runs down the river (-Z)
    vec2 g = slope(q + f, 0.16) * 0.55 + slope(q * 1.0 + f * 1.8 + vec2(31.0, 7.0), 0.55) * 0.18 + slope(q + f * 2.6 + vec2(3.0, 17.0), 1.7) * 0.05;
    vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
    vec3 V = normalize(vWp - cameraPosition);
    vec3 R = reflect(V, N); R.y = abs(R.y);
    float fr = 0.04 + 0.62 * pow(1.0 - max(dot(-V, N), 0.0), 5.0);
    vec3 sky = uSkyUp * 0.55;
    #ifdef USE_FOG
      sky = dwHaze(normalize(vec3(R.x, 0.0, R.z)), fogColor) * 0.8;
    #endif
    sky = mix(sky, uSkyUp * 0.6, smoothstep(0.03, 0.55, R.y)) * vec3(0.8, 0.76, 0.7);    // silty, darker than the sky
    vec3 body = uDeep + uSunCol * 0.06 * pow(max(dot(V, uSun), 0.0), 4.0);
    vec3 col = body * (1.0 - fr) + sky * fr;
    // the low sun: a broad glittering path up the river + sparkles
    vec3 H = normalize(uSun - V);
    float nh = max(dot(N, H), 0.0);
    vec3 Ng = normalize(vec3(-g.x * 3.0, 1.0, -g.y * 3.0));
    float sp = pow(max(dot(Ng, H), 0.0), 300.0) * step(0.55, dwNoise(q * 2.3 + uTime * 0.7));
    col += uSunCol * min(pow(nh, 300.0) * 1.6 + sp * 3.0 + pow(nh, 30.0) * 0.04, 3.0);
    // the burning fleet in the water: each fire's reflection (a lobe along the reflected ray, stretched by the swell)
    // and the firelight lying on the water round the hull
    for (int i = 0; i < ${NF}; i++) {
      vec4 F = uFire[i];
      if (F.w <= 0.0) continue;
      vec3 D = normalize(F.xyz - vWp);
      float c = max(dot(R, D), 0.0), dd = length(q - F.xz);
      col += vec3(1.0, 0.38, 0.08) * F.w * pow(c, 160.0) * 0.9;
      col += vec3(0.8, 0.24, 0.05) * F.w * 0.05 * exp(-dd * dd / 40.0);
    }
    // the waterline: the bank shows through the shallows, a lace of foam along it
    float A = smoothstep(0.0, 0.35, dep) * 0.93 + 0.07 * smoothstep(0.0, 0.05, dep);
    float lace = smoothstep(0.32, 0.05, dep) * smoothstep(0.0, 0.03, dep) * step(0.5, dwNoise(q * 1.4 + vec2(0.0, uTime * 0.5)) + 0.2 * sin(uTime * 1.6 + q.x * 0.8));
    col = mix(col, vec3(0.74, 0.7, 0.62), lace * 0.8); A = max(A, lace * 0.85);
    A *= smoothstep(0.0, 0.03, dep);
    gl_FragColor = vec4(col, A);
    #include <fog_fragment>
    gl_FragColor.rgb *= A;
  }`;

// ---------------------------------------------------------------- the world
/** 赤壁, built under `scene` into its own group: { root, fires, update(dt, focus, game) } (world.js contract). */
export function createChibi(scene) {
  const root = new THREE.Group(); root.name = 'world-chibi';
  scene.add(root);
  const r = makeRng(208);
  // the active grid is 赤壁's while this builds: keep our own handles (TERRAIN is refilled on the next swap)
  const { x0: X0, z0: Z0, step: S, nx: NX, nz: NZ } = G, GH = G.h, GIN = G.in, OWN = G.own;
  const pier = PIECE_IDS.map((id) => id.startsWith('pier'));
  const FLEET = MAP.fleet, BOATS = MAP.fireboats;
  const gridAt = (x, z) => { const i = Math.round((x - X0) / S), j = Math.round((z - Z0) / S); return i < 0 || j < 0 || i >= NX || j >= NZ ? -1 : i + j * NX; };

  // ---- lights (the same rig as Dingjun: one shadowed sun, rim, sky fill, three firelights + an idle fourth)
  const hemi = new THREE.HemisphereLight(0x9cafd4, 0x9a6a54, 2.2);    // warm red-earth bounce under the cliffs
  const sun = new THREE.DirectionalLight(0xffcf9a, 4.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 2;
  Object.assign(sun.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 160 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  const rim = new THREE.DirectionalLight(0xffa060, 1.6);
  rim.position.copy(SUN_DIR).multiplyScalar(100);
  const fill = new THREE.DirectionalLight(0xffb27a, 0);                 // Dingjun's summit fill: kept (light count), unused
  root.add(hemi, sun, sun.target, rim, fill, fill.target);

  // ---------------------------------------------------------------- rock: the red cliffs, the hills at the ends
  // Column top per grid node (m, 1 m courses), NaN on walkable ground and over the river.
  const TOP = new Float32Array(NX * NZ).fill(NaN);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const k = i + j * NX, f = GIN[k];
    if (f > -1.4) continue;
    const x = X0 + i * S, z = Z0 + j * S, h = GH[k], d = -f;
    if (x > RIVER_X || onProp(x, z)) continue;
    const n = noise2(x * 0.045, z * 0.045, 71), cliff = smooth(-8, -34, x);
    const rise = 11 + 31 * cliff * (0.7 + 0.3 * (1 - smooth(40, 120, Math.abs(z - 12))));
    let t = h + Math.max(1.2, rise * (0.7 + 0.6 * n) * (1 - Math.exp(-d / (cliff > 0.5 ? 2.6 : 6)))) + (hash01(i, j, 5) - 0.5) * 1.2;
    if (z >= FACE.z0 && z <= FACE.z1 && x <= FACE.x - 1 && x >= FACE.x - 13) t = FACE.top + (x < FACE.x - 9 ? hash01(i, j, 6) * 3 : 0);
    TOP[k] = Math.round(t);
  }
  const topAt = (x, z) => { const k = gridAt(x, z); return k < 0 || Number.isNaN(TOP[k]) ? ground(x, z) : TOP[k]; };
  {
    const b = makeBuilder(), c = new THREE.Color();
    // red sandstone, kept dark and dusty like Dingjun's rock (the grade warms it): close-valued bands, not stripes
    const STRATA = [0x7a4032, 0x6c392d, 0x844838, 0x62342a, 0x764234, 0x8a4e3a, 0x6a382c, 0x7e4636].map((h) => new THREE.Color(h));
    const at = (i, j) => (i < 0 || j < 0 || i >= NX || j >= NZ ? -8 : Number.isNaN(TOP[i + j * NX]) ? GH[i + j * NX] - 0.6 : TOP[i + j * NX]);
    const K_TOP = [1, 1, 1, 1];
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      const k = i + j * NX, t = TOP[k];
      if (Number.isNaN(t)) continue;
      const x = X0 + i * S, z = Z0 + j * S, x0 = x - S / 2, x1 = x + S / 2, z0 = z - S / 2, z1 = z + S / 2, v = hash01(i, j, 17);
      // top: scrub and red earth on the heights, bare rock on the low shelves
      c.set(t - GH[k] > 6 ? (v < 0.55 ? 0x44472a : v < 0.8 ? 0x55492c : 0x6e4232) : 0x74483a).multiplyScalar(0.9 + 0.2 * hash01(i, j, 3));
      b.quad([[x0, t, z1], [x1, t, z1], [x1, t, z0], [x0, t, z0]], [0, 1, 0], c.r, c.g, c.b, K_TOP);
      // sides down to each lower neighbour, in 2 m courses (the strata bands run level across the whole cliff)
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nt = at(i + di, j + dj);
        if (nt >= t) continue;
        for (let y0 = nt; y0 < t - 0.01;) {
          const y1 = Math.min(t, Math.floor(y0 / 2) * 2 + 2), band = Math.floor(y0 / 2);
          c.copy(STRATA[((band % STRATA.length) + STRATA.length) % STRATA.length]).multiplyScalar(0.88 + 0.24 * hash01(i + di * 3, j + dj * 3, band + 40));
          const ao = y0 < nt + 1.5 ? 0.72 : 1, kk = [ao, ao, 1, 1];
          if (di === 1) b.quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], c.r, c.g, c.b, kk);
          else if (di === -1) b.quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], c.r, c.g, c.b, kk);
          else if (dj === 1) b.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], c.r, c.g, c.b, kk);
          else b.quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], c.r, c.g, c.b, kk);
          y0 = y1;
        }
      }
    }
    const m = new THREE.Mesh(b.build(), voxelGrain(lit(), 0.5, 0.16));
    m.receiveShadow = true; m.name = 'red-cliffs';
    root.add(m);
  }

  // the inscription on the flat face
  {
    const tex = inscriptionTexture();
    const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.35, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(13, 26), mat);
    m.position.set(FACE.x + 0.06, ground(-37, 13) + 19, (FACE.z0 + FACE.z1) / 2);
    m.rotation.y = Math.PI / 2;
    m.receiveShadow = true; m.name = 'chibi-inscription';
    root.add(m);
  }

  // ---------------------------------------------------------------- ground: shore, sand, the river bed
  const RH = new Float32Array(NX * NZ);                                  // render heights: the piers stand over water
  for (let k = 0; k < NX * NZ; k++) RH[k] = pier[OWN[k]] && GIN[k] > -2.5 ? Math.min(GH[k], YANGTZE_Y - 2.4) : GH[k];
  {
    const pos = new Float32Array(NX * NZ * 3), col = new Float32Array(NX * NZ * 3), c = new THREE.Color(), t = new THREE.Color();
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      const k = i + j * NX, x = X0 + i * S, z = Z0 + j * S, h = RH[k], w = GIN[k];
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
      const n = noise2(x * 0.08, z * 0.08, 12), n2 = noise2(x * 0.3, z * 0.3, 13);
      c.set(0x6e5040).lerp(t.set(0x8a6650), n * 0.8);                              // packed red-brown earth
      c.lerp(t.set(0x92543a), smooth(-14, -34, x) * 0.7);                          // red scree toward the cliffs
      if (x > 4) c.lerp(t.set(0x96805e), smooth(8, 0, w) * smooth(4, 20, x) * 0.85);   // sand toward the river
      c.lerp(t.set(0x9c8468), smooth(3.6, 1.2, routeDist(x, z)) * 0.5);           // the trampled road
      c.lerp(t.set(0x5e4a3a), smooth(0.5, 0.15, h - YANGTZE_Y) * 0.8);             // wet bank
      if (h < YANGTZE_Y) c.lerp(t.set(0x34302a), smooth(0, -1, h - YANGTZE_Y));    // river bed
      c.lerp(t.set(0x2e2420), smooth(0.68, 0.8, n2) * smooth(2, 6, w) * 0.75);     // scorch from the fire rain
      c.multiplyScalar(0.92 + 0.16 * hash01(i, j, 9));
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    const idx = [];
    for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) {
      const a = i + j * NX, b = a + 1, c2 = a + NX, d = c2 + 1;
      idx.push(a, c2, b, b, c2, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, voxelGrain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, metalness: 0 }), 0.5, 0.2));
    m.receiveShadow = true; m.name = 'chibi-ground';
    root.add(m);
  }

  // dry grass tufts and reeds along the bank (instanced, off the road)
  {
    const spots = [];
    for (let i = 0; i < 2600 && spots.length < 1400; i++) {
      const x = r.range(-40, 44), z = r.range(-122, 136), w = walkIn(x, z);
      if (w < 0.3 || routeDist(x, z) < 4 || noise2(x * 0.11, z * 0.11, 21) < 0.5) continue;
      const reed = x > 10 && w < 5;
      spots.push([x, z, reed]);
    }
    const geo = new THREE.BoxGeometry(0.08, 1, 0.08).translate(0, 0.5, 0);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 1 }), spots.length * 3);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
    let n = 0;
    for (const [x, z, reed] of spots) for (let k = 0; k < 3; k++) {
      const hx = x + r.range(-0.3, 0.3), hz = z + r.range(-0.3, 0.3), hh = reed ? r.range(1.1, 1.8) : r.range(0.35, 0.7);
      m.setMatrixAt(n, M.compose(p.set(hx, ground(hx, hz), hz), q.setFromEuler(e.set(r.range(-0.25, 0.25), r.range(0, 6), r.range(-0.25, 0.25))), sc.set(1, hh, 1)));
      m.setColorAt(n++, c.set(reed ? 0x7a7440 : 0x8a7a4c).multiplyScalar(r.range(0.75, 1.1)));
    }
    m.receiveShadow = true; m.name = 'chibi-grass';
    root.add(m);
  }

  // ---------------------------------------------------------------- the river
  const fireU = Array.from({ length: NF }, () => new THREE.Vector4(0, 0, 0, 0));
  const uTime = { value: 0 };
  {
    const data = new Uint8Array(NX * NZ * 4);
    for (let k = 0; k < NX * NZ; k++) data[k * 4] = Math.max(0, Math.min(255, (YANGTZE_Y - RH[k]) / 3 * 255));
    const dt = new THREE.DataTexture(data, NX, NZ);
    dt.magFilter = dt.minFilter = THREE.LinearFilter; dt.needsUpdate = true;
    const uni = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime, uFire: { value: fireU }, tDepth: { value: dt },
      uGrid: { value: new THREE.Vector4(X0 - S / 2, Z0 - S / 2, 1 / (S * NX), 1 / (S * NZ)) },
      uSun: { value: SUN_DIR }, uSkyUp: { value: SKY_UP }, uSunCol: { value: new THREE.Color(1.0, 0.72, 0.4) }, uDeep: { value: new THREE.Color(0x0b1a1a) } };
    const water = new THREE.Mesh(new THREE.PlaneGeometry(1600, 3000).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      vertexShader: WATER_VS, fragmentShader: WATER_FS, uniforms: uni, transparent: true, premultipliedAlpha: true, depthWrite: false, fog: true,
    }));
    water.position.set(14 + 800, YANGTZE_Y, 0);
    water.renderOrder = 0.5; water.frustumCulled = false; water.name = 'yangtze';
    root.add(water);
  }

  // ---------------------------------------------------------------- props: fleet, piers, stockade, landing
  const props = [], burnt = [], lanterns = [], fires = [], cloths = [], figures = [], emberSpots = [];
  const mat = {
    wei: bannerMat(bannerTexture('魏', { bg: '#7d2a1f', fg: '#1a0d0a', border: '#4a1712', seed: 3 })),
    cao: bannerMat(bannerTexture('曹', { bg: '#1c1414', fg: '#d8b060', border: '#7d2a1f', w: 160, h: 320, seed: 21 })),
    caoFlag: bannerMat(bannerTexture('曹', { bg: '#7d2a1f', fg: '#1a0d0a', border: '#4a1712', w: 128, h: 96, tatter: false, seed: 22 }), false),
    shuai: bannerMat(bannerTexture('帥', { bg: '#a3321f', fg: '#1a0d0a', border: '#e0b050', w: 128, h: 256, seed: 23 })),
    liu: bannerMat(bannerTexture('劉', { bg: '#c7a574', fg: '#2a120a', border: '#2f5a3a', w: 128, h: 256, seed: 24 })),
    sun: bannerMat(bannerTexture('孫', { bg: '#d8cbb0', fg: '#7a1a10', border: '#7a1a10', w: 128, h: 256, seed: 25 })),
    sail: [0, 1, 2].map((k) => bannerMat(sailTexture(false, 30 + k), false)),
    sailBurnt: [0, 1].map((k) => bannerMat(sailTexture(true, 40 + k))),
  };
  const addCloth = (m, w, h, kind, x, y, z, yaw) => {
    const c = cloth(m, w, h, kind, r.range(0, 6.28));
    c.position.set(x, y, z); c.rotation.y = yaw;
    root.add(c); cloths.push(c);
    return c;
  };
  /** Standard on a pole with a crossbar, the cloth facing `face` [x, z] (default: the road). */
  const standard = (x, z, m, s = 1, face = routeNear(x, z).p) => {
    const P = 8.5 * s, W = 2.3 * s, Hc = 4.3 * s, gy = topAt(x, z), yaw = Math.atan2(face[0] - x, face[1] - z) + r.range(-0.3, 0.3);
    props.push({ s: [0.2 * s, P, 0.2 * s], p: [x, gy + P / 2, z], c: 0x3b2a1e });
    const cx = Math.cos(yaw), cz = -Math.sin(yaw);
    props.push({ s: [W + 0.3, 0.14, 0.14], p: [x + cx * W / 2, gy + P - 0.3, z + cz * W / 2], r: [0, yaw, 0], c: 0x3b2a1e });
    addCloth(m, W, Hc, 'hang', x, gy + P - 0.35, z, yaw);
  };
  /** Tent on the ground (stepped slabs + ridge pole). */
  const tent = (x, z, yaw, col, w = 5, d = 6) => {
    const gy = ground(x, z);
    for (let k = 0; k < 5; k++) props.push({ s: [w * (1 - k * 0.19), 0.7, d], p: [x, gy + 0.35 + k * 0.7, z], r: [0, yaw, 0], c: shade(col, 1 - k * 0.04) });
    props.push({ s: [0.2, 4.6, 0.2], p: [x, gy + 2.3, z], c: 0x3a2618 });
  };
  const wpos = (x, z, yaw, lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  const waterTop = (x, z) => Math.max(ground(x, z), YANGTZE_Y);

  // ---- the chained fleet
  const WOOD = 0x4a3322, PLANK = 0x6a4a30, DARK = 0x2e1d15, LACQ = 0x7c2b1d, ROOF = 0x3a383f, CHAR = 0x241814, CHAR2 = 0x1a120e, EMBER = 0x5a2410;
  const shipFires = [];                                     // [x, y, z, s] of the fleet's big fires (water reflections, lights)
  for (const s of FLEET) {
    const { x, z, yaw, len, w, burn } = s, y0 = YANGTZE_Y - s.sink, bt = burn === 2, b = bt ? burnt : props;
    const L = local(b, x, y0, z, yaw), C = (c) => (bt ? (hash01(x | 0, z | 0, c & 255) < 0.2 ? EMBER : shade(CHAR, 0.8 + hash01(c, x | 0, 3) * 0.4)) : c);
    L(0, -0.3, 0, [w * 0.55, 1.4, len * 0.78], C(DARK));                       // keel
    L(0, 0.9, 0, [w, 1.3, len * 0.86], C(WOOD));                               // hull
    L(0, 1.55, len * 0.43, [w * 0.8, 1.6, 3], C(WOOD), [-0.18, 0, 0]);          // raised bow
    L(0, 2.0, len * 0.5, [w * 0.46, 1.1, 1.6], C(DARK), [-0.35, 0, 0]);
    L(0, 1.95, -len * 0.42, [w * 0.92, 2.3, 3.4], C(WOOD));                    // stern castle base
    L(0, 1.62, 0, [w - 0.5, 0.14, len * 0.84], C(PLANK));                      // deck
    for (const sx of [-1, 1]) {
      L(sx * (w / 2 - 0.1), 1.95, 0, [0.25, 0.6, len * 0.84], C(DARK));        // gunwale
      if (!bt) for (let lz = -len * 0.36; lz < len * 0.36; lz += 1.6) L(sx * (w / 2 + 0.06), 1.75, lz, [0.12, 0.72, 0.8], hash01(lz * 3 | 0, sx + 3, x | 0) < 0.7 ? 0x7a2418 : 0x2a2226);
    }
    // the tower (樓): two tiers with eaves, the lower lacquered
    L(0, 2.9, -3, [w * 0.72, 2.4, 8], C(LACQ)); L(0, 2.6, -3, [w * 0.74, 0.5, 8.1], C(DARK));
    L(0, 4.25, -3, [w * 0.9, 0.3, 9.2], C(ROOF));
    L(0, 5.4, -4, [w * 0.5, 2.0, 5], C(WOOD)); L(0, 6.55, -4, [w * 0.66, 0.3, 6.2], C(ROOF));
    // mast + yard (a burnt-out hull keeps a stump, snapped and leaning)
    const mh = bt ? 5 + hash01(x | 0, z | 0, 8) * 4 : 14;
    L(0, 1.6 + mh / 2, 4, [0.36, mh, 0.36], C(DARK), bt ? [0.25, 0, 0.12] : [0, 0, 0]);
    if (!bt) {
      L(0, 14.6, 4, [6.8, 0.22, 0.22], DARK);
      const [sx, sz] = wpos(x, z, yaw, -3.3, 4.12);
      addCloth(burn ? mat.sailBurnt[hash01(x | 0, z | 0, 9) < 0.5 ? 0 : 1] : mat.sail[(x * 7 + z) & 1 ? 1 : (z | 0) % 3 === 0 ? 2 : 0], 6.6, 10, 'hang', sx, y0 + 14.5, sz, yaw);
      const [fx, fz] = wpos(x, z, yaw, 0, -len * 0.46);
      L(0, 4.3, -len * 0.46, [0.14, 5.5, 0.14], DARK);
      addCloth(mat.caoFlag, 1.5, 1.1, 'flag', fx, y0 + 6.9, fz, yaw + Math.PI / 2);
      if (!burn) for (let k = 0; k < 4; k++) {                                   // crew on deck, facing the shore
        const [px, pz] = wpos(x, z, yaw, r.range(-2.2, 2.2), r.range(1, 8));
        figures.push([px, y0 + 1.7, pz, -Math.PI / 2 + r.range(-0.5, 0.5)]);
      }
      if (!burn) { const [lx, lz] = wpos(x, z, yaw, w * 0.46, -3); paperLantern(lanterns, lx, y0 + 3.9, lz, 0.9); }
    }
    if (burn === 1) {                                                              // ablaze: deck, tower, bow, sail
      const far = s.tow >= 3;
      for (const [lx, ly, lz, fs, smoke] of far ? [[0, 1.8, 2, 2.2, true]] : [[0, 1.8, 2, 2.0, true], [0, 4.5, -3, 1.4, false], [r.range(-1.5, 1.5), 2.0, 8, 1.2, false], [0, 9.5, 4, 1.1, false]]) {
        const [fx, fz] = wpos(x, z, yaw, lx, lz);
        fires.push([fx, y0 + ly, fz, fs, smoke, null, true]);                    // no flat light pool: the water shader lights the river
        if (smoke) shipFires.push([fx, y0 + ly, fz, fs]);
      }
    }
    if (bt) { const [fx, fz] = wpos(x, z, yaw, 0, 0); fires.push([fx, y0 + 1.7, fz, 0.7, false, null, true]); }   // embers still burning in the wreck
  }
  // planks and chains bow to stern along each column (連環: the fleet is one floating platform)
  {
    const cols = {};
    for (const s of FLEET) (cols[s.tow] ||= []).push(s);
    for (const k in cols) {
      const c = cols[k].sort((a, b) => a.z - b.z);
      for (let i = 0; i < c.length - 1; i++) {
        const a = c[i], b = c[i + 1], ax = a.x, az = a.z + a.len / 2, bx = b.x, bz = b.z - b.len / 2, L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az);
        const y = YANGTZE_Y + 1.5 - (a.sink + b.sink) / 2, dst = a.burn === 2 || b.burn === 2 ? burnt : props;
        for (const o of [-1.3, 1.3]) dst.push({ s: [1.1, 0.14, L + 1], p: [(ax + bx) / 2 + Math.cos(yaw) * o, y, (az + bz) / 2 - Math.sin(yaw) * o], r: [0, yaw, 0], c: shade(PLANK, 0.8) });
        for (const o of [-2.6, 2.6]) for (let d = 0; d < L; d += 0.55) {                 // iron chains, sagging
          const t = d / L, sag = Math.sin(t * Math.PI) * 0.7;
          dst.push({ s: [0.12, 0.22, 0.42], p: [ax + (bx - ax) * t + Math.cos(yaw) * o, y + 0.2 - sag, az + (bz - az) * t - Math.sin(yaw) * o], r: [(d / 0.55 | 0) % 2 ? 0 : 1.57, yaw, 0], c: 0x2a2a2e });
        }
      }
    }
  }
  // Huang Gai's fire boats: straw-laden skiffs burning end to end, rammed into the front of the fleet
  for (const [x, z, yaw] of BOATS) {
    const L = local(burnt, x, YANGTZE_Y - 0.2, z, yaw);
    L(0, 0.3, 0, [2.8, 0.9, 8], CHAR); L(0, 0.9, 3.8, [1.6, 0.8, 1.4], CHAR, [-0.3, 0, 0]);
    for (let k = 0; k < 6; k++) L(r.range(-0.8, 0.8), 1.0 + r.range(0, 0.4), r.range(-3, 3), [r.range(0.6, 1.2), 0.5, r.range(0.8, 1.4)], shade(0x6a5a36, r.range(0.4, 0.8)));
    for (const lz of [-2, 1.8]) { const [fx, fz] = wpos(x, z, yaw, 0, lz); fires.push([fx, YANGTZE_Y + 0.9, fz, 1.7, lz < 0]); shipFires.push([fx, YANGTZE_Y + 0.9, fz, 1.7]); }
  }

  // ---- piers: plank decks on posts out to the fleet
  for (const p of [['pier1', [[34, -14], [44, -12], [66, -8]], 0.9], ['pier2', [[34, 20], [44, 21], [66, 22]], 0.9], ['pier3', [[22, 110], [66, 112]], 1.4]]) {
    const [, pts, h] = p, half = p[0] === 'pier3' ? 3.2 : 3;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az);
      for (let d = 0; d < L; d += 0.9) {
        const x = ax + (bx - ax) * d / L, z = az + (bz - az) * d / L, gy = Math.max(ground(x, z), h - 0.3);
        props.push({ s: [half * 2 + 0.2, 0.18, 0.84], p: [x, gy - 0.09, z], r: [0, yaw, r.range(-0.02, 0.02)], c: shade(0x6e5038, r.range(0.75, 1.1)) });
        if ((d / 0.9 | 0) % 4 === 0) for (const o of [-half, half]) {
          const px = x + Math.cos(yaw) * o, pz = z - Math.sin(yaw) * o, top = gy + (hash01(px | 0, pz | 0, 4) < 0.4 ? 0.9 : 0.1);
          props.push({ s: [0.34, top + 3, 0.34], p: [px, top - (top + 3) / 2, pz], c: 0x3a2618 });
        }
      }
    }
  }

  // ---- the allied landing: beached boats, tents, 劉 / 孫 standards
  for (const [x, z, yaw] of [[32, -112, -1.25], [33, -98, -1.1], [31, -84, -1.35], [34, -71, -1.15]]) {
    const L = local(props, x, Math.max(ground(x, z), YANGTZE_Y) - 0.1, z, yaw);
    L(0, 0.35, 0, [2.8, 0.8, 8.5], 0x5a3d28); L(0, 0.8, 0, [2.4, 0.1, 7.6], 0x6e5038); L(0, 1.0, 4.2, [1.4, 0.8, 1.2], 0x4a3322, [-0.3, 0, 0]);
    for (const sx of [-1.3, 1.3]) L(sx, 0.95, 0, [0.14, 0.4, 7.8], 0x3a2618);
    L(0, 3, -1, [0.18, 5.2, 0.18], 0x3a2618);
  }
  for (const [x, z] of [[-18, -114], [-11, -106], [-19, -97], [-12, -89]]) tent(x, z, r.range(-0.2, 0.2), 0xb8a888);
  standard(-4, -76, mat.liu); standard(10, -77, mat.sun); standard(-14, -58, mat.liu, 1.1); standard(18, -54, mat.sun, 1.1);
  supplies(props, r, -22, -82, 0.4); supplies(props, r, 14, -116, -0.3, 5);
  for (const [x, z] of [[-4, -104], [12, -110], [-8, -68]]) { const f = brazier(props, x, z, 0.5); fires.push(f); emberSpots.push([x, z]); }

  // ---- the shore: the fight's aftermath — burnt carts, dropped standards, fallen Wei soldiers
  cart(props, r, -28, -30, 0.9, true); cart(props, r, 27, 34, -0.6, true); cart(props, r, -30, 40, 2.1, true);
  for (const [x, z, s] of [[24, -36, 1.1], [-27, 46, 1.2], [30, 44, 1.0], [-24, -50, 1.0], [-33, 2, 0.9]]) {
    const gy = ground(x, z);
    fires.push([x, gy, z, s, s >= 1.1]); emberSpots.push([x, z]);
    burnt.push({ s: [1.8 * s, 0.32 * s, 0.32 * s], p: [x, gy + 0.16 * s, z], r: [0, 0.5, 0], c: 0x241510 }, { s: [1.8 * s, 0.32 * s, 0.32 * s], p: [x, gy + 0.36 * s, z], r: [0, -0.7, 0], c: 0x2e1c10 });
  }
  shieldRack(props, r, -30, -12, 1.4); shieldRack(props, r, -26, 56, 0.4);
  standard(-24, 60, mat.wei, 0.95); standard(20, 58, mat.wei, 0.95); standard(-30, -40, mat.liu, 0.95);
  for (const [x, z] of [[-35, -18], [-34, 34], [-37, 36], [-33, -22], [-36, 44]]) {           // fallen rock at the cliff foot
    const s = r.range(1.2, 2.6);
    props.push({ s: [s, s * 0.8, s * 1.1], p: [x, ground(x, z) + s * 0.35, z], r: [r.range(-0.3, 0.3), r.range(0, 3), r.range(-0.3, 0.3)], c: shade(0x8e4630, r.range(0.8, 1.1)) });
  }
  const dead = [];
  for (let i = 0; i < 400 && dead.length < 46; i++) {
    const x = r.range(-34, 36), z = r.range(-70, 80);
    if (walkIn(x, z) > 2 && Math.hypot(x, z) > 8) dead.push([x, z, r.range(0, 6.28)]);
  }

  // ---- 曹軍水寨: palisade, gate towers, tents, the command tower (帥) and its drums, watchtowers
  palisade(props, r, [[-31, 84.2], [-8, 84.2]]); palisade(props, r, [[8, 84.2], [29, 84.2]]);
  palisade(props, r, [[-31, 84.2], [-31, 135]]); palisade(props, r, [[-31, 135], [15, 135]]);
  for (const [x, z, H, s] of [[-9.5, 84, 7, 1.7], [9.5, 84, 7, 1.7], [-36, 139, 9, 1.9], [10, 140, 9, 1.9]]) {
    const tb = [], gy = topAt(x, z);
    watchtower(tb, x, z, H, s);
    for (const bx of tb) bx.p[1] += gy;                                             // built at y 0: lift onto the ground
    props.push(...tb);
    figures.push([x, gy + H + 0.4, z, Math.PI]);
  }
  for (let z = 92; z <= 126; z += 8.5) { tent(-24, z, 0, 0x6a5a4a); tent(-24 + 0.1, z, Math.PI / 2, 0x5e4e40, 4, 4.6); }
  for (const z of [92, 100]) tent(21, z, 0.1, 0x6a5a4a);
  // command tower (帥): stone footing, lacquered posts, a railed platform, tiered roof
  {
    const x = 0, z = 119, gy = ground(x, z), L = local(props, x, gy, z, 0);
    L(0, 0.75, 0, [10, 1.5, 10], 0x7a6a5e); L(0, 1.55, 0, [10.4, 0.15, 10.4], 0x5a4a40);
    for (const sx of [-4, 4]) for (const sz of [-4, 4]) L(sx, 5.5, sz, [0.6, 8, 0.6], LACQ);
    L(0, 9.6, 0, [10, 0.4, 10], WOOD);
    for (const [px, pz, w, d] of [[0, -4.8, 10, 0.2], [0, 4.8, 10, 0.2], [-4.8, 0, 0.2, 10], [4.8, 0, 0.2, 10]]) L(px, 10.4, pz, [w, 1.2, d], DARK);
    pagoda(props, x, gy + 11, z, 8, 8, 2, 1.1);
    figures.push([-2, gy + 9.8, z - 3, Math.PI], [2, gy + 9.8, z - 3, Math.PI], [0, gy + 9.8, z - 3.4, Math.PI]);
    paperLantern(lanterns, -4.4, gy + 8.4, z - 4.6); paperLantern(lanterns, 4.4, gy + 8.4, z - 4.6);
    standard(-7.5, 113, mat.cao, 1.5, [0, 60]); standard(7.5, 112.5, mat.shuai, 1.2, [0, 60]);
  }
  drum(props, 11, 117, Math.PI);
  standard(-9, 88, mat.wei, 1, [0, 60]); standard(9, 88, mat.wei, 1, [0, 60]); standard(-14, 104, mat.wei, 0.9); standard(12, 108, mat.wei, 0.9);
  supplies(props, r, 10, 128, 0.3); supplies(props, r, -16, 130, -0.2, 5); shieldRack(props, r, 13, 96, -1.5);
  for (const [x, z] of [[-12, 96], [12, 124], [-11, 126], [4, 90]]) { fires.push(brazier(props, x, z, 0.5)); emberSpots.push([x, z]); }

  // ---- distant land: ridges behind the cliffs and at both ends, the low far bank across the river (fogged silhouettes)
  {
    const far = [], R2 = makeRng(19);
    // peaked hills, not slabs: ridged noise, a falloff toward the ends of each range, per-block jitter
    const ridge = (x0, x1, z0, z1, hLo, hHi, w, col) => {
      for (let x = x0; x <= x1; x += w) for (let z = z0; z <= z1; z += w) {
        const n = noise2(x * 0.016, z * 0.016, 55), pk = 1 - Math.abs(2 * noise2(x * 0.03 + 9, z * 0.03, 56) - 1);
        const h = (hLo + (hHi - hLo) * n * n * (0.55 + 0.45 * pk)) * R2.range(0.85, 1.15);
        far.push({ s: [w * 1.02, h, w * 1.02], p: [x + R2.range(-2, 2), h / 2 - 4, z + R2.range(-2, 2)], c: shade(col, 0.85 + 0.3 * n) });
      }
    };
    ridge(-300, -140, -420, 460, 30, 130, 16, 0x6a4a44);                  // behind the red cliffs
    ridge(-120, 0, 230, 460, 10, 80, 16, 0x6a5452);                       // up the south bank, northward
    ridge(-120, 0, -460, -176, 10, 80, 16, 0x6a5452);
    ridge(380, 440, -900, 900, 4, 24, 24, 0x5a5460);                     // the far (north) bank, 烏林
    const m = new THREE.Mesh(boxesGeometry(far), lit());
    m.name = 'chibi-far';
    root.add(m);
  }

  // pines on the cliff tops (instanced: trunk + three stacked tiers)
  {
    const spots = [];
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      const k = i + j * NX, t = TOP[k];
      if (Number.isNaN(t) || t - GH[k] < 8 || hash01(i, j, 23) > 0.09) continue;
      spots.push([X0 + i * S + hash01(i, j, 24) - 0.5, t, Z0 + j * S + hash01(i, j, 25) - 0.5, 0.8 + hash01(i, j, 26) * 0.7]);
    }
    const geo = boxesGeometry([
      { s: [0.4, 2.2, 0.4], p: [0, 1.1, 0], c: 0x3a2618 }, { s: [3.0, 1.4, 3.0], p: [0, 2.6, 0], c: 0x2f3d25 },
      { s: [2.2, 1.3, 2.2], p: [0, 3.8, 0], c: 0x34452a }, { s: [1.3, 1.2, 1.3], p: [0, 4.9, 0], c: 0x3a4d2e },
    ]);
    const m = new THREE.InstancedMesh(geo, lit(), spots.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    spots.forEach(([x, y, z, s], i) => m.setMatrixAt(i, M.compose(p.set(x, y, z), q.setFromEuler(e.set(0, s * 9, 0)), sc.setScalar(s))));
    m.name = 'chibi-pines';
    root.add(m);
  }

  // ---- merge: props (lit, shadowed), charred wrecks, lanterns (self-lit), figures, the fallen
  {
    const pm = new THREE.Mesh(boxesGeometry(props), lensClear(lit(), 2.5));
    pm.castShadow = true; pm.receiveShadow = true; pm.name = 'chibi-props';
    const bm = new THREE.Mesh(boxesGeometry(burnt), lit());
    bm.castShadow = true; bm.receiveShadow = true; bm.name = 'chibi-wrecks';
    const lm = new THREE.Mesh(boxesGeometry(lanterns), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.4, 1.4, 1.4) }));
    lm.name = 'chibi-lanterns';
    root.add(pm, bm, lm);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    const fg = new THREE.InstancedMesh(figureGeometry(), lit(), figures.length);
    figures.forEach(([x, y, z, yaw], i) => fg.setMatrixAt(i, M.compose(p.set(x, y, z), q.setFromEuler(e.set(0, yaw, 0)), one)));
    fg.castShadow = true; fg.name = 'chibi-crews';
    const dm = new THREE.InstancedMesh(fallenGeometry(), lit(), dead.length);
    dead.forEach(([x, z, yaw], i) => dm.setMatrixAt(i, M.compose(p.set(x, ground(x, z) - 0.02, z), q.setFromEuler(e.set(0, yaw, 0)), one)));
    dm.receiveShadow = true; dm.name = 'chibi-fallen';
    root.add(fg, dm);
  }

  // ---- fire: flames, embers, smoke (dressing.js fireSystem); pools of firelight land on the water round the hulls
  const updateFire = fireSystem(root, fires, waterTop);

  // firelight: three point lights on the sites nearest the focus (Dingjun's scheme), the fourth idles by the landing
  const SITES = [...fires.filter((f) => f[1] - waterTop(f[0], f[2]) < 3 || f[3] >= 1.6).map(([x, y, z, s]) => ({ x, y: y + 1.2, z, i: 26 * Math.min(1.6, s), d: 10 + 3 * s, k: 0 }))];
  const NEAR = [null, null, null, null];
  const fireLights = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xff8a3a, 0, 11, 2); root.add(l); return l; });
  const key = new THREE.PointLight(0xff8a3a, 20, 11, 2);
  key.position.set(-4, ground(-4, -104) + 2.2, -104); key.name = 'chibi-key';
  root.add(key);

  const tmp = new THREE.Vector3();
  let t = 0;
  return {
    root,
    fires: emberSpots.map(([x, z]) => ({ position: new THREE.Vector3(x, 0, z) })),
    update(dt, focus) {
      t += dt;
      uTime.value = t;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      sun.target.position.copy(tmp);
      sun.position.copy(LIGHT_DIR).multiplyScalar(70).add(tmp);
      for (const c of cloths) animateCloth(c, t);
      updateFire(t);
      // the NF ship fires nearest the focus, flickering, for the water's reflections
      shipFires.sort((a, b) => Math.hypot(a[0] - focus.x, a[2] - focus.z) - Math.hypot(b[0] - focus.x, b[2] - focus.z));
      for (let i = 0; i < NF; i++) {
        const f = shipFires[i];
        if (!f) { fireU[i].w = 0; continue; }
        fireU[i].set(f[0], f[1] + 1.4 * f[3], f[2], f[3] * (0.8 + 0.12 * Math.sin(t * 9 + i) + 0.08 * Math.sin(t * 23 + i * 3)));
      }
      for (const s of SITES) s.k = Math.hypot(s.x - focus.x, s.z - focus.z);
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
