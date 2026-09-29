// 第三章「赤壁」 — PLACEHOLDER chapter (phase A): the real CH metadata plus a tiny playable script on the 定軍山 map
// (2 squads, 1 officer, the win on his KO). Phase B replaces this module wholesale (format: ./chapters.js header).
// History (winter 208 AD): 孫權 and 劉備 ally against 曹操's chained fleet at 赤壁; 諸葛亮 calls the east wind, 黃蓋's
// fire ships burn the fleet (火燒連環船), and 曹操 flees north by 烏林 and 華容道.

export const CH = {
  id: 'chibi', num: { zh: '第三章', en: 'CHAPTER III' }, title: { zh: '赤壁', en: 'Red Cliffs' },
  seal: '火燒連環', era: { zh: '建安十三年冬', en: 'Winter, 208 AD' },
  map: 'dingjun',                                  // PLACEHOLDER: the 赤壁 map (C1) replaces it
  heroes: ['zhugeliang', 'zhaoyun'],
  ally: { zhugeliang: 'zhaoyun', zhaoyun: 'zhugeliang' },
  army: { foe: 'cao', ally: 'liu' },
  van: [{ x: -5.575, z: -121.6, n: 12, cols: 4, hold: true }, { x: 5.575, z: -121.6, n: 12, cols: 4, hold: true }],
  hq: [4, 208],
  rank: { kos: [150, 300, 500], time: [150, 240, 360] },
};

export const SPK = {
  zhouyu: { name: { zh: '周瑜', en: 'Zhou Yu' }, seal: '瑜', side: 'shu' },
  yujin: { name: { zh: '于禁', en: 'Yu Jin' }, seal: '禁', side: 'wei' },
};
export const OFF = { yujin: { name: { zh: '于禁', en: 'YU JIN' }, hp: 900, boss: true } };

export const BEATS = [
  {
    when: { wait: 30 },
    obj: { zh: '擊破曹軍水軍都督 于禁', en: 'Defeat Cao Cao\'s admiral, Yu Jin', go: 'yujin' },
    squads: [{ at: ['ford', -0.4, -0.2], n: 22 }, { at: ['ford', 0.4, 0.1], n: 22 }],
    officers: { yujin: { at: ['ford', 0, 0.3] } },
    limit: { z: ['pass', 0, -1] },
    say: [
      { who: 'zhouyu', zh: '東風已起！火攻之計，在此一舉！', en: 'The east wind rises! Everything rides on the fire attack!' },
      { who: 'hero', zhugeliang: ['風向已轉，曹軍敗象已現。', 'The wind has turned. Cao Cao\'s defeat is written in it.'],
        zhaoyun: ['軍師妙算！子龍這就殺入敵陣！', 'A master stroke, Strategist! I ride into their lines!'] },
      { who: 'yujin', zh: '連環船固若金湯，豈懼小小火攻！', en: 'The chained fleet is a fortress. What is a little fire to us?' },
    ],
  },
  {
    when: { down: 'yujin' },
    win: true, waves: false, morale: 1,
    banner: { html: '敵將 <em>于禁</em> 討取！', en: 'Yu Jin has fallen!', dur: 260, big: true },
    say: [{ who: 'hero', zh: '曹軍水寨已破，追擊！', en: 'Cao Cao\'s river camp is broken. Pursue them!' }],
  },
];

const JIANG = 'M-20 520 C260 470 520 560 800 500 S1300 440 1620 480';
export const PL_MAP = {
  art: `<g class="pl-mark" data-id="jiang" filter="url(#pl-ink)" fill="none" stroke-linecap="round">
    <path d="${JIANG}" stroke="#6f7c78" stroke-width="80" opacity=".3"/><path d="${JIANG}" stroke="#46524f" stroke-width="8" opacity=".6"/>
  </g>
  <g class="pl-labels">
    <g class="pl-mark wei" data-id="wulin"><text x="620" y="400">烏林</text></g>
    <g class="pl-mark" data-id="chibi"><text x="760" y="640">赤壁</text></g>
    <g class="pl-mark" data-id="xiakou"><rect x="1240" y="580" width="30" height="30" rx="3"/><text x="1200" y="660">夏口</text></g>
    <g class="pl-mark" data-id="jiang"><text class="sm river" x="200" y="470">長 江</text></g>
  </g>`,
  arrows: [
    ['cao', 'wei', 'M300 300 C420 360 520 420 640 450'],
    ['allied', 'shu', 'M1240 600 C1100 580 960 560 820 560'],
  ],
};

export const PROLOGUE = [
  { cols: ['建安十三年冬', '曹操號稱八十萬', '連舟於赤壁'], en: 'Winter, 208 AD. Cao Cao, claiming eight hundred thousand men, chains his fleet by the Red Cliffs.',
    show: ['cao', 'wulin', 'jiang'], focus: [620, 450, 1.1] },
  { cols: ['孫劉結盟', '諸葛亮借東風', '周瑜欲以火攻'], en: 'Sun Quan and Liu Bei join hands; Zhuge Liang calls the east wind, and Zhou Yu plans to attack with fire.',
    show: ['allied', 'chibi', 'xiakou'], focus: [900, 560, 1.2] },
];

export const EPILOGUE = {
  zhugeliang: {
    zh: ['東南風起，黃蓋火船直衝曹營，連環戰船盡成火海。', '曹操大敗，自華容道北還，天下三分之勢遂成。'],
    en: ['The south-east wind rose; Huang Gai\'s fire ships drove into Cao Cao\'s camp, and the chained fleet became a sea of flame.',
      'Cao Cao fled north by the Huarong road, beaten, and the land was set to split in three.'],
  },
};
