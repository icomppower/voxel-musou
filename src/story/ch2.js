// 第二章「赤壁」 — chapter data for the Red Cliffs battlefield (world/map.js 'chibi'): speakers, the battle script
// (BEATS, same format as ./ch1.js), the officers, the prologue scroll over the Yangtze and the epilogue.
// History (208 AD, 赤壁之戰): 孫權 and 劉備 ally against 曹操's southern campaign; 周瑜 commands, 諸葛亮 advises;
// 黃蓋 feigns surrender and drives fire boats into the chained fleet on the east wind; the allies land and storm the
// naval camp; 曹操 flees by 華容道. Played as either Shu officer: `hero` = the chosen one, `ally` = the other one.
// The field runs along +Z: the allied landing (z ≈ -90) → the shore under the cliffs → the north road → the stockade
// gate (z ≈ 84) → the 帥 command tower (z ≈ 118).

export const SPK = {
  zhouyu: { name: { zh: '周瑜', en: 'Zhou Yu' }, seal: '瑜', side: 'shu' },
  zhuge: { name: { zh: '諸葛亮', en: 'Zhuge Liang' }, seal: '亮', side: 'shu' },
  huanggai: { name: { zh: '黃蓋', en: 'Huang Gai' }, seal: '蓋', side: 'shu' },
  caocao: { name: { zh: '曹操', en: 'Cao Cao' }, seal: '曹', side: 'wei' },
  caimao: { name: { zh: '蔡瑁', en: 'Cai Mao' }, seal: '蔡', side: 'wei' },
  zhangyun: { name: { zh: '張允', en: 'Zhang Yun' }, seal: '允', side: 'wei' },
  zhangliao: { name: { zh: '張遼', en: 'Zhang Liao' }, seal: '遼', side: 'wei' },
  caoren: { name: { zh: '曹仁', en: 'Cao Ren' }, seal: '仁', side: 'wei' },
  xuchu: { name: { zh: '許褚', en: 'Xu Chu' }, seal: '褚', side: 'wei' },
  soldier: { name: { zh: '曹軍兵', en: 'Wei Soldier' }, seal: '兵', side: 'wei' },
};

// officers (crowd.spawnOfficer). The four field commanders fall one per stage; 曹操 (boss) comes out of the 帥 tower
// with his guard of named mini-bosses, and his 虎豹騎 riders join at half HP. HP as ch1: 520 ≈ 5 full combos.
export const OFF = {
  caimao: { name: { zh: '蔡瑁', en: 'CAI MAO' }, hp: 650 },
  zhangyun: { name: { zh: '張允', en: 'ZHANG YUN' }, hp: 650 },
  zhangliao: { name: { zh: '張遼', en: 'ZHANG LIAO' }, hp: 1100 },
  caoren: { name: { zh: '曹仁', en: 'CAO REN' }, hp: 1200 },
  caocao: { name: { zh: '曹操', en: 'CAO CAO' }, hp: 3200, boss: true },
  xuchu: { name: { zh: '許褚', en: 'XU CHU' }, hp: 900 },
  dun: { name: { zh: '夏侯惇', en: 'XIAHOU DUN' }, hp: 900 },
  xuhuang: { name: { zh: '徐晃', en: 'XU HUANG' }, hp: 700 },
  yujin: { name: { zh: '于禁', en: 'YU JIN' }, hp: 600 },
  lejin: { name: { zh: '樂進', en: 'YUE JIN' }, hp: 600 },
  lidian: { name: { zh: '李典', en: 'LI DIAN' }, hp: 600 },
  caochun: { name: { zh: '曹純', en: 'CAO CHUN' }, hp: 800 },
  caohong: { name: { zh: '曹洪', en: 'CAO HONG' }, hp: 700 },
  rider: { name: { zh: '虎豹騎', en: 'TIGER RIDER' }, hp: 360 },
};

