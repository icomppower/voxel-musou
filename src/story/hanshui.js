// 第五章「漢水」 — chapter data (format: ./chapters.js header) for the Han River battlefield (world/maps/hanshui.js).
// History (219 AD, 漢水之戰): after 定軍山, Cao Cao comes out of the 斜谷 valley to take Hanzhong back. His grain
// rolls past 北山; 黃忠 rides to seize it and does not return; 趙雲 rides out with a few horsemen, breaks the
// encirclement, brings the wounded 張著 out, and back at his camp opens the gates, lowers the banners and silences the
// drums (空營計). Cao's army halts, fears an ambush and breaks under the crossbows; many drown in the Han.
// Played as either officer: `hero` = the chosen one, `ally` = the other one (he takes the field as an ally actor once
// the two meet in the ring). The field runs along +Z: 北山's depot (z ≈ -116) → the encirclement (the basin, z ≈ -16) →
// 趙雲's camp gate (z ≈ 44, anchor 'gate') → the bluff over the Han (z ≈ 150). Grain stacks: anchors / gates
// 'grain1'…'grain5'. Beat keys beyond the chapters.js list (story/index.js): escort / saved / safe, calm / held / broke,
// clear, volley, allies, retire: P.

export const CH = {
  id: 'hanshui', num: { zh: '第五章', en: 'CHAPTER V' }, title: { zh: '漢水', en: 'Han River' },
  seal: '一身是膽', era: { zh: '建安二十四年', en: '219 AD' }, map: 'hanshui',
  heroes: ['zhaoyun', 'huangzhong'],
  ally: { huangzhong: 'zhaoyun', zhaoyun: 'huangzhong' },
  army: { foe: 'wei', ally: 'shu' },
  van: [{ x: -5, z: -162, n: 10, cols: 5 }, { x: 6, z: -162, n: 10, cols: 5 }],   // the raiding party behind him
  hq: [10, 160],
  rank: { kos: [400, 800, 1400], time: [600, 780, 960] },
};

export const SPK = {
  zhangzhu: { name: { zh: '張著', en: 'Zhang Zhu' }, seal: '著', side: 'shu' },
  shuSoldier: { name: { zh: '蜀兵', en: 'Shu Soldier' }, seal: '蜀', side: 'shu' },
  caocao: { name: { zh: '曹操', en: 'Cao Cao' }, seal: '曹', side: 'wei', char: 'caocao' },
  zhanghe: { name: { zh: '張郃', en: 'Zhang He' }, seal: '郃', side: 'wei' },
  xuhuang: { name: { zh: '徐晃', en: 'Xu Huang' }, seal: '晃', side: 'wei' },
  xuchu: { name: { zh: '許褚', en: 'Xu Chu' }, seal: '褚', side: 'wei' },
  soldier: { name: { zh: '曹軍兵', en: 'Wei Soldier' }, seal: '兵', side: 'wei' },
};

// officers (crowd.spawnOfficer). 520 ≈ 5 full combos; 許褚 is the boss.
export const OFF = {
  outrider: { name: { zh: '張郃部將', en: "ZHANG HE'S OUTRIDER" }, hp: 520 },
  zhanghe: { name: { zh: '張郃', en: 'ZHANG HE' }, hp: 1000 },
  xuhuang: { name: { zh: '徐晃', en: 'XU HUANG' }, hp: 900 },
  xuchu: { name: { zh: '許褚', en: 'XU CHU' }, hp: 2800, boss: true },
  guard: { name: { zh: '虎衛', en: 'TIGER GUARD' }, hp: 320 },
};

// the grain stacks (map anchors) and the spots the script uses
const GRAIN = [1, 2, 3, 4, 5].map((k) => [`grain${k}`, 0, 0]);
const RING = ['pass', 0, 0.02];                // the heart of the encirclement (≈ 0, -15)
const GATE = ['gate', 0, 0];                   // the camp gate (0, 44)
const NAG = { who: 'shuSoldier', zh: '將軍，前方敵勢未明，不可深入！', en: "General, we don't know what's ahead. Don't go in alone!" };
const NAG_CAMP = { who: 'ally', huangzhong: ['漢升將軍，先守住營寨！', 'General Hansheng, hold the camp first!'], zhaoyun: ['子龍，營中還有追兵！', 'Zilong, there are still pursuers in the camp!'] };
const burn = (k) => ({
  when: { near: [GRAIN[k - 1], 3.8] },
  gate: `grain${k}`,
  obj: k < 5 ? { zh: `焚燒北山糧草（${k}/5）`, en: `Burn the grain at Beishan (${k}/5)`, go: GRAIN[k] } : undefined,
});

