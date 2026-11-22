// Velvet Rope — The Meridian Gallery Heist: the world step, the loop,
// the input. One room, one thief, four guards, two cameras, one diamond.
import { VIEW, GUARDS, CAMERAS, ALARM } from './config.js';
import { makeGuard, updateGuard, canSee, sendToInvestigate } from './guards.js';
import { makeCamera, updateCamera, cameraSees } from './cameras.js';
import { makePlayer, updatePlayer, throwCoin, fireEmp, atExit } from './player.js';
import { makeAlarm, updateAlarm, alarmCaught } from './alarm.js';
import { makeAudio, ensureAudio, sfxCoin, sfxDiamond, sfxEmp, sfxCaught, sfxWin, sfxSpotted, updateAlarmSound } from './audio.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

export function buildWorld() {
  return {
    now: 0,
    elapsed: 0,
    phase: 'title', // title | playing | caught | won
    player: makePlayer(),
    guards: GUARDS.map(makeGuard),
    cameras: CAMERAS.map(makeCamera),
    alarm: makeAlarm(),
    coins: [],
    events: [],
    pendingInvestigate: null,
    audio: makeAudio(),
    caughtWhy: '',
    frozen: false,
    shotName: null,
  };
}

const world = buildWorld();
// A handle for play-testing and for the screenshot driver: the game's
// own world, readable and drivable from the page.
window.__heist = world;
window.__shotReady = false;

const input = { up: false, down: false, left: false, right: false, sneak: false, mouseX: 640, mouseY: 400 };

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

window.addEventListener('keydown', (e) => {
  if (KEYMAP[e.code] !== undefined) {
    input[KEYMAP[e.code]] = true;
    e.preventDefault();
  }
  if (e.code === 'Enter' && world.phase === 'title') startGame();
  if (e.code === 'KeyR' && (world.phase === 'caught' || world.phase === 'won')) restart();
  if (e.code === 'KeyQ' && world.phase === 'playing') {
    const coin = throwCoin(world.player, input.mouseX, input.mouseY, world);
    if (coin) sfxCoin(world.audio);
  }
  if (e.code === 'KeyE' && world.phase === 'playing') {
    if (fireEmp(world.player, world)) sfxEmp(world.audio);
  }
});
window.addEventListener('keyup', (e) => {
  if (KEYMAP[e.code] !== undefined) input[KEYMAP[e.code]] = false;
});
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  input.mouseX = ((e.clientX - r.left) / r.width) * VIEW.width;
  input.mouseY = ((e.clientY - r.top) / r.height) * VIEW.height;
});
canvas.addEventListener('mousedown', (e) => {
  ensureAudio(world.audio);
  if (world.phase === 'title') {
    startGame();
    return;
  }
  if (world.phase === 'playing' && e.button === 2) {
    const coin = throwCoin(world.player, input.mouseX, input.mouseY, world);
    if (coin) sfxCoin(world.audio);
  }
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function startGame() {
  ensureAudio(world.audio);
  world.phase = 'playing';
}

function restart() {
  const fresh = buildWorld();
  Object.assign(world, fresh);
  world.phase = 'playing';
  ensureAudio(world.audio);
}

function step(dt) {
  if (world.phase !== 'playing' || world.frozen) return;
  world.now += dt;
  world.elapsed += dt;

  updatePlayer(world.player, input, dt, world);

  // Who can see the thief right now? The fastest cone fill wins.
  let seen = false;
  let fill = 0;
  for (const g of world.guards) {
    const r = canSee(g.x, g.y, g.heading, g.range, g.halfAngle, world.player.x, world.player.y);
    g.seesPlayer = r.seen;
    if (r.seen) {
      seen = true;
      const prox = 1.15 - 0.7 * (r.dist / g.range);
      fill = Math.max(fill, ALARM.guardFill * prox);
    }
  }
  for (const c of world.cameras) {
    updateCamera(c, world.now, world.now);
    const r = cameraSees(c, world.player.x, world.player.y, world.now);
    c.seesPlayer = r.seen;
    if (r.seen) {
      seen = true;
      fill = Math.max(fill, ALARM.cameraFill);
    }
  }
  const wasAlarming = world.alarm.state === 'alarm';
  updateAlarm(world.alarm, dt, seen, fill);
  if (world.alarm.state === 'alarm' && !wasAlarming) sfxSpotted(world.audio);
  updateAlarmSound(world.audio, world.alarm.state === 'alarm');

  for (const g of world.guards) updateGuard(g, dt, world);
  if (world.pendingInvestigate) {
    const { guard, x, y } = world.pendingInvestigate;
    sendToInvestigate(guard, x, y);
    world.pendingInvestigate = null;
  }

  // A guard that bumps into the thief ends the heist on the spot.
  for (const g of world.guards) {
    if (Math.hypot(g.x - world.player.x, g.y - world.player.y) < 26) {
      world.caughtWhy = `${g.name} grabbed you in the gallery.`;
      endCaught();
      return;
    }
  }
  if (alarmCaught(world.alarm)) {
    world.caughtWhy = 'The alarm hit 100% — security swarmed the gallery.';
    endCaught();
    return;
  }
  if (atExit(world.player)) {
    world.phase = 'won';
    sfxWin(world.audio);
    updateAlarmSound(world.audio, false);
  }

  // Expire old coins and event toasts.
  world.coins = world.coins.filter((c) => world.now - c.born < c.ttl);
  world.events = world.events.filter((e) => world.now - e.t < 2.5);
}

function endCaught() {
  world.phase = 'caught';
  sfxCaught(world.audio);
  updateAlarmSound(world.audio, false);
}

// A deterministic scene from the URL (?shot=cover&seed=1) stages the world
// and freezes it; the loop keeps rendering, the clock never advances.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  if (applyShot(world, shot)) {
    render(ctx, world);
    window.__shotReady = true;
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(dt);
  render(ctx, world);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
