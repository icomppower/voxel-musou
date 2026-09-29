// Guan Yu's Musou presentation (render-only; reads game.musou / hero state, never writes sim state). Same structure as
// Zhao Yun's (src/musou/view.js), in jade and gold instead of ice:
//  · grade (DOM layers, overlay.js): a jade-night dim through the activation and the cut-in, lifting as the whirl starts;
//    a 2-frame screen-blended wash at the whirl's first hit and at the cleave; radial rays erupting from the cut
//  · the crescent moon: light voxels in a reclining crescent (偃月) rising behind his head in the cut-in
//  · the whirl: a disc of streaking light voxels at blade radius turning with the glaive, vortex motes spiralling in
//  · the sky crescent: the same crescent, 16 m wide, standing in the plane of his facing, falling out of the sky with the
//    leap and landing edge-first on the cleave line (shatters into shards), then a glowing cut along the line
//  · the crescent wave: a band of light voxels on the ground riding the sim's wave radius across its sector
//  · calligraphy cut-in (無雙 + 武聖 關雲長 + a red 美髯 seal)
import * as THREE from 'three';
import { on } from '../../core/events.js';
import { vrng, hash01 } from '../../core/rng.js';
import { GY_MUSOU as M } from './musou.js';
import { createOverlay, ramp } from '../../musou/overlay.js';
import { makePool } from '../../vfx/vfx.js';
import { ground } from '../../world/map.js';

const { clamp } = THREE.MathUtils;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _v = new THREE.Vector3();
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _c = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), UP = new THREE.Vector3(0, 1, 0);
const JADE = [0.35, 1.25, 0.78], GOLD = [1.5, 1.12, 0.42], PALE = [0.9, 1.5, 1.1];

/** Crescent cells in [-1, 1]² (y up): inside the outer disc, outside an inner disc shifted up, so the horns point up
 *  (a reclining moon; turned on its side it is also the blade's edge). rim = on the outer edge (gold). */
function crescentCells(N = 30) {
  const cells = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N * 2 - 1, y = (j + 0.5) / N * 2 - 1, r = Math.hypot(x, y), ri = Math.hypot(x, y - 0.42);
    if (r > 1 || ri < 0.86) continue;
    cells.push({ x, y, rim: r > 0.9 || ri < 0.93 });
  }
  return cells;
}
const CELLS = crescentCells();

