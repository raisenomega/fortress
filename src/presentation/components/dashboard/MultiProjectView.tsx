import { useProjectStore } from '../../stores/project-store'
import { ProjectCard } from './ProjectCard'

/**
 * Franja con todos los proyectos a la vez, cada uno con su score. Es la vista
 * principal de la spec: comparar varios repos de un vistazo sin cambiar de
 * pantalla.
 */
export function MultiProjectView(): React.JSX.Element | null {
  const projects = useProjectStore((state) => state.projects)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const setActiveProject = useProjectStore((state) => state.setActiveProject)

  if (projects.length === 0) return null

  return (
    <section className="shrink-0 border-b border-border px-4 py-3">
      <h4 className="mb-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        Proyectos · {projects.length}
      </h4>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            active={project.id === activeProjectId}
            onSelect={setActiveProject}
          />
        ))}
      </div>
    </section>
  )
}
