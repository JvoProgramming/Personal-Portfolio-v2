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

export default function OsRoot() {
  const stage = useOs((s) => s.stage)

  useEffect(() => {
    document.title = 'Johnny XP'
  }, [])

  switch (stage) {
    case 'room':
      return (
        <Suspense fallback={<RoomLoading />}>
          <RoomGate />
        </Suspense>
      )
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
