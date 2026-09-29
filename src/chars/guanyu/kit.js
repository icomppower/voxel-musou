// Guan Yu's kit (contract: src/chars/index.js). His own: the voxel model and chains (model.js), N1–N3 + C1 and the stance
// idle (moves.js), 真・無雙「青龍偃月・天崩」(musou.js, view.js). Borrowed from Zhao Yun's spear kit on the same weapon
// joint until Guan Yu gets his own: N4–N6 (unused: his string loops N1–N3), C2–C6, dash, jump attack / charge, locomotion.
import { MOVES as ZY_MOVES, AIR_CHAIN_MAX } from '../../hero/moves.js';
import { ATTACK_CLIPS, MOVE_FEET } from '../../hero/anims/attacks.js';
import { LOCO_CLIPS, runPose, rollPose } from '../../hero/anims/locomotion.js';
import { GY_MOVES, GY_CLIPS } from './moves.js';
import { createGyModel, createGySecondary } from './model.js';
import { createMusou, GY_MUSOU_CLIPS } from './musou.js';
import { createMusouView } from './view.js';

export const GUANYU_KIT = {
  moves: { ...ZY_MOVES, ...GY_MOVES }, airChainMax: AIR_CHAIN_MAX,
  clips: { ...ATTACK_CLIPS, ...LOCO_CLIPS, ...GY_CLIPS, ...GY_MUSOU_CLIPS }, feet: MOVE_FEET,
  runPose, rollPose,
  dashPlant: ZY_MOVES.dash.lunge[1][0] + 8,
  model: createGyModel, secondary: createGySecondary,
  trail: { base: 1.78, baseHeavy: 1.7, tip: 2.3 },       // the crescent blade: 1.7–2.3 m along the shaft
  // vfx.js palette (linear HDR, as Huang Zhong's): jade and gold instead of Zhao Yun's ice
  fx: {
    needle: [[0.9, 2.6, 1.5], [0.6, 2.2, 1.1], [1.6, 2.8, 2.0]],
    hot: [[0.08, 0.45, 0.22], [0.12, 0.55, 0.3], [0.2, 0.6, 0.36], [1.2, 2.2, 1.5]],
    burst: [0.1, 0.5, 0.26], flash: [1.2, 2.6, 1.6], slash: [1.4, 2.8, 1.8], pulse: [0.5, 1.7, 0.9],
    light: [0.55, 1, 0.7], crack: [1.8, 2.2, 0.9], wall: [0.5, 1.3, 0.7], ring: [1.1, 2.1, 1.2], shard: [1.3, 2.6, 1.6],
    glint: null, glitter: [2.0, 2.6, 1.4],
    glow: [0x1c7a4a, 0x7de0a8, 0.3],
    trail: { white: [0.95, 1.1, 0.9], fringe: [0.2, 1.0, 0.55], hot: [1.3, 1.8, 1.3], glow: [0.45, 1.6, 0.9], grad: true },
  },
  createMusou, createMusouView,
};
