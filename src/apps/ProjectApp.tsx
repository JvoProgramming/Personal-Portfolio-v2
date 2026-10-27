import { projects } from '../content/projects'
import type { WindowState } from '../os/store'

export default function ProjectApp({ win }: { win: WindowState }) {
  const project = projects.find((p) => p.id === win.props?.id)
  if (!project) return <p className="app-pad">This project could not be found.</p>
  return (
    <div className="app-pad">
      <h2 className="app-heading">
        <span aria-hidden="true">{project.icon}</span> {project.name}
      </h2>
      <p>
        <strong>{project.tagline}</strong>
      </p>
      <p>{project.description}</p>
      <fieldset>
        <legend>Built with</legend>
        <p>{project.stack.join(', ')}</p>
      </fieldset>
      {project.link && (
        <p>
          <a href={project.link} target="_blank" rel="noreferrer">
            View on GitHub
          </a>
        </p>
      )}
    </div>
  )
}
