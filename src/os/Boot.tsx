import { useEffect } from 'react'
import { prefersReducedMotion } from '../lib/env'
import { useOs } from './store'

const BOOT_MS = 2800

export function Boot() {
  const setStage = useOs((s) => s.setStage)

  useEffect(() => {
    const done = () => setStage('welcome')
    if (prefersReducedMotion()) {
      done()
      return
    }
    const t = window.setTimeout(done, BOOT_MS)
    window.addEventListener('keydown', done)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', done)
    }
  }, [setStage])

  return (
    <div className="boot" onClick={() => setStage('welcome')} role="status" aria-label="Starting up. Click to skip.">
      <div className="boot__logo">
        <span className="boot__flag" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="boot__name">
          Johnny<sup>®</sup>
          <strong>
            Windows<span>xp</span>
          </strong>
        </span>
      </div>
      <div className="boot__bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="boot__hint">Click anywhere to skip</p>
    </div>
  )
}
