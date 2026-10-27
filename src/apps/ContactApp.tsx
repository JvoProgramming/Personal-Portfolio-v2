import { useState } from 'react'
import { contactLinks } from '../content/personal'
import { resume } from '../content/resume'

export default function ContactApp() {
  const [subject, setSubject] = useState('Hello from your website')
  const [body, setBody] = useState('')
  const mailto = `mailto:${resume.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return (
    <form
      className="outlook"
      onSubmit={(e) => {
        e.preventDefault()
        window.location.href = mailto
      }}
    >
      <div className="app-toolbar">
        <button type="submit">📨 Send</button>
        {contactLinks.map((l) => (
          <a key={l.href} className="button-link" href={l.href} target="_blank" rel="noreferrer">
            {l.label}
          </a>
        ))}
      </div>
      <div className="outlook__fields">
        <label htmlFor="contact-to">To:</label>
        <input id="contact-to" type="text" value={resume.email} readOnly />
        <label htmlFor="contact-subject">Subject:</label>
        <input id="contact-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <textarea
        aria-label="Message"
        className="outlook__body"
        value={body}
        placeholder="Write your message here. Send opens your email app."
        onChange={(e) => setBody(e.target.value)}
      />
    </form>
  )
}
