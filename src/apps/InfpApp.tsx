import { infp } from '../content/personal'

export default function InfpApp() {
  return (
    <div className="infp">
      <div className="infp__hero">
        <span className="infp__type">{infp.type}</span>
        <span className="infp__nick">{infp.nickname}</span>
      </div>
      <div className="app-pad">
        <p>{infp.blurb}</p>
        {infp.traits.map(([trait, text]) => (
          <div key={trait} className="infp__trait">
            <strong>{trait}</strong>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