export const CHAPTER = {
  map: 'chibi',
  label: ['第二章「赤壁」', 'Story · Chapter II · Red Cliffs'],
  head: '第二章 赤壁 · CHAPTER II · RED CLIFFS',
  allies: [{ x: -5, z: -108, n: 12, cols: 4 }, { x: 9, z: -108, n: 12, cols: 4 }],   // the landing party behind him
  prologue: true,
};

const NAG = { who: 'zhouyu', zh: '將軍莫急！前方敵勢未破，不可孤軍深入。', en: 'Not so fast, General! The way ahead isn\'t broken yet.' };
const NAG_GATE = { who: 'zhuge', zh: '水寨營門有曹仁死守，須先將其擊破。', en: 'Cao Ren holds the camp gate. He must fall first.' };
const CAMP = ['stockade', 0, -0.3];            // just inside the stockade gate (z ≈ 89)
const COURT = ['stockade', 0, 0.2];            // before the 帥 tower (z ≈ 108)

// Pacing (default difficulty): landing 1 min · shore two duels 2-3 min · north road + gate 2 min · 曹操 and his guard
// 3-4 min. Officers come forward only after the hero has fought a while (kos / wait), like ch1.
export const BEATS = [
  // ---- 聯軍登岸: the fleet burns behind the cliffs, the allies hit the beach
  {
    when: { wait: 30 },
    obj: { zh: '殺出登岸灘頭', en: 'Fight your way off the landing', go: ['landing', 0, 0.85] },
    squads: [{ at: ['landing', -0.45, 0.35], n: 22 }, { at: ['landing', 0.45, 0.4], n: 22 }, { at: ['landing', 0, 0.75], n: 26 },
      { at: ['shore', -0.1, -0.6], n: 24 }],
    limit: { z: ['shore', 0, -0.35], nag: NAG },
    morale: 0,
    say: [
      { who: 'huanggai', zh: '東風起矣！火船已入曹營，連環船一艘也逃不掉！', en: 'The east wind is up! The fire boats are in — not one chained ship will escape!' },
      { who: 'zhouyu', zh: '全軍登岸！趁曹軍大亂，直搗其水寨！', en: 'All troops ashore! Strike their naval camp while they burn!' },
      { who: 'hero', huangzhong: ['火光沖天，正是老夫殺敵之時！', 'The sky is on fire. A fine hour for an old soldier!'],
        zhaoyun: ['子龍願為前鋒，殺開一條血路！', 'I\'ll lead the van and cut us a road!'] },
    ],
  },
  {
    when: [{ kos: 60 }, { wait: 40 * 60 }],
    waves: true,
    officers: { caimao: { at: ['landing', 0, 0.95], engaged: true } },
    obj: { zh: '擊破水軍都督 蔡瑁', en: 'Defeat the fleet admiral, Cai Mao', go: 'caimao' },
    say: [{ who: 'caimao', zh: '我乃荊州水軍都督蔡瑁！豈容爾等踏上此岸！', en: 'I am Cai Mao, admiral of Jing! You will not take this shore!' }],
  },

  // ---- 赤壁江岸: the beach under the cliffs, the piers and the burning fleet
  {
    when: { down: 'caimao' },
    banner: { html: '水軍都督 <em>蔡瑁</em> 討取！', en: 'Fleet admiral Cai Mao has fallen', dur: 170 },
    heal: 0.3, morale: 0.12, retire: true, hush: true,
    limit: { z: ['shore', 0, 0.55], nag: NAG },
    squads: [{ at: ['shore', -0.3, -0.25], n: 22 }, { at: ['shore', 0.35, -0.1], n: 22 }, { at: ['shore', -0.25, 0.25], n: 22 }],
    obj: { zh: '攻佔赤壁江岸', en: 'Take the shore under the Red Cliffs', go: ['shore', 0, 0] },
    say: [{ who: 'zhuge', zh: '蔡瑁已死，曹軍水師無主。江岸敵將張允，速往擊之！', en: 'Cai Mao is dead and their fleet is leaderless. Zhang Yun holds the shore. Go!' }],
  },
  {
    when: [{ at: ['shore', 0, -0.3], kos: 40 }, { wait: 45 * 60 }],
    officers: { zhangyun: { at: ['shore', 0.45, 0.05], engaged: true } },
    squads: [{ at: ['shore', 0.5, 0.3], n: 18, charge: true }, { at: ['shore', 0.45, -0.3], n: 18, charge: true }],
    obj: { zh: '擊破水軍副督 張允', en: 'Defeat the vice admiral, Zhang Yun', go: 'zhangyun' },
    say: [
      { who: 'zhangyun', zh: '船上兵馬，全數上岸迎敵！', en: 'Every man off the ships and onto the shore!' },
      { who: 'soldier', zh: '火……火燒過來了！', en: 'The fire... the fire is coming this way!' },
    ],
  },
  {
    when: { down: 'zhangyun' },
    banner: { html: '<em>赤壁江岸</em> 攻佔！', en: 'The Red Cliff shore is ours', dur: 170 },
    heal: 0.3, morale: 0.12, retire: true, hush: true, waves: false,
    limit: { z: ['stockade', 0, -0.62], nag: NAG_GATE },             // short of the stockade gate (z ≈ 76)
    obj: { zh: '北上攻向曹軍水寨', en: 'Push north to Cao Cao\'s naval camp', go: ['shore', 0, 0.9] },
    say: [{ who: 'ally', huangzhong: ['漢升將軍，北面便是曹營，子龍隨後殺到！', 'General Hansheng, Cao\'s camp lies north. I\'m right behind you!'],
      zhaoyun: ['子龍，曹營就在北面，老夫與你並肩殺進去！', 'Zilong, their camp is just north. We go in together!'] }],
  },

  // ---- 北道: 張遼 charges down the road
  {
    when: [{ at: ['shore', 0, 0.4] }, { wait: 30 * 60 }],
    waves: true,
    officers: { zhangliao: { at: ['shore', 0, 0.95], engaged: true } },
    squads: [{ at: ['shore', -0.15, 0.85], n: 20, charge: true }, { at: ['shore', 0.2, 0.9], n: 20, charge: true }],
    banner: { html: '<em>張遼</em> 率軍突擊！', en: 'Zhang Liao charges down the road!', dur: 160 },
    morale: -0.08,
    obj: { zh: '擊破張遼', en: 'Defeat Zhang Liao', go: 'zhangliao' },
    say: [
      { who: 'zhangliao', zh: '張文遠在此！誰敢上前一步！', en: 'Zhang Wenyuan stands here! Who dares take one more step?' },
      { who: 'hero', huangzhong: ['久聞張遼驍勇，今日倒要試試！', 'So this is the famous Zhang Liao. Let\'s see!'],
        zhaoyun: ['張遼！休要猖狂，看槍！', 'Zhang Liao! Enough boasting — face my spear!'] },
    ],
  },
  {
    when: { down: 'zhangliao' },
    banner: { html: '<em>張遼</em> 敗走！', en: 'Zhang Liao is beaten back', dur: 150 },
    heal: 0.3, morale: 0.12, retire: true, hush: true,
    officers: { caoren: { at: ['stockade', 0, -0.55] } },
    squads: [{ at: ['stockade', -0.12, -0.62], n: 18 }, { at: ['stockade', 0.12, -0.62], n: 18 }],
    obj: { zh: '擊破曹仁 攻破水寨營門', en: 'Defeat Cao Ren and break the camp gate', go: 'caoren' },
    say: [{ who: 'caoren', zh: '我曹子孝守城，從無失手！水寨之門，休想通過！', en: 'Cao Zixiao has never lost a wall. You will not pass this gate!' }],
  },
  {
    when: { down: 'caoren' },
    limit: { z: null }, heal: 0.35, morale: 0.15, retire: true, hush: true, waves: false,
    banner: { html: '<em>曹軍水寨</em> 營門攻破！', en: 'The gate of Cao Cao\'s naval camp is broken!', dur: 180 },
    obj: { zh: '攻入曹軍水寨', en: 'Storm the naval camp', go: CAMP },
    squads: [{ at: ['stockade', -0.2, -0.05], n: 20 }, { at: ['stockade', 0.25, 0], n: 20 }],
    say: [
      { who: 'zhuge', zh: '曹操就在水寨帥台之上！將軍，此戰就在此一舉！', en: 'Cao Cao himself is on the command tower. General, everything rides on this!' },
    ],
  },

  // ---- 曹軍水寨: 曹操 and his guard of officers
  {
    when: { at: CAMP },
    banner: { html: '敵總大將 <em>曹操</em> 現身！', en: 'Enemy commander Cao Cao takes the field — and his officers with him!', dur: 200, big: true },
    waves: true, morale: -0.12,
    officers: {
      caocao: { at: COURT },
      xuchu: { at: ['stockade', -0.12, 0.05], engaged: true }, dun: { at: ['stockade', 0.12, 0.05], engaged: true },
      xuhuang: { at: ['stockade', -0.3, 0.15], engaged: true }, yujin: { at: ['stockade', 0.3, 0.15], engaged: true },
      lejin: { at: ['stockade', -0.2, 0.35], engaged: true }, lidian: { at: ['stockade', 0.2, 0.3], engaged: true },
    },
    squads: [{ at: ['stockade', -0.35, 0.3], n: 18, charge: true }, { at: ['stockade', 0.35, 0.3], n: 18, charge: true }],
    obj: { zh: '擊破敵總大將 曹操', en: 'Defeat the enemy commander, Cao Cao', go: 'caocao' },
    say: [
      { who: 'caocao', zh: '孤縱橫天下三十年，豈懼爾等鼠輩！諸將，給孤拿下！', en: 'Thirty years I have ruled the field. Rats like you? Officers — take him!' },
      { who: 'xuchu', zh: '有我許褚在，誰也別想靠近丞相！', en: 'While Xu Chu lives, no one gets near the Chancellor!' },
      { who: 'hero', huangzhong: ['來得正好！老夫一併收拾！', 'Good — all of you at once. Saves me the walk!'],
        zhaoyun: ['長坂坡上百萬軍都攔不住我，何況爾等！', 'A million men at Changban couldn\'t stop me. Neither will you!'] },
    ],
  },
  {
    when: { below: ['caocao', 0.5] },
    skip: { down: 'caocao' },
    banner: { html: '<em>虎豹騎</em> 殺到！', en: 'Cao Cao\'s Tiger and Leopard Cavalry arrive!', dur: 170 },
    morale: -0.1,
    officers: {
      caochun: { at: ['stockade', -0.35, 0.55], engaged: true }, caohong: { at: ['stockade', 0.35, 0.5], engaged: true },
      rider1: { at: ['stockade', -0.1, 0.6], engaged: true, like: 'rider' }, rider2: { at: ['stockade', 0.1, 0.6], engaged: true, like: 'rider' },
    },
    squads: [{ at: ['stockade', -0.4, 0.6], n: 16, charge: true }, { at: ['stockade', 0.4, 0.6], n: 16, charge: true }],
    say: [
      { who: 'caocao', zh: '虎豹騎何在！護駕！', en: 'Tiger Riders! To me! Guard your lord!' },
      { who: 'ally', huangzhong: ['漢升將軍，虎豹騎交給子龍，快取曹操！', 'Leave the riders to me. Take Cao Cao!'],
        zhaoyun: ['子龍，這些騎兵老夫擋著，快取曹操！', 'I\'ll hold the riders, Zilong. Go for Cao Cao!'] },
    ],
  },
  {
    when: { down: 'caocao' },
    win: true, waves: false, morale: 1,
    banner: { html: '敵總大將 <em>曹操</em> 敗走！', en: 'Cao Cao is routed — the Red Cliffs are won!', dur: 260, big: true },
    say: [
      { who: 'caocao', zh: '……天不助我！撤，從華容道撤！', en: '...Heaven has forsaken me! Fall back — by the Huarong road!' },
      { who: 'hero', huangzhong: ['曹軍大潰！赤壁一戰，天下三分！', 'The Wei army breaks! After today, the realm is split in three!'],
        zhaoyun: ['曹賊敗走！赤壁之火，燒盡北軍！', 'Cao Cao runs! The fire of the Red Cliffs has burned the northern army away!'] },
    ],
  },
];

