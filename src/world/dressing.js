// Battlefield dressing, zone by zone along the 定軍山 route: 蜀軍本陣 (palisade, gate towers, tents, 蜀 standards,
// braziers), 漢水 ford (reeds, stepping stones in river.js, supply carts, wrecks), 山道 (Wei standards, watchtowers
// and archers on the cliff tops over the chokepoint, its barricade), the plaza before the wall (siege debris),
// 魏軍營寨 courtyard (palisade, tents beyond it, racks, braziers), the ramp (torches, flags, its barricade) and the
// summit (夏侯淵's command pavilion, war drums, the great 夏侯 banner, the beacon whose smoke marks the goal from the
// valley), plus reserve armies of both sides massed off the walkable ground. Wind-driven cloth, fires (voxel flames +
// embers), smoke columns. Everything animates as a pure function of render time (+ the gate states, which are sim
// state read here) → capture-deterministic; nothing writes sim state.
import * as THREE from 'three';
import { boxesGeometry, shade } from '../core/voxel.js';
import { makeRng } from '../core/rng.js';
import { figureGeometry, watchtower, pagoda, paperLantern, lit } from './castle.js';
import { TERRAIN as G, ROUTE, GATES, ground, riverZ, routeDist, routeNear, node, FORDS, WALL_Z, GATE_X, CAMP_H } from './map.js';
import { topAt, GRASS_TIME } from './terrain.js';
import { SUN_DIR, NOISE_GLSL } from './sky.js';
import { lensClear } from '../camera/occlusion.js';

const WIND = new THREE.Vector3(0.75, 0, 0.55).normalize();   // blows up the valley, toward the castle's end
const frac = (x) => x - Math.floor(x);
const FOCUS = { value: new THREE.Vector3() };   // the camera's focus (hero), for the reeds' sight line

// ---------------------------------------------------------------- banners
export function bannerTexture(ch, { bg, fg, border, w = 128, h = 256, tatter = true, seed = 1 }) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), r = makeRng(seed);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {                                     // weave / weathering
    g.fillStyle = r.chance(0.5) ? 'rgba(255,225,190,0.06)' : 'rgba(0,0,0,0.09)';
    g.fillRect(r.int(0, w), r.int(0, h), r.int(2, 10), r.int(1, 4));
  }
  if (border) { g.strokeStyle = border; g.lineWidth = w * 0.09; g.strokeRect(w * 0.045, w * 0.045, w * 0.91, h * 0.86); }
  g.fillStyle = fg;
  g.font = `bold ${Math.round(w * 0.66)}px "Xingkai SC","STXingkai","Kaiti SC","STKaiti","KaiTi","Songti SC",serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  // fill only: a stroke closes 魏's dense counters into a blob at gameplay distance. Two glyphs stack (夏侯).
  if (ch.length > 1) { g.font = g.font.replace(/\d+px/, `${Math.round(w * 0.56)}px`); [...ch].forEach((q, i) => g.fillText(q, w / 2, h * (0.25 + i * 0.33))); }
  else if (ch) g.fillText(ch, w / 2, h * 0.42);
  const grad = g.createLinearGradient(0, 0, 0, h);                    // soot toward the hem
  grad.addColorStop(0.6, 'rgba(20,8,6,0)'); grad.addColorStop(1, 'rgba(20,8,6,0.45)');
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  if (tatter) {
    g.globalCompositeOperation = 'destination-out';
    for (let x = 0; x < w; x += w / 16) g.fillRect(x, h * 0.84 + r.range(0, h * 0.14), w / 16, h);
    for (let i = 0; i < 5; i++) g.fillRect(r.int(0, w), r.int(h * 0.3, h * 0.8), r.int(3, 7), r.int(3, 7));   // holes
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  return t;
}

/**
 * Cloth: plane in local XY, u = 0 at the attached edge (pole) → 1 free edge, v = 0 top → 1 hem.
 * kind 'hang' (T-pole standard: top + pole edge attached), 'flag' (pole edge only, streams in the wind),
 * 'drape' (hung flat on a wall, top edge attached).
 */
export function cloth(mat, w, h, kind, ph) {
  const geo = new THREE.PlaneGeometry(w, h, kind === 'drape' ? 12 : 8, kind === 'flag' ? 6 : 14);
  geo.translate(w / 2, -h / 2, 0);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.userData = { base: Float32Array.from(geo.attributes.position.array), w, h, kind, ph };
  return m;
}

export function animateCloth(m, t) {
  const { base, w, h, kind, ph } = m.userData, p = m.geometry.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) {
    const bx = base[i], by = base[i + 1], u = Math.max(0, bx / w), v = Math.max(0, -by / h);
    let z = 0, x = bx, y = by;
    if (kind === 'hang') {
      const a = Math.pow(u, 0.85) * (0.35 + 0.65 * v) * w * 0.28;
      z = a * (Math.sin(t * 2.6 - u * 4.2 - v * 2.4 + ph) * 0.72 + Math.sin(t * 4.3 - u * 7.5 + v * 1.3 + ph * 1.7) * 0.28);
      // in-plane gusts: the hem swings sideways (reads at 50 m, where out-of-plane ripple alone looks static)
      const sway = Math.sin(t * 2.1 + ph - v * 1.4) * 0.65 + Math.sin(t * 3.7 + ph * 1.3 - v * 2.6) * 0.35;
      x = bx - Math.abs(z) * 0.25 + sway * v * v * w * 0.42 * (0.3 + 0.7 * u);
      y = by + Math.sin(t * 1.7 + ph + u * 2) * 0.05 * v * h * u;
    } else if (kind === 'flag') {
      const a = u * h * 0.3;
      z = a * (Math.sin(t * 6.5 - u * 7 + ph) * 0.8 + Math.sin(t * 9.1 - u * 11 + ph) * 0.2);
      y = by - u * u * h * 0.15;
    } else {
      // drape on the wall: gusts lift the hem off the stone and swing it sideways
      // (horizontal travelling ripples: their facets catch the light differently every frame)
      z = Math.pow(v, 1.6) * (0.55 + 0.5 * Math.sin(t * 1.1 + ph + u * 1.5)) + Math.sin(t * 2.4 - u * 7 - v * 2 + ph) * (0.08 + 0.32 * v);
      x = bx + v * v * (Math.sin(t * 1.3 + ph - v * 1.4) * 0.8 + Math.sin(t * 2.7 + ph * 2 + u * 2) * 0.25);
    }
    p[i] = x; p[i + 1] = y; p[i + 2] = z;
  }
  m.geometry.attributes.position.needsUpdate = true;
}

// ---------------------------------------------------------------- fire, embers, smoke (instanced, stateless)
/** Smoke puff: camera-facing quad with a soft billow (overlapping lobes, alpha falling off smoothly to 0 well inside
 * the quad, a lighter upper rim where the low sun catches it). Linear filtered: near the lens a puff stays a soft
 * cloud, never a stack of hard black texels. Instance matrix = position + rotation/scale in the view plane. */
export function smokeMaterial() {
  const N = 64, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d'), img = g.createImageData(N, N);
  const blobs = [[0.5, 0.56, 0.3], [0.34, 0.46, 0.2], [0.66, 0.42, 0.22], [0.48, 0.3, 0.19], [0.6, 0.64, 0.18], [0.38, 0.62, 0.17]];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = (x + 0.5) / N, v = (y + 0.5) / N;
    let dens = 0;
    for (const [bx, by, br] of blobs) dens += Math.exp(-((Math.hypot(u - bx, v - by) / br) ** 2) * 2.2);
    const a = Math.min(1, dens * 0.9) * Math.min(1, Math.max(0, 0.5 - Math.hypot(u - 0.5, v - 0.5)) * 6);   // 0 before the quad edge
    const rim = 0.86 + 0.34 * Math.max(0, 0.55 - v) + 0.2 * (1 - Math.min(1, dens));
    const i = (y * N + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.min(255, 200 * rim); img.data[i + 3] = a * 255;
  }
  g.putImageData(img, 0, 0);
  const map = new THREE.CanvasTexture(cv);
  map.minFilter = THREE.LinearMipmapLinearFilter;
  const mat = new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0.62, depthWrite: false });
  mat.onBeforeCompile = (sh) => {                                    // billboard + thinned out near the lens
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vSmNear;').replace('#include <project_vertex>', `
      vec4 mvPosition = modelViewMatrix * vec4( instanceMatrix[3].xyz, 1.0 );
      mvPosition.xy += mat2( instanceMatrix[0].xy, instanceMatrix[1].xy ) * transformed.xy;
      vSmNear = smoothstep(2.0, 9.0, -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vSmNear;').replace('#include <dithering_fragment>', 'gl_FragColor.a *= vSmNear;');
  };
  return mat;
}

/** Soft radial glow (white, alpha 0 at the rim) for additive fire halos and ground light pools. */
export function glowTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  for (let k = 0; k <= 10; k++) gr.addColorStop(k / 10, `rgba(255,255,255,${(Math.exp(-((k / 10) ** 2) * 4.5) - Math.exp(-4.5) * k / 10).toFixed(3)})`);   // gaussian, 0 at the rim
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

/** Flame card: a vertical (cylindrical) billboard whose flame is drawn in the shader on a pixel grid — two noise layers
 *  scrolling up erode a teardrop: white-hot root → orange body → dark-red, sooty torn tips. The grid is 12 × 20 far
 *  off and doubles (up to 4×) as the card grows on screen, so a brazier by the lens keeps its detail instead of turning
 *  into flat slabs. Premultiplied-alpha blend: the body and tips occlude a little (a silhouette, not a cream smear),
 *  only the core adds light, so 2-3 overlapping cards stay orange. instanceColor = [seed, intensity, -]; the card
 *  leans downwind at the tip and fades out within 7 m of the lens. */
