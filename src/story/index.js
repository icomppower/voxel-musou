// Story director (sim): scripts a battle through the crowd's story API, the actors (game.actors, C5, when present) and
// the story:* events. Runs inside step() (after the musou), deterministic: timed off its own frame counter, no randomness
// of its own (the crowd draws from rng).
//   game.story = createStory(game)
//   story.reset({ mode, char, ch })        battle start (after hero / crowd / combat / musou resets); ch = chapter id
//   story.step()                           once per sim step while the battle runs
//   story.stats()                          → { kos, time (s), hpMax, maxChain, dmg, rank? } (story:end / result)
//                                          frozen on the win / loss frame; the result animation adds no time or KOs
//   story.morale                           ally share of the HUD morale bar 0-1 (undefined in free mode: HUD falls back)
//   story.target                           {x, z} the HUD objective arrow points at, or null
//   story.hq                               [x, z] of the foe's 本陣 on the minimap (CH.hq), or null (free: the HUD's default)
//   story.timer                            seconds left on the objective countdown (obj.timer), or null (HUD)
//   story.defend                           { name {zh, en}, f (HP fraction), x, z } of the point being defended, or null
// Modes: 'story' plays one chapter, 'trial' one trial (trials.js: the same format, no prologue, gates left open, the
// hero can fall), 'free' the endless field. A stage (chapter or trial) is its BEATS (chapters.js header), run strictly
// in order — beat k fires once its trigger holds and beat k-1 has fired; `limit` keeps the hero inside the stage he is on (DW8's barred gates),
// so the script can't be skipped or soft-locked by running ahead. The map's gates (world/map.js GATES) are sim state:
// story mode shuts them all at reset, a beat's `gate: id` opens one (clampWalk lets everyone through, world.js swings /
// burns it). A beat's `set` is a map set-piece change (story:set, world forwards it to the map's build().sets).
// Trial first-beat `army` is fielded at reset under loading, then left in place when that beat's objective fires.
// CH.rank.s adds strict S limits on clear time / KOs and cumulative damage; stages without it keep the point score.
// Emits story:say / story:banner / story:objective / story:set / story:end (payloads: core/events.js). The flow (main.js)
// leaves the battle for the result screen on story:end; the HUD shows the rest.
// Also owns game.timeScale (wall-clock pace of the fixed-step loop, main.js): 1, except the victory slow-mo, and the
// hero's buff multipliers h.atkK (damage dealt, combat.js applyHit) / h.defK (damage taken ÷, hero.hurt): 1 unless a
// `buff` beat runs. Free mode = the endless field: the army, reinforcement waves, the hero's intro line, and no end.
// Escort / stratagem beats (漢水): `escort` fields one named Shu soldier the hero must keep alive (his fall loses the
// battle until a `saved` beat releases him); `calm` arms a hold-still test (stand within r of a spot without striking:
// `held` once it lasts, `broke` if he strikes after a 1.5 s grace); `volley` blows away a share of the foe grunts round
// a point (crossbows from the walls).
// Allies (crowd.spawnAllies; columns via crowd.setAllies): a stage's CH.van holds rank until the hero marches past;
// omitted (or free mode) = a block behind him, [] = alone. Morale also moves with the duels (foe grunts the
// allies KO'd minus allies lost).
import { emit, on } from '../core/events.js';
import { zone, anchor, setGate, GATES } from '../world/map.js';
import { ST } from '../crowd/crowd.js';
import { CHARS } from '../chars/index.js';
import { NPCS } from '../chars/npc/index.js';
import { chapter } from './chapters.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const nearZ = (id) => { const q = zone(id); return q.z - (q.r ?? q.d / 2); };

