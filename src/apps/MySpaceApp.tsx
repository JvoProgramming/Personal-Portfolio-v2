import { useState } from 'react'
import { useOs } from '../os/store'
import './myspace.css'

// A 2006-style MySpace profile. Songs play through YouTube embeds that only load when you press play.

const SONGS = [
  { title: 'In the End', artist: 'Linkin Park', youtube: 'eVTXPUF4Oz4' },
  { title: 'Numb', artist: 'Linkin Park', youtube: 'kXYiU_JCYtU' },
  { title: 'Animal I Have Become', artist: 'Three Days Grace', search: 'three days grace animal i have become' },
  { title: 'I Hate Everything About You', artist: 'Three Days Grace', search: 'three days grace i hate everything about you' },
]

const TOP8 = [
  { name: 'Mochi', pic: '🐶' },
  { name: 'Tammy', pic: '💖' },
  { name: 'Tom', pic: '🙂' },
  { name: '619 Fan Club', pic: '🎭' },
  { name: 'Spidey', pic: '🕷️' },
  { name: 'xX_Headshot_Xx', pic: '🎯' },
  { name: 'Tennis Crew', pic: '🎾' },
  { name: 'Mom', pic: '👩' },
]

const COMMENTS = [
  { from: 'Tammy', pic: '💖', when: 'Oct 26, 2006 9:41 PM', text: 'thanks for the add!! ur page is sooo cool' },
  { from: 'xX_Headshot_Xx', pic: '🎯', when: 'Oct 25, 2006 11:02 PM', text: 'combat arms 2nite?? bring ur A game lol' },
  { from: 'Mochi', pic: '🐶', when: 'Oct 24, 2006 6:15 PM', text: 'woof. (translation: where is my bone)' },
]

export default function MySpaceApp() {
  const [playing, setPlaying] = useState<number | null>(null)
  const openApp = useOs((s) => s.openApp)
  const song = playing === null ? null : SONGS[playing]

  return (
    <div className="myspace">
      <div className="myspace__topbar">
        <span className="myspace__brand">myspace.com</span>
        <span className="myspace__nav">Home | Browse | Search | Invite | Mail | Blog | Favorites | Forum | Groups | Events | Music</span>
      </div>
      <div className="myspace__columns">
        <div className="myspace__left">
          <h2 className="myspace__name">
            <span className="glitter">~*JoHnNy*~</span>
          </h2>
          <div className="myspace__profile">
            <div className="myspace__pic" aria-hidden="true">
              🧑‍💻
            </div>
            <div className="myspace__facts">
              <p>"rock on 🤘"</p>
              <p>Male</p>
              <p>16 years old</p>
              <p>California</p>
              <p>United States</p>
              <p className="myspace__online">
                <span aria-hidden="true">🟢</span> Online Now!
              </p>
            </div>
          </div>
          <p className="myspace__mood">
            <strong>Mood:</strong> nostalgic 😎
          </p>

          <section className="myspace__box">
            <h3>Contacting Johnny</h3>
            <div className="myspace__contact">
              <button type="button" onClick={() => openApp('contact', 'Contact', { width: 560, height: 420 })}>
                ✉️ Send Message
              </button>
              <button type="button">➕ Add to Friends</button>
              <button type="button">⭐ Add to Favorites</button>
              <button type="button">🎶 Forward to Friend</button>
            </div>
          </section>

          <section className="myspace__box myspace__player" aria-label="Music player">
            <h3>🎵 Johnny's Playlist</h3>
            <ol>
              {SONGS.map((s, i) => (
                <li key={s.title}>
                  {s.youtube ? (
                    <button type="button" className={playing === i ? 'is-playing' : ''} onClick={() => setPlaying(i)}>
                      {playing === i ? '🔊' : '▶'} {s.artist} – {s.title}
                    </button>
                  ) : (
                    <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s.search ?? '')}`} target="_blank" rel="noreferrer">
                      ↗ {s.artist} – {s.title}
                    </a>
                  )}
                </li>
              ))}
            </ol>
            {song?.youtube && (
              <iframe
                title={`${song.artist} – ${song.title}`}
                src={`https://www.youtube-nocookie.com/embed/${song.youtube}?autoplay=1`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}
          </section>

          <section className="myspace__box">
            <h3>Johnny's Interests</h3>
            <table className="myspace__interests">
              <tbody>
                <tr>
                  <th>General</th>
                  <td>tennis, cooking, my dog Mochi, staying up way too late on the computer</td>
                </tr>
                <tr>
                  <th>Music</th>
                  <td>Linkin Park, Three Days Grace, anything on Guitar Hero</td>
                </tr>
                <tr>
                  <th>Television</th>
                  <td>WWE SmackDown (REY MYSTERIO!!), cartoons after school</td>
                </tr>
                <tr>
                  <th>Games</th>
                  <td>RuneScape, Club Penguin, Counter-Strike, Combat Arms, Soldier Front</td>
                </tr>
                <tr>
                  <th>Heroes</th>
                  <td>Rey Mysterio, Spider-Man</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <div className="myspace__right">
          <section className="myspace__extended">
            <p>
              <strong>Johnny is in your extended network</strong>
            </p>
          </section>

          <section className="myspace__box myspace__box--orange">
            <h3>Johnny's Blurbs</h3>
            <h4>About me:</h4>
            <p>
              hey whats up!! im johnny. i like tennis, video games and food (a LOT of food). my dog mochi is the best dog in the world no
              contest. if u play combat arms add me!! <span className="blink">*~619~*</span>
            </p>
            <h4>Who I'd like to meet:</h4>
            <p>Rey Mysterio. Also whoever invented pepperoni pizza, I just want to talk.</p>
          </section>

          <section className="myspace__box myspace__hero">
            <h3>My Hero 🎭</h3>
            <div className="myspace__mask" aria-hidden="true">
              <span />
            </div>
            <p>
              <strong>REY MYSTERIO</strong> · 619! The smallest guy in the ring with the biggest heart. Booyaka booyaka!
            </p>
          </section>

          <section className="myspace__box">
            <h3>Johnny's Friend Space</h3>
            <p className="myspace__count">
              Johnny has <strong>8</strong> friends.
            </p>
            <ul className="myspace__top8">
              {TOP8.map((f) => (
                <li key={f.name}>
                  <span className="myspace__friend-name">{f.name}</span>
                  <span className="myspace__friend-pic" aria-hidden="true">
                    {f.pic}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="myspace__box">
            <h3>Johnny's Friends Comments</h3>
            {COMMENTS.map((c) => (
              <div key={c.when} className="myspace__comment">
                <div className="myspace__comment-who">
                  <span aria-hidden="true">{c.pic}</span>
                  <span>{c.from}</span>
                </div>
                <div>
                  <p className="myspace__comment-when">{c.when}</p>
                  <p>{c.text}</p>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}