const FLAME_VS = /* glsl */`
  uniform float uTime;
  varying vec2 vUv; varying vec3 vP; varying float vNear; flat varying float vGrid;
  void main() {
    vec3 base = instanceMatrix[3].xyz;
    float w = length(instanceMatrix[0].xyz), h = length(instanceMatrix[1].xyz);
    vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]) + vec3(1e-5, 0.0, 0.0));
    vec3 wp = base + right * position.x * w + vec3(0.0, (position.y + 0.5) * h, 0.0);
    float sw = sin(uTime * 2.7 + instanceColor.x * 40.0) * 0.6 + sin(uTime * 5.3 + instanceColor.x * 17.0) * 0.4;
    wp.xz += vec2(0.8, 0.6) * uv.y * uv.y * h * (0.12 + 0.08 * sw);
    vec4 mv = viewMatrix * vec4(wp, 1.0);
    vNear = smoothstep(2.5, 7.0, -mv.z);
    float bd = max(-(viewMatrix * vec4(base, 1.0)).z, 0.5);                 // per card (flat): no seams inside a card
    vGrid = exp2(clamp(floor(log2(10.0 * h / bd)), 0.0, 3.0));
    vUv = uv; vP = instanceColor;
    gl_Position = projectionMatrix * mv;
  }`;
const FLAME_FS = /* glsl */`
  uniform float uTime;
  varying vec2 vUv; varying vec3 vP; varying float vNear; flat varying float vGrid;
  ${NOISE_GLSL}
  void main() {
    vec2 px = vec2(12.0, 20.0) * vGrid, uv = (floor(vUv * px) + 0.5) / px;  // chunky flame pixels (voxel style)
    float sd = vP.x * 23.0, sp = 2.1 + vP.x * 0.8;
    float n = dwNoise(vec2(uv.x * 3.2 + sd, uv.y * 2.6 - uTime * sp)) * 0.55 + dwNoise(vec2(uv.x * 6.5 - sd, uv.y * 5.0 - uTime * sp * 1.7)) * 0.3
            + dwNoise(vec2(uv.x * 13.0 + sd, uv.y * 10.0 - uTime * sp * 2.6)) * 0.15;
    float x = abs(uv.x - 0.5) * 2.0;
    // a narrow teardrop eroded hard by the noise: separate tongues licking up, a hot root, dark torn tips
    float heat = (1.0 - x / mix(0.9, 0.2, uv.y)) * (1.0 - 0.85 * uv.y) + (n - 0.5) * (0.6 + uv.y * 1.3) - 0.05;
    heat *= 0.55 + 0.6 * smoothstep(0.0, 0.16, uv.y);
    if (heat < 0.05) discard;
    float root = 1.0 - smoothstep(0.04, 0.26, uv.y);                        // the white-hot core lives only at the base
    vec3 c = mix(vec3(0.1, 0.018, 0.008), vec3(0.72, 0.1, 0.012), smoothstep(0.05, 0.22, heat));   // soot-red tips → red body
    c = mix(c, vec3(1.25, 0.3, 0.025), smoothstep(0.3, 0.56, heat));                           // orange tongues
    c = mix(c, vec3(1.7, 0.72, 0.1), smoothstep(0.6, 0.82, heat) * (0.25 + 0.75 * (1.0 - uv.y)));   // yellow in the lower body
    c = mix(c, vec3(2.2, 1.4, 0.5), smoothstep(0.78, 0.95, heat) * root);                     // near-white only at the root
    float k = vP.y * vNear;
    // premultiplied: rgb = emitted light, alpha = how much of the background the flame hides (tips/body, not the core)
    float a = smoothstep(0.05, 0.14, heat) * mix(0.72, 0.18, smoothstep(0.2, 0.6, heat));
    gl_FragColor = vec4(c * smoothstep(0.05, 0.16, heat) * k, a * k);
  }`;

/** list: [x, y, z, scale, smoke = scale ≥ 1.3, gate id]: a gate-linked fire only burns once that gate is open (the
 *  barricade was fired: map.js GATES). update(t). Per fire: 2-3 flame cards + 2 detaching licks (flame shader),
 *  a stream of ember cubes, dark smoke puffs lit from below (big fires), a dim halo and a firelight pool. */