export function createStory(game) {
  /** Script position P = [zone id, fx, fz] (fractions of the zone's half extents), [anchor id, dx, dz] (metres from a
   *  map anchor: def.anchors) or ['hero', dx, dz] (metres from the hero, now). */
  function pos([id, a, b]) {
    if (id === 'hero') return [game.hero.x + a, game.hero.z + b];
    const p = anchor(id);
    if (p) return [p[0] + a, p[1] + b];
    const q = zone(id), hw = q.r ?? q.w / 2, hd = q.r ?? q.d / 2;
    return [q.x + a * hw, q.z + b * hd];
  }
  const xz = (P) => { const [x, z] = pos(P); return { x, z }; };
  const S = { mode: 'free', char: 'zhaoyun', t: 0, done: false, maxChain: 0, downT: -1 };
  const st = { morale: undefined, target: null, timer: null, defend: null };
  const DLG_GAP = 12;                            // sim frames between two queued lines
  let C = null;                                  // the chapter module (story mode)

  st.stats = () => {
    if (S.final) return S.final;
    const h = game.hero, time = Math.round(S.t / 60);
    const s = { kos: h.kos, time, hpMax: h.hpMax, maxChain: S.maxChain, dmg: S.dmg };
    if (S.won >= 0) s.rank = rank(s);
    return s;
  };
  S.end = (win) => { if (!S.done) { S.done = true; game.timeScale = 1; emit('story:end', { win, stats: st.stats(), reason: S.reason }); } };

  // sim-side listeners (these events fire inside step(), so the bookkeeping stays deterministic)
  on('hero:down', () => { if (S.mode !== 'free' && S.won < 0 && S.downT < 0) { S.downT = S.t; S.final = st.stats(); } });
  on('hero:hurt', (e) => { S.dmg += e.dmg; });
  on('ko', (e) => { if (e.officer && S.off) for (const k in S.off) if (S.off[k] === e.i) { S.dead[k] = true; S.off[k] = -1; } });
  // the hero struck this step (a swing / shot or a Musou; drawing the bow is a stance): the calm hold reads it
  on('attack:start', (e) => { if (e.move !== 'aim') S.atk = true; });
  on('musou:start', () => { S.atk = true; });
  const gone = (e) => { if (S.dead) S.dead[e.key] = true; };   // an actor KO'd or withdrawn: `down` for the script
  on('actor:down', gone); on('actor:retreat', gone);

  // ---- dialogue: one line at a time. Text: the hero's branch, else the line's own; speaker: hero / ally (CH.ally) /
  // SPK seal (or its CHARS pixel portrait) / a CHARS id. No text or no speaker for this hero = the line is skipped.
  const say = (line) => {
    const pick = line[S.char], zh = pick ? pick[0] : line.zh, en = pick ? pick[1] : line.en;
    if (!zh) return;
    const who = line.who === 'ally' ? S.ally : line.who === S.char ? 'hero' : line.who;
    const e = { zh, en, dur: Math.max(160, Math.min(270, 100 + zh.length * 8)) };   // ≈ 2.7-4.5 s: DW8 pace
    if (who !== 'hero') {
      const p = C.SPK[who], ch = CHARS[p?.char || who] || NPCS[p?.char || who];
      if (!p && !ch) return;
      Object.assign(e, { speaker: p ? p.name : ch.name, portrait: ch ? ch.id : { seal: p.seal }, side: p ? p.side : 'shu' });
    }
    S.q.push(e);
  };

  // ---- triggers (every key of an object must hold; an array = any one of its objects)
  const officerFrac = (k) => { const i = S.off[k]; return S.dead[k] ? 0 : i >= 0 ? game.crowd.hp[i] / game.crowd.hpMax[i] : 1; };
  /** HP fraction of a script key: the defend point, an actor (C5), else a crowd officer. */
  const frac = (k) => {
    if (S.def && S.def.key === k) return S.def.hp / S.def.hpMax;
    const a = k in S.off ? null : game.actors?.get(k);
    return a ? (a.dead || S.dead[k] ? 0 : a.hp / a.hpMax) : officerFrac(k);
  };
  /** A foe grunt or officer on his feet within r m of the hero. */
  const foeNear = (r) => {
    const c = game.crowd, h = game.hero;
    for (let i = 0; i < c.N; i++) { const s = c.st[i]; if (s !== ST.OFF && s !== ST.DEAD && (c.x[i] - h.x) ** 2 + (c.z[i] - h.z) ** 2 < r * r) return true; }
    return false;
  };
  /** World [x, z] of a `near` target: an escort's key (where he stands now) or a position P. */
  const at = (t) => (typeof t === 'string' ? (S.esc[t] >= 0 ? [game.crowd.x[S.esc[t]], game.crowd.z[S.esc[t]]] : [1e9, 1e9]) : pos(t));
  const holds = (w) => {
    if (!w) return true;
    if (Array.isArray(w)) return w.some(holds);
    const h = game.hero;
    if (w.wait != null && S.t - S.beatT < w.wait) return false;
    if (w.kos != null && h.kos - S.koBase < w.kos) return false;
    if (w.zone && h.z < nearZ(w.zone)) return false;
    if (w.at && h.z < pos(w.at)[1]) return false;
    if (w.near) { const [x, z] = at(w.near[0]); if (Math.hypot(h.x - x, h.z - z) > w.near[1]) return false; }
    if (w.down && !S.dead[w.down] && !game.actors?.get(w.down)?.dead) return false;
    if (w.below && frac(w.below[0]) >= w.below[1]) return false;
    if (w.hp && frac(w.hp[0]) >= w.hp[1]) return false;
    if (w.timer && !(S.timerEnd >= 0 && S.t >= S.timerEnd)) return false;
    if (w.hero && !w.hero.includes(S.char)) return false;
    if (w.clear != null && foeNear(w.clear)) return false;
    if (w.safe) { const i = S.esc[w.safe[0]]; if (i === undefined || game.crowd.z[i] < pos(w.safe[1])[1]) return false; }
    if (w.held && !S.held) return false;
    if (w.broke && !S.broke) return false;
    return true;
  };

  function fire(b) {
    const c = game.crowd, h = game.hero;
    if (b.win) { S.won = S.t; S.final = st.stats(); S.q.length = 0; S.sayUntil = 0; } // victory: freeze stats and drop chatter
    if (b.retire) c.retire(b.retire === true ? h.z - 45 : pos(b.retire)[1]);   // stage change: idle blocks far behind (or south of P) leave
    for (const a of b.allies || []) c.spawnAllies(a);                  // Shu blocks { x, z, n, cols, hold } (metres)
    for (const q of b.squads || []) { const [x, z] = pos(q.at); c.spawnSquad({ x, z, n: q.n, cols: q.cols, charge: !!q.charge }); }
    for (const k in b.officers || {}) {                                // spawned on the next steps (retried while slots are full)
      const o = b.officers[k], d = C.OFF[o.like || k];
      const [x, z] = pos(o.at);
      S.want[k] = { x, z, name: d.name, hp: d.hp, boss: !!d.boss, engaged: !!o.engaged, look: d.look };   // look: C3 (armies.js)
      S.off[k] = -1; S.dead[k] = false;
    }
    for (const k in b.actors || {}) { S.dead[k] = false; game.actors?.spawn(k, { ...b.actors[k], at: xz(b.actors[k].at) }); }
    for (const a of [].concat(b.actor || [])) game.actors?.order(a.key, a.do, a.at && xz(a.at));
    if (b.army && !c.armyOn) c.spawnArmy();
    if (b.waves != null) c.setWaves(b.waves);
    if (b.limit) {                                                     // crowd: waves spawn inside the forward bound
      S.limit = c.zMax = b.limit.z ? pos(b.limit.z)[1] : Infinity;
      S.back = b.limit.back ? pos(b.limit.back)[1] : -Infinity; S.nag = b.limit.nag || null;
    }
    if (b.heal && !h.dead) h.hp = Math.min(h.hpMax, h.hp + b.heal * game.diff.heal * h.hpMax);
    if (b.morale != null) S.mBase = b.morale === 1 ? 1 : S.mBase + b.morale;
    if (b.gate) setGate(b.gate, true);
    if (b.escort) {                                                    // one named Shu soldier the hero must bring out alive
      const e = b.escort, [x, z] = pos(e.at), i = c.spawnAllies({ x, z, n: 1, cols: 1, hold: true })?.[0] ?? -1;
      if (i >= 0) { c.hp[i] = c.hpMax[i] = e.hp ?? 300; S.esc[e.key] = i; S.off[e.key] = i; S.escName = e.name; }
    }
    if (b.saved) delete S.esc[b.saved];
    if (b.volley) {                                                    // crossbows from the walls: a blow-away volley on the foe ranks
      const v = b.volley, [x, z] = pos(v.at), key = 900000 + S.beat;
      for (let i = 0; i < c.grunts; i++) {
        const s = c.st[i];
        if (s === ST.OFF || s === ST.DEAD || (c.x[i] - x) ** 2 + (c.z[i] - z) ** 2 > v.r * v.r || ((i * 7) % 10) / 10 >= v.frac) continue;
        game.combat.hitOne(i, { dmg: 999, kb: 'blow', force: 9, lift: 4, heavy: true }, x, z - 20, 0, key, false, 'musou');
      }
    }
    if (b.calm) { const [x, z] = pos(b.calm.at); S.calm = { x, z, r: b.calm.r ?? 5, frames: b.calm.frames, obj: b.calm.obj, t0: S.t }; S.calmT = 0; S.held = S.broke = false; }
    if (b.banner) emit('story:banner', { dur: 150, ...b.banner });
    if (b.hush) S.q.length = 0;                                        // stage cleared: queued taunts are stale now
    if (b.obj) {
      emit('story:objective', { zh: b.obj.zh, en: b.obj.en }); S.go = b.obj.go;
      if (!b.obj.keepTimer) S.timerEnd = b.obj.timer ? S.t + b.obj.timer * 60 : -1;
    }
    if ('fail' in b) S.fail = b.fail;
    if ('defend' in b) { const d = b.defend; S.def = d && { key: d.key, ...xz(d.at), r: d.r, hp: d.hp, hpMax: d.hp, name: d.name }; }
    if (b.set) emit('story:set', { id: b.set });
    if (b.buff) {
      const u = b.buff; h.atkK = u.atk ?? 1; h.defK = u.def ?? 1; S.buffEnd = u.dur ? S.t + u.dur * 60 : Infinity;
      if (u.zh) emit('story:banner', { html: u.zh, en: u.en, dur: 170 });
    }
    for (const l of b.say || []) say(l);
  }

  st.reset = ({ mode = 'free', char = 'zhaoyun', ch } = {}) => {
    C = mode === 'free' ? null : chapter(ch);
    Object.assign(S, { mode, char, ally: C?.CH.ally?.[char], t: 0, done: false, maxChain: 0,
      downT: -1, final: null, dmg: 0, beat: 0, beatT: 0, koBase: 0, off: {}, want: {}, dead: {}, q: [], sayUntil: 0, limit: Infinity, back: -Infinity,
      nag: null, nagT: -999, mBase: 0.4, won: -1, go: null, timerEnd: -1, fail: null, reason: null, def: null, buffEnd: Infinity,
      esc: {}, escName: null, atk: false, calm: null, calmT: 0, held: false, broke: false });
    const c = game.crowd, h = game.hero;
    game.timeScale = 1;
    h.atkK = h.defK = 1;
    Object.assign(st, { target: null, timer: null, defend: null, hq: C?.CH.hq || null });
    if (mode === 'story') for (const id in GATES) setGate(id, false);  // spawnPoint() opened them all; the script opens each
    st.morale = C ? 0.4 : undefined;
    if (!C) c.spawnArmy();
    // allies: the chapter's van; free and a trial without one, a block behind the hero
    for (const v of C?.CH.van || [{ x: h.x, z: h.z - 9, n: 24, cols: 6 }]) c.spawnAllies(v);
    c.setAllies(true);
    if (mode === 'trial' && C?.BEATS[0].army) c.spawnArmy();
    // story: the first beat spawns the field on step 1 — after main.js's 'scenario' reset of the HUD, so its objective sticks
  };

  st.step = () => {
    const h = game.hero, c = game.crowd;
    if (S.done) return;
    S.t++;
    if (h.combo > S.maxChain) S.maxChain = h.combo;
    if (!C) { if (game.frame === 185) emit('story:say', { ...h.char.lines.intro, dur: 300 }); return; }   // the hero's opening line

    // victory: slow-mo on the killing blow (0.3× for ~5 s of wall time, eased back), the hero untouchable, then results
    if (S.won >= 0) {
      const k = S.t - S.won;
      game.timeScale = k < 90 ? 0.3 : Math.min(1, 0.3 + (k - 90) / 60 * 0.7);
      h.iframes = Math.max(h.iframes, 2);
      if (k >= 300) S.end(true);
    } else if (S.downT >= 0) { if (S.t - S.downT >= 120) S.end(false); return; }     // 2 s down (or failed), then defeat
    else if (S.fail && holds(S.fail.when)) {                                          // an armed fail condition: lost
      S.reason = { zh: S.fail.zh, en: S.fail.en }; S.downT = S.t; S.final = st.stats(); S.fail = null;
      emit('story:banner', { html: S.reason.zh, en: S.reason.en, dur: 150, big: true });
      return;
    }

    // an escort falls: his cry, 2 s, then defeat
    for (const k in S.esc) if (S.won < 0 && S.downT < 0 && c.st[S.esc[k]] === ST.DEAD) {
      S.reason = { zh: `${S.escName?.zh ?? ''} 陣亡`, en: `${S.escName?.en ?? ''} has fallen` };
      S.downT = S.t; S.final = st.stats(); delete S.esc[k];
      emit('story:banner', { html: `<em>${S.escName?.zh ?? ''}</em> 陣亡`, en: S.reason.en, dur: 150, big: true });
    }
    // calm hold (a beat's `calm`): stand within r of the spot, don't strike, for `frames` in a row. Stepping out of the
    // circle restarts the count; a strike (or a Musou) after the first 1.5 s breaks it for good. The objective counts down.
    if (S.calm) {
      const K = S.calm;
      if (S.atk && S.t - K.t0 > 90) { S.broke = true; S.calm = null; }       // 1.5 s grace: a combo already under way finishes
      else if (Math.hypot(h.x - K.x, h.z - K.z) <= K.r) {
        if (++S.calmT >= K.frames) { S.held = true; S.calm = null; }
        else if (K.obj && S.calmT % 60 === 1) emit('story:objective', { zh: `${K.obj.zh} ${Math.ceil((K.frames - S.calmT) / 60)}`, en: `${K.obj.en} ${Math.ceil((K.frames - S.calmT) / 60)}s` });
      } else S.calmT = 0;
    }
    S.atk = false;

    const BEATS = C.BEATS;
    while (S.beat < BEATS.length) {
      const b = BEATS[S.beat];
      if ((b.hero && !b.hero.includes(S.char)) || (b.skip && holds(b.skip))) { S.beat++; continue; }
      if (!holds(b.when)) break;
      S.beat++; S.beatT = S.t; S.koBase = h.kos;
      fire(b);
      if (b.win) break;
    }

    // officers the script asked for: spawn as soon as a slot is free (a KO'd officer frees his slot after crowd deadTime)
    for (const k in S.want) {
      const i = c.spawnOfficer(S.want[k]);
      if (i >= 0) { S.off[k] = i; delete S.want[k]; }
    }

    // stage bounds: the hero can't run past the stage he is on, nor back out of it (a nag line explains, ≤ every 10 s)
    const out = h.z > S.limit ? S.limit : h.z < S.back ? S.back : null;
    if (out !== null) {
      if ((h.z - out) * h.vz > 0) h.vz = 0;
      h.z = out;
      if (S.nag && S.t - S.nagT > 600 && !S.q.length && S.t >= S.sayUntil) { S.nagT = S.t; say(S.nag); }
    }
    if (S.t >= S.buffEnd) { h.atkK = h.defK = 1; S.buffEnd = Infinity; }

    // defend point: every foe soldier on his feet inside r drains 1 hp/s (× the tier's damage)
    const D = S.def;
    if (D && D.hp > 0) {
      let n = 0;
      for (let i = 0; i < c.N; i++) if (c.st[i] >= ST.IDLE && c.st[i] <= ST.ATTACK && (c.x[i] - D.x) ** 2 + (c.z[i] - D.z) ** 2 < D.r * D.r) n++;
      D.hp = Math.max(0, D.hp - n * game.diff.dmg / 60);
    }
    st.defend = D ? { name: D.name, f: D.hp / D.hpMax, x: D.x, z: D.z } : null;
    st.timer = S.timerEnd >= 0 ? Math.max(0, Math.ceil((S.timerEnd - S.t) / 60)) : null;

    // dialogue queue
    if (S.q.length && S.t >= S.sayUntil) { const e = S.q.shift(); emit('story:say', e); S.sayUntil = S.t + e.dur + DLG_GAP; }

    // HUD reads: objective arrow target (an officer, an actor, or a position), morale (stage morale + a little per KO, eased)
    const g = S.go;
    if (typeof g === 'string') {
      const i = S.off[g], a = i === undefined && game.actors?.get(g);
      st.target = i >= 0 ? { x: c.x[i], z: c.z[i] } : S.want[g] ? { x: S.want[g].x, z: S.want[g].z } : a && !a.dead ? { x: a.x, z: a.z } : null;
    } else st.target = g ? xz(g) : null;
    const m = S.mBase >= 1 ? 1 : clamp01(S.mBase + h.kos * 0.0004 + (c.allyKos - c.allyLost) * 0.0006);
    st.morale += (Math.min(0.95, Math.max(0.08, m)) - st.morale) * 0.03;
  };

  /** DW-style rank from KOs, clear time and damage taken: 3 points each (+ game.diff.rankBonus; KO / time steps from
   *  CH.rank), S ≥ 8, A ≥ 6, B ≥ 4, else C; never above game.diff.rankMax (初級 tops out at A).
   *  CH.rank.s, when present, also requires time ≤ s.time, KOs ≥ s.kos and damage ≤ hpMax × s.dmg for S. */
  function rank({ kos, time, dmg, hpMax }) {
    const R = C.CH.rank;
    const p = R.kos.filter((v) => kos >= v).length + R.time.filter((v) => time <= v).length +
      (dmg <= hpMax * 0.35 ? 3 : dmg <= hpMax * 0.7 ? 2 : dmg <= hpMax * 1.1 ? 1 : 0);
    const d = game.diff, q = p + d.rankBonus, r = q >= 8 ? 'S' : q >= 6 ? 'A' : q >= 4 ? 'B' : 'C';
    const s = R.s;
    return r === 'S' && (d.rankMax === 'A' || s && (time > (s.time ?? Infinity) || kos < (s.kos ?? 0) || dmg > hpMax * s.dmg)) ? 'A' : r;
  }
  return st;
}
