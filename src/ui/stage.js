// Officer stage shared by the title and select screens (ui lane, render-only): an officer's voxel model on its own rig
// (kit.model + cloth/hair chains), posed from a held clip frame every render, a stage point up the pass, and the soft
// round sprite their embers / dust motes are drawn with.
import * as THREE from 'three';
import { CHARS } from '../chars/index.js';
import { createRig, HERO_SCALE } from '../hero/rig.js';
import { ground, zone } from '../world/map.js';

/** Soft round dot sprite (32 px): white core, alpha a at radius fraction r, clear at the rim. */
export function dotTex(r, a) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 32;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(r, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(cv);
}

/** n fixed pseudo-random values in (-1, 1) (render-only scatter, never the sim RNG). */
export const scatter = (n, off = 0) => Float32Array.from({ length: n }, (_, i) => (Math.sin(i * 12.9898 + off) * 43758.5453) % 1);

/** Point on the pass road: `at` of the way up the pass zone (0 = its south edge) plus dz metres, on the ground. */
export function passPoint(v, at, dz = 0) {
  const q = zone('pass'), z = q.z - q.d / 2 + q.d * at + dz;
  return v.set(q.x, ground(q.x, z), z);
}

/** Officer `id` on its own rig under `parent`: { K (kit), root, rig, m (kit.model result), sec (chains), fresh }. */
export function standOfficer(id, parent) {
  const K = CHARS[id].kit, root = new THREE.Group(), rig = createRig(K);
  root.add(rig.root); parent.add(root);
  const m = K.model(rig);
  return { K, root, rig, m, sec: K.secondary(root, rig, m.material), fresh: true };
}

/** Pose officer o (standOfficer) at point p facing yaw, then step its chains (reset on the first frame after (re)entry). */
export function poseOfficer(o, pose, p, yaw, dt) {
  o.rig.root.scale.set(1, 1, 1);
  o.rig.apply(pose, p, yaw);
  o.rig.root.scale.setScalar(o.K.scale || HERO_SCALE); o.rig.root.updateMatrixWorld(true);
  if (o.fresh) { o.sec.reset(); o.fresh = false; }
  o.sec.update(dt);
}
