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
import { bindVeil, setVeil } from './look'
import { setSeated } from './play/toys'
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

export default function RoomGate({ active = true }: { active?: boolean }) {
  const setStage = useOs((s) => s.setStage)
  const hover = useRoom((s) => s.hover)
  const poweringOn = useRoom((s) => s.poweringOn)
  const seated = useRoom((s) => s.seated)
  const locked = useRoom((s) => s.locked)
  const stand = useRoom((s) => s.stand)
  const [lighting] = useState(getLighting)
  const t = useT()
  const enterOs = () => {
    // Stay black under the OS, so coming back fades in from the screen instead of popping.
    setVeil(1)
    useRoom.setState({ poweringOn: false, modal: null, hover: null })
    setStage('boot')
  }

  // Mochi brings toys to wherever you are: the rug, or beside the chair.
  useEffect(() => setSeated(seated), [seated])

  return (
    <div className={active ? 'room' : 'room room--paused'} aria-hidden={!active}>
      <ErrorBoundary fallback={null} onError={enterOs}>
        <Suspense fallback={<RoomLoading />}>
          <Room onEnter={enterOs} lighting={lighting} active={active} />
        </Suspense>
      </ErrorBoundary>
      {active && seated && locked && !poweringOn && <div className="room__crosshair" aria-hidden="true" />}
      <div className="room__veil" ref={bindVeil} aria-hidden="true" />
      {active && (
        <div className={poweringOn ? 'room__hud room__hud--off' : 'room__hud'}>
          <div className="room__top">
            <span className="room__clock">
              {t('room.laTime')} · {lighting.label}
            </span>
            <LangSwitch className="room__lang" />
          </div>
          <div className="room__label" aria-live="polite">
            {hover ?? t(seated ? (isCoarsePointer() ? 'room.hintSeatedTouch' : locked ? 'room.hintSeated' : 'room.hintSeatedFree') : isCoarsePointer() ? 'room.hintTouch' : 'room.hint')}
          </div>
          <div className="room__actions">
            {seated && (
              <button type="button" onClick={stand}>
                {t('room.stand')}
              </button>
            )}
            <button type="button" onClick={enterOs}>
              {t('room.skipDesktop')}
            </button>
            <a href="/resume">{t('room.skipResume')}</a>
          </div>
          <a className="room__credits" href="/credits">
            {t('room.credits')}
          </a>
        </div>
      )}
      {active && <RoomModal />}
    </div>
  )
}
