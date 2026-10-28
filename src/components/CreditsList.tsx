import { MODEL_CREDITS } from '../content/credits'

const LICENSE_URL = { 'CC-BY 4.0': 'https://creativecommons.org/licenses/by/4.0/', 'CC-BY 2.0': 'https://creativecommons.org/licenses/by/2.0/' }

/** The list of 3D model and photo credits, shared by the Credits window and the /credits page. */
export function CreditsList() {
  return (
    <div className="credits">
      <p>
        Mochi, the room and everything else were built in code. These models and the night skyline photo were made by other people and are used under their licenses (changes: compressed, resized and
        repositioned):
      </p>
      <ul>
        {MODEL_CREDITS.map((c) => (
          <li key={c.url}>
            <a href={c.url} target="_blank" rel="noreferrer">
              “{c.title}”
            </a>{' '}
            by {c.author},{' '}
            {c.license === 'CC0' ? (
              'CC0'
            ) : (
              <a href={LICENSE_URL[c.license]} target="_blank" rel="noreferrer">
                {c.license.replace('-', ' ')}
              </a>
            )}{' '}
            · <span className="muted">{c.usedFor}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
