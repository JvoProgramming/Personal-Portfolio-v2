import { Suspense, lazy, useEffect, useState } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { LangSwitch } from '../components/LangSwitch'
import { isCoarsePointer } from '../lib/env'
import { useT } from '../lib/i18n'
import { useOs } from '../os/store'
import { useRoom } from './roomStore'
import { FRAME_PHOTOS, gameBoyScreen, photoTexture } from './textures'
import { getLighting } from './time'
import { RoomLoading } from './RoomLoading'
import './room.css'

// The 3D code is its own chunk. If it fails to load or crashes, we fall through to the OS.
const Room = lazy(() => import('./Room'))

function canvasUrl(texture: { image: unknown }) {
  return (texture.image as HTMLCanvasElement).toDataURL()
}

function RoomModal() {
  const modal = useRoom((s) => s.modal)
  const setModal = useRoom((s) => s.setModal)
  const t = useT()

  useEffect(() => {
    if (!modal) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setModal(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, setModal])

  if (!modal) return null
  const photo = modal.type === 'photo' ? FRAME_PHOTOS.find((p) => p.id === modal.id) : undefined

  return (
    <div className="room-modal" role="dialog" aria-modal="true" aria-label={photo?.caption ?? 'Game Boy'} onClick={() => setModal(null)}>
      <div className="room-modal__card" onClick={(e) => e.stopPropagation()}>
        {photo ? (
          <figure className="room-modal__photo">
            <img src={canvasUrl(photoTexture(photo))} alt={photo.caption} />
            <figcaption>{photo.caption}</figcaption>
          </figure>
        ) : (
          <div className="room-modal__gameboy">
            <div className="room-modal__gb-screen">
              <img src={canvasUrl(gameBoyScreen())} alt="A Spider-Man style game on the Game Boy screen" />
            </div>
            <div className="room-modal__gb-brand">GAME BOY</div>
            <div className="room-modal__gb-controls" aria-hidden="true">
              <span className="room-modal__gb-dpad" />
              <span className="room-modal__gb-ab">
                <i />
                <i />
              </span>
            </div>
          </div>
        )}
        <button type="button" onClick={() => setModal(null)} autoFocus>
          {t('room.close')}
        </button>
      </div>
    </div>
  )
}

export default function RoomGate() {
  const setStage = useOs((s) => s.setStage)
  const hover = useRoom((s) => s.hover)
  const poweringOn = useRoom((s) => s.poweringOn)
  const [lighting] = useState(getLighting)
  const t = useT()
  const enterOs = () => {
    useRoom.setState({ poweringOn: false, modal: null, hover: null })
    setStage('boot')
  }

  return (
    <div className="room">
      <ErrorBoundary fallback={null} onError={enterOs}>
        <Suspense fallback={<RoomLoading />}>
          <Room onEnter={enterOs} lighting={lighting} />
        </Suspense>
      </ErrorBoundary>
      {!poweringOn && (
        <>
          <div className="room__top">
            <span className="room__clock">
              {t('room.laTime')} · {lighting.label}
            </span>
            <LangSwitch className="room__lang" />
          </div>
          <div className="room__label" aria-live="polite">
            {hover ?? t(isCoarsePointer() ? 'room.hintTouch' : 'room.hint')}
          </div>
          <div className="room__actions">
            <button type="button" onClick={enterOs}>
              {t('room.skipDesktop')}
            </button>
            <a href="/resume">{t('room.skipResume')}</a>
          </div>
          <a className="room__credits" href="/credits">
            {t('room.credits')}
          </a>
        </>
      )}
      <RoomModal />
    </div>
  )
}
