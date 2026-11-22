// The thief: WASD or arrows to move, Shift to sneak, Q to toss a decoy
// coin at the mouse, E to fire the EMP. Standing at the diamond case
// picks its lock — slowly, and only while no cone is on you.
import { PLAYER, TOOLS, PICK, DIAMOND, EXIT } from './config.js';
import { moveCircle, EXIT_DOOR } from './level.js';

export function makePlayer() {
  return {
    x: PLAYER.startX,
    y: PLAYER.startY,
    radius: PLAYER.radius,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    noise: 0,
    coins: TOOLS.coins,
    emp: TOOLS.emp,
    hasDiamond: false,
    pickProgress: 0,
    picking: false,
  };
}

export function updatePlayer(p, input, dt, world) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  const len = Math.hypot(dx, dy);
  p.moving = len > 0;
  p.sneaking = !!input.sneak && p.moving;
  if (p.moving) {
    dx /= len;
    dy /= len;
    p.facing = Math.atan2(dy, dx);
    const speed = p.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    // The getaway door stays shut until the diamond is in hand.
    const door = p.hasDiamond ? [] : [EXIT_DOOR];
    const [nx, ny] = moveCircle(p.x, p.y, dx * speed * dt, dy * speed * dt, p.radius, door);
    p.x = nx;
    p.y = ny;
    p.noise = p.sneaking ? PLAYER.noiseSneak : PLAYER.noiseWalk;
  } else {
    p.noise = 0;
  }

  // Picking the diamond case: hold still, close, unseen.
  const dc = Math.hypot(p.x - DIAMOND.x, p.y - DIAMOND.y);
  const nearCase = dc < PICK.reach && !p.hasDiamond;
  const seen = world.guards.some((g) => g.seesPlayer) || world.cameras.some((c) => c.seesPlayer);
  p.picking = nearCase && !p.moving && !seen;
  if (p.picking) {
    p.pickProgress += dt / PICK.seconds;
    if (p.pickProgress >= 1) {
      p.pickProgress = 1;
      p.hasDiamond = true;
      world.alarm.value = Math.min(100, world.alarm.value + 8);
      world.events.push({ kind: 'diamond', t: world.now });
    }
  } else if (!p.hasDiamond) {
    p.pickProgress = Math.max(0, p.pickProgress - dt * 0.5);
  }

  // Loud walking feet pull the nearest guard over to listen.
  if (p.moving && !p.sneaking) {
    for (const g of world.guards) {
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      if (d < p.noise && g.mode === 'patrol' && !g.seesPlayer) {
        world.pendingInvestigate = { guard: g, x: p.x, y: p.y };
      }
    }
  }
}

// A decoy coin lands where the mouse points (capped by throwing range).
// The nearest guard in earshot walks over to look at it.
export function throwCoin(p, mx, my, world) {
  if (p.coins <= 0) return null;
  p.coins -= 1;
  const dx = mx - p.x;
  const dy = my - p.y;
  const dist = Math.hypot(dx, dy);
  const reach = Math.min(dist, TOOLS.coinRange);
  const lx = dist > 0 ? p.x + (dx / dist) * reach : p.x;
  const ly = dist > 0 ? p.y + (dy / dist) * reach : p.y;
  const coin = { x: lx, y: ly, born: world.now, ttl: TOOLS.coinLinger };
  world.coins.push(coin);
  let best = null;
  let bestD = Infinity;
  for (const g of world.guards) {
    const d = Math.hypot(g.x - lx, g.y - ly);
    if (d < TOOLS.coinHear && d < bestD) {
      best = g;
      bestD = d;
    }
  }
  if (best) {
    world.pendingInvestigate = { guard: best, x: lx, y: ly };
  }
  return coin;
}

export function fireEmp(p, world) {
  if (p.emp <= 0) return false;
  p.emp -= 1;
  for (const c of world.cameras) c.disabledUntil = world.now + TOOLS.empSeconds;
  world.events.push({ kind: 'emp', t: world.now });
  return true;
}

// Inside the getaway gap, diamond in hand: the heist is over.
export function atExit(p) {
  return p.hasDiamond && p.x > EXIT.x0 && p.x < EXIT.x1 && p.y > EXIT.y;
}
