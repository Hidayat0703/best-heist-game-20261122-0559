// The alarm meter: what every cone in the room is doing to you.
// Calm below 35, suspicious to 75, alarm above that, caught at 100.
// It drains when you break line of sight — cover is a real mechanic,
// not decoration.
import { ALARM } from './config.js';

export function makeAlarm() {
  return {
    value: 0,
    state: 'calm', // calm | suspicious | alarm
    alarmsRaised: 0,
    lastSeenX: 0,
    lastSeenY: 0,
  };
}

export function updateAlarm(alarm, dt, seen, fillRate) {
  const before = alarm.state;
  if (seen) {
    alarm.value = Math.min(ALARM.caughtAt, alarm.value + fillRate * dt);
  } else {
    alarm.value = Math.max(0, alarm.value - ALARM.decay * dt);
  }
  alarm.state = alarm.value >= ALARM.alarmAt
    ? 'alarm'
    : alarm.value >= ALARM.calmBelow
      ? 'suspicious'
      : 'calm';
  if (before !== 'alarm' && alarm.state === 'alarm') alarm.alarmsRaised += 1;
}

export function alarmCaught(alarm) {
  return alarm.value >= ALARM.caughtAt;
}
