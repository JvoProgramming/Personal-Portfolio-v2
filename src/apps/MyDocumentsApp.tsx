import { appsForUser } from './registry'
import { useOs } from '../os/store'
import { ExplorerBar, GridItem, IconGrid, StatusBar } from './shared'

/** A folder view of every app this user has, for people who prefer folders to desktops. */
export default function MyDocumentsApp() {
  const user = useOs((s) => s.user)
  const openApp = useOs((s) => s.openApp)
  const apps = user ? appsForUser(user).filter((a) => a.inDocuments) : []
  return (
    <div className="app-explorer">
      <ExplorerBar path="C:\Documents and Settings\My Documents" />
      <IconGrid>
        {apps.map((a) => (
          <GridItem key={a.id} icon={a.icon} label={a.title} onOpen={() => openApp(a.id, a.title, a.size)} />
        ))}
      </IconGrid>
      <StatusBar>{apps.length} objects</StatusBar>
    </div>
  )
}
