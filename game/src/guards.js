// The four guards: patrols on clear lanes, vision cones, suspicion,
// investigation and the hunt. A guard never leaves its lane unless it
// is investigating a noise or hunting a thief it has seen.
import { ALARM } from './config.js';
import { moveCircle, segmentBlocked } from './level.js';

export const GUARD_RADIUS = 14;

export function makeGuard(spec) {
  return {
    name: spec.name,
    x: spec.x0,
    y: spec.y0,
    fromX: spec.x0,
    fromY: spec.y0,
    toX: spec.x1,
    toY: spec.y1,
    speed: spec.speed,
    range: spec.range,
    halfAngle: spec.halfAngle,
    pause: spec.pause,
    heading: spec.x1 === spec.x0 ? Math.PI / 2 : 0,
    leg: 0, // 0: walking to the far end, 1: walking back
    wait: 0,
    mode: 'patrol', // patrol | investigate | hunt | return
    targetX: spec.x1,
    targetY: spec.y1,
    seesPlayer: false,
    alertFlash: 0, // seconds the "!" stays over the guard
    stuck: 0,
  };
}

// Can this watcher see the player? Cone + range + line of sight.
export function canSee(wx, wy, heading, range, halfAngle, px, py) {
  const dx = px - wx;
  const dy = py - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { seen: false, dist };
  let diff = Math.atan2(dy, dx) - heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return { seen: false, dist };
  if (segmentBlocked(wx, wy, px, py)) return { seen: false, dist };
  return { seen: true, dist };
}

function stepToward(g, tx, ty, dt, speed) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const vx = (dx / dist) * speed * dt;
  const vy = (dy / dist) * speed * dt;
  const [nx, ny] = moveCircle(g.x, g.y, vx, vy, GUARD_RADIUS);
  const moved = Math.hypot(nx - g.x, ny - g.y);
  if (moved < 0.001 && dist > 6) {
    // Anti-stuck: the lane is clear by construction, but if a hunt ever
    // wedges a guard on a corner, turn back instead of freezing.
    g.stuck += dt;
    if (g.stuck > 0.6) {
      g.mode = 'return';
      g.stuck = 0;
    }
    return false;
  }
  g.stuck = 0;
  g.heading = Math.atan2(vy, vx);
  g.x = nx;
  g.y = ny;
  return dist < 8;
}

export function updateGuard(g, dt, world) {
  const speedMul = world.alarm.state === 'alarm'
    ? ALARM.huntSpeed
    : world.alarm.state === 'suspicious'
      ? ALARM.suspiciousSpeed
      : 1;
  const speed = g.speed * speedMul;
  if (g.alertFlash > 0) g.alertFlash -= dt;

  // A guard that sees the player remembers where, and hunts while the
  // alarm is up. Suspicion alone only turns the guard toward the thief.
  if (g.seesPlayer) {
    g.alertFlash = 0.7;
    world.alarm.lastSeenX = world.player.x;
    world.alarm.lastSeenY = world.player.y;
    if (world.alarm.state === 'alarm') g.mode = 'hunt';
  }

  if (g.mode === 'hunt') {
    const arrived = stepToward(g, world.player.x, world.player.y, dt, speed);
    if (world.alarm.state !== 'alarm') g.mode = 'return';
    if (arrived) g.mode = 'return';
    return;
  }

  if (g.mode === 'investigate') {
    const arrived = stepToward(g, g.targetX, g.targetY, dt, speed);
    if (arrived) {
      g.wait += dt;
      // Look around the spot, then walk back to the lane.
      g.heading += dt * 1.4;
      if (g.wait > 2.2) {
        g.mode = 'return';
        g.wait = 0;
      }
    }
    return;
  }

  if (g.mode === 'return') {
    // Walk back to the nearest end of the patrol lane, then resume.
    const d0 = Math.hypot(g.x - g.fromX, g.y - g.fromY);
    const d1 = Math.hypot(g.x - g.toX, g.y - g.toY);
    const hx = d0 < d1 ? g.fromX : g.toX;
    const hy = d0 < d1 ? g.fromY : g.toY;
    const arrived = stepToward(g, hx, hy, dt, speed);
    if (arrived) {
      g.leg = d0 < d1 ? 1 : 0;
      g.mode = 'patrol';
    }
    return;
  }

  // Patrol: walk the lane, pause at each end.
  if (g.wait > 0) {
    g.wait -= dt;
    return;
  }
  const ex = g.leg === 0 ? g.toX : g.fromX;
  const ey = g.leg === 0 ? g.toY : g.fromY;
  const arrived = stepToward(g, ex, ey, dt, speed);
  if (arrived) {
    g.leg = 1 - g.leg;
    g.wait = g.pause;
    g.heading += Math.PI; // turn around at the end of the lane
  }
}

// Send a guard to look at a point (decoy coin, loud footstep).
export function sendToInvestigate(g, x, y) {
  if (g.mode === 'hunt') return;
  g.mode = 'investigate';
  g.targetX = x;
  g.targetY = y;
  g.wait = 0;
}
