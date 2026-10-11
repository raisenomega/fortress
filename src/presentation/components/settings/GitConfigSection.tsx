import { useActiveProject } from '../../stores/project-store'
import { GitProjectForm } from './GitProjectForm'

/**
 * Fijar identidad + remoto del proyecto ACTIVO DESDE FORTRESS (PASO 163, 2a).
 * Solo aparece con un proyecto seleccionado; el formulario vive aparte para
 * respetar el techo de líneas. Es lo mínimo para probar; se refina después.
 */
export function GitConfigSection(): React.JSX.Element {
  const project = useActiveProject()
  if (!project) {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Git del proyecto</h3>
        <p className="text-xs text-muted-foreground">
          Selecciona un proyecto para fijar su identidad y su remoto.
        </p>
      </section>
    )
  }
  return <GitProjectForm projectId={project.id} nombre={project.name} />
}
