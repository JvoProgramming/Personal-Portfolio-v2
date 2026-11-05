import { Suspense, lazy, useEffect } from 'react'
import 'xp.css/dist/XP.css'
import './os.css'
import { Boot } from './Boot'
import { Desktop } from './Desktop'
import { RoomLoading } from '../room/RoomLoading'
import { ShutDown } from './ShutDown'
import { useOs } from './store'
import { Welcome } from './Welcome'

// The room (and three.js with it) only downloads for visitors who will see it.
const RoomGate = lazy(() => import('../room/RoomGate'))

function Stage() {
  const stage = useOs((s) => s.stage)
  switch (stage) {
    case 'room':
      return null
    case 'boot':
      return <Boot />
    case 'welcome':
      return <Welcome />
    case 'desktop':
      return <Desktop />
    case 'off':
      return <ShutDown />
  }
}

export default function OsRoot() {
  const inRoom = useOs((s) => s.stage === 'room')
  const roomVisited = useOs((s) => s.roomVisited)

  useEffect(() => {
    document.title = 'Johnny XP'
  }, [])

  return (
    <>
      {/* Once loaded, the room is kept (paused) under the OS rather than torn down, so going back is seamless. */}
      {roomVisited && (
        <Suspense fallback={inRoom ? <RoomLoading /> : null}>
          <RoomGate active={inRoom} />
        </Suspense>
      )}
      <Stage />
    </>
  )
}
