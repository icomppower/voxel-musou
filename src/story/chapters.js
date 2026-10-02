// Story chapters by battlefield (world/map.js layout id; also the chapter id: ?go=story&ch=<id>): each module exports SPK, OFF, BEATS, EPILOGUE and CHAPTER
// ({ map, label [zh, en] (menus / loading card), head (result screen), allies (spawnAllies blocks at the start),
// prologue (true: the ink-scroll prologue.js plays before the battle) }).
import * as ch1 from './ch1.js';
import * as ch2 from './ch2.js';
import * as ch4 from './ch4.js';

export const CHAPTERS = { dingjun: ch1, chibi: ch2, hanshui: ch4 };
/** The chapter fought on battlefield `map` (default: 定軍山). */
export const chapter = (map) => CHAPTERS[map] || ch1;
