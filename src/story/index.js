// Story director (sim): scripts a battle through the crowd's story API and the story:* events. Runs inside step()
// (after the musou), deterministic: timed off its own frame counter, no randomness of its own (the crowd draws from rng).
//   game.story = createStory(game)
//   story.reset({ mode, char })            battle start (after hero / crowd / combat / musou resets)
//   story.step()                           once per sim step while the battle runs
//   story.stats()                          → { kos, time (s), hpMax, maxChain, dmg, rank? } (story:end / result)
//   story.morale                           蜀 share of the HUD morale bar 0-1 (undefined in free mode: HUD falls back)
//   story.target                           {x, z} the HUD objective arrow points at, or null
// Map gates (world/map.js GATES: 'pass' barricade, 'weiCamp' castle gate, 'summit' barricade) are sim state: story mode
// closes all three at reset, a beat's `gate: id` opens one (clampWalk lets everyone through, world.js burns / swings it).
// Emits story:say / story:banner / story:objective / story:end (payloads: core/events.js). The flow
// (main.js) leaves the battle for the result screen on story:end; the HUD shows the rest.
// Also owns game.timeScale (wall-clock pace of the fixed-step loop, main.js): 1, except the victory slow-mo.
// Free mode = the endless field: the army, reinforcement waves, the hero's intro line, and no end.
// Both modes field live Shu allies (crowd.spawnAllies; columns via crowd.setAllies): story — the van drawn up either side
// of the road inside the 本陣 gate, holding rank until the hero marches past; free — a block behind him.
// Morale also moves with the duels (Wei grunts the allies KO'd minus allies lost).
// Story mode: the chapter fought on the active battlefield (./chapters.js: 定軍山 ch1.js, 赤壁 ch2.js); its BEATS = a
// beat list (format: header of ./ch1.js), run strictly in order — beat k fires once
// its trigger holds and beat k-1 has fired; a `limit` keeps the hero from running past the stage he is on (DW8's
// barred gates), so the script can't be skipped or soft-locked by running ahead, and going back is always free.
import { emit, on } from '../core/events.js';
import { zone, setGate, GATES, WALL_Z, GATE_X, mapId } from '../world/map.js';
import { CHARS } from '../chars/index.js';
import { chapter } from './chapters.js';
import { ST } from '../crowd/crowd.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Script position P = [zone id, fx, fz] (fractions of the zone's half extents) or ['gate', dx, dz] (metres). */
function pos([id, a, b]) {
  if (id === 'gate') return [GATE_X + a, WALL_Z + b];
  const q = zone(id), hw = q.r ?? q.w / 2, hd = q.r ?? q.d / 2;
  return [q.x + a * hw, q.z + b * hd];
}
const nearZ = (id) => { const q = zone(id); return q.z - (q.r ?? q.d / 2); };

