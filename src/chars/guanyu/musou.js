// Guan Yu's 真・無雙「青龍偃月・天崩」(Crescent Moon, the Sky Falls) — sim. Same interface and events as Zhao Yun's
// (src/musou/musou.js): active, t, reset, start, stepHero, shot, ready, step; musou:ready/start/hit/burst/end; hits via
// game.combat.strike(..., 'musou'). The helpers (aura shove, sun avoidance, easing, end, gauge) are Zhao Yun's.
// Concept: the weapon is the signature. 偃月 = the reclining crescent moon: a jade crescent rises behind him in the
// cut-in, he whirls the glaive into a vortex that drags the army in, leaps, and the crescent falls out of the sky with
// him: a colossal blade of light that cleaves the field in a line where it lands, then rolls out as a crescent wave.
// Timeline (musou frames t; t = 1 on the first step after the press; hitstop pauses it):
//   0   activation — world freezes, aura shove, the glaive swung up and planted, chin up (「武聖」)
//   30  close-up cut-in (≈ 0.9 s): the red face, the beard, the crescent moon rising behind his head, 無雙 calligraphy
//   84  pull-back into the whirl stance
//   92  WHIRLWIND ('contact': the world moves again): he walks the whirl forward (steerable), the glaive a disc of jade
//       light; every 8 sf a spinning hit round him (2 KO a grunt) and a vortex pull on everyone within 11 m, so the army closes in
//   150 wind-up: glaive overhead, the crescent appears high above his line
//   158 LEAP (≈ 3 m) — the crescent falls with him —   170 plunge
//   172 CLEAVE (musou:burst): the crescent lands edge-first along his facing — a line 16 m long, 3.6 m wide, heavy launch —
//       then the CRESCENT WAVE rolls out from the cut over 22 sf (a front-facing sector widening to 13 m)
//   210 control returns (≈ 3.5 s)
import { emit } from '../../core/events.js';
import { setState, stickDir, turnToward } from '../../hero/locomotion.js';
import { ST, wrap } from '../../crowd/crowd.js';
import { SUN_AZ } from '../../world/sky.js';
import { clip } from '../../hero/rig.js';
import { easeOut, smooth, offSun, auraShove, auraMove, endMusou, gauge } from '../../musou/musou.js';
import { K } from './moves.js';

export const GY_MUSOU = {
  closeup: 30, pullback: 84, whirl: 92, windup: 150, leap: 158, plunge: 170, cleave: 172, end: 210,
  aura: { r0: 5.2, k: 0.35, frames: 5 },
  whirlSpeed: 3.2, whirlTurn: 1.8, every: 8, spinRate: 5.5,         // m/s, rad/s, sf between whirl hits, glaive turns per s (view)
  pull: { r: 11, speed: 3.6, swirl: 2.2 },                            // vortex: m, m/s inward at the edge, m/s tangential
  whirlHit: { shape: 'circle', range: 3.6, dmg: 20, kb: 'spin', force: 3.5, lift: 3.2, hitstop: 0, yMax: 2.2 },
  leapH: 3.2,
  cleaveHit: { shape: 'line', len: 16, width: 3.6, off: 0.5, dmg: 90, kb: 'launch', force: 6, lift: 11, hitstop: 6, heavy: true, yMax: 6 },
  waveFrames: 22, waveR: 13, waveAng: 230,
  waveHit: { shape: 'sector', range: 0, ang: 230, dmg: 50, kb: 'blow', force: 8, lift: 8.5, hitstop: 0, heavy: false, yMax: 6 },
  cost: 1 / 3,
};
const M = GY_MUSOU;

// ---------------------------------------------------------------- clips (merged into the kit's clip registry)
const RAISE = { hips: [0, 0.92, 0], hipsR: [0, -10, 0], spine: [-4, -4, 0], chest: [-8, -6, 0], head: [-10, -14, 0],
  spear: [-0.3, 0.06, 0.12, 4, 88, -90], gripR: 0.95, gripL: 1.25, footL: [0.24, 0.08, 0.16, 0, 18], footR: [-0.26, 0.08, -0.16, 0, -22] };
