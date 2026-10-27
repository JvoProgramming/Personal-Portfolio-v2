import { useState } from 'react'
import { travelChecklist, trips, type Photo } from '../content/personal'
import { storage } from '../lib/env'
import { ExplorerBar, PhotoTile, PhotoViewer } from './shared'

const KEY = 'travel-checklist'

export default function TravelApp() {
  const [tab, setTab] = useState<'trips' | 'checklist'>('trips')
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [done, setDone] = useState<string[]>(() => storage.get(KEY, ['Japan', 'Vietnam']))

  const toggle = (place: string) => {
    const next = done.includes(place) ? done.filter((p) => p !== place) : [...done, place]
    setDone(next)
    storage.set(KEY, next)
  }

  return (
    <div className="app-explorer">
      <ExplorerBar path="C:\My Pictures\Travel" />
      <menu role="tablist" className="app-tabs">
        <button role="tab" type="button" aria-selected={tab === 'trips'} onClick={() => setTab('trips')}>
          Trips
        </button>
        <button role="tab" type="button" aria-selected={tab === 'checklist'} onClick={() => setTab('checklist')}>
          Checklist
        </button>
      </menu>
      <div role="tabpanel" className="app-tabpanel">
        {tab === 'trips' ? (
          trips.map((t) => (
            <section key={t.id} className="trip">
              <h3>
                {t.name} <span className="muted">· {t.when}</span>
              </h3>
              <p>{t.notes}</p>
              <div className="photo-grid photo-grid--small">
                {t.photos.map((p) => (
                  <PhotoTile key={p.caption} photo={p} onClick={() => setPhoto(p)} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="checklist">
            {travelChecklist.map((place) => {
              const id = `travel-${place.replace(/\W+/g, '-')}`
              return (
                <div key={place} className="field-row">
                  <input id={id} type="checkbox" checked={done.includes(place)} onChange={() => toggle(place)} />
                  <label htmlFor={id}>{place}</label>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {photo && <PhotoViewer photo={photo} onClose={() => setPhoto(null)} />}
    </div>
  )
}
