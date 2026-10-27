export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isCoarsePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}

export function isSmallScreen(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 720
}

let webgl: boolean | undefined

/** True when the browser can create a WebGL context. Checked once, since each check makes a context. */
export function hasWebGL(): boolean {
  if (webgl !== undefined) return webgl
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    webgl = Boolean(gl)
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webgl = false
  }
  return webgl
}

/** The 3D room is skipped on phones, without WebGL, and with reduced motion. */
export function canShowRoom(): boolean {
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(window.location.search).has('no3d')) return false
  return !isSmallScreen() && !isCoarsePointer() && !prefersReducedMotion() && hasWebGL()
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage can be blocked (private mode); the site works without it.
    }
  },
}
