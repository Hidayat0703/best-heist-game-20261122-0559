// The Meridian Gallery floor plan: walls, cases, ropes and the vault.
// Walls and display cases block movement AND sight. Velvet ropes block
// movement only (you can see over them). The diamond case is glass:
// it blocks movement, never sight. Pure geometry — no DOM — so a plain
// Node script can import this file and prove the patrol lanes are clear.
import { DIAMOND } from './config.js';

export const WALLS = [
  // Outer shell (the south wall leaves the getaway gap at x 60..140).
  { x: 8, y: 84, w: 1264, h: 12 },
  { x: 8, y: 780, w: 52, h: 12 },
  { x: 140, y: 780, w: 1132, h: 12 },
  { x: 8, y: 84, w: 12, h: 708 },
  { x: 1260, y: 84, w: 12, h: 708 },
  // Vault annex, top-right: west wall with a door gap y 240..300,
  // south wall with a door gap x 1180..1240.
  { x: 1000, y: 96, w: 12, h: 144 },
  { x: 1000, y: 300, w: 12, h: 32 },
  { x: 1012, y: 320, w: 168, h: 12 },
  { x: 1240, y: 320, w: 20, h: 12 },
];

// Display cases: cover you can hide behind. Two rows leave clear lanes
// at x 400..480 and x 580..860 for the vertical patrol, and the gaps
// between the rows are the open gallery floor.
export const CASES = [
  { x: 240, y: 300, w: 160, h: 60 },
  { x: 480, y: 300, w: 100, h: 60 },
  { x: 860, y: 300, w: 160, h: 60 },
  { x: 240, y: 580, w: 160, h: 60 },
  { x: 480, y: 580, w: 100, h: 60 },
  { x: 860, y: 580, w: 160, h: 60 },
];

// Stone pillars in the open floor, clear of every patrol lane.
export const PILLARS = [
  { x: 420, y: 240, w: 24, h: 24 },
  { x: 900, y: 240, w: 24, h: 24 },
];

// Velvet ropes: low barriers near the vault's south door and the exit.
export const ROPES = [
  { x: 200, y: 660, w: 140, h: 6 },
  { x: 1100, y: 640, w: 120, h: 6 },
  { x: 1100, y: 680, w: 120, h: 6 },
];

export const SIGHT_BLOCKERS = [...WALLS, ...CASES, ...PILLARS];
export const MOVE_BLOCKERS = [...WALLS, ...CASES, ...PILLARS, ...ROPES];

// The getaway door: shut until the diamond is in hand. A thief who tries
// to slip out empty-handed finds it locked and has to go back in.
export const EXIT_DOOR = { x: 60, y: 780, w: 80, h: 12 };

export const DIAMOND_CASE = {
  x: DIAMOND.caseX,
  y: DIAMOND.caseY,
  w: DIAMOND.caseW,
  h: DIAMOND.caseH,
};

// True when the circle (cx, cy, r) overlaps any rect in the list.
export function circleHitsRects(cx, cy, r, rects) {
  for (const rc of rects) {
    const nx = Math.max(rc.x, Math.min(cx, rc.x + rc.w));
    const ny = Math.max(rc.y, Math.min(cy, rc.y + rc.h));
    const dx = cx - nx;
    const dy = cy - ny;
    if (dx * dx + dy * dy < r * r) return rc;
  }
  return null;
}

// True when the segment (x0,y0)-(x1,y1) crosses any sight blocker.
export function segmentBlocked(x0, y0, x1, y1) {
  for (const rc of SIGHT_BLOCKERS) {
    if (segmentHitsRect(x0, y0, x1, y1, rc)) return true;
  }
  return false;
}

function segmentHitsRect(x0, y0, x1, y1, rc) {
  if (pointInRect(x0, y0, rc) || pointInRect(x1, y1, rc)) return true;
  const edges = [
    [rc.x, rc.y, rc.x + rc.w, rc.y],
    [rc.x + rc.w, rc.y, rc.x + rc.w, rc.y + rc.h],
    [rc.x + rc.w, rc.y + rc.h, rc.x, rc.y + rc.h],
    [rc.x, rc.y + rc.h, rc.x, rc.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    if (segmentsCross(x0, y0, x1, y1, ax, ay, bx, by)) return true;
  }
  return false;
}

function pointInRect(px, py, rc) {
  return px >= rc.x && px <= rc.x + rc.w && py >= rc.y && py <= rc.y + rc.h;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Slide a circle along the axes against the move blockers: try the full
// step, then x-only, then y-only, so a thief never wedges on a corner.
// extraBlockers are one-off additions (the shut getaway door).
export function moveCircle(x, y, dx, dy, r, extraBlockers = []) {
  const blockers = extraBlockers.length ? [...MOVE_BLOCKERS, ...extraBlockers] : MOVE_BLOCKERS;
  if (!circleHitsRects(x + dx, y + dy, r, blockers)) return [x + dx, y + dy];
  if (!circleHitsRects(x + dx, y, r, blockers)) return [x + dx, y];
  if (!circleHitsRects(x, y + dy, r, blockers)) return [x, y + dy];
  return [x, y];
}

// Count how many samples along a patrol lane would put a guard inside a
// wall or case. A lane is clear only when this returns 0.
export function countBlockedSamples(x0, y0, x1, y1, r, step = 4) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(len / step));
  let blocked = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    if (circleHitsRects(x, y, r, MOVE_BLOCKERS)) blocked++;
  }
  return blocked;
}
