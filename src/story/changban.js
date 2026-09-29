// 第二章「長坂坡」 — PLACEHOLDER chapter (phase A): the real CH metadata plus a tiny playable script on the 定軍山 map
// (2 squads, 1 officer, the win on his KO). Phase B replaces this module wholesale (format: ./chapters.js header).
// History (208 AD, 當陽): 曹操's light horse overtake 劉備's column of refugees at 長坂; 趙雲 rides through the host to
// save 阿斗 (taking 夏侯恩's 青釭劍 on the way); 張飛 holds the bridge over the river alone (據水斷橋).

export const CH = {
  id: 'changban', num: { zh: '第二章', en: 'CHAPTER II' }, title: { zh: '長坂坡', en: 'Changban' },
  seal: '當陽之戰', era: { zh: '建安十三年', en: '208 AD' },
  map: 'dingjun',                                  // PLACEHOLDER: the 長坂坡 map (C1) replaces it
  heroes: ['zhaoyun', 'zhangfei'],
  ally: { zhaoyun: 'zhangfei', zhangfei: 'zhaoyun' },
  army: { foe: 'cao', ally: 'liu' },
  van: [{ x: -5.575, z: -121.6, n: 12, cols: 4, hold: true }, { x: 5.575, z: -121.6, n: 12, cols: 4, hold: true }],
  hq: [4, 208],
  rank: { kos: [150, 300, 500], time: [150, 240, 360] },
};

export const SPK = {
  liubei: { name: { zh: '劉備', en: 'Liu Bei' }, seal: '劉', side: 'shu' },
  xiahouen: { name: { zh: '夏侯恩', en: 'Xiahou En' }, seal: '恩', side: 'wei' },
};
export const OFF = { xiahouen: { name: { zh: '夏侯恩', en: 'XIAHOU EN' }, hp: 900, boss: true } };

export const BEATS = [
  {
    when: { wait: 30 },
    obj: { zh: '擊破曹軍追兵將 夏侯恩', en: 'Defeat the pursuing officer, Xiahou En', go: 'xiahouen' },
    squads: [{ at: ['ford', -0.4, -0.2], n: 22 }, { at: ['ford', 0.4, 0.1], n: 22 }],
    officers: { xiahouen: { at: ['ford', 0, 0.3] } },
    limit: { z: ['pass', 0, -1] },
    say: [
      { who: 'liubei', zh: '曹軍追兵已至，百姓何辜！', en: 'Cao Cao\'s horsemen are upon us. What have these people done to deserve this?' },
      { who: 'hero', zhaoyun: ['主公勿憂，子龍必護少主周全！', 'Fear not, my lord. I will keep your son safe!'],
        zhangfei: ['哥哥先走，俺來斷後！', 'Go on, brother. I\'ll hold the rear!'] },
      { who: 'xiahouen', zh: '青釭寶劍在此，誰敢擋我！', en: 'I bear the Qinggang blade. Who dares stand in my way?' },
    ],
  },
  {
    when: { down: 'xiahouen' },
    win: true, waves: false, morale: 1,
    banner: { html: '敵將 <em>夏侯恩</em> 討取！', en: 'Xiahou En has fallen!', dur: 260, big: true },
    say: [{ who: 'hero', zh: '追兵已破，速護百姓渡河！', en: 'The pursuit is broken. Get the people across the river!' }],
  },
];

export const PL_MAP = {
  art: `<g class="pl-labels">
    <g class="pl-mark wei" data-id="fancheng"><rect x="700" y="170" width="36" height="36" rx="3"/><text x="660" y="250">樊城</text></g>
    <g class="pl-mark" data-id="changban"><text x="640" y="520">長坂</text><text class="sm" x="760" y="580">當陽</text></g>
    <g class="pl-mark" data-id="jiangling"><rect x="560" y="760" width="30" height="30" rx="3"/><text x="610" y="790">江陵</text></g>
  </g>`,
  arrows: [
    ['liu', 'shu', 'M730 230 C700 350 680 420 640 480'],
    ['cao', 'wei', 'M1050 180 C950 300 850 400 740 470'],
  ],
};

export const PROLOGUE = [
  { cols: ['建安十三年秋', '曹操大軍南下', '劉備棄樊城而走'], en: 'Autumn, 208 AD. Cao Cao marches south in force; Liu Bei abandons Fancheng and flees.',
    show: ['liu', 'fancheng', 'jiangling'], focus: [700, 450, 1.1] },
  { cols: ['十餘萬百姓相隨', '曹軍輕騎追至', '當陽長坂'], en: 'A hundred thousand refugees follow him, and Cao Cao\'s light horse overtake them at Changban, by Dangyang.',
    show: ['cao', 'changban'], focus: [760, 480, 1.25] },
];

export const EPILOGUE = {
  zhaoyun: {
    zh: ['趙雲懷抱阿斗，於曹軍百萬之中七進七出。', '張飛據水斷橋，一聲斷喝，曹軍無人敢近。'],
    en: ['Zhao Yun rode seven times into Cao Cao\'s host and seven times out again, with Liu Bei\'s infant son in his arms.',
      'Zhang Fei held the bridge alone, and at his roar not one of Cao Cao\'s men dared come near.'],
  },
};
