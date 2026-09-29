// 第一章「虎牢關」 — PLACEHOLDER chapter (phase A): the real CH metadata plus a tiny playable script on the 定軍山 map
// (2 squads, 1 officer, the win on his KO). Phase B replaces this module wholesale (format: ./chapters.js header).
// History (190 AD): the lords east of the passes rise against 董卓; 華雄 holds 汜水關 until 關羽 cuts him down; at
// 虎牢關 劉備 關羽 張飛 face 呂布 together (三英戰呂布).

export const CH = {
  id: 'hulao', num: { zh: '第一章', en: 'CHAPTER I' }, title: { zh: '虎牢關', en: 'Hulao Gate' },
  seal: '討董之戰', era: { zh: '初平元年', en: '190 AD' },
  map: 'dingjun',                                  // PLACEHOLDER: the 虎牢關 map (C1) replaces it
  heroes: ['liubei', 'guanyu', 'zhangfei'],
  ally: { liubei: 'guanyu', guanyu: 'zhangfei', zhangfei: 'guanyu' },
  army: { foe: 'dong', ally: 'liu' },
  van: [{ x: -5.575, z: -121.6, n: 12, cols: 4, hold: true }, { x: 5.575, z: -121.6, n: 12, cols: 4, hold: true }],
  hq: [4, 208],
  rank: { kos: [150, 300, 500], time: [150, 240, 360] },
};

export const SPK = {
  caocao: { name: { zh: '曹操', en: 'Cao Cao' }, seal: '曹', side: 'shu' },
  huaxiong: { name: { zh: '華雄', en: 'Hua Xiong' }, seal: '華', side: 'wei' },
};
export const OFF = { huaxiong: { name: { zh: '華雄', en: 'HUA XIONG' }, hp: 900, boss: true } };

export const BEATS = [
  {
    when: { wait: 30 },
    obj: { zh: '擊破董卓軍先鋒 華雄', en: 'Defeat Dong Zhuo\'s vanguard, Hua Xiong', go: 'huaxiong' },
    squads: [{ at: ['ford', -0.4, -0.2], n: 22 }, { at: ['ford', 0.4, 0.1], n: 22 }],
    officers: { huaxiong: { at: ['ford', 0, 0.3] } },
    limit: { z: ['pass', 0, -1] },
    say: [
      { who: 'caocao', zh: '華雄連斬我軍數將，誰敢出戰？', en: 'Hua Xiong has cut down general after general. Who dares face him?' },
      { who: 'hero', liubei: ['備雖不才，願與二弟同往！', 'Unworthy as I am, my brothers and I will go!'],
        guanyu: ['關某願往，斬華雄之首獻於帳下！', 'Let me go. I will lay Hua Xiong\'s head before your tent!'],
        zhangfei: ['俺張翼德來也！華雄休走！', 'Zhang Yide is here! Stand and fight, Hua Xiong!'] },
      { who: 'huaxiong', zh: '無名小卒，也敢來送死？', en: 'Nameless nobodies, come here to die?' },
    ],
  },
  {
    when: { down: 'huaxiong' },
    win: true, waves: false, morale: 1,
    banner: { html: '敵將 <em>華雄</em> 討取！', en: 'Hua Xiong has fallen!', dur: 260, big: true },
    say: [{ who: 'hero', zh: '華雄已死，聯軍進兵虎牢關！', en: 'Hua Xiong is dead. On to Hulao Gate!' }],
  },
];

export const PL_MAP = {
  art: `<g class="pl-labels">
    <g class="pl-mark wei" data-id="luoyang"><rect x="300" y="360" width="36" height="36" rx="3"/><text x="270" y="440">洛陽</text></g>
    <g class="pl-mark wei" data-id="sishui"><text x="690" y="500">汜水關</text></g>
    <g class="pl-mark" data-id="suanzao"><rect x="1230" y="520" width="30" height="30" rx="3"/><text x="1190" y="600">酸棗</text></g>
  </g>`,
  arrows: [
    ['coal', 'shu', 'M1230 540 C1100 520 960 500 830 480'],
    ['dong', 'wei', 'M340 390 C450 410 560 440 660 460'],
  ],
};

export const PROLOGUE = [
  { cols: ['初平元年', '關東諸侯起兵', '共討董卓'], en: '190 AD. The lords east of the passes raise their armies against the tyrant Dong Zhuo.',
    show: ['coal', 'suanzao', 'luoyang'], focus: [800, 470, 1.1] },
  { cols: ['董卓遣華雄', '據守汜水關', '連斬聯軍數將'], en: 'Dong Zhuo sends Hua Xiong to hold Sishui Pass; general after general of the coalition falls to him.',
    show: ['dong', 'sishui'], focus: [640, 460, 1.2] },
];

export const EPILOGUE = {
  liubei: {
    zh: ['關羽溫酒斬華雄，聯軍士氣大振。', '其後劉關張三英戰呂布於虎牢關前，名震天下。'],
    en: ['Guan Yu slew Hua Xiong before his wine could cool, and the coalition took heart.',
      'Then, before Hulao Gate, the three sworn brothers stood together against Lü Bu, and their names rang across the land.'],
  },
};
