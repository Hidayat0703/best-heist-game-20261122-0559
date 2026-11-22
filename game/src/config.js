// Velvet Rope — The Meridian Gallery Heist: every fixed number lives here.
// One room, one thief, four guards, two cameras, one diamond, one way out.
export const VIEW = { width: 1280, height: 800 };
export const HUD_H = 76;

// Playfield bounds (inside the outer walls).
export const FIELD = { x0: 20, y0: 96, x1: 1260, y1: 780 };

// The thief.
export const PLAYER = {
  startX: 170,
  startY: 700,
  radius: 16,
  walkSpeed: 168,
  sneakSpeed: 86,
  noiseWalk: 120, // guards inside this radius hear walking feet
  noiseSneak: 42,
};

// The alarm meter: 0 calm, 100 caught.
export const ALARM = {
  calmBelow: 35,
  alarmAt: 75,
  caughtAt: 100,
  guardFill: 26, // per second while seen by a guard
  cameraFill: 30, // per second while seen by a camera
  decay: 11, // per second while unseen
  pickChirp: 8, // alarm added the moment the diamond leaves its case
  suspiciousSpeed: 1.35, // guard speed multiplier while suspicious
  huntSpeed: 1.5, // guard speed multiplier while the alarm is up
};

// Tools, each with a visible cost.
export const TOOLS = {
  coins: 3, // decoy coins: throw one, the nearest guard walks to it
  coinRange: 320, // how far a coin can be thrown
  coinHear: 520, // guards inside this radius investigate the landing
  coinLinger: 4, // seconds the ringing coin holds a guard
  emp: 1, // EMP bursts: both cameras dark at once
  empSeconds: 8,
};

// The diamond case: stand close and hold still to pick the lock.
export const PICK = {
  seconds: 2.0,
  reach: 72, // distance from the case centre that starts the pick
};

// Guards: name, lane endpoints, speed, cone.
export const GUARDS = [
  { name: 'Marlow', x0: 180, y0: 470, x1: 1100, y1: 470, speed: 55, range: 230, halfAngle: 0.6, pause: 1.2 },
  { name: 'Vesper', x0: 760, y0: 130, x1: 760, y1: 740, speed: 50, range: 220, halfAngle: 0.6, pause: 1.0 },
  { name: 'Rook', x0: 300, y0: 150, x1: 960, y1: 150, speed: 60, range: 210, halfAngle: 0.6, pause: 0.9 },
  { name: 'Ivy', x0: 180, y0: 130, x1: 180, y1: 740, speed: 48, range: 215, halfAngle: 0.6, pause: 1.1 },
];

// Cameras: wall mount, base aim (radians, 0 = east, PI/2 = south), sweep.
export const CAMERAS = [
  { name: 'CAM 1', x: 640, y: 96, base: Math.PI / 2, sweep: 0.96, period: 6, range: 260, halfAngle: 0.49 },
  { name: 'CAM 2', x: 1260, y: 470, base: Math.PI, sweep: 0.7, period: 7, range: 260, halfAngle: 0.49 },
];

// The loot: the Aurora Diamond, in its glass case inside the vault.
export const DIAMOND = { x: 1150, y: 200, caseX: 1120, caseY: 170, caseW: 60, caseH: 60 };

// The getaway: a gap in the south wall.
export const EXIT = { x0: 60, x1: 140, y: 772 };

// Palette: one visual code — dark blue room, amber danger, gold loot, green safe.
export const COLORS = {
  floor: '#161d33',
  floorAlt: '#1a2140',
  vaultFloor: '#1d1a2e',
  carpet: '#3a1f2b',
  wall: '#2a3350',
  wallEdge: '#4a5680',
  caseTop: '#22304f',
  caseTrim: '#8a6d2f',
  rope: '#a33348',
  cone: 'rgba(255,176,32,0.20)',
  coneSeen: 'rgba(255,60,60,0.30)',
  coneCamera: 'rgba(255,176,32,0.16)',
  coneOff: 'rgba(140,150,170,0.10)',
  gold: '#ffd24a',
  safe: '#37d67a',
  danger: '#ff4d4d',
  amber: '#ffb020',
  ink: '#e8ecf8',
  dim: '#9aa5c4',
  thief: '#2fd6c8',
  guard: '#5a6b9e',
};
