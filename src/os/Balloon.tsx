import { useEffect, useState } from 'react'
import { isCoarsePointer } from '../lib/env'
import { useT } from '../lib/i18n'

const seen = new Set<string>()

/** The classic tray balloon. Shows once per account per visit with a tip on how to use the desktop. */
export function Balloon({ user }: { user: string }) {
  const t = useT()
  const [open, setOpen] = useState(() => !seen.has(user))

  useEffect(() => {
    seen.add(user)
    if (!open) return
    const timer = window.setTimeout(() => setOpen(false), 9000)
    return () => window.clearTimeout(timer)
  }, [user, open])

  if (!open) return null
  return (
    <div className="balloon" role="status">
      <button type="button" className="balloon__close" aria-label={t('balloon.close')} onClick={() => setOpen(false)}>
        ×
      </button>
      <strong>
        <span aria-hidden="true">ℹ️</span> {t('balloon.title')}
      </strong>
      <p>{t(isCoarsePointer() ? 'balloon.bodyTouch' : 'balloon.body')}</p>
    </div>
  )
}
