import { useEffect } from 'react'
import { ResumeDocument } from '../components/ResumeDocument'
import { resume } from '../content/resume'
import './resume-page.css'

/** Plain, printable resume for recruiters. No OS, no 3D. */
export default function ResumePage() {
  useEffect(() => {
    document.title = `${resume.name} · Resume`
    if (new URLSearchParams(window.location.search).has('print')) {
      const t = window.setTimeout(() => window.print(), 300)
      return () => window.clearTimeout(t)
    }
  }, [])

  return (
    <div className="resume-page">
      <nav className="resume-page__bar" aria-label="Resume actions">
        <a href="/">← Back to the full site</a>
        <button type="button" onClick={() => window.print()}>
          Download PDF
        </button>
      </nav>
      <main className="resume-page__paper">
        <ResumeDocument />
      </main>
    </div>
  )
}