const SPIN = (s) => ({ hips: [0, 0.8, 0.1], hipsR: [0, 20, 0], spine: [6, 8, 0], chest: [2, 12, 0], head: [0, -6, 0], spin: s,
  spear: [0, 1.1, 0.24, 92, 2, -90], gripL: 0.42, footL: [0.26, 0.08, 0.5, 0, 15] });
const OVER = { hips: [0, 0.97, 0.06], hipsR: [-8, 0, 0], spine: [-11, 0, 0], chest: [-17, 0, 0], head: [-14, 0, 0],
  spear: [-0.12, 1.71, -0.05, 0, 154, 180], gripL: 0.46, footL: [0.2, 0.34, 0.36, -20, 10], footR: [-0.2, 0.34, -0.14, -20, -20] };
const SLAM = { hips: [0, 0.64, 0.4], hipsR: [22, -8, 0], spine: [18, -2, 0], chest: [20, -4, 0], head: [16, 0, 0],
  spear: [-0.12, 0.96, 0.48, 0, -22, 180], gripL: 0.52, footL: [0.22, 0.08, 0.9, 0, 10], footR: [-0.24, 0.08, -0.4, 0, -30] };
export const GY_MUSOU_CLIPS = {
  // the glaive swung up and planted upright on his right, chin raised
  gy_act: clip([K(0, {}), K(0.4, { ...RAISE, spear: [-0.32, 0.4, 0.1, 4, 70, -90] }, 'out'), K(1, RAISE)]),
  gy_face: clip([K(0, RAISE), K(0.5, { ...RAISE, chest: [-6, -4, 0], head: [-8, -10, 0] }), K(1, RAISE)]),
  gy_ready: clip([K(0, RAISE), K(1, SPIN(0), 'out')]),
  // one turn of the whirl (looped): the blade flat at waist height
  gy_whirl: clip([K(0, SPIN(0)), K(0.5, SPIN(180), 'lin'), K(1, SPIN(360), 'lin')], true),
  gy_windup: clip([K(0, SPIN(0)), K(1, OVER, 'out')]),
  gy_air: clip([K(0, OVER), K(1, { ...OVER, spear: [-0.12, 1.74, -0.08, 0, 162, 180], chest: [-19, 0, 0] })]),
  gy_slam: clip([K(0, OVER), K(0.08, SLAM, 'in'), K(0.7, { ...SLAM, head: [10, 0, 0], spear: [-0.12, 0.94, 0.48, 0, -24, 180] }, 'io'), K(1, {}, 'io')]),
};

const DT = 1 / 60;

