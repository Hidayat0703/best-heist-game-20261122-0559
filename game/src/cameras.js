// The two wall cameras: they sweep, they never move, and an EMP burst
// puts them both to sleep. A camera that sees the thief fills the alarm
// faster than a guard does — read the sweep before you cross it.
import { canSee } from './guards.js';

export function makeCamera(spec) {
  return {
    name: spec.name,
    x: spec.x,
    y: spec.y,
    base: spec.base,
    sweep: spec.sweep,
    period: spec.period,
    range: spec.range,
    halfAngle: spec.halfAngle,
    heading: spec.base,
    seesPlayer: false,
    disabledUntil: 0,
  };
}

export function updateCamera(cam, t, now) {
  if (now < cam.disabledUntil) {
    cam.seesPlayer = false;
    return;
  }
  cam.heading = cam.base + Math.sin((t / cam.period) * Math.PI * 2) * cam.sweep;
}

export function cameraSees(cam, px, py, now) {
  if (now < cam.disabledUntil) return { seen: false, dist: Infinity };
  return canSee(cam.x, cam.y, cam.heading, cam.range, cam.halfAngle, px, py);
}

export function camerasDisabled(cam, now) {
  return now < cam.disabledUntil;
}