// ---- prologue (prologue.js; format: ./ch1.js PROLOGUE): ink-scroll cards over the middle Yangtze, 208 AD.
export const PROLOGUE = [
  { cols: ['建安十三年秋', '曹操平定北方', '親率大軍南下'], en: 'Autumn, 208 AD. Master of the north, Cao Cao marches south at the head of his armies.',
    show: ['wei1', 'changban', 'jiangling'], focus: [220, 300, 1.25] },
  { cols: ['劉備兵敗長坂', '退守夏口', '孔明東說孫權'], en: 'Routed at Changban, Liu Bei falls back to Xiakou and sends Zhuge Liang east to win over Sun Quan.',
    show: ['shu1', 'xiakou', 'river'], focus: [520, 300, 1.1] },
  { cols: ['孫權拜周瑜為都督', '率水軍三萬', '與劉備共拒曹操'], en: 'Sun Quan makes Zhou Yu grand commander; thirty thousand marines sail to stand with Liu Bei.',
    show: ['wu1', 'chaisang', 'chibi'], focus: [800, 580, 1.2] },
  { cols: ['曹軍戰船首尾相連', '屯於烏林', '黃蓋獻火攻之計'], en: 'Cao Cao chains his warships bow to stern off Wulin. Huang Gai proposes fire.',
    show: ['wei2', 'wulin', 'fleet'], focus: [540, 430, 1.35] },
  { cols: ['東南風急', '火船齊發', '烈焰照赤壁'], en: 'The southeast wind rises, the fire boats are loosed, and the flames light the Red Cliffs.',
    show: ['fire', 'flames'], focus: [600, 470, 1.5] },
];

