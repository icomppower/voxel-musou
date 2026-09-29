// Battlefield of 定軍山 (layout, heights, walkable ground and gates: map.js). Golden hour as in the concept: a low sun
// straight up the valley between the castle's corner tower and the camp-shelf watchtowers, sun-aware aerial haze
// (warm toward the sun, mauve away), voxel terrain with canyon cliffs, the Han River, the castle wall as the Wei
// camp's front, 魏/蜀 banners with cloth motion, fires with smoke columns and embers, reserve armies, and layered
// mountains with Dingjun's peak behind the summit. Render-only: never touches sim state (it reads the gate states;
// river.js reads who wades the ford); all animation is a pure function of render time.
import * as THREE from 'three';
import { SUN_DIR, HAZE, installHaze, createSky } from './sky.js';
import { buildTerrain, GRASS_TIME } from './terrain.js';
import { buildCastle } from './castle.js';
import { createRiver } from './river.js';
import { buildDressing } from './dressing.js';
import { WALL_Z, GATE_X, CAMP_H, GATES, ground, smooth, useMap } from './map.js';
import { createChibi } from './chibi.js';

// burning wrecks on the field, near the walkable edges so the fight stays clear: [x, z, scale]
const FIELD_FIRES = [[-33, -64, 1.2], [32, -58, 1.1], [-30, 8, 1.3], [30, -8, 1.2], [-22, -28, 1.0], [24, 24, 1.1], [15, 40, 1.0],
  [-36, 126, 1.2], [-12, 202, 1.1]];
// key light: from behind-left of the up-valley view, higher than the visible sun so the ground reads (hard shadows
// fall toward the camera, soldiers get a warm rim)
const LIGHT_DIR = new THREE.Vector3(0.5, 0.58, 0.64).normalize();

installHaze();
// the sun's shadow fades out over the outer 20 % of its box instead of cutting off: soldiers and props at the box edge
// no longer pop a shadow on / off as the hero moves (must patch before any material compiles)
const SHADOW_BOX = 34;
{
  const RET = '\t\t\treturn mix( 1.0, shadow, shadowIntensity );\n\t\t}\n\t#elif defined( SHADOWMAP_TYPE_VSM )';
  const src = THREE.ShaderChunk.shadowmap_pars_fragment;
  if (src.includes(RET)) THREE.ShaderChunk.shadowmap_pars_fragment = src.replace(RET, RET.replace('\t\t\treturn',
    '\t\t\tshadow = mix( shadow, 1.0, smoothstep( 0.8, 0.98, max( abs( shadowCoord.x - 0.5 ), abs( shadowCoord.y - 0.5 ) ) * 2.0 ) );\n\t\t\treturn'));
}

