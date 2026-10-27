import { wiki } from '../content/personal'

export default function WikipediaApp() {
  return (
    <div className="wiki">
      <div className="wiki__brand">
        <span aria-hidden="true">🌐</span> WikiJohnny <span className="muted">The Free-ish Encyclopedia</span>
      </div>
      <h2 className="wiki__title">{wiki.title}</h2>
      <p className="muted wiki__from">From WikiJohnny, the free encyclopedia</p>
      <aside className="wiki__infobox" aria-label="Infobox">
        <div className="wiki__infobox-title">{wiki.title}</div>
        <div className="wiki__portrait" aria-hidden="true">
          🧑‍💻
        </div>
        <table>
          <tbody>
            {wiki.infobox.map(([k, v]) => (
              <tr key={k}>
                <th scope="row">{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </aside>
      <p>{wiki.intro}</p>
      <nav className="wiki__toc" aria-label="Contents">
        <strong>Contents</strong>
        <ol>
          {wiki.sections.map((s) => (
            <li key={s.heading}>{s.heading}</li>
          ))}
        </ol>
      </nav>
      {wiki.sections.map((s) => (
        <section key={s.heading}>
          <h3>{s.heading}</h3>
          <p>{s.body}</p>
        </section>
      ))}
    </div>
  )
}
