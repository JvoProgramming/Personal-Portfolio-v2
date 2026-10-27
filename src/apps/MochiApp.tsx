import { useState } from 'react'
import { mochiPhotos, type Photo } from '../content/personal'
import { ExplorerBar, PhotoTile, PhotoViewer, StatusBar } from './shared'

export default function MochiApp() {
  const [open, setOpen] = useState<Photo | null>(null)
  return (
    <div className="app-explorer">
      <ExplorerBar path="C:\My Pictures\Mochi" />
      <div className="photo-grid">
        {mochiPhotos.map((p) => (
          <PhotoTile key={p.caption} photo={p} onClick={() => setOpen(p)} />
        ))}
      </div>
      <StatusBar>{mochiPhotos.length} pictures of a very good dog</StatusBar>
      {open && <PhotoViewer photo={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
