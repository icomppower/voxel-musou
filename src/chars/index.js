// Character registry: metadata for the title / select / HUD / story screens, plus each character's kit (what the generic
// hero, combat, musou, vfx and audio code reads from game.hero.kit instead of importing a character's modules).
//
// char = {
//   id
//   name {zh, en}, courtesy {zh, en}, seal (red HUD seal: 2 glyphs), title {zh, en} (epithet), motto (HUD intro subline)
//   weapon {zh, en}, bio {zh: [2 lines], en: [2 lines]}, stats {atk, def, speed, range} 1-5, musou {zh, en} (Musou name)
//   accent             CSS colour of the character (select screen / HUD highlights)
//   lines              voice lines the HUD / story show: intro (battle start), musouEnd (shout after the Musou) {zh, en};
//                      copy: [2 short lines] of vertical calligraphy shown while the Musou plays
//   portrait {face, pal} 20×20 pixel portrait: rows of palette keys ('.' = clear), shared by the HUD badge, dialogue and
//                      select screen (paintPortrait below)
//   story              false = free battle only (the story script has no lines for this officer yet); default true
//   kit                see below
// }
//
// kit = {
//   moves              move table (format: src/hero/moves.js header), prepared with prepMoves (src/hero/moveset.js); every
//                      kit has n1 c1 dash jatk jc (combo.js starts these from neutral); an `aim` move = aim mode (hud.js)
//   airChainMax        air-string length per jump
//   clips              clip registry sampled by heroPose (attack + locomotion + musou clips; ids = move ids / states:
//                      idle run dodge air airFall land hurt + whatever the musou sets in h.musouClip); a clip id that
//                      is a move id is an attack clip (short 5-frame blend in)
//   feet               { moveId: (u, pose) => void } baked feet applied over a borrowed clip (moves.js `anim`)
//   runPose(phase, k, out, lean), rollPose(u, out)   procedural run / dive roll poses
//   dashPlant          dash move frame where the lunge lands (footstep dust), or -1
//   model(rig) → { material, meshes }            voxel model on the shared rig (src/hero/rig.js)
//   secondary(scene, rig, material, hero?) → { update(dt), reset() }   cloth / hair chains (hero: the battle view's)
//   trail              weapon ribbon {base, baseHeavy, tip} (m along the rig's weapon, vfx.js spearWorld) or null = none
//   createMusou(game) → musou sim (interface: src/musou/musou.js createMusou — active, t, reset, start(inp),
//                      stepHero(inp), shot(), ready(), step(), optional aimShot() (camera.js aim shot); emits musou:* events;
//                      hits via game.combat.strike(..., 'musou'))
//   createMusouView(scene, game, camera) → { update(dt), dispose() }   render-only
// }
import { ZHAOYUN_KIT } from './zhaoyun/kit.js';
import { HUANGZHONG_KIT } from './huangzhong/kit.js';
import { GUANYU_KIT } from './guanyu/kit.js';

const ZY_FACE = [
  '....................',
  '.......KKKKK........',
  '.....KKKKKKKKK......',
  '....KKKKKKKKKKKK....',
  '...KKKkkKKKKKKKKK...',
  '...KKKKKKKKKKKKKKKK.',
  '...KTTTTTTTTTTTTKKTt',
  '...KKKKKKKKKKKKKKKtT',
  '...KKKSKKKKKSKKKKKKt',
  '...KKSSSSSSSSSSKKKKK',
  '...KKEESSSSSSEEKKKK.',
  '...KKSwESSSSwESKKKK.',
  '...KKSSSSSsSSSSKKK..',
  '....KSSSSSsSSSSKKK..',
  '....KsSSSSSSSSsKK...',
  '.....sSSSMMSSSsKK...',
  '......ssSSSSssKK....',
  '...WWTtssssssTtWW...',
  '.WWWWWWTWWWWTWWWWW..',
  'WWwwWWWWTWWTWWWWwwW.',
];
// Huang Zhong: grey topknot, red headband, heavy brows, white moustache and long beard, gold lamellar collar
const HZ_FACE = [
  '....................',
  '.......GGGGG........',
  '.....GGGGGGGGG......',
  '....GGGGGGGGGGGG....',
  '...GGGggGGGGGGGGG...',
  '...GGGGGGGGGGGGGGG..',
  '...GRRRRRRRRRRRRGGRr',
  '...GGGGGGGGGGGGGGGrR',
  '...GGSSSSSSSSSSGGGGr',
  '...GGSkkSSSSkkSGGGG.',
  '...GGEESSSSSSEEGGGG.',
  '...GGSwESSSSwESGGG..',
  '...GGSSSSSsSSSSGGG..',
  '....GSSggGGggSSGG...',
  '....GSGGGMMGGGSG....',
  '.....GGGGGGGGGGG....',
  '......GgGGGGGgG.....',
  '...YYyGGGGGGGyYY....',
  '.YYYYYYyGgGyYYYYY...',
  'YYyyYYYYyGyYYYYyyY..',
];
// Guan Yu: green hood with a gold band and jade stone, the red face, heavy brows, phoenix eyes, the long black beard over
// jade lamellar
const GY_FACE = [
  '....................',
  '.......HHHHH........',
  '.....HHHHHHHHH......',
  '....HHHhhHHHHHHH....',
  '...HHHHHHHHHHHHHH...',
  '...HYYYYYYJYYYYYHh..',
  '...HHFFFFFFFFFFHHhh.',
  '...HBBBFFFFFFBBBHh..',
  '...HFFBEEFFEEBFFHH..',
  '...HFFEwEFFEwEFFHH..',
  '...HFFFFFFfFFFFFHH..',
  '....FFFFFFfFFFFFH...',
  '....FBBBFFFFBBBFH...',
  '....BBBBBMMBBBBB....',
  '....BBBBBBBBBBBB....',
  '.....BBBBBBBBBB.....',
  '...WWWBBBBBBBBWWW...',
  '.WWWWWWBBBBBBWWWWW..',
  'WWggWWWWBBBBWWWWggW.',
  'WWWWWWWWWBBWWWWWWWWW',
];
const GY_PAL = { H: '#2a6040', h: '#1a4029', Y: '#c9a049', J: '#2fbf8a', F: '#b3472f', f: '#7e2c20', B: '#141016', E: '#140c0c', w: '#ffffff', M: '#5a1a14', W: '#2f6e46', g: '#4e9466' };
const PAL = { K: '#1d1514', k: '#4a3834', S: '#efc3a0', s: '#c38a6c', E: '#140c0c', M: '#7e3a2e', T: '#3fb8b0', t: '#1f5f5c',
  W: '#efe8de', w: '#ffffff', G: '#dcd6cc', g: '#9a948a', R: '#b3261e', r: '#6e1712', Y: '#d9a53a', y: '#8a5a1a' };

