import { resume } from '../content/resume'
import './resume-document.css'

export function ResumeDocument() {
  return (
    <article className="resume-doc">
      <header>
        <h1>{resume.name}</h1>
        <p className="resume-doc__title">
          {resume.title} · {resume.location}
        </p>
        <p className="resume-doc__links">
          <a href={`mailto:${resume.email}`}>{resume.email}</a>
          {resume.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          ))}
        </p>
      </header>

      <section>
        <h2>Summary</h2>
        <p>{resume.summary}</p>
      </section>

      <section>
        <h2>Experience</h2>
        {resume.experience.map((job) => (
          <div className="resume-doc__job" key={job.company + job.start}>
            <div className="resume-doc__row">
              <strong>
                {job.role}, {job.company}
              </strong>
              <span>
                {job.start} – {job.end}
              </span>
            </div>
            <ul>
              {job.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h2>Education</h2>
        {resume.education.map((e) => (
          <div className="resume-doc__row" key={e.school}>
            <strong>
              {e.degree}, {e.school}
            </strong>
            <span>{e.year}</span>
          </div>
        ))}
      </section>

      <section>
        <h2>Skills</h2>
        <p>{resume.skills.join(' · ')}</p>
      </section>
    </article>
  )
}
