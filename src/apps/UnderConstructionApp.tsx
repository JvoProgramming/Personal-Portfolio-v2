import type { WindowState } from '../os/store'

export default function UnderConstructionApp({ win }: { win: WindowState }) {
  return (
    <div className="app-pad under-construction">
      <div className="under-construction__sign" aria-hidden="true">
        🚧
      </div>
      <h2 className="app-heading">{win.title} is under construction</h2>
      <p>This one is coming in a later update. Check back soon!</p>
    </div>
  )
}