export const CHARS = {
  zhaoyun: {
    id: 'zhaoyun',
    name: { zh: '趙雲', en: 'Zhao Yun' }, courtesy: { zh: '子龍', en: 'Zilong' }, seal: '常山',
    title: { zh: '常山龍膽', en: 'The Dragon of Changshan' }, motto: '常山龍膽 · 單騎無雙 · 義貫雲天',
    weapon: { zh: '龍膽槍', en: 'Dragon-Heart Spear' },
    bio: {
      zh: ['常山真定人，一杆長槍，長坂坡單騎救主。', '先主讚曰：「子龍一身都是膽也。」'],
      en: ['A spearman of Changshan who rode alone through Cao Cao\'s host at Changban.', 'Liu Bei said of him: "Zilong is courage through and through."'],
    },
    stats: { atk: 4, def: 3, speed: 5, range: 3 }, musou: { zh: '蒼龍破陣', en: 'Azure Dragon Breach' }, accent: '#3fb8b0',
    lines: {
      intro: { zh: '主公之子在此，趙雲誓死護之！', en: 'My lord\'s son is in my care. None of you shall pass!' },
      musouEnd: { zh: '吾乃常山趙子龍也！', en: 'I am Zhao Zilong of Changshan!' },
      copy: ['長槍所向', '百軍皆破'],
    },
    portrait: { face: ZY_FACE, pal: PAL },
    kit: ZHAOYUN_KIT,
  },
  huangzhong: {
    id: 'huangzhong',
    name: { zh: '黃忠', en: 'Huang Zhong' }, courtesy: { zh: '漢升', en: 'Hansheng' }, seal: '老將',
    title: { zh: '老當益壯', en: 'The Veteran Who Never Ages' }, motto: '老當益壯 · 百步穿楊 · 定軍斬將',
    weapon: { zh: '破軍弓', en: 'Army-Breaker Longbow' },
    bio: {
      zh: ['南陽人，年近七旬，開硬弓百發百中。', '定軍山一戰，陣斬夏侯淵，威震漢中。'],
      en: ['A Nanyang veteran near seventy whose great bow never misses.', 'At Mount Dingjun he cut down Xiahou Yuan and shook all Hanzhong.'],
    },
    stats: { atk: 4, def: 3, speed: 2, range: 5 }, musou: { zh: '百步穿楊', en: 'Hundred-Pace Volley' }, accent: '#d9a53a',
    lines: {
      intro: { zh: '老將黃忠在此！誰敢與我一戰？', en: 'Old Huang Zhong stands here! Who dares face me?' },
      musouEnd: { zh: '老夫寶刀未老！', en: 'This old blade has not dulled!' },
      copy: ['一矢既出', '萬軍辟易'],
    },
    portrait: { face: HZ_FACE, pal: PAL },
    kit: HUANGZHONG_KIT,
  },
  guanyu: {
    id: 'guanyu',
    name: { zh: '關羽', en: 'Guan Yu' }, courtesy: { zh: '雲長', en: 'Yunchang' }, seal: '武聖',
    title: { zh: '美髯公', en: 'Lord of the Magnificent Beard' }, motto: '武聖 · 青龍偃月 · 義薄雲天',
    weapon: { zh: '青龍偃月刀', en: 'Green Dragon Crescent Blade' },
    bio: {
      zh: ['河東解良人，赤面長髯，義重如山。', '溫酒斬華雄，千里走單騎，威震華夏。'],
      en: ['A man of Jieliang with a red face and a long beard, whose loyalty never bent.', 'He cut down Hua Xiong before the wine went cold and rode a thousand li alone.'],
    },
    stats: { atk: 5, def: 4, speed: 2, range: 4 }, musou: { zh: '青龍偃月・天崩', en: 'Crescent Moon, the Sky Falls' }, accent: '#4fc08d',
    lines: {
      intro: { zh: '關雲長在此！插標賣首之徒，還不退下！', en: 'Guan Yunchang stands here! Stand aside, or lose your heads!' },
      musouEnd: { zh: '青龍偃月，所向無敵！', en: 'Before the Crescent Blade, none stand!' },
      copy: ['偃月一落', '天崩地裂'],
    },
    portrait: { face: GY_FACE, pal: GY_PAL },
    story: false,
    kit: GUANYU_KIT,
  },
};
export const CHAR_ORDER = ['zhaoyun', 'huangzhong', 'guanyu'];

/** Paint a char's 20×20 portrait into a canvas (width/height 20; scale it with CSS, image-rendering: pixelated). */
export function paintPortrait(cv, char) {
  const g = cv.getContext('2d'), { face, pal } = char.portrait;
  g.clearRect(0, 0, cv.width, cv.height);
  face.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
}