// the handscroll map (prologue.js; format: ./ch1.js SCROLL): the Yangtze west → east across the paper, the Han joining
// at 夏口 — every place left of x ≈ 1060, clear of the calligraphy card on the right — the red cliffs on the south bank facing 烏林, Cao Cao's chained fleet moored off the north bank
const RIVER = 'M-20 470 C150 440 280 520 420 470 S560 420 640 440 S800 420 880 385 S1300 330 1620 300';
const HAN = 'M760 -20 C780 120 850 250 835 392';
const SHIPS = [0, 1, 2, 3, 4, 5].flatMap((i) => [0, 1].map((j) => [470 + i * 30 + j * 14, 418 + j * 20]));
export const SCROLL = {
  arrows: [
    ['wei1', 'wei', 'M330 10 C310 140 220 250 150 326'],
    ['shu1', 'shu', 'M262 205 C420 160 640 210 812 346'],
    ['wu1', 'shu', 'M952 598 C870 600 760 596 660 552'],
    ['wei2', 'wei', 'M180 452 C300 510 400 500 462 440'],
    ['fire', 'fire', 'M670 566 C640 522 620 492 600 462'],
  ],
  land: (peaks) => `
  <g class="pl-mtns" fill="url(#pl-mtn)" filter="url(#pl-ink)">
    ${peaks([[90, 180, 1.1], [230, 160], [520, 170, .9], [700, 150, 1.1], [900, 175], [1340, 170, 1.2], [1500, 150, .9]], 110, 90)}
    ${peaks([[120, 900, 1.2], [320, 880], [560, 905, 1.1], [760, 890, .9], [1080, 900, 1.2], [1280, 885]], 130, 100)}
  </g>
  <g class="pl-mark" data-id="chibi" fill="url(#pl-cliff)" filter="url(#pl-ink)">${peaks([[560, 560, .8], [620, 548, 1.2], [690, 562, .9]], 110, 60)}</g>
  <g class="pl-mark" data-id="river" filter="url(#pl-ink)" fill="none" stroke-linecap="round">
    <path d="${RIVER}" stroke="#6f7c78" stroke-width="46" opacity=".35"/><path d="${RIVER}" stroke="#46524f" stroke-width="9" opacity=".7"/>
    <path d="${HAN}" stroke="#6f7c78" stroke-width="24" opacity=".3"/><path d="${HAN}" stroke="#46524f" stroke-width="5" opacity=".6"/>
  </g>
  <g class="pl-mark" data-id="fleet" filter="url(#pl-ink)">
    <path d="M${SHIPS.map(([x, y]) => `${x + 9} ${y + 3}`).join(' L')}" fill="none" stroke="#24160b" stroke-width="2" opacity=".6"/>
    ${SHIPS.map(([x, y]) => `<rect x="${x}" y="${y}" width="18" height="7" rx="2" fill="#2b1d12"/>`).join('')}
  </g>
  <g class="pl-mark late" data-id="flames" filter="url(#pl-ink)">
    ${SHIPS.filter((_, i) => i % 3 !== 1).map(([x, y], i) => `<path d="M${x + 2} ${y} Q${x + 9} ${y - 30 - (i % 4) * 6} ${x + 16} ${y}Z" fill="#d2601a" opacity=".85"/>`).join('')}
    <ellipse cx="550" cy="420" rx="120" ry="44" fill="#e08a2a" opacity=".22"/>
  </g>`,
  labels: `
    <g class="pl-mark wei" data-id="jiangling"><rect x="130" y="330" width="32" height="32" rx="3"/><text x="70" y="410">江陵</text></g>
    <g class="pl-mark" data-id="changban"><text class="sm" x="200" y="215">長坂</text></g>
    <g class="pl-mark" data-id="xiakou"><rect x="818" y="352" width="34" height="34" rx="3"/><text x="866" y="382">夏口</text></g>
    <g class="pl-mark" data-id="chaisang"><rect x="946" y="580" width="34" height="34" rx="3"/><text x="900" y="560">柴桑</text></g>
    <g class="pl-mark" data-id="chibi"><text x="580" y="640">赤壁</text></g>
    <g class="pl-mark wei" data-id="wulin"><text x="440" y="370">烏林</text><text class="sm" x="580" y="370">曹操</text></g>
    <g class="pl-mark" data-id="river"><text class="sm river" x="200" y="560">長 江</text></g>`,
  stamp: { small: '第二章', big: '赤壁', seal: '火燒連環', en: 'CHAPTER II · RED CLIFFS' },
};

// ---- result screen epilogue (win), branched on the hero
export const EPILOGUE = {
  huangzhong: {
    zh: ['東風助火，連環船盡焚，黃忠隨聯軍殺入水寨，曹軍死傷無數。', '曹操自華容道敗走北還。劉備乘勢收取荊南四郡，天下三分之勢遂成。'],
    en: ['The east wind drove the fire through the chained fleet; Huang Zhong stormed the naval camp with the allies, and Wei lost men beyond counting.',
      'Cao Cao fled north by the Huarong road. Liu Bei took the four commanderies south of the Yangtze, and the realm split in three.'],
  },
  zhaoyun: {
    zh: ['赤壁火起，趙雲當先登岸，槍挑曹營諸將，直逼帥台。', '曹操倉皇自華容道北遁。孫劉聯軍大勝，天下三分自此始。'],
    en: ['As the Red Cliffs burned, Zhao Yun was first ashore; his spear cut through Cao\'s officers to the foot of the command tower.',
      'Cao Cao fled north by the Huarong road. The Sun-Liu alliance had won, and the Three Kingdoms began.'],
  },
};
