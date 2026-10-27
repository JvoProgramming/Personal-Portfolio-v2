import { MODEL_CREDITS } from '../content/credits'

/** The list of 3D model credits, shared by the Credits window and the /credits page. */
export function CreditsList() {
  return (
    <div className="credits">
      <p>
        Mochi, the room and everything else were built in code. These models were made by other people and are used under their licenses (changes: compressed, resized and
        repositioned):
      </p>
      <ul>
        {MODEL_CREDITS.map((c) => (
          <li key={c.url}>
            <a href={c.url} target="_blank" rel="noreferrer">
              “{c.title}”
            </a>{' '}
            by {c.author}, {c.license === 'CC0' ? 'CC0' : <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>} · <span className="muted">{c.usedFor}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
