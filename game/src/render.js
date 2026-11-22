// Every pixel of Velvet Rope is drawn here, in code: the gallery floor,
// the vault, the cones, the thief, the HUD and the overlays. The visual
// code never changes — dark blue room, amber danger, gold loot, green safe.
import { VIEW, HUD_H, COLORS, DIAMOND, EXIT, TOOLS } from './config.js';
import { WALLS as LV_WALLS, CASES as LV_CASES, PILLARS as LV_PILLARS, ROPES as LV_ROPES, DIAMOND_CASE } from './level.js';
import { camerasDisabled } from './cameras.js';

const walls = LV_WALLS;
const cases = LV_CASES;
const pillars = LV_PILLARS;
const ropes = LV_ROPES;

function conePath(ctx, x, y, heading, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, heading - half, heading + half);
  ctx.closePath();
}

function drawCone(ctx, x, y, heading, range, half, fill, dashed) {
  ctx.save();
  if (dashed) ctx.setLineDash([6, 6]);
  conePath(ctx, x, y, heading, range, half);
  ctx.fillStyle = fill;
  ctx.fill();
  if (dashed) {
    ctx.strokeStyle = 'rgba(200,210,230,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function label(ctx, text, x, y, size, color, align = 'center') {
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function diamondShape(ctx, x, y, r, t) {
  const pulse = 1 + Math.sin(t * 3) * 0.06;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.8, -r * 0.2);
  ctx.lineTo(r * 0.55, r * 0.8);
  ctx.lineTo(-r * 0.55, r * 0.8);
  ctx.lineTo(-r * 0.8, -r * 0.2);
  ctx.closePath();
  ctx.fillStyle = COLORS.gold;
  ctx.fill();
  ctx.strokeStyle = '#fff6c9';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r * 0.2);
  ctx.lineTo(r * 0.8, -r * 0.2);
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r * 0.8);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

export function render(ctx, world) {
  const t = world.now;
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  drawVault(ctx);
  drawRopes(ctx);
  drawCases(ctx, t);
  drawPillars(ctx);
  drawDiamondCase(ctx, world, t);
  drawExit(ctx, world);
  drawCoins(ctx, world, t);
  drawCameraCones(ctx, world);
  drawGuardCones(ctx, world);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawPlayer(ctx, world, t);
  drawHud(ctx, world);
  drawBanners(ctx, world);
  if (world.phase === 'title') drawTitle(ctx, world);
  if (world.phase === 'caught') drawCaught(ctx, world);
  if (world.phase === 'won') drawWin(ctx, world);
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, HUD_H, VIEW.width, VIEW.height - HUD_H);
  // Subtle floor tiles so the room reads as a room, not a void.
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 20; x < 1260; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, HUD_H + 12);
    ctx.lineTo(x, 780);
    ctx.stroke();
  }
  for (let y = 96; y < 780; y += 80) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(1260, y);
    ctx.stroke();
  }
  // The burgundy carpet runner down the open gallery floor.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(20, 440, 980, 60);
  ctx.strokeStyle = 'rgba(255,210,74,0.35)';
  ctx.strokeRect(20, 440, 980, 60);
}

function drawVault(ctx) {
  ctx.fillStyle = COLORS.vaultFloor;
  ctx.fillRect(1012, 96, 248, 224);
  ctx.strokeStyle = 'rgba(255,210,74,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1012, 96, 248, 224);
  label(ctx, 'VAULT', 1136, 116, 13, 'rgba(255,210,74,0.85)');
}