// Pacing (default difficulty): depot 1.5 min · the ring 1-1.5 min · 張著 and the retreat 1.5 min · 空營計 30 s ·
// the chase and the rearguard 3 min. Officers come forward only after the hero has fought a while (kos / wait).
export const BEATS = [
  // ---- 北山: burn the grain
  {
    when: { wait: 30 },
    obj: { zh: '焚燒北山糧草（0/5）', en: 'Burn the grain at Beishan (0/5)', go: GRAIN[0] },
    squads: [{ at: ['beishan', -0.3, -0.1], n: 20 }, { at: ['beishan', 0.3, 0.1], n: 18 }, { at: ['beishan', -0.2, 0.55], n: 18 }, { at: ['beishan', 0.35, 0.75], n: 16 }],
    officers: { outrider: { at: ['beishan', 0.1, 0.25] } },
    limit: { z: ['pass', 0, -0.9], nag: NAG },
    waves: true, morale: 0,
    say: [
      { who: 'hero', huangzhong: ['曹賊的糧草盡在北山，老夫一把火燒個乾淨！', "Cao's grain is all at Beishan. I'll burn every sack of it!"],
        zhaoyun: ['漢升將軍劫糧未歸，子龍先把這北山糧屯燒了！', "General Hansheng went for the grain and hasn't come back. I'll burn the depot first!"] },
      { who: 'soldier', zh: '有人劫糧！快報張將軍！', en: 'Raiders at the grain! Tell General Zhang!' },
    ],
  },
  burn(1), burn(2), burn(3), burn(4),
  {
    ...burn(5),
    banner: { html: '<em>北山糧草</em> 盡焚！', en: "Cao Cao's grain at Beishan is burning", dur: 180 },
    heal: 0.3, morale: 0.12, retire: true, hush: true, waves: false,
  },

  // ---- 包圍圈: Cao's main army closes the ring
  {
    when: { wait: 150 },
    banner: { html: '曹操大軍殺到 — <em>張郃</em>・<em>徐晃</em> 合圍！', en: 'Cao Cao\'s main army arrives — Zhang He and Xu Huang close the ring!', dur: 190, big: true },
    squads: [{ at: ['pass', -0.6, -0.55], n: 18, charge: true }, { at: ['pass', 0.6, -0.5], n: 18, charge: true }, { at: ['pass', -0.5, 0.35], n: 16, charge: true },
      { at: ['pass', 0.5, 0.3], n: 16, charge: true }],
    officers: { zhanghe: { at: ['pass', -0.3, 0.15], engaged: true }, xuhuang: { at: ['pass', 0.3, 0.2], engaged: true } },
    limit: { z: ['pass', 0, 0.45], nag: NAG },
    waves: true, morale: -0.12,
    say: [{ who: 'zhanghe', zh: '蜀將已入重圍，一個也別放走！', en: 'The Shu generals are inside the ring. Let none of them out!' }],
  },
  {   // as 黃忠: hold the ring until 趙雲 breaks in
    hero: ['huangzhong'],
    obj: { zh: '死守陣地，等待援軍', en: 'Hold your ground until relief arrives', go: RING },
    say: [{ who: 'hero', zh: '被圍了？哼，老夫就在此等子龍來！', en: 'Surrounded? Hmph. I\'ll hold here until Zilong comes.' }],
  },
  {   // as 趙雲: break in to 黃忠's surrounded troops
    hero: ['zhaoyun'],
    allies: [{ x: 0, z: -15, n: 12, cols: 4, hold: true }],
    actors: { huangzhong: { kit: 'huangzhong', role: 'ally', at: RING, yaw: Math.PI } },
    actor: { key: 'huangzhong', do: 'hold', at: RING },
    obj: { zh: '殺入重圍，接應黃忠', en: 'Break into the ring and reach Huang Zhong', go: RING },
    say: [{ who: 'hero', zh: '漢升將軍被圍了——隨我殺進去！', en: 'Hansheng is surrounded. With me, break in!' }],
  },
  {
    when: { wait: 50 * 60 },
    hero: ['huangzhong'],
    allies: [{ x: 0, z: -58, n: 16, cols: 4 }],
    actors: { zhaoyun: { kit: 'zhaoyun', role: 'ally', at: ['pass', 0, -0.55] } },
    banner: { html: '<em>趙雲</em> 突入重圍！', en: 'Zhao Yun breaks into the ring!', dur: 170 },
    heal: 0.25, morale: 0.1,
    say: [{ who: 'ally', zh: '漢升將軍！子龍來也！', en: 'General Hansheng! Zilong is here!' }],
  },
  {
    when: { near: [RING, 7] },
    hero: ['zhaoyun'],
    actor: { key: 'huangzhong', do: 'follow' },
    banner: { html: '與<em>黃忠</em>會合！', en: 'Zhao Yun reaches Huang Zhong!', dur: 170 },
    heal: 0.25, morale: 0.1,
    say: [{ who: 'ally', zh: '子龍！老夫就知道你會來！', en: 'Zilong! I knew you would come!' }],
  },

  // ---- 張著: the wounded officer cut off in the west of the ring
  {
    when: { wait: 90 },
    escort: { key: 'zhangzhu', at: ['pass', -0.6, -0.3], name: { zh: '張著', en: 'Zhang Zhu' }, hp: 320 },
    squads: [{ at: ['pass', -0.72, -0.1], n: 14, charge: true }, { at: ['pass', -0.45, -0.55], n: 14, charge: true }],
    obj: { zh: '救出被困的張著', en: 'Reach Zhang Zhu, cut off in the ring', go: 'zhangzhu' },
    limit: { z: ['pass', 0, 0.85], nag: NAG },
    say: [
      { who: 'zhangzhu', zh: '將軍！末將受傷被困，走不脫了！', en: "General! I'm wounded and cut off — I can't get out!" },
      { who: 'hero', huangzhong: ['張著莫慌，老夫這就來！', 'Hold on, Zhang Zhu, I\'m coming!'], zhaoyun: ['張著撐住，子龍來救你！', "Hold on, Zhang Zhu! I'm coming for you!"] },
    ],
  },
  {   // beside him: he keeps pace with the hero from here; lead him out through the chokepoint
    when: { near: ['zhangzhu', 13] },   // he keeps a flank slot 7.5-11.5 m off the hero once he joins
    obj: { zh: '護送張著至隘口', en: 'Bring Zhang Zhu out through the pass', go: ['pass', 0, 0.8] },
    say: [{ who: 'hero', huangzhong: ['跟緊老夫，殺出去！', 'Stay close. We cut our way out!'], zhaoyun: ['跟著子龍，殺出去！', 'Stay with me. We cut our way out!'] }],
  },
  {
    when: { safe: ['zhangzhu', ['pass', 0, 0.72]] },
    saved: 'zhangzhu',
    banner: { html: '<em>張著</em> 脫險！', en: 'Zhang Zhu is out of the ring', dur: 170 },
    gate: 'campGate', heal: 0.3, morale: 0.1, hush: true,
    limit: { z: ['camp', 0, 0.3], nag: NAG_CAMP },
    obj: { zh: '且戰且退，返回本營', en: 'Fight your way back to the camp', go: GATE },
    squads: [{ at: ['pass', -0.3, -0.2], n: 18, charge: true }, { at: ['pass', 0.3, -0.25], n: 18, charge: true }],
    say: [{ who: 'zhangzhu', zh: '多謝將軍救命之恩！', en: 'General, I owe you my life!' }],
  },

  // ---- 空營計: the empty-camp stratagem
  {
    when: { zone: 'camp' },
    waves: false, hush: true,
    obj: { zh: '肅清營中追兵', en: 'Clear the pursuers out of the camp', go: ['camp', 0, -0.2] },
    say: [{ who: 'shuSoldier', zh: '曹軍主力就在後面！將軍，關營門嗎？', en: "Cao's main army is right behind us! General, do we shut the gate?" }],
  },
  {
    when: [{ clear: 16 }, { wait: 30 * 60 }],   // the camp is clear (or a straggler hovers in the outer ring: begin anyway)
    calm: { at: GATE, r: 5, frames: 12 * 60, obj: { zh: '立於營門，按兵不動', en: 'Stand at the open gate. Do not attack.' } },
    banner: { html: '<em>空營計</em> — 大開營門，偃旗息鼓', en: 'The empty camp: gates open, banners down, drums silent', dur: 220, big: true },
    obj: { zh: '立於營門，按兵不動', en: 'Stand at the open gate. Do not attack.', go: GATE },
    squads: [{ at: ['pass', -0.3, 0.5], n: 22 }, { at: ['pass', 0.3, 0.5], n: 22 }, { at: ['pass', 0, 0.25], n: 24 }],
    officers: { zhanghe2: { at: ['pass', -0.15, 0.6], like: 'zhanghe' }, xuhuang2: { at: ['pass', 0.15, 0.62], like: 'xuhuang' } },
    say: [
      { who: 'hero', huangzhong: ['子龍，你這是……？', 'Zilong, what are you doing?'], zhaoyun: ['大開營門，偃旗息鼓。誰也不許出聲！', 'Open the gates. Banners down, drums silent. Not a sound!'] },
      { who: 'ally', huangzhong: ['漢升將軍，站在營門，一動也別動。', 'General Hansheng, stand at the gate and do not move.'], zhaoyun: ['……好膽量。老夫陪你站著。', '...You have nerve. I\'ll stand with you.'] },
      { who: 'caocao', zh: '營門大開，必有伏兵……全軍止步！', en: 'The gates stand open. There must be an ambush... All troops, halt!' },
    ],
  },
  {   // kept: drums and crossbows, the Cao army breaks
    when: { held: true },
    skip: { broke: true },
    volley: { at: ['pass', 0, 0.45], r: 34, frac: 0.6 },
    banner: { html: '<em>空營計</em> 成！伏弩齊發！', en: 'The ruse holds! Drums roll and the crossbows loose!', dur: 220, big: true },
    retire: GATE, heal: 0.3, morale: 0.25, hush: true,
    say: [
      { who: 'soldier', zh: '有伏兵！快逃啊！', en: "It's an ambush! Run!" },
      { who: 'caocao', zh: '中計了！撤——往漢水撤！', en: "We've been tricked! Fall back — to the river!" },
    ],
  },
  {   // broken: the halted army comes on — a straight fight, harder
    when: { broke: true },
    skip: { held: true },
    banner: { html: '計破！曹軍殺到！', en: 'The ruse is broken — the Cao army charges!', dur: 200, big: true },
    squads: [{ at: ['pass', -0.4, 0.55], n: 20, charge: true }, { at: ['pass', 0.4, 0.55], n: 20, charge: true }, { at: ['pass', 0, 0.3], n: 22, charge: true }],
    officers: { zhanghe3: { at: ['pass', 0, 0.6], engaged: true, like: 'zhanghe' } },
    waves: true, morale: -0.15,
    obj: { zh: '擊退曹軍，擊破張郃', en: 'Drive off the Cao army and defeat Zhang He', go: 'zhanghe3' },
    say: [{ who: 'zhanghe', zh: '哪有什麼伏兵！給我殺進去！', en: 'There is no ambush! Charge!' }],
  },

  // ---- 漢水: chase the rout to the river, then the rearguard
  {
    when: [{ held: true }, { down: 'zhanghe3' }],
    limit: { z: null }, waves: true, retire: true, heal: 0.2,
    obj: { zh: '追擊潰兵至漢水岸', en: 'Chase the routed army to the bluff over the Han', go: ['bank', 0, -0.3] },
    squads: [{ at: ['bank', -0.3, -0.4], n: 20, charge: true }, { at: ['bank', 0.3, -0.2], n: 20, charge: true }, { at: ['bank', 0, 0.3], n: 22 }],
    say: [{ who: 'ally', huangzhong: ['漢升將軍，追！把他們趕進漢水！', 'After them, Hansheng! Drive them into the Han!'], zhaoyun: ['子龍，追！別讓曹賊喘口氣！', "After them, Zilong! Don't give Cao Cao a breath!"] }],
  },
  {
    when: [{ zone: 'bank', kos: 80 }, { wait: 75 * 60 }],
    officers: { xuhuang4: { at: ['bank', 0, 0.2], engaged: true, like: 'xuhuang' } },
    obj: { zh: '擊破殿後的徐晃', en: 'Defeat the rearguard, Xu Huang', go: 'xuhuang4' },
    say: [{ who: 'xuhuang', zh: '徐公明在此斷後！蜀軍休想過去！', en: 'Xu Gongming holds the rear! No Shu soldier gets past!' }],
  },
  {
    when: { down: 'xuhuang4' },
    heal: 0.3, hush: true,
    banner: { html: '敵殿軍 <em>許褚</em>', en: 'Enemy rearguard: Xu Chu', dur: 170, big: true },
    officers: { xuchu: { at: ['bank', 0.1, 0.55], engaged: true } },
    squads: [{ at: ['bank', -0.4, 0.5], n: 18, charge: true }, { at: ['bank', 0.45, 0.4], n: 18, charge: true }],
    obj: { zh: '擊破許褚', en: 'Defeat Xu Chu', go: 'xuchu' },
    say: [
      { who: 'caocao', zh: '仲康，斷後！孤先渡河！', en: 'Zhongkang, hold them! I cross the river first!' },
      { who: 'xuchu', zh: '誰敢近丞相一步，先問問我許褚！', en: 'Whoever comes near the Chancellor answers to Xu Chu!' },
    ],
  },
  {
    when: { below: ['xuchu', 0.5] },
    skip: { down: 'xuchu' },
    banner: { html: '<em>虎衛</em> 殺到！', en: "Xu Chu's Tiger Guards join the fight!", dur: 160 },
    officers: { guard1: { at: ['bank', -0.3, 0.6], engaged: true, like: 'guard' }, guard2: { at: ['bank', 0.4, 0.6], engaged: true, like: 'guard' } },
    squads: [{ at: ['bank', 0, 0.7], n: 16, charge: true }],
    say: [{ who: 'xuchu', zh: '虎衛，上！', en: 'Tiger Guards, at them!' }],
  },
  {
    when: { down: 'xuchu' },
    win: true, waves: false, morale: 1,
    banner: { html: '<em>許褚</em> 敗退 — 曹操退出漢中！', en: 'Xu Chu is routed — Cao Cao abandons Hanzhong!', dur: 260, big: true },
    say: [{ who: 'hero', huangzhong: ['老夫與子龍，守住了漢中！', 'Zilong and I have held Hanzhong!'], zhaoyun: ['曹軍退了。漢中，守住了！', 'The Cao army is gone. Hanzhong is held!'] }],
  },
];

