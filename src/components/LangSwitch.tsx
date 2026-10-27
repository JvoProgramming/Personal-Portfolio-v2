import { useLang, useT } from '../lib/i18n'

export function LangSwitch({ className }: { className?: string }) {
  const toggle = useLang((s) => s.toggle)
  const t = useT()
  return (
    <button type="button" className={className} onClick={toggle} aria-label={t('lang.switchLabel')}>
      <span aria-hidden="true">🌐</span> <span className="lang-switch__text">{t('lang.switch')}</span>
    </button>
  )
}
