// NPC key characters: story figures who take the field only as hero-model actors (game.actors, src/actors/actors.js) —
// never on the select screen. NPCS id → { id, name {zh, en}, courtesy {zh, en}, seal (HUD boss-bar seal), kit } — the
// actor-facing half of a CHARS entry (src/chars/index.js), so game.actors.spawn(key, { kit: id }) resolves either one. The
// kits come from ./kit.js (npcKit: a model def + a weapon-class clip set with its boss attack table).
import { npcKit } from './kit.js';
import * as SWORD from './sword.js';
import * as POLEARM from './polearm.js';
import { DEF as CAOCAO } from './caocao.js';
import { DEF as ZHANGLIAO } from './zhangliao.js';
import { DEF as XIAHOUYUAN } from './xiahouyuan.js';

export const NPCS = {
  caocao: { id: 'caocao', name: { zh: '曹操', en: 'Cao Cao' }, courtesy: { zh: '孟德', en: 'Mengde' }, seal: '奸雄', kit: npcKit(CAOCAO, SWORD) },
  zhangliao: { id: 'zhangliao', name: { zh: '張遼', en: 'Zhang Liao' }, courtesy: { zh: '文遠', en: 'Wenyuan' }, seal: '雁門', kit: npcKit(ZHANGLIAO, POLEARM) },
  xiahouyuan: { id: 'xiahouyuan', name: { zh: '夏侯淵', en: 'Xiahou Yuan' }, courtesy: { zh: '妙才', en: 'Miaocai' }, seal: '虎步', kit: npcKit(XIAHOUYUAN, POLEARM) },
};
