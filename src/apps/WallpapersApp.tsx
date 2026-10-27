import { fandomWallpapers } from '../content/personal'
import { useOs } from '../os/store'
import { ExplorerBar, StatusBar } from './shared'

export default function WallpapersApp() {
  const setWallpaper = useOs((s) => s.setWallpaper)
  const current = useOs((s) => s.wallpaperOverride)
  return (
    <div className="app-explorer">
      <ExplorerBar path="C:\My Pictures\Wallpapers" />
      <div className="photo-grid">
        {fandomWallpapers.map((w) => (
          <button
            key={w.id}
            type="button"
            className={`wallpaper-tile${current === w.url ? ' is-current' : ''}`}
            onClick={() => setWallpaper(w.url)}
          >
            <img src={w.url} alt="" />
            <span>{w.name}</span>
          </button>
        ))}
      </div>
      <StatusBar>Click a picture to set it as your desktop background.</StatusBar>
    </div>
  )
}
