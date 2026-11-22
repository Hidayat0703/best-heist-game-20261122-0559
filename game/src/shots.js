// Deterministic screenshot scenes: ?shot=cover|sneak|alarm|win.
// Each scene stages a real world state — the same guards, cameras and
// render code the live game uses — then freezes the clock, so the render
// is identical on every run. Nothing here is composited or edited.
import { DIAMOND, EXIT } from './config.js';

const SHOTS = {
  // The cover: the whole heist in one frame — room, thief, guard cones,
  // cameras, the diamond and the alarm meter, all readable at a glance.
  cover: {
    player: { x: 560, y: 478, facing: 0.35, sneaking: true, coins: 3, emp: 1 },
    guards: [
      { x: 700, y: 470, heading: Math.PI, seesPlayer: false, mode: 'patrol' },
      { x: 760, y: 300, heading: Math.PI / 2, seesPlayer: false, mode: 'patrol' },
      { x: 500, y: 150, heading: 0, seesPlayer: false, mode: 'patrol' },
      { x: 180, y: 560, heading: Math.PI / 2, seesPlayer: false, mode: 'patrol' },
    ],
    cameras: [{ heading: Math.PI / 2 + 0.5 }, { heading: Math.PI - 0.4 }],
    alarm: { value: 22, state: 'calm', alarmsRaised: 0 },
    coins: [],
    events: [],
    elapsed: 42,
    now: 12.0,
  },
  // The quiet route: the thief on the north corridor, a decoy coin ringing
  // while Vesper turns toward it.
  sneak: {
    player: { x: 880, y: 150, facing: Math.PI, sneaking: true, coins: 2, emp: 1 },
    guards: [
      { x: 620, y: 470, heading: 0, seesPlayer: false, mode: 'patrol' },
      { x: 760, y: 210, heading: -Math.PI / 2, seesPlayer: false, mode: 'investigate' },
      { x: 420, y: 150, heading: 0, seesPlayer: false, mode: 'patrol' },
      { x: 180, y: 380, heading: Math.PI / 2, seesPlayer: false, mode: 'patrol' },
    ],
    cameras: [{ heading: Math.PI / 2 - 0.6 }, { heading: Math.PI + 0.3 }],
    alarm: { value: 34, state: 'calm', alarmsRaised: 0 },
    coins: [{ x: 760, y: 250, born: 11.4, ttl: 4 }],
    events: [],
    elapsed: 95,
    now: 12.0,
  },
  // The caught moment: the alarm at 88%, cones red, guards hunting,
  // the thief caught inside the vault door with the diamond in reach.
  alarm: {
    player: { x: 1050, y: 272, facing: Math.PI, sneaking: false, coins: 1, emp: 0, pickProgress: 0.4 },
    guards: [
      { x: 920, y: 470, heading: Math.PI, seesPlayer: true, mode: 'hunt', alertFlash: 0.7 },
      { x: 760, y: 330, heading: Math.PI / 2, seesPlayer: true, mode: 'hunt', alertFlash: 0.7 },
      { x: 880, y: 150, heading: 0, seesPlayer: true, mode: 'hunt', alertFlash: 0.7 },
      { x: 180, y: 300, heading: Math.PI / 2, seesPlayer: false, mode: 'patrol' },
    ],
    cameras: [{ heading: Math.PI / 2 + 0.2, seesPlayer: true }, { heading: Math.PI - 0.5 }],
    alarm: { value: 88, state: 'alarm', alarmsRaised: 1 },
    coins: [],
    events: [],
    elapsed: 130,
    now: 12.0,
  },
  // The getaway: diamond secured, thief at the exit, the win panel up.
  win: {
    player: { x: 100, y: 742, facing: Math.PI / 2, sneaking: false, coins: 2, emp: 1, hasDiamond: true },
    guards: [
      { x: 620, y: 470, heading: Math.PI, seesPlayer: false, mode: 'patrol' },
      { x: 760, y: 520, heading: -Math.PI / 2, seesPlayer: false, mode: 'patrol' },
      { x: 500, y: 150, heading: 0, seesPlayer: false, mode: 'patrol' },
      { x: 180, y: 300, heading: Math.PI / 2, seesPlayer: false, mode: 'patrol' },
    ],
    cameras: [{ heading: Math.PI / 2 }, { heading: Math.PI + 0.2 }],
    alarm: { value: 12, state: 'calm', alarmsRaised: 0 },
    coins: [],
    events: [],
    elapsed: 167,
    now: 12.0,
    phase: 'won',
  },
};

export function shotNames() {
  return Object.keys(SHOTS);
}

// Stage a scene onto a fresh world. Returns true when the name is known.
export function applyShot(world, name) {
  const scene = SHOTS[name];
  if (!scene) return false;
  Object.assign(world.player, scene.player);
  world.player.pickProgress = scene.player.pickProgress ?? 0;
  world.player.picking = false;
  scene.guards.forEach((g, i) => Object.assign(world.guards[i], g));
  scene.cameras.forEach((c, i) => Object.assign(world.cameras[i], c));
  Object.assign(world.alarm, scene.alarm);
  world.coins = scene.coins.map((c) => ({ ...c }));
  world.events = [...scene.events];
  world.elapsed = scene.elapsed;
  world.now = scene.now;
  world.frozen = true;
  world.phase = scene.phase ?? 'playing';
  world.shotName = name;
  return true;
}

export { DIAMOND, EXIT };