function drawRopes(ctx) {
  for (const r of ropes) {
    ctx.fillStyle = COLORS.rope;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(r.x, r.y + 3, 4, 0, Math.PI * 2);
    ctx.arc(r.x + r.w, r.y + 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCases(ctx, t) {
  for (const c of cases) {
    ctx.fillStyle = COLORS.caseTop;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = COLORS.caseTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    // A little artifact inside each case: a vase silhouette.
    ctx.fillStyle = 'rgba(255,210,74,0.55)';
    ctx.beginPath();
    ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, 9, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, 3);
  }
  for (const w of walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallEdge;
    if (w.h <= 12) ctx.fillRect(w.x, w.y, w.w, 3);
    else ctx.fillRect(w.x, w.y, 3, w.h);
  }
}

function drawPillars(ctx) {
  for (const p of pillars) {
    ctx.fillStyle = '#3a4470';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = COLORS.wallEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }
}

function drawDiamondCase(ctx, world, t) {
  const c = DIAMOND_CASE;
  ctx.save();
  if (!world.player.hasDiamond) {
    const glow = ctx.createRadialGradient(DIAMOND.x, DIAMOND.y, 4, DIAMOND.x, DIAMOND.y, 90);
    glow.addColorStop(0, 'rgba(255,210,74,0.35)');
    glow.addColorStop(1, 'rgba(255,210,74,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(DIAMOND.x - 90, DIAMOND.y - 90, 180, 180);
  }
  ctx.fillStyle = 'rgba(120,160,220,0.25)';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(c.x, c.y, c.w, c.h);
  if (!world.player.hasDiamond) {
    diamondShape(ctx, DIAMOND.x, DIAMOND.y, 15, t);
    label(ctx, 'AURORA DIAMOND', DIAMOND.x, DIAMOND.y - 44, 12, COLORS.gold);
  } else {
    label(ctx, 'CASE EMPTY', DIAMOND.x, DIAMOND.y - 44, 11, COLORS.dim);
  }
  // The lockpick ring while the thief works the case.
  const p = world.player;
  if (p.picking && p.pickProgress > 0) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26, -Math.PI / 2, -Math.PI / 2 + p.pickProgress * Math.PI * 2);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    ctx.stroke();
    label(ctx, 'PICKING…', p.x, p.y - 36, 11, COLORS.gold);
  }
  ctx.restore();
}

function drawExit(ctx, world) {
  ctx.fillStyle = COLORS.safe;
  ctx.fillRect(EXIT.x0, 780, EXIT.x1 - EXIT.x0, 12);
  label(ctx, 'EXIT — GETAWAY', 100, 758, 13, COLORS.safe);
  if (world.player.hasDiamond) {
    ctx.save();
    ctx.globalAlpha = 0.6 + Math.sin(world.now * 4) * 0.25;
    ctx.strokeStyle = COLORS.safe;
    ctx.lineWidth = 3;
    ctx.strokeRect(EXIT.x0 - 6, 752, EXIT.x1 - EXIT.x0 + 12, 34);
    ctx.restore();
  }
}

function drawCoins(ctx, world, t) {
  for (const coin of world.coins) {
    const age = t - coin.born;
    if (age > TOOLS.coinLinger) continue;
    const ring = ((age % 0.8) / 0.8) * 34;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, ring, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,210,74,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gold;
    ctx.fill();
  }
}

function drawCameraCones(ctx, world) {
  for (const cam of world.cameras) {
    const off = camerasDisabled(cam, world.now);
    const fill = off ? COLORS.coneOff : cam.seesPlayer ? COLORS.coneSeen : COLORS.coneCamera;
    drawCone(ctx, cam.x, cam.y, cam.heading, cam.range, cam.halfAngle, fill, off);
  }
}

function drawGuardCones(ctx, world) {
  for (const g of world.guards) {
    const fill = g.seesPlayer ? COLORS.coneSeen : COLORS.cone;
    drawCone(ctx, g.x, g.y, g.heading, g.range, g.halfAngle, fill, false);
  }
}

function drawCameras(ctx, world) {
  for (const cam of world.cameras) {
    const off = camerasDisabled(cam, world.now);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.heading);
    ctx.fillStyle = off ? '#5a6478' : cam.seesPlayer ? COLORS.danger : '#c8d2e8';
    ctx.fillRect(-4, -8, 16, 16);
    ctx.beginPath();
    ctx.arc(12, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = off ? '#3a4152' : COLORS.danger;
    ctx.fill();
    ctx.restore();
    const tag = off ? `${cam.name} OFF` : cam.name;
    label(ctx, tag, cam.x + (cam.x > 1200 ? -34 : 0), cam.y + (cam.y < 120 ? 30 : -22), 11, off ? COLORS.dim : '#c8d2e8');
  }
}

function drawGuards(ctx, world) {
  for (const g of world.guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = g.seesPlayer ? '#7a2e3a' : COLORS.guard;
    ctx.fill();
    ctx.strokeStyle = g.seesPlayer ? COLORS.danger : '#8fa0c8';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick + cap brim, so the guard reads as a person, not a dot.
    ctx.rotate(g.heading);
    ctx.fillStyle = '#dfe6f8';
    ctx.fillRect(8, -3, 10, 6);
    ctx.restore();
    label(ctx, g.name.toUpperCase(), g.x, g.y - 24, 11, '#c8d2e8');
    if (g.seesPlayer) {
      label(ctx, '!', g.x, g.y - 42, 22, COLORS.danger);
    } else if (g.mode === 'investigate') {
      label(ctx, '?', g.x, g.y - 40, 18, COLORS.amber);
    }
  }
}

function drawPlayer(ctx, world, t) {
  const p = world.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.sneaking) {
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(47,214,200,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#123a3f';
  ctx.fill();
  ctx.strokeStyle = p.hasDiamond ? COLORS.gold : COLORS.thief;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Hood point + facing tick.
  ctx.rotate(p.facing);
  ctx.beginPath();
  ctx.moveTo(4, -9);
  ctx.lineTo(16, 0);
  ctx.lineTo(4, 9);
  ctx.closePath();
  ctx.fillStyle = COLORS.thief;
  ctx.fill();
  ctx.restore();
  label(ctx, 'YOU', p.x, p.y - 26, 11, COLORS.thief);
  if (p.hasDiamond) {
    diamondShape(ctx, p.x, p.y - 34, 7, t);
  }
}

function drawHud(ctx, world) {
  const p = world.player;
  const a = world.alarm;
  ctx.fillStyle = '#0b0f1e';
  ctx.fillRect(0, 0, VIEW.width, HUD_H);
  ctx.fillStyle = 'rgba(255,210,74,0.25)';
  ctx.fillRect(0, HUD_H - 2, VIEW.width, 2);

  // Left: title + objective.
  label(ctx, 'VELVET ROPE', 20, 22, 20, COLORS.gold, 'left');
  const objective = !p.hasDiamond
    ? 'Steal the Aurora Diamond — then reach the EXIT'
    : 'Diamond secured — GET TO THE EXIT, unseen';
  label(ctx, objective, 20, 50, 13, p.hasDiamond ? COLORS.safe : COLORS.ink, 'left');

  // Centre: the alarm meter. This is the whole tension of the game.
  const mx = 470;
  const mw = 340;
  const stateColor = a.state === 'alarm' ? COLORS.danger : a.state === 'suspicious' ? COLORS.amber : COLORS.safe;
  label(ctx, 'ALARM', mx, 20, 13, COLORS.dim, 'left');
  ctx.fillStyle = '#232c48';
  ctx.fillRect(mx, 30, mw, 18);
  ctx.fillStyle = stateColor;
  ctx.fillRect(mx, 30, (mw * a.value) / 100, 18);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, 30, mw, 18);
  label(ctx, `${Math.round(a.value)}%  ${a.state.toUpperCase()}`, mx + mw + 12, 39, 13, stateColor, 'left');
  if (a.alarmsRaised > 0) {
    label(ctx, `alarms raised: ${a.alarmsRaised}`, mx, 64, 11, COLORS.amber, 'left');
  }

  // Right: loot, tools, timer.
  const rx = 1260;
  label(ctx, p.hasDiamond ? '◇ DIAMOND: SECURED' : '◇ DIAMOND: IN CASE', rx, 20, 13, p.hasDiamond ? COLORS.gold : COLORS.dim, 'right');
  label(ctx, `◉ coins ×${p.coins}   ⚡ EMP ×${p.emp}`, rx, 40, 13, COLORS.ink, 'right');
  label(ctx, `⏱ ${formatTime(world.elapsed)}`, rx, 60, 13, COLORS.dim, 'right');
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function drawBanners(ctx, world) {
  const a = world.alarm;
  if (world.phase === 'playing' && a.state === 'alarm') {
    // Bottom-centre, on a dark plate: the top of the room is crowded with
    // cones and camera tags, and a bare red banner washes out over them.
    ctx.save();
    ctx.globalAlpha = 0.65 + Math.sin(world.now * 6) * 0.3;
    ctx.fillStyle = 'rgba(8,11,24,0.88)';
    ctx.fillRect(390, 734, 500, 34);
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 2;
    ctx.strokeRect(390, 734, 500, 34);
    label(ctx, '!  SPOTTED — BREAK LINE OF SIGHT  !', 640, 752, 20, COLORS.danger);
    ctx.restore();
  }
  const empLeft = Math.max(0, ...world.cameras.map((c) => c.disabledUntil - world.now));
  if (empLeft > 0.01) {
    label(ctx, `CAMERAS DOWN — ${empLeft.toFixed(0)}s`, 640, 108, 16, COLORS.amber);
  }
  for (const ev of world.events) {
    const age = world.now - ev.t;
    if (age > 2.5) continue;
    if (ev.kind === 'diamond') {
      label(ctx, '◆ AURORA DIAMOND SECURED — GET TO THE EXIT ◆', 640, 140, 18, COLORS.gold);
    }
    if (ev.kind === 'emp') {
      label(ctx, '⚡ EMP — CAMERAS DARK', 640, 140, 16, COLORS.amber);
    }
  }
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(8,11,24,0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(5,8,18,0.72)';
  ctx.fillRect(0, HUD_H, VIEW.width, VIEW.height - HUD_H);
  panel(ctx, 340, 190, 600, 400);
  label(ctx, 'VELVET ROPE', 640, 250, 40, COLORS.gold);
  label(ctx, 'The Meridian Gallery Heist', 640, 296, 18, COLORS.ink);
  label(ctx, 'Steal the Aurora Diamond. Dodge the cones.', 640, 344, 15, COLORS.dim);
  label(ctx, 'Cameras sweep. Guards patrol. The alarm only', 640, 372, 15, COLORS.dim);
  label(ctx, 'falls when you break line of sight.', 640, 396, 15, COLORS.dim);
  label(ctx, 'WASD / arrows — move      Shift — sneak', 640, 442, 15, COLORS.ink);
  label(ctx, 'Q — toss a decoy coin      E — EMP the cameras', 640, 470, 15, COLORS.ink);
  label(ctx, 'Hold still at the diamond case to pick its lock.', 640, 498, 15, COLORS.ink);
  label(ctx, 'Click or press Enter to start', 640, 548, 17, COLORS.safe);
}

function drawCaught(ctx, world) {
  ctx.fillStyle = 'rgba(40,5,10,0.66)';
  ctx.fillRect(0, HUD_H, VIEW.width, VIEW.height - HUD_H);
  panel(ctx, 390, 240, 500, 280);
  label(ctx, 'CAUGHT!', 640, 300, 40, COLORS.danger);
  label(ctx, world.caughtWhy || 'The alarm hit 100%.', 640, 348, 16, COLORS.ink);
  label(ctx, `Alarm ${Math.round(world.alarm.value)}%  ·  ${formatTime(world.elapsed)}  ·  alarms raised ${world.alarm.alarmsRaised}`, 640, 392, 14, COLORS.dim);
  label(ctx, 'Press R to try the gallery again', 640, 452, 16, COLORS.safe);
}

function drawWin(ctx, world) {
  ctx.fillStyle = 'rgba(5,18,10,0.66)';
  ctx.fillRect(0, HUD_H, VIEW.width, VIEW.height - HUD_H);
  panel(ctx, 360, 210, 560, 340);
  label(ctx, 'CLEAN GETAWAY', 640, 268, 38, COLORS.gold);
  label(ctx, 'The Aurora Diamond is yours.', 640, 314, 17, COLORS.ink);
  const rating = world.alarm.alarmsRaised === 0 ? 'GHOST — never raised the alarm' : world.alarm.alarmsRaised <= 1 ? 'CLEAN — one alarm, still gone' : 'LOUD — but the diamond is yours';
  label(ctx, rating, 640, 352, 15, COLORS.safe);
  label(ctx, `Time ${formatTime(world.elapsed)}   ·   Alarms raised ${world.alarm.alarmsRaised}`, 640, 398, 15, COLORS.ink);
  label(ctx, `Coins left ${world.player.coins}   ·   EMP left ${world.player.emp}`, 640, 428, 15, COLORS.ink);
  label(ctx, 'Press R to run the gallery again', 640, 492, 16, COLORS.safe);
}
