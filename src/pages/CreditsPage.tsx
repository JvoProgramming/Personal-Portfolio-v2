import { useEffect } from 'react'
import { CreditsList } from '../components/CreditsList'
import './resume-page.css'

/** Plain page with the 3D model credits, linked from the room. */
export default function CreditsPage() {
  useEffect(() => {
    document.title = 'Credits'
  }, [])
  return (
    <div className="resume-page">
      <nav className="resume-page__bar" aria-label="Page actions">
        <a href="/">← Back to the full site</a>
      </nav>
      <main className="resume-page__paper">
        <h1>Credits</h1>
        <CreditsList />
      </main>
    </div>
  )
}