export function createMusou(game) {
  const mu = { active: false, t: 0, wasReady: false, yaw0: 0, cx: 0, cz: 0, cyaw: 0, side: 1, waveR: 0, seq: 0, spin: 0 };
  const shot = { id: 0, yaw: 0, dist: 0, pitch: 0, fov: 50, height: 1.2, side: 0, shake: 1 };
  const push = [];
  let startMusou = 0;

  mu.reset = () => { mu.active = false; mu.t = 0; mu.wasReady = false; mu.waveR = 0; mu.spin = 0; push.length = 0; };

  mu.start = (inp) => {
    const h = game.hero;
    const [sx, sz, smag] = stickDir(inp, game.cam.yaw);
    if (smag) h.yaw = Math.atan2(sx, sz);
    mu.active = true; mu.t = 0; mu.waveR = 0; mu.spin = 0; mu.seq++;
    mu.yaw0 = mu.cyaw = h.yaw; mu.cx = h.x; mu.cz = h.z;
    startMusou = h.musou;
    h.move = null; h.vx = h.vz = 0;
    setState(h, 'musou');
    h.musouClip = 'gy_act'; h.musouT = 0;
    h.iframes = M.end + 30;
    game.freeze = 2;
    auraShove(game.crowd, h, M.aura, push);
    emit('musou:start', { x: h.x, z: h.z, activation: M.closeup, burstAt: M.cleave, contact: M.whirl });
  };

  const hitAt = (hit, x, z, yaw, key, rehit) => game.combat.strike(hit, x, z, yaw, key - (mu.seq % 1000) * 100000, rehit, 'musou');

  /** Vortex: standing soldiers within pull.r slide inward and round (counter to the glaive), faster near the edge. */
  function vortex(h) {
    const c = game.crowd, { r, speed, swirl } = M.pull;
    for (let i = 0; i < c.N; i++) {
      const s = c.st[i];
      if (s === ST.OFF || s === ST.DEAD || s === ST.DOWN || c.y[i] > 0.3) continue;
      const dx = c.x[i] - h.x, dz = c.z[i] - h.z, d = Math.hypot(dx, dz);
      if (d > r || d < 2.2) continue;
      const k = (d - 2.2) / (r - 2.2), inw = speed * (0.35 + 0.65 * k) * DT, tan = swirl * (1 - 0.5 * k) * DT;
      c.x[i] += (-dx / d) * inw + (dz / d) * tan; c.z[i] += (-dz / d) * inw - (dx / d) * tan;
    }
  }

  mu.stepHero = (inp) => {
    const h = game.hero, c = game.crowd, t = ++mu.t;
    h.iframes = Math.max(h.iframes, 2);
    h.vx = h.vz = 0;
    h.musou = Math.max(0, startMusou - h.musouMax * M.cost * Math.min(1, t / M.whirl));
    if (t < M.whirl) game.freeze = Math.max(game.freeze, 2);
    if (t <= M.aura.frames) auraMove(c, push, t / M.aura.frames);
    if (t < M.closeup) { h.musouClip = 'gy_act'; h.musouT = t / M.closeup; return; }
    if (t < M.pullback) { h.musouClip = 'gy_face'; h.musouT = (t - M.closeup) / (M.pullback - M.closeup); return; }
    if (t < M.whirl) { h.musouClip = 'gy_ready'; h.musouT = (t - M.pullback) / (M.whirl - M.pullback); return; }
    if (t < M.windup) {                                                  // WHIRLWIND: walk the vortex (stick steers)
      const [dx, dz, mag] = stickDir(inp, game.cam.yaw);
      if (mag) turnToward(h, Math.atan2(dx, dz), M.whirlTurn * DT);
      const v = M.whirlSpeed * Math.min(1, (t - M.whirl) / 10);
      h.x += Math.sin(h.yaw) * v * DT; h.z += Math.cos(h.yaw) * v * DT;
      mu.spin += M.spinRate * DT;
      h.musouClip = 'gy_whirl'; h.musouT = mu.spin % 1;
      vortex(h);
      const k = t - M.whirl;
      if (k % M.every === 0) {
        hitAt(M.whirlHit, h.x, h.z, h.yaw, -2100 - t, true);
        emit('musou:hit', { x: h.x, y: 1.1, z: h.z, stage: k === 0 ? 'contact' : 'rush', yaw: h.yaw, n: k });
      }
      return;
    }
    if (t < M.leap) {                                                    // wind-up: face the line, glaive overhead
      if (t === M.windup) {
        mu.cyaw = h.yaw;
        // payoff camera side: the flank of the cleave line that looks further from the sun (front-lit launch)
        mu.side = Math.abs(wrap(h.yaw + Math.PI / 2 - SUN_AZ)) >= Math.abs(wrap(h.yaw - Math.PI / 2 - SUN_AZ)) ? 1 : -1;
      }
      h.musouClip = 'gy_windup'; h.musouT = (t - M.windup) / (M.leap - M.windup);
      return;
    }
    if (t < M.cleave) {                                                  // the leap and the plunge
      const u = t < M.plunge ? easeOut((t - M.leap) / (M.plunge - M.leap)) : 1 - (t - M.plunge) / (M.cleave - M.plunge);
      h.y = M.leapH * u;
      h.x += Math.sin(mu.cyaw) * 1.2 * DT * 60 / (M.cleave - M.leap);   // ≈ 1.2 m forward over the jump
      h.z += Math.cos(mu.cyaw) * 1.2 * DT * 60 / (M.cleave - M.leap);
      h.yaw = mu.cyaw;
      h.musouClip = 'gy_air'; h.musouT = (t - M.leap) / (M.cleave - M.leap);
      return;
    }
    h.y = 0;
    h.musouClip = 'gy_slam'; h.musouT = (t - M.cleave) / (M.end - M.cleave);
    const w = t - M.cleave;
    if (w === 0) {                                                       // CLEAVE: the crescent lands along the line
      mu.cx = h.x; mu.cz = h.z;
      const n = hitAt(M.cleaveHit, h.x, h.z, mu.cyaw, -3000, false);
      emit('musou:burst', { count: n, x: h.x + Math.sin(mu.cyaw) * 6, z: h.z + Math.cos(mu.cyaw) * 6 });
    }
    if (w > 0 && w <= M.waveFrames && w % 2 === 0) {                     // CRESCENT WAVE out of the cut
      const u = w / M.waveFrames;
      mu.waveR = 2 + (M.waveR - 2) * (1 - (1 - u) ** 3);
      const n = hitAt({ ...M.waveHit, range: mu.waveR, lift: M.waveHit.lift - 3 * u, heavy: w <= 2 }, mu.cx, mu.cz, mu.cyaw, -3100, false);
      if (n) {
        const a = mu.cyaw + (w % 4 ? 0.7 : -0.7) * u;
        emit('musou:hit', { x: mu.cx + Math.sin(a) * mu.waveR * 0.9, y: 0.4, z: mu.cz + Math.cos(a) * mu.waveR * 0.9, stage: 'wave', yaw: a, n: w });
      }
    }
    if (t >= M.end) { h.y = 0; endMusou(mu, h, startMusou, M.cost); }
  };

  /** Camera shot for the current Musou frame (id change = hard cut). Terms as src/musou/musou.js shot(). */
  mu.shot = () => {
    if (!mu.active) return null;
    const t = mu.t, h = game.hero, o = shot;
    o.shake = 0.3; o.side = 0;
    if (t < M.closeup) {                                   // front three-quarter from above, slow push-in on the raised glaive
      const u = t / M.closeup;
      Object.assign(o, { id: 1, yaw: offSun(mu.yaw0 + Math.PI * 0.82), dist: 4.6 - 0.6 * u, pitch: 0.3, fov: 46, height: 1.2, side: 0.2 });
    } else if (t < M.whirl) {                              // the cut-in: face and beard, square on, long lens; pull back into the whirl
      const u = Math.min(1, (t - M.closeup) / (M.pullback - M.closeup)), v = Math.max(0, (t - M.pullback) / (M.whirl - M.pullback));
      // (r1: 3 m on a 30° lens filled the frame with the upright glaive and his pauldron: a step back, a touch wider,
      // turned a little off square so the blade stands to one side of his face)
      Object.assign(o, { id: 2, yaw: offSun(mu.yaw0 + Math.PI * 0.9), dist: 3.9 - 0.3 * smooth(u) + 2.5 * v * v, pitch: 0.14 + 0.1 * v, fov: 34 + 18 * v,
        height: 1.66 - 0.3 * v, side: -0.35 });
    } else if (t < M.windup) {                             // the whirl: behind-side, low and wide, the pulled-in army round him
      Object.assign(o, { id: 3, yaw: offSun(h.yaw + 0.55), dist: 7.2, pitch: 0.2, fov: 58, height: 1.3, side: 0.4, shake: 0.5 });
    } else if (t < M.cleave + 2) {                         // the leap: low behind-side, looking up past him at the falling crescent
      // (r1: a 10-12 m side shot left him a speck and the crescent off the top of the frame; the lens now sits 5 m back,
      // below his leap, and the aim rises with the crescent, so he stands against it as it comes down)
      const u = smooth((t - M.windup) / (M.cleave - M.windup));
      Object.assign(o, { id: 4, yaw: offSun(mu.cyaw + mu.side * 0.75), dist: 7 + 1.5 * u, pitch: -0.12 + 0.12 * u, fov: 64, height: 3.2 - 1.2 * u, side: mu.side * 1.6, shake: 0.4 });
    } else {
      // payoff: square to the cleave line on the sun-away flank, the line across the frame, the wave rolling out of it
      const u = smooth((t - M.cleave) / (M.end - M.cleave));
      Object.assign(o, { id: 5, yaw: mu.cyaw + mu.side * Math.PI / 2, dist: 14 + 3 * u, pitch: 0.2 + 0.05 * u, fov: 58, height: 2.2 + 1.0 * u,
        side: mu.side * (5 + 2 * u), shake: 0.9 });
    }
    return o;
  };

  gauge(mu, game, M.cost);
  return mu;
}
