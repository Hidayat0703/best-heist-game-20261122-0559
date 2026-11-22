// All sound is synthesised with WebAudio: no audio files, no network.
// A soft blip for a coin, a chime for the diamond, a two-tone alarm
// while the meter is up, a short sting for being caught or getting away.
export function makeAudio() {
  return { ctx: null, alarmOn: false, alarmTimer: null };
}

export function ensureAudio(audio) {
  if (audio.ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio.ctx = new AC();
  } catch {
    audio.ctx = null;
  }
}

function tone(audio, freq, dur, type, gain, when = 0) {
  if (!audio.ctx) return;
  const t0 = audio.ctx.currentTime + when;
  const osc = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(audio.ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function sfxCoin(audio) {
  tone(audio, 1320, 0.09, 'sine', 0.12);
  tone(audio, 1760, 0.12, 'sine', 0.1, 0.07);
}

export function sfxPick(audio) {
  tone(audio, 880, 0.08, 'triangle', 0.1);
}

export function sfxDiamond(audio) {
  [523, 659, 784, 1047].forEach((f, i) => tone(audio, f, 0.22, 'triangle', 0.12, i * 0.09));
}

export function sfxEmp(audio) {
  tone(audio, 220, 0.35, 'sawtooth', 0.08);
  tone(audio, 110, 0.4, 'sawtooth', 0.08, 0.1);
}

export function sfxCaught(audio) {
  [392, 311, 233].forEach((f, i) => tone(audio, f, 0.3, 'sawtooth', 0.12, i * 0.16));
}

export function sfxWin(audio) {
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(audio, f, 0.3, 'triangle', 0.12, i * 0.11));
}

export function sfxSpotted(audio) {
  tone(audio, 740, 0.14, 'square', 0.09);
  tone(audio, 988, 0.2, 'square', 0.09, 0.12);
}

// A quiet two-tone pulse while the alarm state is up; silent otherwise.
export function updateAlarmSound(audio, alarming) {
  if (!audio.ctx) return;
  if (alarming && !audio.alarmOn) {
    audio.alarmOn = true;
    const tick = () => {
      if (!audio.alarmOn) return;
      tone(audio, 660, 0.12, 'square', 0.05);
      tone(audio, 440, 0.12, 'square', 0.05, 0.18);
      audio.alarmTimer = setTimeout(tick, 720);
    };
    tick();
  } else if (!alarming && audio.alarmOn) {
    audio.alarmOn = false;
    clearTimeout(audio.alarmTimer);
  }
}