export function createMusouView(parent, game, camera) {
  const mu = game.musou, hero = game.hero;
  const scene = new THREE.Group();
  parent.add(scene);
  const addMat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: true, fog: false });

  // ---- rays quad (as Zhao Yun's: fullscreen, depth-tested, so launched bodies cut out against the light)
  const rayU = { uC: { value: new THREE.Vector2(0.5, 0.5) }, uRays: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 16 / 9 }, uDepth: { value: -1 },
    uCol: { value: new THREE.Color(0.7, 1.3, 0.8) } };
  const rayGeo = new THREE.BufferGeometry();
  rayGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const rays = new THREE.Mesh(rayGeo, new THREE.ShaderMaterial({ uniforms: rayU, depthWrite: false, transparent: true, fog: false, blending: THREE.AdditiveBlending,
    vertexShader: 'uniform float uDepth; varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, uDepth, 1.0); }',
    fragmentShader: `
    uniform vec2 uC; uniform float uRays, uTime, uAspect; uniform vec3 uCol; varying vec2 vUv;
    void main() {
      vec2 p = vUv - uC; p.x *= uAspect;
      float r = length(p), a = atan(p.y, p.x + 1e-5);
      float ray = pow(max(0.0, 0.5 + 0.5 * sin(a * 17.0 + uTime * 0.8)), 6.0) + 0.7 * pow(max(0.0, 0.5 + 0.5 * sin(a * 29.0 - uTime * 1.4 + 1.1)), 9.0);
      float core = exp(-r * r * 50.0);
      gl_FragColor = vec4(uCol * uRays * (ray * smoothstep(0.05, 0.3, r) * (1.0 - 0.45 * clamp(r, 0.0, 1.0)) + core * 0.8), 1.0);
    }` }));
  rays.frustumCulled = false; rays.renderOrder = 1e6 + 1; rays.visible = false;
  scene.add(rays);

  const ov = createOverlay({ sub: '武聖 關雲長', seal: '美髯', css: {
    big: 'color: #f6f2e2; text-shadow: 0 0 2px #0a140e, 6px 8px 0 rgba(6,14,9,.55), 0 0 28px rgba(110,240,170,.5);',
    sub: 'color: #eed9a0; text-shadow: 0 0 10px rgba(80,220,140,.7), 2px 2px 0 rgba(0,0,0,.6);' } });
  const { dim: dimEl, wash: washEl, setStyle, show } = ov;

  // ---- light voxels: moon | whirl disc | vortex motes | sky crescent | cut line | wave band
  const NC = CELLS.length, NW = 72, NV = 140, NL = 64, NB = 150;
  const O = { moon: 0, whirl: NC, motes: NC + NW, sky: NC + NW + NV, line: 2 * NC + NW + NV, wave: 2 * NC + NW + NV + NL };
  const TOTAL = O.wave + NB;
  const fx = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), addMat(), TOTAL);
  fx.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  fx.frustumCulled = false; fx.visible = false;
  for (let i = 0; i < TOTAL; i++) { fx.setMatrixAt(i, ZERO); fx.setColorAt(i, _c.setRGB(1, 1, 1)); }
  scene.add(fx);
  const put = (i, x, y, z, sx, sy, sz, rgb, k, q = _q.identity()) => {
    if (k <= 0.002) { fx.setMatrixAt(i, ZERO); return; }
    fx.setMatrixAt(i, _m.compose(_p.set(x, y, z), q, _s.set(sx, sy, sz)));
    fx.setColorAt(i, _c.setRGB(rgb[0] * k, rgb[1] * k, rgb[2] * k));
  };
  const clearRange = (a, n) => { for (let i = a; i < a + n; i++) fx.setMatrixAt(i, ZERO); };

  // ---- shards (vfx.js pool): the crescent shattering, KOs, the whirl's sparks
  const shards = makePool(parent, 600, addMat(), () => game.frame, { drag: 2.2, shrink: 2.5, near: (p) => ramp(p.distanceTo(camera.position), 4, 8) });
  const shard = (x, y, z, vx, vy, vz, life, size, rgb) => shards.spawn(x, y, z, vx, vy, vz, life, size, 4, rgb[0], rgb[1], rgb[2]);

  const glow = new THREE.PointLight(0x8dffc0, 0, 22, 1.4);
  scene.add(glow);

  // ---- events
  let tv = -1, time = 0, whirlF = -99, cleaveF = -99, cutX = 0, cutZ = 0;
  on('musou:start', () => { tv = 0; });
  on('musou:hit', (e) => {
    if (e.stage === 'contact') whirlF = game.frame;
    if (e.stage === 'rush') for (let i = 0; i < 6; i++) {
      const a = vrng.range(0, 6.283);
      shard(e.x + Math.sin(a) * 2.2, 1.1 + vrng.range(-0.3, 0.3), e.z + Math.cos(a) * 2.2, Math.cos(a) * 3, vrng.range(0.5, 2), -Math.sin(a) * 3, vrng.range(0.25, 0.5), vrng.range(0.05, 0.1), JADE);
    }
  });
  on('musou:burst', (e) => {
    cleaveF = game.frame; cutX = e.x; cutZ = e.z;
    // the sky crescent shatters along the line
    const fx0 = Math.sin(mu.cyaw), fz0 = Math.cos(mu.cyaw);
    for (let i = 0; i < 70; i++) {
      const d = vrng.range(0, 16), s = vrng.range(-1, 1);
      shard(mu.cx + fx0 * d + fz0 * s, vrng.range(0.3, 3), mu.cz + fz0 * d - fx0 * s, fz0 * s * 4 + vrng.range(-1, 1), vrng.range(2, 8), -fx0 * s * 4 + vrng.range(-1, 1),
        vrng.range(0.4, 0.9), vrng.range(0.08, 0.16), vrng.chance(0.3) ? GOLD : JADE);
    }
  });
  on('ko', (e) => { if (mu.active) shard(e.x, e.y, e.z, e.dx * 5 + vrng.range(-2, 2), vrng.range(2, 6), e.dz * 5 + vrng.range(-2, 2), vrng.range(0.3, 0.5), vrng.range(0.05, 0.08), JADE); });
  on('scenario', () => { tv = -1; shards.clear(); });

  function hideAll() { fx.visible = rays.visible = false; glow.intensity = 0; ov.hide(); }

  /** A crescent of NC voxels at centre c in the plane (ax, ay), `w` wide, brightness k; skip = fraction of cells lit. */
  function crescent(o, cx, cy, cz, ax, ay, w, k, lit = 1, cell = 1.08) {
    const cs = w / 30 * cell;
    _q.setFromRotationMatrix(_m.makeBasis(ax, ay, _z.crossVectors(ax, ay)));
    for (let i = 0; i < NC; i++) {
      const c = CELLS[i], on = hash01(i, 3, 7) < lit;
      const x = cx + ax.x * c.x * w / 2 + ay.x * c.y * w / 2, y = cy + ax.y * c.x * w / 2 + ay.y * c.y * w / 2, z = cz + ax.z * c.x * w / 2 + ay.z * c.y * w / 2;
      const fl = 0.8 + 0.2 * Math.sin(time * 9 + i * 1.7);
      put(o + i, x, y, z, cs, cs, cs * 0.6, c.rim ? GOLD : JADE, on ? k * fl * (c.rim ? 1 : 0.7) : 0, _q);
    }
  }

  function updateFx(t) {
    const h = hero, fwd = _v.set(Math.sin(mu.cyaw), 0, Math.cos(mu.cyaw));
    // moon behind his head through the cut-in (billboard to the lens, just behind him)
    const km = ramp(t, M.closeup - 2, M.closeup + 10) * (1 - ramp(t, M.pullback, M.whirl + 4));
    if (km > 0) {
      camera.getWorldDirection(_z);
      _x.crossVectors(_z, UP).normalize(); _y.crossVectors(_x, _z).normalize();
      // small and high, a gold-rimmed crescent over the back of his head (r1: 1.9 m at head height boxed his face in)
      const rise = 0.35 * (1 - ramp(t, M.closeup, M.closeup + 30));
      crescent(O.moon, h.x + _z.x * 1.3, h.y + 2.3 - rise, h.z + _z.z * 1.3, _x, _y, 1.25, km * 0.6, ramp(t, M.closeup, M.closeup + 18));
    } else clearRange(O.moon, NC);
    // whirl disc + vortex motes
    const kw = ramp(t, M.whirl - 2, M.whirl + 4) * (1 - ramp(t, M.windup - 2, M.windup + 6));
    if (kw > 0) {
      const a0 = mu.spin * 6.283;
      for (let i = 0; i < NW; i++) {
        const u = i / NW, a = a0 - u * 2.6, r = 1.4 + 0.9 * hash01(i, 1, 2), fade = (1 - u) * (1 - u);
        _q.setFromAxisAngle(UP, a);
        put(O.whirl + i, h.x + Math.sin(a) * r, 1.05 + (hash01(i, 4, 2) - 0.5) * 0.25, h.z + Math.cos(a) * r, 0.5, 0.05, 0.08, i % 5 ? JADE : GOLD, kw * fade * 0.9, _q);
      }
      for (let i = 0; i < NV; i++) {
        const ph = (time * (0.35 + 0.3 * hash01(i, 9, 1)) + hash01(i, 5, 5)) % 1, r = 7 * (1 - ph) + 1.2, a = -time * 2.2 * (1 + ph) + i * 2.4;
        put(O.motes + i, h.x + Math.sin(a) * r, 0.2 + ph * 2.8, h.z + Math.cos(a) * r, 0.07, 0.07, 0.07, i % 4 ? JADE : PALE, kw * Math.sin(ph * Math.PI) * 0.8);
      }
    } else { clearRange(O.whirl, NW); clearRange(O.motes, NV); }
    // the sky crescent: appears at the wind-up high over the line, falls with the leap, lands on the cleave, gone in 20 sf
    const ks = ramp(t, M.windup, M.windup + 6) * (1 - ramp(t, M.cleave + 1, M.cleave + 20));
    if (ks > 0) {
      // (r1: it hung at 22 m, above every Musou lens: now it looms at 11 m over his line, then drops with the plunge)
      const u = ramp(t, M.windup, M.cleave), drop = u < 0.5 ? 0 : ((u - 0.5) / 0.5) ** 2.2;
      const cy = 11 - 8.5 * drop, sp = t >= M.cleave ? 1 + 0.35 * ramp(t, M.cleave, M.cleave + 20) : 1;
      _x.copy(fwd); _y.copy(UP);
      crescent(O.sky, mu.cx + fwd.x * 6, cy + (t >= M.cleave ? -1.2 * ramp(t, M.cleave, M.cleave + 20) : 0), mu.cz + fwd.z * 6, _x, _y, 16 * sp, ks * (t >= M.cleave ? 1.3 : 1), 1, 1.12);
    } else clearRange(O.sky, NC);
    // the cut: a glowing seam along the line
    const kl = ramp(t, M.cleave, M.cleave + 2) * (1 - ramp(t, M.cleave + 18, M.end + 20));
    if (kl > 0) {
      _q.setFromAxisAngle(UP, mu.cyaw);
      for (let i = 0; i < NL; i++) {
        const d = 0.8 + i / NL * 15.5, j = (hash01(i, 7, 3) - 0.5) * 0.5;
        put(O.line + i, mu.cx + fwd.x * d + fwd.z * j, 0.06, mu.cz + fwd.z * d - fwd.x * j, 0.34, 0.1, 0.3, i % 3 ? GOLD : PALE, kl * (0.7 + 0.3 * Math.sin(time * 14 + i)), _q);
      }
    } else clearRange(O.line, NL);
    // crescent wave band on the sim's radius
    const kb = mu.active && t >= M.cleave && mu.waveR > 0 ? 1 - ramp(t, M.cleave + M.waveFrames - 4, M.cleave + M.waveFrames + 10) : 0;
    if (kb > 0) {
      const half = M.waveAng / 2 * Math.PI / 180;
      for (let i = 0; i < NB; i++) {
        const u = i / (NB - 1), a = mu.cyaw - half + 2 * half * u, horn = 1 - Math.abs(2 * u - 1), r = mu.waveR - 0.6 * hash01(i, 2, 9);
        _q.setFromAxisAngle(UP, a);
        put(O.wave + i, mu.cx + Math.sin(a) * r, 0.1 + 0.5 * horn * hash01(i, 8, 8), mu.cz + Math.cos(a) * r, 0.5, 0.18 + 0.5 * horn, 0.12, i % 4 ? JADE : GOLD, kb * (0.4 + 0.6 * horn), _q);
      }
    } else clearRange(O.wave, NB);
    fx.instanceMatrix.needsUpdate = true; fx.instanceColor.needsUpdate = true;
  }

  function updateGrade(t) {
    // jade-night dim centred on him, from the press until the whirl starts (as Zhao Yun's: flash on the cut frame only)
    const dim = (t < 1 ? 0.9 : 1) * (1 - ramp(t, M.pullback, M.whirl + 2));
    const mul = (d) => Math.round(255 * (1 - dim * (1 - d / 255)));
    show(dimEl, dim > 0.003 ? 1 : 0);
    if (dim > 0.003) {
      _p.set(hero.x, 1.4 + scene.position.y, hero.z).project(camera);
      const hx = (clamp(_p.x * 0.5 + 0.5, 0, 1) * 100).toFixed(1), hy = ((1 - clamp(_p.y * 0.5 + 0.5, 0, 1)) * 100).toFixed(1);
      setStyle(dimEl, 'background', `radial-gradient(ellipse 30% 58% at ${hx}% ${hy}%, rgb(${mul(150)},${mul(210)},${mul(170)}) 0%, ` +
        `rgb(${mul(80)},${mul(140)},${mul(105)}) 55%, rgb(${mul(40)},${mul(80)},${mul(60)}) 100%)`);
    }
    const flashW = game.frame - whirlF < 2 ? 0.22 : 0, flashC = game.frame - cleaveF < 2 ? 0.38 : 0, flash = t < 1 ? 0.09 : 0;
    const wash = Math.max(flash, flashW, flashC);
    const c = t - M.cleave;
    _p.set(c >= 0 ? cutX : hero.x, 1.2 + scene.position.y, c >= 0 ? cutZ : hero.z).project(camera);
    const cx = clamp(_p.x * 0.5 + 0.5, 0, 1), cy = clamp(_p.y * 0.5 + 0.5, 0, 1);
    show(washEl, wash);
    if (wash > 0) setStyle(washEl, 'background', flash ? '#fff' :
      `radial-gradient(ellipse at ${(cx * 100).toFixed(1)}% ${((1 - cy) * 100).toFixed(1)}%, rgba(246,255,238,1) 0%, rgba(214,250,220,.75) 30%, rgba(160,228,180,.35) 100%)`);
    // rays out of the cut, depth-tested 3 m past it so the launched bodies stand against them
    rayU.uRays.value = c >= 0 ? 0.11 * (1 - ramp(c, 4, 30)) : 0;
    rays.visible = rayU.uRays.value > 0.002;
    if (rays.visible) {
      rayU.uC.value.set(cx, cy); rayU.uAspect.value = camera.aspect; rayU.uTime.value = time;
      camera.getWorldDirection(_v);
      _p.set(cutX, 1.2 + scene.position.y, cutZ).addScaledVector(_v, 3).project(camera);
      rayU.uDepth.value = Math.min(0.99999, _p.z);
    }
    const gc = c >= 0 ? 1 - ramp(c, 2, 18) : 0;
    glow.intensity = 3.2 * gc;
    if (gc > 0) { glow.position.set(cutX, 3, cutZ).lerp(camera.position, 0.3); glow.position.y = 3.2 - scene.position.y; }
  }

  let warm = 2;
  return {
    update(dt) {
      time += dt;
      scene.position.y = ground(hero.x, hero.z);
      if (mu.active) tv = mu.t;
      else if (tv >= 0) { tv += dt * 60; if (tv > M.end + 40) tv = -1; }
      shards.update();
      if (warm > 0 && tv < 0) { warm--; rayU.uRays.value = 0; rays.visible = fx.visible = true; shard(0, -50, 0, 0, 0, 0, 0.05, 0.01, JADE); return; }
      if (tv < 0) { hideAll(); return; }
      fx.visible = true;
      updateGrade(tv);
      updateFx(tv);
      ov.cut(tv, M.closeup, ramp(tv, M.closeup, M.closeup + 5) * (1 - ramp(tv, M.pullback - 2, M.pullback + 6)), ramp(tv, M.closeup, M.closeup + 5));
    },
    dispose() {
      parent.remove(scene, shards.mesh);
      for (const o of [scene, shards.mesh]) o.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
      ov.dispose();
    },
  };
}
