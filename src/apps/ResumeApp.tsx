import { ResumeDocument } from '../components/ResumeDocument'

export default function ResumeApp() {
  return (
    <div className="app-doc">
      <div className="app-toolbar">
        <a className="button-link" href="/resume" target="_blank" rel="noreferrer">
          Open printable page
        </a>
        <a className="button-link" href="/resume?print=1" target="_blank" rel="noreferrer">
          Download PDF
        </a>
      </div>
      <div className="app-doc__paper">
        <ResumeDocument />
      </div>
    </div>
  )
}
