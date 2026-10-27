import type { ReactNode } from 'react'
import type { Photo } from '../content/personal'

/** XP Explorer style toolbar with an optional Back button and an address bar. */
export function ExplorerBar({ path, onBack }: { path: string; onBack?: () => void }) {
  return (
    <div className="explorer-bar">
      <button type="button" onClick={onBack} disabled={!onBack} aria-label="Back">
        ◀ Back
      </button>
      <div className="explorer-bar__address" aria-label="Address">
        <span className="explorer-bar__label">Address</span>
        <span className="explorer-bar__path">{path}</span>
      </div>
    </div>
  )
}

export function IconGrid({ children }: { children: ReactNode }) {
  return <div className="icon-grid">{children}</div>
}

export function GridItem({ icon, label, onOpen }: { icon: string; label: string; onOpen: () => void }) {
  return (
    <button type="button" className="icon-grid__item" onClick={onOpen}>
      <span className="icon-grid__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="icon-grid__label">{label}</span>
    </button>
  )
}

/** A placeholder "photo": a colored tile with an emoji, or the real image once `src` is set. */
export function PhotoTile({ photo, onClick }: { photo: Photo; onClick?: () => void }) {
  return (
    <button type="button" className="photo-tile" onClick={onClick} style={{ background: photo.color }}>
      {photo.src ? (
        <img src={photo.src} alt={photo.caption} />
      ) : (
        <span className="photo-tile__emoji" role="img" aria-label={photo.caption}>
          {photo.emoji}
        </span>
      )}
      <span className="photo-tile__caption">{photo.caption}</span>
    </button>
  )
}

export function PhotoViewer({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  return (
    <div className="photo-viewer" role="dialog" aria-label={photo.caption}>
      <div className="photo-viewer__frame" style={{ background: photo.color }}>
        {photo.src ? <img src={photo.src} alt={photo.caption} /> : <span aria-hidden="true">{photo.emoji}</span>}
      </div>
      <p>{photo.caption}</p>
      <button type="button" onClick={onClose} autoFocus>
        Close
      </button>
    </div>
  )
}

export function StatusBar({ children }: { children: ReactNode }) {
  return (
    <div className="status-bar">
      <p className="status-bar-field">{children}</p>
    </div>
  )
}