export function fireSystem(scene, list, top = topAt) {
  const r = makeRng(77);
  const cards = [], embers = [], puffs = [];
  for (const [x, y, z, s, smoke = s >= 1.3, g = null] of list) {
    for (let i = 0, n = s >= 0.9 ? 3 : 2; i < n; i++) {
      const mid = i === 1;
      cards.push({ x, y, z, s, g, lick: false, seed: r.next(), k: mid || n < 3 ? 1 : 0.6, ox: (i - (n - 1) / 2) * 0.32 + r.range(-0.1, 0.1), oz: r.range(-0.25, 0.25),
        w: r.range(0.9, 1.25) * (mid ? 1.15 : 0.85), h: r.range(1.7, 2.3) * (mid ? 1.2 : 0.85), ph: r.range(0, 6.28) });
    }
    for (let i = 0; i < 2; i++) cards.push({ x, y, z, s, g, lick: true, seed: r.next(), ox: r.range(-0.3, 0.3), oz: r.range(-0.3, 0.3), w: r.range(0.35, 0.5), h: r.range(0.6, 0.9), ph: i * 0.5 + r.range(0, 0.2), sp: r.range(0.9, 1.4) });
    for (let i = 0; i < Math.round(14 * s); i++) embers.push({ x, y, z, s, g, ph: r.next(), sp: r.range(0.18, 0.35), ox: r.range(-0.8, 0.8), oz: r.range(-0.8, 0.8), w: r.range(0, 6.28) });
    if (smoke) for (let i = 0; i < 30; i++) puffs.push({ x, y, z, s, g, ph: i / 30 + r.range(0, 0.02), sp: r.range(0.075, 0.095), ox: r.range(-0.8, 0.8), oz: r.range(-0.8, 0.8), rot: r.range(0, 6.28), v: r.range(0.8, 1.2) });
  }
  const uTime = { value: 0 };
  const cm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ vertexShader: FLAME_VS, fragmentShader: FLAME_FS, uniforms: { uTime },
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    transparent: true, depthWrite: false, side: THREE.DoubleSide }), cards.length);
  cm.frustumCulled = false; cm.renderOrder = 2;
  cm.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cards.length * 3), 3);
  // embers: soft round sparks (camera-facing quad, radial glow: hot core → orange rim), capped at ≈ 0.6° on screen and
  // faded out inside 4 m of the lens — a box by the lens turned into a flat tan hexagon
  const add = new THREE.MeshBasicMaterial({ map: glowTexture(), color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false });
  add.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vEmNear;').replace('#include <project_vertex>', `
      vec4 mvPosition = modelViewMatrix * vec4( instanceMatrix[3].xyz, 1.0 );
      float emS = length(instanceMatrix[0].xyz), emD = -mvPosition.z;
      mvPosition.xy += transformed.xy * 2.6 * min(emS, emD * 0.004);
      vEmNear = smoothstep(2.5, 4.5, emD);
      gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vEmNear;')
      .replace('#include <dithering_fragment>', 'gl_FragColor.rgb *= vEmNear * mix(vec3(1.0, 0.55, 0.3), vec3(1.0), diffuseColor.a * diffuseColor.a);');
  };
  const fm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), add, embers.length);
  fm.frustumCulled = false;
  fm.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(embers.length * 3), 3);
  const sm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), smokeMaterial(), puffs.length);
  sm.frustumCulled = false;
  sm.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(puffs.length * 3), 3);
  sm.renderOrder = 1;
  cm.name = 'flames'; fm.name = 'embers'; sm.name = 'smoke';
  scene.add(cm, fm, sm);
  // per fire: a soft additive halo round the flames (heat + light) and a flickering pool of firelight on the ground
  // under it — both fade out near the lens; the halo is kept dim so a brazier by the hero never blows out the frame
  // (no pool for a fire heaped against a wall — list[6]: a flat plane there only cut a hard orange edge along the wall foot)
  const glow = glowTexture(), sites = list.map(([x, y, z, s, , g = null, wall = false]) => ({ x, y, z, s, g, wall, ph: r.range(0, 6.28), py: y - top(x, z) < 3.2 ? top(x, z) : y }));
  const glowMat = (bb) => {
    const gm = new THREE.MeshBasicMaterial({ map: glow, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
    gm.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vNear;').replace('#include <project_vertex>', bb ? `
        vec4 mvPosition = modelViewMatrix * vec4( instanceMatrix[3].xyz, 1.0 );
        float hR = length(instanceMatrix[0].xyz) * 0.5;
        vNear = smoothstep(5.0, 14.0, -mvPosition.z);
        float hD = -mvPosition.z, hS = min(hR * 0.85, max(hD - 1.0, 0.0));
        mvPosition.z += hS;                                                     // in front of whatever the fire stands on / by,
        mvPosition.xy += mat2( instanceMatrix[0].xy, instanceMatrix[1].xy ) * transformed.xy * (hD - hS) / hD;   // same size on screen
        gl_Position = projectionMatrix * mvPosition;` : '#include <project_vertex>\nvNear = smoothstep(4.0, 12.0, -mvPosition.z);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vNear;').replace('#include <dithering_fragment>', 'gl_FragColor.rgb *= vNear;');
    };
    gm.customProgramCacheKey = () => 'fire-glow|' + bb;   // halo (billboard) and pool (flat) share the callback text: keep two programs
    return gm;
  };
  const flat = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const hm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), glowMat(true), sites.length), pm = new THREE.InstancedMesh(flat, glowMat(false), sites.length);
  for (const k of [hm, pm]) { k.frustumCulled = false; k.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(sites.length * 3), 3); k.renderOrder = 2; scene.add(k); }
  hm.name = 'fire-halo'; pm.name = 'fire-pool';
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
  const SMOKE_LO = new THREE.Color(0x3a2e2a), SMOKE_HI = new THREE.Color(0x6e6470), GLOW = new THREE.Color(0.4, 0.14, 0.03);
  return (t) => {
    uTime.value = t;
    for (let i = 0; i < cards.length; i++) {
      const f = cards[i], s = f.g && !GATES[f.g].open ? 0 : f.s;
      if (f.lick) {                                                              // a tongue tearing off and rising
        const k = frac(t * f.sp + f.ph), sz = s * (1 - k * 0.8);
        p.set(f.x + (f.ox + WIND.x * k * 0.9) * s, f.y + (0.7 + k * 2.1) * s, f.z + (f.oz + WIND.z * k * 0.9) * s);
        cm.setMatrixAt(i, m.compose(p, q.identity(), sc.set(f.w * sz, f.h * sz, 1)));
        cm.setColorAt(i, c.setRGB(f.seed, 0.9 * (1 - k) * Math.min(1, k * 6), 0));
      } else {
        const fl = 0.9 + 0.1 * Math.sin(t * 9 + f.ph) + 0.06 * Math.sin(t * 21 + f.ph * 3);
        p.set(f.x + f.ox * s, f.y + 0.05 * s, f.z + f.oz * s);
        cm.setMatrixAt(i, m.compose(p, q.identity(), sc.set(f.w * s, f.h * s * fl, 1)));
        cm.setColorAt(i, c.setRGB(f.seed, f.k, 0));                            // side cards dimmer: overlaps stay orange, not white
      }
    }
    cm.instanceMatrix.needsUpdate = true; cm.instanceColor.needsUpdate = true;
    for (let i = 0; i < embers.length; i++) {
      const f = embers[i], k = frac(t * f.sp + f.ph), s = f.g && !GATES[f.g].open ? 0 : f.s;
      p.set(f.x + f.ox * s + WIND.x * k * 10 * s + Math.sin(k * 19 + f.w) * 0.5, f.y + 0.8 + k * 13 * s, f.z + f.oz * s + WIND.z * k * 10 * s + Math.cos(k * 15 + f.w) * 0.5);
      const size = s && 0.08 * (1 - k * 0.6) * (Math.sin(t * 23 + f.w * 5) > -0.3 ? 1 : 0.25);
      fm.setMatrixAt(i, m.compose(p, q.identity(), sc.set(size, size, size)));
      fm.setColorAt(i, c.setRGB(6, 2.2, 0.5).multiplyScalar(1 - k));
    }
    fm.instanceMatrix.needsUpdate = true; fm.instanceColor.needsUpdate = true;
    for (let j = 0; j < puffs.length; j++) {
      const f = puffs[j], k = frac(t * f.sp + f.ph), s = f.g && !GATES[f.g].open ? 0 : f.s;
      const drift = k * k * 15 * s;
      p.set(f.x + f.ox * s + WIND.x * drift, f.y + 1.6 * s + k * 17 * s, f.z + f.oz * s + WIND.z * drift);
      const size = s * f.v * (0.7 + 3.6 * k) * Math.min(1, k / 0.06) * (1 - Math.max(0, (k - 0.78) / 0.22));
      q.setFromEuler(e.set(0, 0, f.rot + t * 0.2 * (f.v - 1)));                  // spin in the view plane (billboard)
      sm.setMatrixAt(j, m.compose(p, q, sc.set(size * 1.3, size * 1.3, 1)));
      c.copy(SMOKE_LO).lerp(SMOKE_HI, Math.min(1, k * 1.4));
      const glow = Math.max(0, 1 - k / 0.12);                                  // underside lit by the fire
      c.r += GLOW.r * glow; c.g += GLOW.g * glow; c.b += GLOW.b * glow;
      sm.setColorAt(j, c);
    }
    sm.instanceMatrix.needsUpdate = true; sm.instanceColor.needsUpdate = true;
    for (let j = 0; j < sites.length; j++) {
      const f = sites[j], s = f.g && !GATES[f.g].open ? 0 : f.s, fl = 0.8 + 0.12 * Math.sin(t * 11 + f.ph) + 0.08 * Math.sin(t * 23.7 + f.ph * 3);
      hm.setMatrixAt(j, m.compose(p.set(f.x, f.y + 1.1 * s, f.z), q.identity(), sc.set(3.8 * s * fl, 4.6 * s * fl, 1)));
      hm.setColorAt(j, c.setRGB(0.42, 0.13, 0.03).multiplyScalar(fl));
      pm.setMatrixAt(j, m.compose(p.set(f.x, f.py + 0.07, f.z), q.identity(), sc.set(5.2 * s * fl, 1, 5.2 * s * fl).multiplyScalar(f.wall ? 0 : 1)));
      pm.setColorAt(j, c.setRGB(0.55, 0.17, 0.035).multiplyScalar(fl));
    }
    for (const k of [hm, pm]) { k.instanceMatrix.needsUpdate = true; k.instanceColor.needsUpdate = true; }
  };
}


// ---------------------------------------------------------------- set pieces (merged boxes on the ground under them)
const inAt = (x, z) => G.in[node(x, z)];   // walk inside value (m)

/** Palisade of sharpened stakes with two rails along a ground-following polyline [[x, z], …]. */
export function palisade(b, r, pts) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az);
    for (let d = 0; d < L; d += 0.38) {
      if (r.chance(0.05)) continue;
      const x = ax + (bx - ax) * d / L, z = az + (bz - az) * d / L, gy = ground(x, z), hh = r.range(2.3, 3.1);
      b.push({ s: [0.34, hh, 0.34], p: [x, gy + hh / 2, z], r: [r.range(-0.08, 0.08), yaw, r.range(-0.1, 0.1)], c: shade(0x5a3d2a, r.range(0.75, 1.1)) });
      b.push({ s: [0.2, 0.35, 0.2], p: [x, gy + hh + 0.15, z], c: shade(0x6e4c34, r.range(0.8, 1.1)) });
    }
    for (let d = 0; d < L - 0.5; d += 3) {                                      // rails, 3 m lengths following the ground
      const l = Math.min(3, L - d), x = ax + (bx - ax) * (d + l / 2) / L, z = az + (bz - az) * (d + l / 2) / L, gy = ground(x, z);
      for (const ry of [0.8, 1.9]) b.push({ s: [0.16, 0.2, l], p: [x, gy + ry, z], r: [0, yaw, 0], c: 0x3e2a1d });
    }
  }
}

/** Stepped-slab tent (5 slabs + pole) on whatever surface is there. */
function tent(b, x, z, yaw, col, w = 5, d = 6) {
  const gy = topAt(x, z);
  for (let k = 0; k < 5; k++) b.push({ s: [w * (1 - k * 0.19), 0.7, d], p: [x, gy + 0.35 + k * 0.7, z], r: [0, yaw, 0], c: shade(col, 1 - k * 0.04) });
  b.push({ s: [0.2, 4.6, 0.2], p: [x, gy + 2.3, z], c: 0x3a2618 });
}

/** Box pusher in a local frame (x across, z along `yaw`) at (x0, y0, z0). */
export const local = (b, x0, y0, z0, yaw) => (lx, ly, lz, s, c, rr = [0, 0, 0]) => {
  const cs = Math.cos(yaw), sn = Math.sin(yaw);
  b.push({ s, p: [x0 + lx * cs + lz * sn, y0 + ly, z0 - lx * sn + lz * cs], r: [rr[0], yaw + rr[1], rr[2]], c });
};

/** Supply cart: bed, sides, chunky wheels, shafts, a load of crates and rice sacks (burnt: charred, tipped, no load). */
export function cart(b, r, x, z, yaw, burnt = false) {
  const L = local(b, x, ground(x, z), z, yaw), W = burnt ? 0x2a1a10 : 0x5a3d28, D = burnt ? 0x1c120c : 0x3a2618, tip = burnt ? 0.22 : 0;
  L(0, 0.95, 0, [1.8, 0.16, 3.0], W, [0, 0, tip]);
  for (const sx of [-1, 1]) {
    L(sx * 0.88, 1.25, 0, [0.1, 0.5, 3.0], D, [0, 0, tip]);
    L(sx * 1.02, 0.55, -0.5, [0.18, 1.1, 1.1], D, [0.4, 0, 0]);               // wheel: two squares turned apart read round at range
    L(sx * 1.02, 0.55, -0.5, [0.19, 0.8, 0.8], W, [1.18, 0, 0]);
    L(sx * 0.5, 0.65, 2.3, [0.1, 0.1, 2.2], D, [-0.25, 0, 0]);
  }
  if (burnt) return;
  for (let k = 0, n = r.int(3, 5); k < n; k++) {
    const sack = r.chance(0.5), s = sack ? [0.8, 0.5, 0.6] : [0.7, 0.7, 0.7];
    L(r.range(-0.45, 0.45), 1.3 + (k > 2 ? 0.6 : 0) + s[1] / 2, r.range(-1, 1), s, sack ? shade(SACK, r.range(0.85, 1.05)) : shade(0x6e5038, r.range(0.8, 1.1)), [0, r.range(-0.3, 0.3), 0]);
  }
}

/** A fallen Wei soldier sprawled on his back (head +Z), one arm flung out, legs apart, his spear dropped beside him:
 *  sun-faded armour and the red sash so he reads as a body at gameplay range, not a black plank. Origin on the ground. */
export function fallenGeometry() {
  const B = (s, p, c, ry = 0, rx = 0) => ({ s, p, c, r: [rx, ry, 0] });
  return boxesGeometry([
    B([0.46, 0.24, 0.6], [0, 0.13, 0.18], 0x5e504a), B([0.36, 0.05, 0.4], [0, 0.26, 0.24], 0x7e6e62), B([0.48, 0.25, 0.09], [0, 0.13, -0.08], 0x8a2a1c),
    B([0.24, 0.22, 0.24], [0.02, 0.12, 0.62], 0xb88a68), B([0.3, 0.2, 0.16], [0.02, 0.12, 0.78], 0x4a4341), B([0.31, 0.06, 0.2], [0.02, 0.2, 0.72], 0xb02a1c),
    B([0.13, 0.12, 0.52], [0.42, 0.07, 0.5], 0x5e3026, 1.1), B([0.1, 0.1, 0.12], [0.62, 0.06, 0.62], 0xb88a68, 1.1),   // arm flung out
    B([0.13, 0.12, 0.48], [-0.31, 0.07, 0.08], 0x5e3026, -0.25),
    B([0.15, 0.14, 0.78], [0.17, 0.08, -0.5], 0x3a302b, 0.28), B([0.15, 0.14, 0.76], [-0.15, 0.08, -0.5], 0x3a302b, -0.12),
    B([0.16, 0.2, 0.14], [0.28, 0.1, -0.9], 0x2a1d16, 0.28), B([0.16, 0.2, 0.14], [-0.2, 0.1, -0.88], 0x2a1d16, -0.12),
    B([0.05, 0.05, 2.1], [0.95, 0.03, 0.2], 0x6b4a2e, 0.45), B([0.1, 0.03, 0.24], [1.45, 0.03, 1.2], 0xa8adb2, 0.45),
  ]);
}

/** Iron brazier on legs: returns its fire spot. */
export function brazier(b, x, z, s = 0.6) {
  const gy = ground(x, z);
  for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) b.push({ s: [0.1, 1.0, 0.1], p: [x + dx, gy + 0.5, z + dz], c: 0x2a2624 });
  b.push({ s: [0.95, 0.32, 0.95], p: [x, gy + 1.05, z], c: 0x35302c });
  return [x, gy + 1.1, z, s, false];
}

/** War drum (lacquered barrel on a frame, skin toward `yaw`). */
export function drum(b, x, z, yaw, y = ground(x, z)) {
  const L = local(b, x, y, z, yaw);
  for (const sx of [-1.45, 1.45]) L(sx, 1.6, 0, [0.28, 3.2, 0.28], 0x2e1d15);
  L(0, 3.1, 0, [3.3, 0.26, 0.3], 0x2e1d15);
  L(0, 1.9, 0, [2.0, 2.0, 1.4], 0x7c2b1d); L(0, 1.9, 0, [2.3, 1.4, 1.25], 0x7c2b1d); L(0, 1.9, 0, [1.4, 2.3, 1.25], 0x7c2b1d);
  for (const sz of [-0.72, 0.72]) L(0, 1.9, sz, [1.75, 1.75, 0.06], 0x8a7656);   // hide skin (a pale one blew out by firelight)
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; L(Math.cos(a) * 1.08, 1.9 + Math.sin(a) * 1.08, -0.66, [0.1, 0.1, 0.1], 0xc9a040); }
  L(1.9, 0.9, -0.4, [0.12, 1.4, 0.12], 0x4a3222, [0, 0, 0.5]);               // drumstick leaning on the frame
}

/** Cheval-de-frise unit: a log with crossed sharpened stakes. */
function frise(L, lx, ly, lz) {
  L(lx, ly + 0.55, lz, [5, 0.34, 0.34], 0x4a3222);
  for (let k = 0; k < 5; k++) {
    L(lx + (k - 2) * 1.1, ly + 0.8, lz, [0.16, 2.2, 0.16], 0x5e4330, [0.75, 0, 0]);
    L(lx + (k - 2) * 1.1, ly + 0.8, lz, [0.16, 2.2, 0.16], 0x5e4330, [-0.75, 0, 0]);
  }
}

/** Supply pile: crates (banded lids) and burlap rice sacks (twine tie, slumped top), some thrown on the crates. */
const SACK = 0x8a7a5c;
export function supplies(b, r, x, z, yaw, n = 6) {
  const L = local(b, x, ground(x, z), z, yaw);
  const sackAt = (lx, y, lz, ry, c) => {
    L(lx, y, lz, [0.85, 0.46, 0.6], c, ry); L(lx, y + 0.25, lz, [0.7, 0.08, 0.48], shade(c, 0.92), ry);   // slumped top
    L(lx + 0.3 * Math.cos(ry[1]), y, lz - 0.3 * Math.sin(ry[1]), [0.07, 0.48, 0.63], 0x4a3a28, ry);       // twine tie near one end
  };
  for (let k = 0; k < n; k++) {
    const lx = (k % 3 - 1) * 0.95 + r.range(-0.1, 0.1), lz = Math.floor(k / 3) * 0.95, sack = r.chance(0.4), ry = [0, r.range(-0.25, 0.25), 0];
    const sackC = shade(SACK, r.range(0.8, 1.0));
    if (sack) { sackAt(lx, 0.23, lz, ry, sackC); continue; }
    L(lx, 0.4, lz, [0.8, 0.8, 0.8], shade(0x6e5038, r.range(0.75, 1.1)), ry);
    L(lx, 0.7, lz, [0.84, 0.08, 0.84], 0x2e1d15, ry);                          // iron-banded lid
    if (r.chance(0.5)) sackAt(lx, 1.03, lz, [0, r.range(-0.5, 0.5), 0], sackC);
  }
}

/** Shield rack: a low rail with four round shields leaning on it (red 魏 faces, bronze bosses). */
export function shieldRack(b, r, x, z, yaw) {
  const L = local(b, x, ground(x, z), z, yaw);
  L(0, 0.75, 0, [2.6, 0.1, 0.1], 0x3a2618);
  for (const sx of [-1.2, 1.2]) L(sx, 0.4, 0, [0.12, 0.8, 0.12], 0x3a2618);
  for (let k = 0; k < 4; k++) {
    const lx = -0.95 + k * 0.63, face = r.chance(0.75) ? 0x7a2418 : 0x9a8058;
    L(lx, 0.42, 0.16, [0.58, 0.8, 0.07], shade(face, r.range(0.8, 1.05)), [-0.28, 0, 0]);
    L(lx, 0.44, 0.21, [0.16, 0.16, 0.05], 0xb89040, [-0.28, 0, 0]);
  }
}

/** Command table: map spread on it (red / blue unit markers), four stools. */
function commandTable(b, x, z, yaw) {
  const L = local(b, x, ground(x, z), z, yaw);
  L(0, 0.8, 0, [3.0, 0.12, 1.8], 0x4a3020);
  for (const sx of [-1.35, 1.35]) for (const sz of [-0.75, 0.75]) L(sx, 0.4, sz, [0.14, 0.8, 0.14], 0x2e1d15);
  L(0.1, 0.875, 0, [2.2, 0.03, 1.3], 0xcdb88a, [0, 0.08, 0]);
  L(-0.5, 0.9, 0.2, [0.6, 0.02, 0.05], 0x8a2a1c); L(0.4, 0.9, -0.3, [0.05, 0.02, 0.5], 0x8a2a1c);
  L(0.7, 0.95, 0.3, [0.12, 0.12, 0.12], 0x2a4a8a); L(-0.2, 0.95, -0.2, [0.12, 0.12, 0.12], 0x9a2a1c); L(0.2, 0.95, 0.35, [0.12, 0.12, 0.12], 0x9a2a1c);
  for (const [sx, sz] of [[-2.0, 0], [2.0, 0], [0, -1.35], [0, 1.35]]) L(sx, 0.25, sz, [0.5, 0.5, 0.5], 0x3a2618);
}

/** Beacon tower: stepped stone courses, an iron basket on top. Returns the fire's height. */
function beaconTower(b, r, x, z) {
  let y = ground(x, z);
  for (const [w, h] of [[4.4, 1.3], [3.8, 1.3], [3.2, 1.2], [2.8, 0.5]]) {
    b.push({ s: [w, h, w], p: [x, y + h / 2, z], c: shade(0x6a5a50, r.range(0.8, 1.0)) });
    for (let k = 0; k < 4; k++) b.push({ s: [w + 0.06, 0.08, 0.5], p: [x, y + r.range(0.3, h - 0.2), z + (k - 1.5) * w * 0.25], c: 0x3e332e });   // mortar course
    y += h;
  }
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.push({ s: [0.16, 1.0, 0.16], p: [x + dx * 1.1, y + 0.5, z + dz * 1.1], c: 0x241e1c });
  b.push({ s: [2.5, 0.2, 2.5], p: [x, y + 0.3, z], c: 0x2a2422 });
  return y + 0.35;
}

/**
 * Barricade across a corridor, its own mesh so world.js can collapse and char it when the gate opens. Pivot on the
 * corridor centre; units run along local x (yaw turns the line), each on the ground under it.
 */
function barricade(scene, x, z, yaw, half) {
  const b = [], gy0 = ground(x, z), L = local(b, 0, 0, 0, 0), cs = Math.cos(yaw), sn = Math.sin(yaw);
  for (let lx = -half; lx <= half + 0.1; lx += 4.4) frise(L, lx, ground(x + lx * cs, z - lx * sn) - gy0, 0);
  L(0, 1.4, 0.6, [2 * half, 0.26, 0.26], 0x3e2a1d);                           // lashed top rail
  const mat = lit(), m = new THREE.Mesh(boxesGeometry(b), mat);
  m.position.set(x, gy0, z); m.rotation.set(0, yaw, 0, 'YXZ');            // YXZ: the collapse tilts it about its own line
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  return { m, mat, y: gy0 };
}

// sunlight through the cloth: emissive = the banner's own texture, so 魏/蜀 read even when backlit
// lensClear (also on the poles / props below): a banner or tent between the lens and the hero blacked out a third of the frame
// DoubleSide cloth seen from behind showed the glyph mirror-imaged (魏 read backwards): back faces sample the colour
// with u flipped (the alpha / tattered hem stays put, so the silhouette matches from both sides)
const unmirror = (m) => {
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <map_fragment>', 'vec2 bnUv = gl_FrontFacing ? vMapUv : vec2(1.0 - vMapUv.x, vMapUv.y);\ndiffuseColor *= vec4(texture2D(map, bnUv).rgb, texture2D(map, vMapUv).a);')
      .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance *= texture2D(emissiveMap, bnUv).rgb;');
  };
  return m;
};
/** Banner cloth material (bannerTexture map): self-lit by its own dye, glyph never mirrored, faded by the lens. */
export const bannerMat = (map, alpha = true) => lensClear(unmirror(new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.22, side: THREE.DoubleSide, alphaTest: alpha ? 0.5 : 0, roughness: 0.92, flatShading: true })), 2.5);

export function buildDressing(scene, { castle, fieldFires }) {
  const r = makeRng(44);
  const poles = [], cloths = [], props = [];
  const cm = bannerMat;
  const mats = {
    wei: cm(bannerTexture('魏', { bg: '#7d2a1f', fg: '#1a0d0a', border: '#4a1712', seed: 3 })),
    shu: cm(bannerTexture('蜀', { bg: '#c7a574', fg: '#2a120a', border: '#8e2a1c', w: 192, h: 256, seed: 5 })),
    shuFlag: cm(bannerTexture('蜀', { bg: '#b89668', fg: '#2a120a', border: '#9a2e1e', w: 128, h: 96, tatter: false, seed: 6 }), false),
    han: cm(bannerTexture('漢', { bg: '#2f5a3a', fg: '#e8d6a8', border: '#c7a574', w: 128, h: 256, seed: 8 })),
    red: cm(bannerTexture('', { bg: '#a3321f', fg: '#000', border: '#6a1c12', w: 64, h: 128, seed: 7 })),
    xiahou: cm(bannerTexture('夏侯', { bg: '#1c1414', fg: '#d8b060', border: '#7d2a1f', w: 160, h: 320, seed: 9 })),
  };
  const addCloth = (mat, w, h, kind, x, y, z, yaw) => {
    const c = cloth(mat, w, h, kind, r.range(0, 6.28));
    c.position.set(x, y, z); c.rotation.y = yaw;
    scene.add(c); cloths.push(c);
    return c;
  };
  /** Standard: pole + crossbar, cloth hangs from the bar and faces the nearest road point (the player's line of travel)
   *  or `face` [x, z]. */
  const standard = (x, z, s = 1, mat = mats.wei, P = 8.5 * s, face = routeNear(x, z).p) => {
    const W = 2.3 * s, Hc = 4.3 * s, gy = topAt(x, z);
    const yaw = Math.atan2(face[0] - x, face[1] - z) + r.range(-0.35, 0.35);
    const cx = Math.cos(yaw), cz = -Math.sin(yaw);
    poles.push({ s: [0.2 * s, P, 0.2 * s], p: [x, gy + P / 2, z], c: 0x3b2a1e });
    poles.push({ s: [W + 0.5, 0.16 * s, 0.16 * s], p: [x + cx * (W / 2), gy + P - 0.3 * s, z + cz * (W / 2)], r: [0, yaw, 0], c: 0x3b2a1e });
    poles.push({ s: [0.14, 0.5, 0.14], p: [x + cx * (W + 0.25), gy + P - 0.3 * s, z + cz * (W + 0.25)], c: 0x6b5a2a });
    poles.push({ s: [0.12, 0.8 * s, 0.12], p: [x, gy + P + 0.4 * s, z], c: 0xb8b0a0 });
    addCloth(mat, W, Hc, 'hang', x + cx * 0.12, gy + P - 0.4 * s, z + cz * 0.12, yaw);
  };
  const flag = (x, y, z, h = 3.2, mat = mats.shuFlag) => {
    poles.push({ s: [0.12, h + 1.4, 0.12], p: [x, y + (h + 1.4) / 2, z], c: 0x3b2a1e });
    addCloth(mat, 1.9, 1.3, 'flag', x, y + h + 1.3, z, Math.atan2(-WIND.z, WIND.x));
  };
  const tower = (x, z, h, s, mat = mats.red) => {
    const tb = [], gy = topAt(x, z);
    watchtower(tb, x, z, h, s);
    for (const q of tb) q.p[1] += gy;
    props.push(...tb);
    flag(x + 1.4 * s, gy + h + 1, z - 1.4 * s, 3, mat);
  };
  const glowBoxes = [];                              // self-lit paper lanterns (one basic-material mesh)
  const fires = [];                                  // [x, y, z, scale, smoke?, gate?]
  const embers = [];                                 // ground-level fires near the fight: the vfx embers rise from them
  const burn = (x, z, s, gate) => { fires.push([x, ground(x, z), z, s, s >= 1.3, gate]); if (!gate) embers.push([x, z]); };
  const lamp = (x, z, s) => { fires.push(brazier(props, x, z, s)); embers.push([x, z]); };

  // ---- 蜀軍本陣: palisade round three sides and either side of the gate, gate towers, tents, HQ, standards
  palisade(props, r, [[-25.5, -118], [-25.5, -157.5], [25.5, -157.5], [25.5, -118]]);
  palisade(props, r, [[-25, -119.5], [-10.5, -119.5]]);
  palisade(props, r, [[10.5, -119.5], [25, -119.5]]);
  tower(-11.8, -119.5, 5.5, 1.3, mats.shuFlag); tower(11.8, -119.5, 5.5, 1.3, mats.shuFlag);
  for (let z = -150; z <= -127; z += 7.5) for (const sx of [-1, 1]) tent(props, sx * 19.5, z + r.range(-1, 1), Math.PI / 2 + r.range(-0.1, 0.1), r.chance(0.35) ? 0x7a8a66 : 0xb8a684, 4.6, 5.6);
  { const P = [], gy = ground(0, -152);
    props.push({ s: [13, 0.9, 8], p: [0, gy + 0.45, -152.5], c: 0x6a5a50 });
    pagoda(P, 0, gy + 0.9, -152.5, 10.5, 6, 1, 0.9);
    props.push(...P); }
  for (const sx of [-1, 1]) { standard(sx * 7, -148.5, 1.3, mats.han, 10, [0, -120]); standard(sx * 21, -154, 1.1, mats.shu, 8.5, [0, -136]); standard(sx * 21, -123, 1.1, mats.shu, 8.5, [0, -136]); }
  for (const [x, z] of [[-6, -128], [6, -128], [-6, -143], [6, -143], [-15.5, -121.5], [15.5, -121.5]]) lamp(x, z, 0.6);
  for (let i = 0; i < 10; i++) {                                                 // crates stacked against the palisade
    const back = r.chance(0.4), x = back ? r.range(-22, 22) : (r.chance(0.5) ? -1 : 1) * 23.6, z = back ? -155.6 : r.range(-150, -124);
    const L = local(props, x, ground(x, z), z, r.range(0, 3));
    L(0, 0.45, 0, [0.9, 0.9, 0.9], shade(0x6e5038, r.range(0.8, 1.1))); L(0.3, 1.2, 0.1, [0.7, 0.6, 0.7], shade(0x5a4030, r.range(0.8, 1.1)));
  }
  // ---- 漢水渡口: reeds on the banks, the Shu supply train on the south side, wrecks and Wei standards to the north
  const reeds = [];
  for (let x = -104; x < 104; x += 0.8) for (const side of [-1, 1]) {        // clumps of 4-8 stalks, thinned at the crossings
    const inFord = FORDS.some(([a, b]) => x > a + 1 && x < b - 1);
    if (r.chance(inFord ? 0.85 : 0.2)) continue;
    const cx = x + r.range(-0.3, 0.3), cz = riverZ(x) + side * r.range(4.6, 8.4), lean = r.range(-0.2, 0.2);
    for (let k = 0, n = r.int(4, 8); k < n; k++) {
      const xx = cx + r.range(-0.35, 0.35), zz = cz + r.range(-0.35, 0.35), h = r.range(0.8, 1.6);
      reeds.push([xx, ground(xx, zz), zz, h, lean + r.range(-0.15, 0.15), r.range(-0.2, 0.2)]);
    }
  }
  for (const [x, z, yaw] of [[-38, -112, 0.4], [-33, -106, 0.2], [36, -110, -0.3], [31, -114, -0.5], [-24, -115, 1.2]]) cart(props, r, x, z, yaw);
  for (const [x, z, yaw] of [[-33, -64, 2.2], [32, -58, 0.8]]) cart(props, r, x, z, yaw, true);
  for (const [x, z] of [[-40, -115], [40, -115], [-12, -116], [12, -116]]) standard(x, z, 1.1, mats.shu);
  for (const [x, z] of [[-41, -52], [41, -54], [-22, -46], [22, -46]]) standard(x, z, 1.1, r.chance(0.2) ? mats.red : mats.wei);
  // ---- 山道: standards round the basin rim and along the climb, towers + archers on the cliffs over the chokepoint
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2, x = Math.sin(a) * 36.5, z = Math.cos(a) * 34.5;
    if (Math.abs(x) < 16 && Math.abs(z) > 28) continue;                        // keep the road mouths clear
    standard(x, z, r.range(1, 1.2), r.chance(0.15) ? mats.red : mats.wei);
  }
  // (none at the foot of the climb: the title key art stands there, its sky gap above the officers' heads kept clear)
  for (const [x, z] of [[-16, -42], [16, -42], [19, 47], [-4, 53], [12, 55], [-11, 72], [4, 74]]) standard(x, z, 1.05, mats.wei, 7.6);
  tower(-10.5, 60, 5.5, 1.3); tower(16, 57, 6, 1.35);
  const pass = barricade(scene, 2, 61, 0, 11);
  burn(-1, 61.5, 1.1, 'pass'); burn(6.5, 61, 1.0, 'pass');
  // ---- plaza before the wall: the siege line of standards, rubble at the wall foot (the castle adds ladders + fires)
  for (const [x, z, s] of [[-27, 79, 1.05], [2, 80, 1], [-27, 93, 1.1], [3, 91, 1.05]]) standard(x, z, s, mats.wei, 7.3 * s);
  for (let i = 0; i < 60; i++) {
    const x = r.range(-28, 4), s = r.range(0.3, 0.9);
    if (Math.abs(x - GATE_X) < 6) continue;
    props.push({ s: [s, s * r.range(0.5, 1), s], p: [x, CAMP_H + s * 0.35, WALL_Z - r.range(0.6, 3.5)], r: [r.range(-0.3, 0.3), r.range(0, 3), r.range(-0.3, 0.3)], c: shade(0x5e4e4c, r.range(0.75, 1.15)) });
  }
  // ---- 魏軍營寨 courtyard: palisade on the open sides (the ramp leaves through the north-west corner), tents beyond
  palisade(props, r, [[-43.5, 109.5], [-43.5, 135]]);
  palisade(props, r, [[-29.5, 141], [6.5, 141]]);
  for (let z = 113; z < 136; z += 7) tent(props, -52 + r.range(-2, 2), z, Math.PI / 2 + r.range(-0.2, 0.2), r.chance(0.5) ? 0x8a3025 : 0xb09a7c);
  for (let x = -22; x < 6; x += 8) tent(props, x + r.range(-1.5, 1.5), 148 + r.range(-1, 1), r.range(-0.2, 0.2), r.chance(0.5) ? 0x8a3025 : 0xb09a7c);
  for (const [x, z] of [[-39, 114], [2, 114], [-39, 136], [2, 136], [-14, 138]]) lamp(x, z, 0.6);
  for (const [x, z] of [[-41, 111.5], [-41, 138.5], [4, 138.5], [-20, 139]]) standard(x, z, 1.1, mats.wei, 8.5, [-18, 125]);
  for (let i = 0; i < 6; i++) {                                                  // spear racks against the north palisade
    const x = r.range(-26, 3), L = local(props, x, ground(x, 140), 140, 0);
    L(0, 0.9, 0, [2.2, 0.12, 0.12], 0x3a2618); L(0, 0.2, 0, [2.2, 0.12, 0.12], 0x3a2618);
    for (let k = 0; k < 6; k++) L(-0.9 + k * 0.36, 1.3, -0.1, [0.06, 2.6, 0.06], 0x4a3222, [-0.15, 0, 0]);
  }
  // the camp is lived in: supply piles along the palisades, shield racks, the officers' command table under two
  // standards, a war drum by the east wall, scorched earth (terrain.js) and the fallen (instanced below)
  for (const [x, z, yaw] of [[2.5, 113, Math.PI / 2], [2.5, 124, Math.PI / 2], [-40.5, 128, -Math.PI / 2], [-6, 138.6, Math.PI], [-26, 138.6, Math.PI]]) supplies(props, r, x, z, yaw, r.int(5, 7));
  for (const [x, z, yaw] of [[-41.2, 118, Math.PI / 2], [-41.2, 122.5, Math.PI / 2], [-14, 139.3, Math.PI], [3.4, 131, -Math.PI / 2]]) shieldRack(props, r, x, z, yaw);
  commandTable(props, -4, 130.5, 0.2);
  standard(-7.5, 134.5, 1.0, mats.xiahou, 7.5, [-4, 124]); standard(-0.5, 134.5, 1.0, mats.wei, 7.5, [-4, 124]);
  lamp(-2.2, 128.3, 0.55); lamp(-30, 116, 0.55);                                 // (the table + this brazier: a map CARVE)
  supplies(props, r, -33, 113, 0.1, 6); supplies(props, r, -16, 138.6, Math.PI, 6); supplies(props, r, 0.5, 138.6, Math.PI, 5);
  drum(props, 1.5, 119, -Math.PI / 2); drum(props, -24, 137.5, 0.15);
  // watchtowers on the camp shelf beyond the flank wall (the old concept view: the sun between the corner tower and them)
  tower(35, 114, 6.5, 1.5); tower(51, 125, 8, 1.55); tower(60, 103, 6, 1.45);
  // ---- ramp: torches on both sides, a flag at each bend, the summit barricade
  const rampPts = [[-30, 133], [-41, 145], [-45, 159], [-33, 171], [-17, 176.5], [-6, 180]];
  for (let i = 0; i < rampPts.length - 1; i++) {
    const [ax, az] = rampPts[i], [bx, bz] = rampPts[i + 1], L = Math.hypot(bx - ax, bz - az), nx = (bz - az) / L, nz = -(bx - ax) / L;
    for (let d = 3; d < L; d += 8) for (const sd of [-1, 1]) {
      const x = ax + (bx - ax) * d / L + nx * sd * 6.8, z = az + (bz - az) * d / L + nz * sd * 6.8;
      if (inAt(x, z) > -0.5 || inAt(x, z) < -3) continue;                     // on the verge, not in the rock
      fires.push(brazier(props, x, z, 0.45));
    }
    if (i) flag(ax + nx * 7.5, ground(ax, az), az + nz * 7.5, 3.4, mats.red);
  }
  const summitGate = barricade(scene, -20, 176, Math.PI / 2, 9);
  burn(-20, 172.5, 1.0, 'summit'); burn(-20.5, 179.5, 1.1, 'summit');
  // ---- 定軍山頂: 夏侯淵's pavilion on a stone platform, war drums, the great 夏侯 banner, the beacon, rim standards
  { const P = [], gy = ground(4, 209);
    props.push({ s: [17, 1.2, 11], p: [4, gy + 0.6, 209], c: 0x6a5a50 }, { s: [17.2, 0.1, 0.16], p: [4, gy + 1.2, 203.5], c: 0x9a8a78 });
    for (let k = 0; k < 3; k++) {                                              // stepped stair, pale worn nosing
      const top = 0.4 * (k + 1), d = 1.35 - k * 0.45, z = 203.5 - d / 2 - 0.01;
      props.push({ s: [6.2 - k * 0.2, top, d], p: [4, gy + top / 2, z - 0.001 * k], c: shade(0x5e4e46, 1 + k * 0.04) }, { s: [6.2 - k * 0.2, 0.06, 0.14], p: [4, gy + top, 203.5 - d + 0.07], c: 0x9a8a78 });
    }
    for (const [x0, x1] of [[-4.4, 0.8], [7.2, 12.4]]) {                     // red lacquer balustrade either side of the stair
      props.push({ s: [x1 - x0, 0.12, 0.12], p: [(x0 + x1) / 2, gy + 1.95, 203.35], c: 0x8a2a1c }, { s: [x1 - x0, 0.08, 0.08], p: [(x0 + x1) / 2, gy + 1.5, 203.35], c: 0x6a2016 });
      for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 4) props.push({ s: [0.18, 0.85, 0.18], p: [x, gy + 1.62, 203.35], c: 0x7a2418 }, { s: [0.24, 0.12, 0.24], p: [x, gy + 2.08, 203.35], c: 0xa07c34 });
    }
    for (const x of [0.2, 7.8]) {                                              // stone lanterns at the stair foot, a small flame inside
      const lz = 202.45;
      props.push({ s: [0.7, 0.3, 0.7], p: [x, gy + 0.15, lz], c: 0x6a5a50 }, { s: [0.3, 0.8, 0.3], p: [x, gy + 0.7, lz], c: 0x6a5a50 },
        { s: [0.62, 0.08, 0.62], p: [x, gy + 1.12, lz], c: 0x5a4c44 }, { s: [0.9, 0.16, 0.9], p: [x, gy + 1.62, lz], c: 0x5a4c44 }, { s: [0.3, 0.2, 0.3], p: [x, gy + 1.8, lz], c: 0x6a5a50 });
      for (const [dx, dz] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) props.push({ s: [0.1, 0.42, 0.1], p: [x + dx, gy + 1.35, lz + dz], c: 0x5a4c44 });
      fires.push([x, gy + 1.16, lz, 0.2, false]);
    }
    pagoda(P, 4, gy + 1.2, 209, 13, 8, 2, 1);
    props.push(...P);
    // paper lanterns under both eaves: self-lit, they carry the backlit facade (the sun sits straight behind it)
    for (const lx of [-4.6, -1.6, 1.6, 4.6]) paperLantern(glowBoxes, 4 + lx, gy + 4.05, 205.3, 1.15);
    for (const lx of [-2.6, 0, 2.6]) paperLantern(glowBoxes, 4 + lx, gy + 7.2, 206.4, 0.95);
    // war drums on the terrace either side of the stair, lit by the step braziers (on the stone: nobody walks there)
    drum(props, -2.5, 205.4, -Math.PI / 2 + 0.35, gy + 1.2); drum(props, 10.5, 205.4, Math.PI / 2 - 0.35, gy + 1.2); }   // side-on: frame to the lens
  { const x = -6, z = 213, gy = ground(x, z), P = 20;
    poles.push({ s: [0.4, P, 0.4], p: [x, gy + P / 2, z], c: 0x2e1d15 }, { s: [5.6, 0.3, 0.3], p: [x + 2.6, gy + P - 0.5, z], c: 0x2e1d15 }, { s: [0.3, 1.4, 0.3], p: [x, gy + P + 0.7, z], c: 0xc9a040 });
    addCloth(mats.xiahou, 5, 10, 'hang', x + 0.2, gy + P - 0.7, z, 0.1); }
  fires.push([15, beaconTower(props, r, 15, 215), 215, 3.2, true]);          // the beacon: its smoke marks the goal from the valley
  // braziers flanking the pavilion steps (they light its backlit front), supplies and shield racks by the pavilion,
  // a command table on the parade ground's edge, and a jagged crest of voxel crags round the back of the rim so the
  // summit reads as a mountain top against the sky
  // (the pavilion terrace is a map CARVE; nothing else stands on the walkable parade ground but thin standards)
  for (const [x, z] of [[-2.5, 203], [10.5, 203]]) lamp(x, z, 0.85);
  for (let i = 0; i < 34; i++) {
    const a = -2.0 + (i / 33) * 4.0 + r.range(-0.04, 0.04), rr = r.range(27.5, 32), x = 2 + Math.sin(a) * rr, z = 194 + Math.cos(a) * rr;
    if (inAt(x, z) > -1.5 || Math.hypot(x + 6, z - 227) < 9 || Math.hypot(x - 20, z - 229) < 9) continue;
    const gy = topAt(x, z), h = r.range(2, 6.5), w = r.range(1.6, 3.2);
    props.push({ s: [w, h, w * r.range(0.7, 1.2)], p: [x, gy + h / 2 - 0.3, z], r: [r.range(-0.12, 0.12), r.range(0, 3), r.range(-0.12, 0.12)], c: shade(0x6a5448, r.range(0.75, 1.05)) });
    props.push({ s: [w * 0.55, h * 0.5, w * 0.55], p: [x + r.range(-0.4, 0.4), gy + h * 1.1 - 0.4, z + r.range(-0.4, 0.4)], r: [r.range(-0.2, 0.2), r.range(0, 3), r.range(-0.2, 0.2)], c: shade(0x76604f, r.range(0.8, 1.05)) });
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.3, x = 2 + Math.sin(a) * 23.5, z = 194 + Math.cos(a) * 23.5;
    if (Math.hypot(x + 10, z - 178) < 10) continue;                            // the ramp's arrival
    standard(x, z, 1.15, r.chance(0.3) ? mats.red : mats.wei, 8.5, [2, 194]);
  }
  palisade(props, r, [[-16, 214], [-6, 219.5], [10, 220], [22, 212]]);
  for (const [x, z] of [[-8, 196], [14, 194], [0, 186]]) lamp(x, z, 0.7);

  // ---- burning wrecks on the field (scorch marks: terrain.js)
  for (const [x, z, s] of fieldFires) {
    burn(x, z, s);
    const yaw = r.range(0, 3), gy = ground(x, z);
    props.push({ s: [1.6 * s, 0.14, 2.6 * s], p: [x + 0.4, gy + 0.55, z], r: [0.35, yaw, 0.2], c: 0x2a1a10 });
    for (const o of [-1, 1]) props.push({ s: [0.16, 1.1 * s, 1.1 * s], p: [x + Math.cos(yaw) * o * 0.9 * s, gy + 0.5 * s, z - Math.sin(yaw) * o * 0.9 * s], r: [0, yaw, 0.4 * o], c: 0x241610 });
  }
  // arrow volleys stuck in the ground, all low so nothing blocks the fight
  for (let c = 0; c < 40; c++) {
    const cx = r.range(-40, 40), cz = r.range(-115, 200);
    if (inAt(cx, cz) < 2 || routeDist(cx, cz) < 2) continue;
    const tilt = r.range(0.2, 0.5), dir = r.range(-0.4, 0.4) + 2.5;
    for (let k = 0, n = r.int(5, 12); k < n; k++) {
      const x = cx + r.range(-1.6, 1.6), z = cz + r.range(-1.6, 1.6), gy = ground(x, z);
      props.push({ s: [0.035, 0.85, 0.035], p: [x, gy + 0.3, z], r: [tilt, dir, 0], c: 0x4a3524 }, { s: [0.09, 0.14, 0.02], p: [x + Math.sin(dir) * Math.sin(tilt) * 0.4, gy + 0.3 + Math.cos(tilt) * 0.4, z + Math.cos(dir) * Math.sin(tilt) * 0.4], r: [tilt, dir, 0], c: 0xd8cfc0 });
    }
  }

  // the fallen: dropped shields (red 魏 / sand 蜀 rims), broken spears and helmets flat in the dirt, never upright
  for (let c = 0, n = 0; c < 400 && n < 120; c++) {
    const x = r.range(-44, 44), z = r.range(-118, 215);
    if (inAt(x, z) < 1 || routeDist(x, z) < 1.5 || Math.abs(z - riverZ(x)) < 5.5) continue;
    n++;
    const gy = ground(x, z), yaw = r.range(0, 6.28), L = local(props, x, gy, z, yaw), kind = r.int(0, 2);
    if (kind === 0) {
      const face = r.chance(0.6) ? 0x6e2418 : 0x9a8058;
      L(0, 0.05, 0, [0.9, 0.08, 0.7], shade(face, r.range(0.8, 1.05)), [r.range(-0.2, 0.2), 0, r.range(-0.1, 0.1)]);
      L(0, 0.05, 0, [0.7, 0.085, 0.9], shade(face, r.range(0.8, 1.05)), [r.range(-0.2, 0.2), 0, r.range(-0.1, 0.1)]);
      L(0, 0.1, 0, [0.2, 0.06, 0.2], 0x8a7a50);                                // boss
    } else if (kind === 1) {
      const len = r.range(1.2, 2.6);
      L(0, 0.05, 0, [0.06, 0.06, len], 0x6b4a2e, [0, 0, 0]);                                  // sun-bleached shaft, not a black bar
      L(0, 0.05, len / 2 + 0.12, [0.1, 0.04, 0.26], 0xa8adb2);                 // spearhead catches the sun
    } else L(0, 0.14, 0, [0.34, 0.26, 0.38], shade(0x3a3434, r.range(0.8, 1.2)), [r.range(-0.6, 0.6), 0, r.range(-0.6, 0.6)]);
  }
  // torch posts just outside the walk edge along the ford and the pass: small flames lining the route into the dusk
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const [ax, az] = ROUTE[i], [bx, bz] = ROUTE[i + 1];
    if (az > 70 || az < -118) continue;
    const len = Math.hypot(bx - ax, bz - az), nx = (bz - az) / len, nz = -(bx - ax) / len;
    for (let d = 4; d < len; d += 13) for (const sd of [-1, 1]) {
      for (let off = 4; off < 60; off += 1) {                                    // walk outward to the edge
        const x = ax + (bx - ax) * d / len + nx * sd * off, z = az + (bz - az) * d / len + nz * sd * off, f = inAt(x, z);
        if (f > -0.6) continue;
        if (f > -2.5 && Math.abs(z - riverZ(x)) > 7) {
          const gy = topAt(x, z);
          props.push({ s: [0.18, 2.6, 0.18], p: [x, gy + 1.3, z], c: 0x3a2618 }, { s: [0.5, 0.3, 0.5], p: [x, gy + 2.7, z], c: 0x2a2624 });
          fires.push([x, gy + 2.85, z, 0.4, false]);
        }
        break;
      }
    }
  }

  // ---- the castle's banners (castle frame → + CAMP_H): 夏侯 drape beside the gate, red flags along the wall walk
  const wy = CAMP_H + castle.H;
  addCloth(mats.xiahou, 6, 9.5, 'drape', GATE_X - 18 + 3, wy - 0.3, WALL_Z - 0.35, Math.PI);   // faces the plaza (-Z)
  poles.push({ s: [7.1, 0.35, 0.35], p: [GATE_X - 18, wy - 0.15, WALL_Z - 0.4], c: 0x3b2a1e });
  for (let x = castle.x0 + 4; x < castle.x1 - 4; x += 16) if (Math.abs(x - GATE_X) > 12) flag(x + r.range(-2, 2), wy, WALL_Z + 0.8, 3.2, mats.red);
  flag(GATE_X - 7, wy + 0.6, WALL_Z + 1, 9, mats.red);
  flag(GATE_X + 7, wy + 0.6, WALL_Z + 1, 9, mats.red);
  flag(castle.cornerX + 4, CAMP_H + castle.towerH, WALL_Z - 0.5, 4, mats.red);

  // ---- reserve armies off the walkable ground (instanced, idle bob): 蜀 behind the 本陣 and on the ford hills, 魏 on
  // the camp shelf, archers lining the cliffs over the chokepoint, a guard on the summit's back shoulder. One instanced
  // mesh per formation, so the renderer frustum-culls each block (one mesh spanning the map was always drawn, twice)
  const troops = [];                                 // [side, [{ x, y, z, yaw, ph }]]
  const formation = (side, cx, cz, face, cols, rows, gap = 1.3) => {
    const list = []; troops.push([side, list]);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const lx = (i - cols / 2) * gap + r.range(-0.2, 0.2), lz = (j - rows / 2) * 1.4 + r.range(-0.2, 0.2);
      const x = cx + lx * Math.cos(face) + lz * Math.sin(face), z = cz - lx * Math.sin(face) + lz * Math.cos(face);
      if (inAt(x, z) > -2) continue;                                            // never on ground the fight can reach
      list.push({ x, y: topAt(x, z), z, yaw: face + r.range(-0.2, 0.2), ph: r.range(0, 6.28) });
    }
    if (r.chance(0.6)) standard(cx, cz, r.range(1.0, 1.3), side === 'shu' ? mats.shu : mats.wei, undefined, [cx + Math.sin(face) * 9, cz + Math.cos(face) * 9]);
  };
  for (const [x, z, f] of [[-32, -170, 0], [0, -171, 0], [32, -170, 0], [-58, -138, 0.9], [58, -136, -0.9], [-60, -100, 1.3], [60, -96, -1.3]]) formation('shu', x, z, f, r.int(10, 16), r.int(5, 8));
  for (const [x, z, f] of [[30, 124, -1.4], [44, 136, -1.6], [42, 106, -1.2], [60, 118, -1.5], [-58, 124, 1.5], [-6, 227, Math.PI], [20, 229, Math.PI]]) formation('wei', x, z, f, r.int(9, 14), r.int(4, 7));
  const rims = [[], []];
  troops.push(['wei', rims[0]], ['wei', rims[1]]);
  for (let z = 44; z < 78; z += 1.6) for (const x of [-15 - (z - 44) * 0.1, 21 - (z - 44) * 0.15]) {   // archers on both rims, facing into the pass
    const ax = x + r.range(-1.2, 1.2);
    if (inAt(ax, z) > -3) continue;
    rims[x < 0 ? 0 : 1].push({ x: ax, y: topAt(ax, z), z, yaw: (x < 0 ? Math.PI / 2 : -Math.PI / 2) + r.range(-0.3, 0.3), ph: r.range(0, 6.28) });
  }
  const figGeo = { shu: figureGeometry(0x3c7a3a, 0x3a3428), wei: figureGeometry() }, armyMat = lit();
  // the fallen: bodies sprawled in the courtyard, the plaza, on the summit and around the field wrecks (one instanced
  // mesh; laid flat, never an obstacle to the eye)
  { const spots = [], zones = [[-40, 3, 112, 138, 16], [-27, 3, 78, 95, 8], [-20, 24, 180, 210, 14], [-40, 40, -110, 60, 22]];
    for (const [x0, x1, z0, z1, n] of zones) for (let k = 0, c = 0; k < 200 && c < n; k++) {
      const x = r.range(x0, x1), z = r.range(z0, z1);
      if (inAt(x, z) < 1 || routeDist(x, z) < 2 || Math.abs(z - riverZ(x)) < 6) continue;
      c++; spots.push([x, z, r.range(0, 6.28), r.chance(0.5) ? -1 : 1]);
    }
    const dead = new THREE.InstancedMesh(fallenGeometry(), armyMat, spots.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    spots.forEach(([x, z, yaw], i) => dead.setMatrixAt(i, m.compose(p.set(x, topAt(x, z) - 0.02, z), q.setFromEuler(e.set(r.range(-0.06, 0.06), yaw, r.range(-0.08, 0.08))), one)));
    dead.receiveShadow = true; dead.name = 'fallen';
    scene.add(dead); }
  const armies = troops.filter(([, list]) => list.length).map(([k, list]) => {
    const m = new THREE.InstancedMesh(figGeo[k], armyMat, list.length);
    m.name = 'reserve-' + k; scene.add(m);
    return [m, list];
  });
  const am = new THREE.Matrix4(), aq = new THREE.Quaternion(), ap = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
  const poseArmy = (t) => {
    for (const [m, list] of armies) {
      for (let i = 0; i < list.length; i++) { const s = list[i]; m.setMatrixAt(i, am.compose(ap.set(s.x, s.y + Math.max(0, Math.sin(t * 2.2 + s.ph)) * 0.06, s.z), aq.setFromAxisAngle(up, s.yaw), one)); }
      m.instanceMatrix.needsUpdate = true;
    }
  };
  poseArmy(0);
  for (const [m] of armies) { m.computeBoundingSphere(); m.boundingSphere.radius += 2; }   // + the figure's height and bob

  // reeds (instanced, static): tapered straw-gold stalks with a brown seed head, lit like the grass cards (normal pinned
  // up: never a black backlit stake) with a gold glow toward the low sun; swaying a little. Stalks near the lens or on
  // the hero line duck to 30 % and thin out (nothing hides the fight, the tufts' rule)
  const reedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  reedMat.onBeforeCompile = (sh) => {
    sh.uniforms.uFocus = FOCUS; sh.uniforms.uTime = GRASS_TIME; sh.uniforms.uSunW = { value: SUN_DIR };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform vec3 uFocus; uniform float uTime; varying float vReedY;').replace('#include <begin_vertex>', `#include <begin_vertex>
      vec2 rA = cameraPosition.xz, rD = uFocus.xz - rA, rP = instanceMatrix[3].xz;
      float rT = dot(rP - rA, rD) / max(dot(rD, rD), 1e-4);
      float rClear = rT > 1.0 ? 1.0 : smoothstep(1.4, 3.0, distance(rP, rA + rD * max(rT, 0.0)));
      rClear = min(rClear, smoothstep(2.0, 5.0, distance(rP, rA)));
      vReedY = transformed.y + 0.5;
      transformed.y = vReedY * mix(0.3, 1.0, rClear) - 0.5;
      transformed.xz *= mix(0.4, 1.0, rClear);
      transformed.xz += vec2(0.75, 0.55) * (sin(uTime * 1.7 + rP.x * 0.4 + rP.y * 0.3) * 0.5 + 0.5) * 2.2 * vReedY * vReedY;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uSunW; varying float vReedY;')
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float rBack = pow(max(dot(normalize(-vViewPosition), normalize((viewMatrix * vec4(uSunW, 0.0)).xyz)), 0.0), 3.0);
        totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.55, 0.2) * (0.03 + 0.2 * rBack * vReedY);`);
  };
  // unit stalk (y -0.5 … 0.5): three tapering sections, then a slim seed head
  const reedGeo = boxesGeometry([
    { s: [1, 0.5, 1], p: [0, -0.25, 0], c: 0x9a8454, skip: [3] }, { s: [0.55, 0.4, 0.55], p: [0, 0.2, 0], c: 0xb09662, skip: [3] },
    { s: [1.15, 0.13, 1.15], p: [0, 0.455, 0], c: 0x5e3e22, skip: [3] },
  ]);
  const reedM = new THREE.InstancedMesh(reedGeo, reedMat, reeds.length);
  { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
    reeds.forEach(([x, y, z, h, tx, tz], i) => {
      reedM.setMatrixAt(i, m.compose(p.set(x, y + h / 2 - 0.1, z), q.setFromEuler(e.set(tx, 0, tz)), s.set(0.055, h, 0.055)));
      reedM.setColorAt(i, c.set(r.chance(0.7) ? 0xffffff : 0xc8d0a0).multiplyScalar(r.range(0.8, 1.05)));   // straw gold, a few still green
    }); }
  reedM.name = 'reeds';
  scene.add(reedM);

  // fallen standards lying in the dirt (flat, never occlude)
  const fallenTex = bannerTexture('魏', { bg: '#a0583c', fg: '#4a2418', border: '#7a3a26', seed: 11 });   // trampled, sun-faded, dusty
  const fallenMat = new THREE.MeshStandardMaterial({ map: fallenTex, emissiveMap: fallenTex, emissive: 0xffffff, emissiveIntensity: 0.12, side: THREE.DoubleSide, alphaTest: 0.5, roughness: 0.95 });
  for (let i = 0, n = 0; i < 60 && n < 10; i++) {
    const x = r.range(-40, 40), z = r.range(-110, 200), yaw = r.range(0, 6.28);
    if (inAt(x, z) < 3 || routeDist(x, z) < 6) continue;             // off the road: a 4 m orange slab by the spawn filled the frame
    n++;
    const gy = ground(x, z), c = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 4.3, 3, 4), fallenMat);
    c.rotation.set(-Math.PI / 2, 0, yaw); c.position.set(x, gy + 0.06, z); c.receiveShadow = true;
    scene.add(c);
    poles.push({ s: [0.2, 0.2, 6], p: [x + Math.cos(yaw) * 1.6, gy + 0.12, z - Math.sin(yaw) * 1.6], r: [0, yaw + 0.15, 0], c: 0x3b2a1e });
  }
  // drifting dust banks (soft sprites): the wall foot, the ford, the basin — backlit haze in the middle distance
  const dc = document.createElement('canvas'); dc.width = dc.height = 64;
  const dg = dc.getContext('2d'), grd = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.5, 'rgba(255,255,255,0.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  dg.fillStyle = grd; dg.fillRect(0, 0, 64, 64);
  const dustTex = new THREE.CanvasTexture(dc);
  const dusts = [];
  for (let i = 0; i < 34; i++) {
    const wall = i < 8, x = wall ? r.range(-40, 10) : r.range(-50, 50), z = wall ? WALL_Z - r.range(3, 12) : r.range(-120, 40);
    // wall-foot banks kept thin: the stone coursing, ladders and banners must read through them
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTex, color: wall ? 0xc89c80 : 0xb08c7c, transparent: true, opacity: wall ? r.range(0.035, 0.07) : r.range(0.06, 0.13), depthWrite: false }));
    const w = r.range(14, 26);
    sp.scale.set(w, w * r.range(0.3, 0.45), 1);
    sp.position.set(x, topAt(x, z) + w * 0.12, z);
    sp.userData = { x, ph: r.range(0, 6.28), sp: r.range(0.2, 0.5) };
    scene.add(sp); dusts.push(sp);
  }

  const glowMesh = new THREE.Mesh(boxesGeometry(glowBoxes), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(4, 4, 4) }));
  glowMesh.name = 'paper-lanterns';
  scene.add(glowMesh);
  const poleMesh = new THREE.Mesh(boxesGeometry(poles.concat(props)), lensClear(lit(), 2.5));
  poleMesh.castShadow = true; poleMesh.receiveShadow = true;
  scene.add(poleMesh);

  // fires: castle braziers / burning debris (castle frame → + CAMP_H), field wrecks, braziers, barricades, the beacon
  for (const [x, y, z, s] of castle.fires) { fires.push([x, y + CAMP_H, z, s, undefined, null, WALL_Z - z < 4]); if (y < 1) embers.push([x, z]); }
  // under each flame: two charred logs (lit) on a bed of self-lit coals — scattered small voxels from glowing orange to
  // dull red to black ash, never one flat orange slab
  const logs = [], coals = [], cr = makeRng(91), COALS = [0xff8a30, 0xe0561c, 0xa8300f, 0x5a180a, 0x1e0e08];
  for (const [x, y, z, s, , g] of fires) {
    if (g) continue;                                                            // barricade fires burn on the wreck itself
    logs.push({ s: [1.8 * s, 0.32 * s, 0.32 * s], p: [x, y + 0.16 * s, z], r: [0, 0.5, 0], c: 0x241510 }, { s: [1.8 * s, 0.32 * s, 0.32 * s], p: [x, y + 0.36 * s, z], r: [0, -0.7, 0], c: 0x2e1c10 });
    for (let k = 0; k < 9; k++) {
      const q = cr.range(0.07, 0.16) * s, a = cr.range(0, 6.28), d = Math.sqrt(cr.next()) * 0.42 * s;
      coals.push({ s: [q, q * 0.7, q], p: [x + Math.cos(a) * d, y + q * 0.3, z + Math.sin(a) * d], r: [0, cr.range(0, 3), 0], c: COALS[Math.min(4, Math.floor(d / (0.42 * s) * 3 + cr.next() * 2))] });
    }
  }
  scene.add(new THREE.Mesh(boxesGeometry(logs), lit()));
  const coalMesh = new THREE.Mesh(boxesGeometry(coals), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.5, 1.5, 1.5) }));
  coalMesh.name = 'coals';
  scene.add(coalMesh);
  // far-off burning 60-140 m off the route: warm points of fire in the hazy band — a battlefield ablaze to the horizon
  const farFires = [[-72, -96], [70, -62], [-78, 28], [72, 148], [-74, 172], [40, 236], [-86, -150]].map(([x, z]) => [x, topAt(x, z), z, 3.2]);
  const updateFire = fireSystem(scene, fires.concat(farFires));
  // world.fires contract (vfx embers): ground-level fires near the fight; position y = 0 (vfx adds ground())
  const emberSpots = embers.map(([x, z]) => ({ position: new THREE.Vector3(x, 0, z) }));

  return {
    fires: emberSpots,
    /** Barricade meshes by gate id: { m, mat, y } (world.js collapses + chars them as the gate opens). */
    gates: { pass, summit: summitGate },
    update(t, focus) {
      FOCUS.value.copy(focus);
      for (const c of cloths) animateCloth(c, t);
      updateFire(t);
      poseArmy(t);
      for (const d of dusts) d.position.x = d.userData.x + Math.sin(t * 0.05 * d.userData.sp + d.userData.ph) * 4 + WIND.x * 3.2 * Math.sin(t * 0.021 * d.userData.sp + d.userData.ph * 1.7);
    },
  };
}
