import { useEffect, useRef, type RefObject } from 'react'

export type Step = (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => void

/**
 * Runs `step` every animation frame on a canvas that fills its parent.
 * The canvas is sized for the screen's pixel density; `step` works in CSS pixels.
 * The loop idles while the canvas is hidden (e.g. its window is minimized).
 */
export function useCanvasLoop(canvasRef: RefObject<HTMLCanvasElement | null>, step: Step) {
  const stepRef = useRef(step)
  useEffect(() => {
    stepRef.current = step
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let width = 0
    let height = 0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (width < 2 || height < 2 || canvas.offsetParent === null) return
      stepRef.current(ctx, width, height, dt)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [canvasRef])
}

export function loadHighScore(key: string): number {
  try {
    return Number(window.localStorage.getItem(`hi-${key}`)) || 0
  } catch {
    return 0
  }
}

export function saveHighScore(key: string, score: number): number {
  const best = Math.max(score, loadHighScore(key))
  try {
    window.localStorage.setItem(`hi-${key}`, String(best))
  } catch {
    // Storage blocked: high score just isn't remembered.
  }
  return best
}
