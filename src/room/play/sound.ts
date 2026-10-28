// Mochi's noises and the toy squeak, made with the Web Audio API, so there are no sound files to load.
// The audio context only starts after a click or tap, as browsers require.

let ctx: AudioContext | null = null
function audio() {
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** One short pitched chirp with a quick fade, filtered so it sounds soft rather than electronic. */
function chirp(c: AudioContext, at: number, from: number, peak: number, to: number, length: number, volume: number, type: OscillatorType = 'triangle') {
  const osc = c.createOscillator()
  const gain = c.createGain()
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = peak
  filter.Q.value = 1.2
  osc.type = type
  osc.frequency.setValueAtTime(from, at)
  osc.frequency.exponentialRampToValueAtTime(peak, at + length * 0.35)
  osc.frequency.exponentialRampToValueAtTime(to, at + length)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(filter).connect(gain).connect(c.destination)
  osc.start(at)
  osc.stop(at + length + 0.02)
}

/** A happy little yip or two, a bit different every time. */
export function yip() {
  const c = audio()
  if (!c) return
  const t = c.currentTime
  const pitch = 0.9 + Math.random() * 0.25
  chirp(c, t, 700 * pitch, 1500 * pitch, 900 * pitch, 0.12, 0.18)
  if (Math.random() < 0.6) chirp(c, t + 0.16, 750 * pitch, 1650 * pitch, 1000 * pitch, 0.1, 0.14)
}

/** A sleepy, contented hum for petting her while she naps. */
export function sigh() {
  const c = audio()
  if (!c) return
  chirp(c, c.currentTime, 420, 520, 300, 0.45, 0.08, 'sine')
}

/** A short excited bark, when a toy is out of reach. */
export function bark() {
  const c = audio()
  if (!c) return
  const t = c.currentTime
  chirp(c, t, 500, 1100, 600, 0.09, 0.2, 'sawtooth')
}

/** The rubber duck's squeak. */
export function squeak() {
  const c = audio()
  if (!c) return
  chirp(c, c.currentTime, 1800, 2600, 1500, 0.14, 0.1, 'square')
}