/** 定軍山, built into its own group (root) under `scene`: { root, fires, update }. */
function createDingjun(scene, sky) {
  const root = new THREE.Group(); root.name = 'world-dingjun';
  scene.add(root);
  scene = root;                                                     // everything below lands in the battlefield's group

  const hemi = new THREE.HemisphereLight(0x9cafd4, 0x9a7a5c, 2.2);  // cool dusk-blue sky fill, warm dust bounce (shade reads blue, light gold)
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffcf9a, 4.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 2;
  const sc = sun.shadow.camera;
  sc.left = -SHADOW_BOX; sc.right = SHADOW_BOX; sc.top = SHADOW_BOX; sc.bottom = -SHADOW_BOX; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0xffa060, 1.6);            // warm back/rim light from the visible sun
  rim.position.copy(SUN_DIR).multiplyScalar(100);
  scene.add(rim);

  buildTerrain(scene, FIELD_FIRES);
  const river = createRiver(scene);
  const camp = new THREE.Group();                                   // the castle set stands on the camp plateau
  camp.position.y = CAMP_H;
  scene.add(camp);
  const castle = buildCastle(camp);
  const dressing = buildDressing(scene, { castle, fieldFires: FIELD_FIRES });

  // firelight: three point lights that follow the fight — each frame they sit on the three light sites nearest the
  // focus (gate fires, the summit's step braziers and beacon, the courtyard braziers, field wrecks), faded by distance
  // so a swap happens unseen; the same light count as before (every lit shader loops over them). The fourth stays by
  // the ford wreck: the select screen borrows it as the officer's warm key (select.js 'stage-key').
  // site: [x, y (above ground), z, intensity, range]
  const SITES = [[GATE_X - 6.5, 2.2, WALL_Z - 3.5, 30, 11], [GATE_X + 7, 2.2, WALL_Z - 3.5, 30, 11], [-30, 2.2, 8, 30, 11], [30, 2.2, -8, 26, 10],
    [-2.5, 1.9, 202.0, 30, 12], [10.5, 1.9, 202.0, 30, 12], [15, 9, 213, 60, 18], [-2.2, 1.9, 127.6, 30, 10], [-14, 1.9, 137.2, 26, 10], [-8, 1.9, 196, 24, 10]]
    .map(([x, y, z, i, d]) => ({ x, y: ground(x, z) + y, z, i, d, k: 0 }));
  const NEAR = [null, null, null, null];
  const fireLights = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xff8a3a, 0, 11, 2); scene.add(l); return l; });
  const stageKey = new THREE.PointLight(0xff8a3a, 30, 11, 2);
  stageKey.position.set(-33, ground(-33, -64) + 2.2, -64); stageKey.name = 'stage-key'; scene.add(stageKey);
  // summit fill: the sun sits straight behind 夏侯淵's pavilion, so its lacquer and gilt face the lens in shade — a warm
  // low fill from the valley side (the fires below / sky bounce) eases in on the summit approach only
  const fill = new THREE.DirectionalLight(0xffb27a, 0);
  fill.position.set(-0.35, 0.45, -1).multiplyScalar(60); fill.target.position.set(0, 0, 0);
  scene.add(fill, fill.target);

  // gates: render-side eased 0 (shut) … 1 (open) toward the sim state; doors swing in ≈ 1 s, barricades collapse and char
  const open = { weiCamp: 1, pass: 1, summit: 1 }, CHAR = new THREE.Color(0x3a2a24), WHITE = new THREE.Color(1, 1, 1);
  const tmp = new THREE.Vector3();
  let t = 0;
  return {
    root,
    fires: dressing.fires,
    update(dt, focus, game) {
      t += dt;
      river.update(dt, game);
      // shadow frustum follows the focus (snapped to texels to avoid shimmer), at the ground under it
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      sun.target.position.copy(tmp);
      sun.position.copy(LIGHT_DIR).multiplyScalar(70).add(tmp);
      GRASS_TIME.value = t;
      dressing.update(t, focus);
      castle.update(t);
      for (const id in open) open[id] += ((GATES[id].open ? 1 : 0) - open[id]) * Math.min(1, dt * 3);
      castle.setDoors(open.weiCamp * (2 - open.weiCamp));
      for (const id of ['pass', 'summit']) {
        const g = dressing.gates[id], k = open[id];
        g.m.rotation.x = -0.25 * k; g.m.scale.y = 1 - 0.72 * k; g.m.position.y = g.y - 0.1 * k;   // broken down to a low burning wreck
        g.mat.color.copy(WHITE).lerp(CHAR, k);
      }
      // the four sites nearest the focus (partial selection, no allocation); lights 0-2 take the first three, each faded
      // out as the fourth closes in on it, so the hand-over from one site to the next is never a pop
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
      stageKey.intensity = 28 + Math.sin(t * 22.3 + 3) * 5 + Math.sin(t * 7.3 + 6) * 4;
      fill.intensity = 1.5 * smooth(160, 188, focus.z);
      fill.target.position.set(focus.x, 0, focus.z); fill.position.set(focus.x - 21, 27, focus.z - 60);
    },
  };
}

/**
 * Every battlefield under one scene, one shown at a time: { fires, use(id), update(dt, focus, game) }. use(id) makes
 * map.js describe that field (useMap), builds its set on first use, hides the others (their lights too: a hidden
 * light is out of every shader) and restores the shared sky and haze. fires is one array, refilled in place on a
 * swap, so a module that took it once (vfx ember emitter) always reads the active field's fires. Swap only under
 * cover (loading card, ink wipe): the first use of a field builds it synchronously and new light sets recompile.
 */
export function createWorlds(scene) {
  const sky = createSky();
  scene.add(sky);
  const BUILD = { dingjun: createDingjun, chibi: createChibi };
  const built = {}, fires = [];
  let cur = null, id = null, t = 0;
  const W = {
    fires,
    get id() { return id; },
    use(next) {
      const m = useMap(next);
      if (m === id) return W;
      id = m;
      if (!built[id]) built[id] = BUILD[id](scene, sky);
      for (const k in built) built[k].root.visible = k === id;
      cur = built[id];
      scene.background = HAZE.clone();
      // clear fight disc; haze reaches 63 % 28 + 290 m out (sky.js): the far zones of the 370 m valley stay
      // silhouettes, the summit a dark shoulder under its beacon smoke from the Shu camp
      scene.fog = new THREE.Fog(HAZE.clone(), 36, 330);
      fires.length = 0; fires.push(...cur.fires);
      return W;
    },
    update(dt, focus, game) {
      t += dt;
      sky.material.uniforms.uTime.value = t;
      cur.update(dt, focus, game);
    },
  };
  return W.use('dingjun');
}
