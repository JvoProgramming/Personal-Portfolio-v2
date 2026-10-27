import { projects } from '../content/projects'
import { useOs } from '../os/store'
import { ExplorerBar, GridItem, IconGrid, StatusBar } from './shared'

export default function ProjectsApp() {
  const openApp = useOs((s) => s.openApp)
  return (
    <div className="app-explorer">
      <ExplorerBar path="C:\Documents and Settings\Johnny\Projects" />
      <IconGrid>
        {projects.map((p) => (
          <GridItem
            key={p.id}
            icon={p.icon}
            label={p.name}
            onOpen={() => openApp('project', p.name, { key: p.id, title: p.name, props: { id: p.id }, width: 520, height: 380 })}
          />
        ))}
      </IconGrid>
      <StatusBar>{projects.length} objects</StatusBar>
    </div>
  )
}
