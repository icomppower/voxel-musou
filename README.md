# Voxel Musou

<p align="center">
  <a href="https://voxel-musou.vercel.app"><img src="media/gameplay.gif" alt="Zhao Yun and Huang Zhong vs 300 soldiers — the Musou" width="100%"></a>
</p>

<p align="center"><b><a href="https://voxel-musou.vercel.app">▶ Play in your browser — voxel-musou.vercel.app</a></b></p>

| | |
| --- | --- |
| ![Zhao Yun in the crowd](media/zhaoyun.jpg) | ![Huang Zhong's Musou volley](media/volley.jpg) |
| Zhao Yun — spear string through the crowd | Huang Zhong — Musou 百步穿楊, flaming volley |
| ![Zhao Yun's Musou dragon](media/dragon.jpg) | ![Huang Zhong's giant arrow](media/arrow.jpg) |
| Zhao Yun — Musou 蒼龍破陣, the dragon | Huang Zhong — the giant arrow |
| ![Character select](media/select.jpg) | ![Chapter I prologue](media/story.jpg) |
| Choose your officer | 「定軍山」 prologue (Chapter IV in the campaign) |

A browser-playable voxel action game in the style of Dynasty Warriors, built with Three.js. Seven playable officers cut through hundreds of soldiers across four historical story chapters, or fight endless waves in free battle.

No build step: plain ES modules, Three.js r186 vendored in `vendor/three/`, deterministic fixed 60 Hz simulation.

## Features

- Seven playable officers with their own models, N1–N6 normal strings, C1–C6 charge attacks and Musou:
  - **Liu Bei** (劉備) — twin swords, Musou 昭烈・雙龍斬
  - **Guan Yu** (關羽) — Green Dragon Crescent Blade, Musou 青龍偃月・天斬
  - **Zhang Fei** (張飛) — serpent spear, Musou 燕人咆哮
  - **Zhao Yun** — spear: normal combos (N1–N6), charge attacks (C1–C6), Musou 蒼龍破陣 with a dragon
  - **Zhuge Liang** (諸葛亮) — feather fan, wind blades and formation sigils, Musou 東風・八陣
  - **Huang Zhong** — bow: limb slashes and point-blank shots, charge shots (fan, barrage, arrow rain, fire arrow), aim mode, Musou 百步穿楊 (a flaming volley and a giant arrow)
  - **Lü Bu** (呂布) — crescent halberd, Musou 天下無雙・神鬼亂舞; also the Hulao Gate boss
- Four story chapters, unlocked in order, with independent maps, ink-map prologues, dialogue branches and endings:
  - **I · Hulao Gate** (虎牢關, 190): Liu Bei / Guan Yu / Zhang Fei; Guan Yu's timed Hua Xiong duel and the three brothers against Lü Bu
  - **II · Changban** (長坂坡, 208): Zhao Yun rescues A Dou and returns; Zhang Fei holds and breaks the bridge
  - **III · Red Cliffs** (赤壁, 208): Zhuge Liang / Zhao Yun; defend the altar, summon the east wind, burn the chained ships and pursue Cao Cao to Huarong Road
  - **IV · Mount Dingjun** (定軍山, 219): Huang Zhong / Zhao Yun; fight uphill against Xiahou Yuan
- Trials (演武試煉), ranked score attacks open to every officer; unlike free battle, the hero can fall:
  - **Thousand Slain** (千人斬): 1,000 KOs against a 3-minute clock
  - **Hold the Bridge** (死守): keep Changban Bridge for 4 minutes against ever heavier pushes; ranked by KOs
  - **The Gauntlet** (過關斬將): Xiahou Yuan, Zhang Liao, Cao Cao and Lü Bu at their story strength, one after another
- Free battle: endless waves on any field, found at the end of the trial list
- Records: best rank, fastest clear and most KOs per chapter / trial × officer × difficulty, shown on the title, the select screen and a records wall (戰績); a new best is marked on the result screen
- Unlocks earned by clears: the later chapters in order, Lü Bu after chapter I, Hold the Bridge after chapter II, the Gauntlet after chapter IV
- Four difficulties, picked after the mode on the title: 初級 · 普通 · 上級 · 修羅 (修羅 opens once any battle is cleared on 上級). Grunts stay one-sweep fodder; the tiers turn enemy pressure, officer toughness and the cost of a hit
- Jump, jump attack, dodge; hit-stop and impact VFX
- Dense voxel crowds of Wei soldiers (~300, InstancedMesh) blasted apart into voxel debris, allied Shu troops
- Enemy officers and allied hero NPCs with name and HP tags; Cao Cao, Zhang Liao and Xiahou Yuan have dedicated boss models and telegraphed attacks
- Army-specific colours and banners; meat buns restore HP, and defeat topples the hero
- Daylight Hulao Gate, dusk at Changban, the Red Cliffs night fleet and the golden-hour Mount Dingjun valley; maps switch in the same page
- Custom post-processing: atmospheric haze, depth of field, bloom, retro pixel look
- Procedural WebAudio sound
- Calligraphy-style title, character select, HUD and ink-wipe transitions

## Run

ES modules don't load from `file://`, so serve the folder with any static server:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000 . Requires a WebGL2 browser; a desktop GPU is recommended. Sound starts on the first key press or click.

## Controls

Keyboard and mouse, or a gamepad.

| Action | Keys | Gamepad |
| --- | --- | --- |
| Move (camera-relative) | WASD / arrow keys | left stick |
| Attack | J / left click | X □ |
| Charge | K / right click (mid-combo) | Y △ |
| Jump | Space | A × |
| Dodge | L / Shift | R1 R2 |
| Musou (gauge full) | I | B ○ |
| Camera | mouse (click the field to lock it) / Q E | right stick |
| Recenter / face nearest officer | R | L1 L2 |
| Aim (Huang Zhong) | hold K / right click, release to loose | hold Y △ |
| Pause / controls | Esc | |

![Title screen](media/title.jpg)

## Options

| URL parameter | Description |
| --- | --- |
| `?enemies=N` | Number of enemy soldiers, 0–2000 (default 300) |
| `?go=free\|story\|trial&char=ID&ch=ID` | Skip the menus into a battle; character IDs: `liubei`, `guanyu`, `zhangfei`, `zhaoyun`, `zhugeliang`, `huangzhong`, `lubu`; chapter IDs: `hulao`, `changban`, `chibi`, `dingjun`; trial IDs: `slay`, `hold`, `gauntlet` |
| `?map=ID` | Battlefield for a free battle; uses the same IDs as the chapters |
| `?hq` | Pin full render quality (no automatic MSAA downgrade) |

## Project layout

```
index.html      entry point, importmap, all screen CSS
src/            core (incl. records and unlocks), hero, chars (per-character kits), combat, crowd, musou, camera, vfx,
                post, world, audio, story (chapter and trial scripts, prologue, result), ui
vendor/three/   Three.js r186
checks/         Node regression checks and the trial balance bot (`node checks/<name>.mjs`, Node 22.15+)
media/          README screenshots and GIF
```

## Credits & License

- Code: MIT, see [LICENSE](LICENSE).
- [three.js](https://threejs.org/): MIT.
- HUD fallback font `src/ui/brush.woff2` is a subset of Yuji Boku by Kinuta Font Factory, licensed under the SIL Open Font License 1.1.

This is a fan project, not affiliated with or endorsed by KOEI TECMO. "Dynasty Warriors" is a trademark of KOEI TECMO. No game assets from the original games are included.