// ---- prologue ink map of 漢中 (viewBox 1600×900): the Han across the paper, 定軍山 to the south-west, 趙雲's camp on
// the south bank, 北山 and Cao's grain road north of the river, 斜谷 opening at the top. Labels stay left of x ≈ 1060
// (the calligraphy card) and above y ≈ 700 (the English line).
const peaks = (list, h, w) => list.map(([x, y, k = 1]) =>
  `<path d="M${x - w * k} ${y} Q${x - w * k * 0.35} ${y - h * k * 0.55} ${x} ${y - h * k} Q${x + w * k * 0.3} ${y - h * k * 0.5} ${x + w * k} ${y}Z"/>`).join('');
const RIVER = 'M-20 440 C200 410 420 470 640 440 S900 400 1100 425 S1400 455 1620 430';
export const PL_MAP = {
  art: `<g class="pl-mtns" fill="url(#pl-mtn)" filter="url(#pl-ink)">
    ${peaks([[80, 190, 1.1], [240, 170], [420, 185, .9], [600, 160, 1.1], [1060, 180], [1240, 170, 1.2], [1420, 160, .9]], 120, 90)}
    ${peaks([[120, 900, 1.2], [440, 890, .9], [760, 905, 1.1], [1040, 890], [1300, 900, 1.2]], 130, 100)}
    ${peaks([[860, 120, .8], [1000, 130, .9]], 150, 70)}
  </g>
  <g class="pl-mark" data-id="dingjun" fill="url(#pl-mtn)" filter="url(#pl-ink)">${peaks([[160, 640, .9], [230, 620, 1.35], [310, 645, .85]], 150, 80)}</g>
  <g class="pl-mark" data-id="beishan" fill="url(#pl-mtn)" filter="url(#pl-ink)">${peaks([[700, 320, .6], [770, 300, .9], [840, 322, .6]], 90, 60)}</g>
  <g class="pl-mark" data-id="river" filter="url(#pl-ink)" fill="none" stroke-linecap="round">
    <path d="${RIVER}" stroke="#6f7c78" stroke-width="34" opacity=".35"/><path d="${RIVER}" stroke="#46524f" stroke-width="8" opacity=".7"/>
  </g>
  <g class="pl-mark" data-id="carts" filter="url(#pl-ink)">
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${905 - i * 22}" y="${88 + i * 34}" width="14" height="9" rx="2" fill="#6a4a2a"/>`).join('')}
  </g>
  <g class="pl-labels">
    <g class="pl-mark" data-id="dingjun"><text x="330" y="600">定軍山</text></g>
    <g class="pl-mark wei" data-id="xiegu"><text x="720" y="80">斜谷</text><text class="sm" x="830" y="170">曹操</text></g>
    <g class="pl-mark wei" data-id="beishan"><text x="660" y="260">北山</text><text class="sm" x="860" y="300">糧道</text></g>
    <g class="pl-mark" data-id="camp"><rect x="560" y="496" width="34" height="34" rx="3"/><text x="606" y="560">趙雲營</text></g>
    <g class="pl-mark" data-id="river"><text class="sm river" x="330" y="520">漢 水</text></g>
  </g>`,
  arrows: [
    ['shu1', 'shu', 'M90 830 C130 770 170 700 205 640'],
    ['wei1', 'wei', 'M930 40 C905 120 850 210 790 270'],
    ['shu2', 'shu', 'M250 600 C400 520 600 390 735 318'],
    ['shu3', 'shu', 'M585 500 C630 450 680 390 728 335'],
  ],
};

// ---- prologue cards (format: chapters.js), spring 219
export const PROLOGUE = [
  { cols: ['建安二十四年春', '黃忠斬夏侯淵', '於定軍山'], en: 'Spring, 219 AD. Huang Zhong cuts down Xiahou Yuan at Mount Dingjun.',
    show: ['shu1', 'dingjun'], focus: [230, 600, 1.25] },
  { cols: ['曹操親率大軍', '出斜谷', '爭奪漢中'], en: 'Cao Cao leads the main army out of the Xie valley to take back Hanzhong.',
    show: ['wei1', 'xiegu'], focus: [820, 220, 1.2] },
  { cols: ['曹軍運米', '數千萬囊', '過北山下'], en: 'Endless grain carts roll past the foot of Beishan.',
    show: ['carts', 'beishan', 'river'], focus: [760, 320, 1.3] },
  { cols: ['黃忠引兵劫糧', '過期不還'], en: 'Huang Zhong rides out to seize the grain, and does not come back.',
    show: ['shu2'], focus: [520, 460, 1.15] },
  { cols: ['趙雲輕騎出營', '往尋黃忠'], en: 'Zhao Yun rides out with a few horsemen to find him.',
    show: ['shu3', 'camp'], focus: [640, 430, 1.3] },
];

// ---- result screen epilogue (win), branched on the hero (the Story Bible's historical ending)
export const EPILOGUE = {
  huangzhong: {
    zh: ['黃忠北山劫糧，陷入重圍；趙雲突圍相救，大開營門，以空營退曹軍。', '曹操言「雞肋」，退出漢中。劉備讚曰：「子龍一身都是膽也！」是年，劉備進位漢中王。'],
    en: ['Huang Zhong was caught raiding the grain at Beishan; Zhao Yun broke the ring, then opened his camp gates and turned Cao\'s army back with an empty camp.',
      'Cao Cao muttered "chicken rib" and left Hanzhong. Liu Bei said: "Zilong is courage through and through!" That year Liu Bei became King of Hanzhong.'],
  },
  zhaoyun: {
    zh: ['趙雲單騎突圍，救黃忠、張著而還；曹軍追至營下，營門大開，偃旗息鼓，曹軍疑有伏兵而退。', '曹操言「雞肋」，退出漢中。劉備讚曰：「子龍一身都是膽也！」是年，劉備進位漢中王。'],
    en: ['Zhao Yun rode through the encirclement and brought Huang Zhong and Zhang Zhu home; when Cao\'s army reached his camp, the gates stood open and the drums were silent, and Wei withdrew fearing an ambush.',
      'Cao Cao muttered "chicken rib" and left Hanzhong. Liu Bei said: "Zilong is courage through and through!" That year Liu Bei became King of Hanzhong.'],
  },
};
