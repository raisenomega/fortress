import { useProjectStore } from '../../stores/project-store'
import { ProjectListItem } from './ProjectListItem'

export function ProjectList(): React.JSX.Element {
  const projects = useProjectStore((state) => state.projects)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const setActiveProject = useProjectStore((state) => state.setActiveProject)

  if (projects.length === 0) {
    return (
      <p className="px-2 text-xs text-muted-foreground">
        Sin proyectos todavia. Agrega uno para empezar.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {projects.map((project) => (
        <ProjectListItem
          key={project.id}
          project={project}
          active={project.id === activeProjectId}
          onSelect={setActiveProject}
        />
      ))}
    </div>
  )
}