export function createStory(game) {
  const S = { mode: 'free', char: 'zhaoyun', t: 0, done: false, maxChain: 0, downT: -1 };
  const st = { morale: undefined, target: null };
  const DLG_GAP = 12;                            // sim frames between two queued lines

  st.stats = () => {
    const h = game.hero, time = Math.round(S.t / 60);
    const s = { kos: h.kos, time, hpMax: h.hpMax, maxChain: S.maxChain, dmg: S.dmg };
    if (S.won >= 0) s.rank = rank(s);
    return s;
  };
  S.end = (win) => { if (!S.done) { S.done = true; game.timeScale = 1; emit('story:end', { win, stats: st.stats() }); } };

  // sim-side listeners (these events fire inside step(), so the bookkeeping stays deterministic)
  on('hero:down', () => { if (S.mode === 'story' && S.won < 0) S.downT = S.t; });
  on('hero:hurt', (e) => { S.dmg += e.dmg; });
  on('ko', (e) => { if (e.officer && S.off) for (const k in S.off) if (S.off[k] === e.i) { S.dead[k] = true; S.off[k] = -1; } });
  // the hero struck this step (a swing / shot or a Musou; drawing the bow is a stance): the calm hold reads it
  on('attack:start', (e) => { if (e.move !== 'aim') S.atk = true; });
  on('musou:start', () => { S.atk = true; });

  // ---- dialogue: one line at a time; lines resolve the speaker (hero / ally / SPK seal) and branch on the hero
  const say = (line) => {
    const pick = line[S.char], zh = pick ? pick[0] : line.zh, en = pick ? pick[1] : line.en;
    const dur = Math.max(160, Math.min(270, 100 + zh.length * 8));   // ≈ 2.7-4.5 s: DW8 pace, taunts don't queue behind a briefing
    const e = { zh, en, dur };
    if (line.who === 'ally') { const a = CHARS[S.ally]; Object.assign(e, { speaker: a.name, portrait: a.id, side: 'shu' }); }
    else if (line.who !== 'hero') { const p = S.ch.SPK[line.who]; Object.assign(e, { speaker: p.name, portrait: { seal: p.seal }, side: p.side }); }
    S.q.push(e);
  };

  // ---- triggers (every key of an object must hold; an array = any one of its objects)
  const officerFrac = (k) => { const i = S.off[k]; return S.dead[k] ? 0 : i >= 0 ? game.crowd.hp[i] / game.crowd.hpMax[i] : 1; };
  /** A standing Wei soldier or officer within r m of the hero. */
  const weiNear = (r) => {
    const c = game.crowd, h = game.hero;
    for (let i = 0; i < c.N; i++) { const s = c.st[i]; if (s !== ST.OFF && s !== ST.DEAD && (c.x[i] - h.x) ** 2 + (c.z[i] - h.z) ** 2 < r * r) return true; }
    return false;
  };
  const holds = (w) => {
    if (!w) return true;
    if (Array.isArray(w)) return w.some(holds);
    const h = game.hero;
    if (w.wait != null && S.t - S.beatT < w.wait) return false;
    if (w.kos != null && h.kos - S.koBase < w.kos) return false;
    if (w.zone && h.z < nearZ(w.zone)) return false;
    if (w.at && h.z < pos(w.at)[1]) return false;
    if (w.down && !S.dead[w.down]) return false;
    if (w.below && officerFrac(w.below[0]) >= w.below[1]) return false;
    if (w.hero && S.char !== w.hero) return false;
    if (w.reach) {                                                     // P, or an escort's key (his position)
      const t = w.reach[0], i = typeof t === 'string' ? S.esc[t] : -1, [x, z] = i >= 0 ? [game.crowd.x[i], game.crowd.z[i]] : typeof t === 'string' ? [1e9, 1e9] : pos(t);
      if (Math.hypot(h.x - x, h.z - z) > w.reach[1]) return false;
    }
    if (w.clear != null && weiNear(w.clear)) return false;
    if (w.safe) { const i = S.esc[w.safe[0]]; if (i === undefined || game.crowd.z[i] < pos(w.safe[1])[1]) return false; }
    if (w.held && !S.held) return false;
    if (w.broke && !S.broke) return false;
    return true;
  };

  function fire(b) {
    const c = game.crowd, h = game.hero;
    if (b.win) { S.won = S.t; S.q.length = 0; S.sayUntil = 0; }       // victory: drop pending chatter, its line goes out first
    if (b.retire) c.retire(b.retire === true ? h.z - 45 : pos(b.retire)[1]);   // stage change: idle blocks far behind (or south of P) leave
    for (const a of b.allies || []) c.spawnAllies(a);                   // Shu blocks { x, z, n, cols, hold } (metres)
    for (const q of b.squads || []) { const [x, z] = pos(q.at); c.spawnSquad({ x, z, n: q.n, cols: q.cols, charge: !!q.charge }); }
    for (const k in b.officers || {}) {                                // spawned on the next steps (retried while slots are full)
      const o = b.officers[k], d = S.ch.OFF[o.like || k];
      const [x, z] = pos(o.at);
      S.want[k] = { x, z, name: d.name, hp: d.hp, boss: !!d.boss, engaged: !!o.engaged };
      S.off[k] = -1; S.dead[k] = false;
    }
    if (b.waves != null) c.setWaves(b.waves);
    if (b.limit) { S.limit = c.zMax = b.limit.z ? pos(b.limit.z)[1] : Infinity; S.nag = b.limit.nag || null; }   // crowd: waves spawn inside it
    if (b.heal && !h.dead) h.hp = Math.min(h.hpMax, h.hp + b.heal * game.diff.heal * h.hpMax);
    if (b.morale != null) S.mBase = b.morale === 1 ? 1 : S.mBase + b.morale;
    if (b.gate) setGate(b.gate, true);
    if (b.escort) {                                                    // one named Shu ally the hero must bring out alive
      const e = b.escort, [x, z] = pos(e.at);
      let i = -1;
      for (let k = c.N; k < c.T; k++) if (c.st[k] === ST.OFF) { i = k; break; }  // spawnAllies fills the lowest free ally slot
      if (i >= 0) {
        c.spawnAllies({ x, z, n: 1, cols: 1, hold: true });
        c.hp[i] = c.hpMax[i] = e.hp ?? 300;
        S.esc[e.key] = i; S.off[e.key] = i; S.escName = e.name;
      }
    }
    if (b.saved) delete S.esc[b.saved];
    if (b.volley) {                                                    // crossbows from the walls: a blow-away volley on the Wei ranks
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
    if (b.obj) { emit('story:objective', { zh: b.obj.zh, en: b.obj.en }); S.go = b.obj.go; }
    for (const l of b.say || []) say(l);
  }

  st.reset = ({ mode = 'free', char = 'zhaoyun' } = {}) => {
    Object.assign(S, { mode, char, ally: char === 'huangzhong' ? 'zhaoyun' : 'huangzhong', t: 0, done: false, maxChain: 0,
      downT: -1, dmg: 0, beat: 0, beatT: 0, koBase: 0, off: {}, want: {}, dead: {}, q: [], sayUntil: 0, limit: Infinity, nag: null,
      nagT: -999, mBase: 0.4, won: -1, go: null, ch: chapter(mapId()), esc: {}, escName: null, atk: false, calm: null, calmT: 0, held: false, broke: false });
    game.timeScale = 1;
    st.target = null;
    if (mode === 'story') for (const id in GATES) setGate(id, false);   // spawnPoint() opened them all; the script opens each
    st.morale = mode === 'story' ? 0.4 : undefined;
    const c = game.crowd;
    if (mode === 'free') { c.spawnArmy(); c.spawnAllies({ x: 0, z: -9, n: 24, cols: 6 }); }
    else for (const a of S.ch.CHAPTER.allies) c.spawnAllies(a);
    c.setAllies(true);
    // story: the first beat spawns the field on step 1 — after main.js's 'scenario' reset of the HUD, so its objective sticks
  };

  st.step = () => {
    const h = game.hero, c = game.crowd;
    if (S.done) return;
    S.t++;
    if (h.combo > S.maxChain) S.maxChain = h.combo;
    if (S.mode === 'free') { if (game.frame === 185) emit('story:say', { ...h.char.lines.intro, dur: 300 }); return; }   // the hero's opening line

    // victory: slow-mo on the killing blow (0.3× for ~5 s of wall time, eased back), the hero untouchable, then results
    if (S.won >= 0) {
      const k = S.t - S.won;
      game.timeScale = k < 90 ? 0.3 : Math.min(1, 0.3 + (k - 90) / 60 * 0.7);
      h.iframes = Math.max(h.iframes, 2);
      if (k >= 300) S.end(true);
    } else if (S.downT >= 0) { if (S.t - S.downT >= 120) S.end(false); return; }     // 2 s on the ground, then defeat
    // an escort falls: his cry, 2 s, then defeat
    for (const k in S.esc) if (S.won < 0 && S.downT < 0 && c.st[S.esc[k]] === ST.DEAD) {
      S.downT = S.t; delete S.esc[k];
      emit('story:banner', { html: `<em>${S.escName?.zh ?? ''}</em> 陣亡`, en: `${S.escName?.en ?? ''} has fallen`, dur: 150, big: true });
    }

    // calm hold (a beat's `calm`): stand within r of the spot, don't strike, for `frames` in a row. Stepping out of the
    // circle restarts the count; a strike (or a Musou) after the first 1.5 s breaks it for good. The objective counts the seconds down.
    if (S.calm) {
      const C = S.calm;
      if (S.atk && S.t - C.t0 > 90) { S.broke = true; S.calm = null; }       // 1.5 s grace: a combo already under way finishes
      else if (Math.hypot(h.x - C.x, h.z - C.z) <= C.r) {
        if (++S.calmT >= C.frames) { S.held = true; S.calm = null; }
        else if (C.obj && S.calmT % 60 === 1) emit('story:objective', { zh: `${C.obj.zh} ${Math.ceil((C.frames - S.calmT) / 60)}`, en: `${C.obj.en} ${Math.ceil((C.frames - S.calmT) / 60)}s` });
      } else S.calmT = 0;
    }
    S.atk = false;
    const BEATS = S.ch.BEATS;
    while (S.beat < BEATS.length) {
      const b = BEATS[S.beat];
      if (b.skip && holds(b.skip)) { S.beat++; continue; }
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

    // stage gate: the hero can't run past the stage he is on (a nag line explains, at most every 10 s)
    if (h.z > S.limit) {
      h.z = S.limit; if (h.vz > 0) h.vz = 0;
      if (S.nag && S.t - S.nagT > 600 && !S.q.length && S.t >= S.sayUntil) { S.nagT = S.t; say(S.nag); }
    }

    // dialogue queue
    if (S.q.length && S.t >= S.sayUntil) { const e = S.q.shift(); emit('story:say', e); S.sayUntil = S.t + e.dur + DLG_GAP; }

    // HUD reads: objective arrow target, morale (stage morale + a little per KO, eased)
    const g = S.go;
    if (typeof g === 'string') { const i = S.off[g]; st.target = i >= 0 ? { x: c.x[i], z: c.z[i] } : S.want[g] ? { x: S.want[g].x, z: S.want[g].z } : null; }
    else if (g) { const [x, z] = pos(g); st.target = { x, z }; }
    else st.target = null;
    const m = S.mBase >= 1 ? 1 : clamp01(S.mBase + h.kos * 0.0004 + (c.allyKos - c.allyLost) * 0.0006);
    st.morale += (Math.min(0.95, Math.max(0.08, m)) - st.morale) * 0.03;
  };

  /** DW-style rank from KOs, clear time and damage taken: 3 points each (+ game.diff.rankBonus), S ≥ 8, A ≥ 6, B ≥ 4,
   *  else C; never above game.diff.rankMax (初級 tops out at A). */
  function rank({ kos, time, dmg, hpMax }) {
    const p = (kos >= 2000 ? 3 : kos >= 1200 ? 2 : kos >= 600 ? 1 : 0) + (time <= 540 ? 3 : time <= 720 ? 2 : time <= 900 ? 1 : 0) +
      (dmg <= hpMax * 0.35 ? 3 : dmg <= hpMax * 0.7 ? 2 : dmg <= hpMax * 1.1 ? 1 : 0);
    const d = game.diff, q = p + d.rankBonus, r = q >= 8 ? 'S' : q >= 6 ? 'A' : q >= 4 ? 'B' : 'C';
    return r === 'S' && d.rankMax === 'A' ? 'A' : r;
  }
  return st;
}
