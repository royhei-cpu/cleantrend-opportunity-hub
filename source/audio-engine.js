// Original, synthesized ambient music. No remote recordings or audio requests.
const CHORDS = [[48,55,59,64],[45,52,55,60],[41,48,52,57],[43,50,57,59]];
const MELODY = [72,76,79,74,76,72,69,71];
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
export const clampVolume = value => Math.min(1, Math.max(0, Number(value) || 0));

export function createAudioEngine({ Context, timer = globalThis } = {}) {
  if (!Context) throw new Error('Audio is unavailable in this browser.');
  const context = new Context();
  const master = context.createGain();
  const music = context.createGain();
  const effects = context.createGain();
  const filter = context.createBiquadFilter();
  master.gain.value = 0.65;
  music.gain.value = 0;
  effects.gain.value = 0.16;
  filter.type = 'lowpass'; filter.frequency.value = 1800;
  music.connect(filter); filter.connect(master); effects.connect(master); master.connect(context.destination);
  const musicNodes = new Set();
  let interval = null, cursor = 0, position = 0, playing = false, muted = false, volume = 0.2, disposed = false;
  let lastClick = -Infinity;
  let startVersion = 0;

  function tone(midi, at, duration, level, bus, bell = false) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency(midi);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(level, at + (bell ? 0.012 : 1.8));
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope); envelope.connect(bus);
    if (bus === music) musicNodes.add(oscillator);
    oscillator.onended = () => { musicNodes.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(at); oscillator.stop(at + duration + 0.03);
  }

  function schedule() {
    if (!playing || disposed) return;
    while (cursor < context.currentTime + 0.7) {
      const chord = CHORDS[Math.floor(position / 2) % CHORDS.length];
      if (position % 2 === 0) chord.forEach((note, index) => tone(note, cursor + index * 0.045, 9.5, 0.075, music));
      tone(MELODY[position % MELODY.length], cursor + 0.3, 3.3, 0.045, music, true);
      cursor += 4; position++;
    }
  }

  async function wake() {
    if (disposed) return false;
    if (context.state !== 'running' && context.state !== 'closed') await context.resume();
    return !disposed && context.state === 'running';
  }
  function stopMusic() {
    ++startVersion;
    playing = false;
    if (interval !== null) { timer.clearInterval(interval); interval = null; }
    const at = context.currentTime;
    music.gain.cancelScheduledValues(at);
    music.gain.setTargetAtTime(0, at, 0.08);
    for (const node of musicNodes) { try { node.stop(at + 0.35); } catch { /* Already ended. */ } }
    musicNodes.clear();
  }
  async function startMusic() {
    if (playing || disposed) return playing;
    const ticket=++startVersion;
    if (!await wake()) return false;
    if (disposed || ticket!==startVersion) return false;
    playing = true; cursor = context.currentTime + 0.08; position = 0;
    music.gain.cancelScheduledValues(context.currentTime);
    music.gain.setTargetAtTime(volume, context.currentTime, 0.5);
    schedule(); interval = timer.setInterval(schedule, 250);
    return true;
  }
  async function click() {
    if (muted || disposed) return;
    if (!await wake()) return;
    if (muted || disposed || context.currentTime - lastClick < 0.05) return;
    lastClick = context.currentTime;
    // A short, rounded two-note touch, quieter than a notification.
    tone(79, context.currentTime, 0.095, 0.25, effects, true);
    tone(84, context.currentTime + 0.018, 0.07, 0.085, effects, true);
  }
  function setVolume(next) {
    volume = clampVolume(next);
    if (playing) music.gain.setTargetAtTime(volume, context.currentTime, 0.08);
  }
  function setMuted(next) {
    muted = Boolean(next);
    master.gain.setTargetAtTime(muted ? 0 : 0.65, context.currentTime, 0.04);
  }
  async function hide() { stopMusic(); if (context.state === 'running') await context.suspend(); }
  async function dispose() {
    if (disposed) return;
    stopMusic(); disposed = true;
    if (context.state !== 'closed') await context.close();
  }
  return { startMusic, stopMusic, click, setVolume, setMuted, hide, dispose };
}
