import { useEffect } from 'react'
import 'xp.css/dist/XP.css'
import './os.css'
import { RoomGate } from '../room/RoomGate'
import { Boot } from './Boot'
import { Desktop } from './Desktop'
import { ShutDown } from './ShutDown'
import { useOs } from './store'
import { Welcome } from './Welcome'

export default function OsRoot() {
  const stage = useOs((s) => s.stage)

  useEffect(() => {
    document.title = 'Johnny XP'
  }, [])

  switch (stage) {
    case 'room':
      return <RoomGate />
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
