import { useActiveProject } from '../../stores/project-store'
import { EmptyState } from '../common/EmptyState'
import { OmegaDashboard } from './OmegaDashboard'

/**
 * Superdashboard de SENTINEL OMEGA. La vista solo resuelve el proyecto activo;
 * la composicion (header, puntuacion, salud macro, perfil micro, estadisticas,
 * comparativa y Libro de la Vida) vive en OmegaDashboard. Todo con datos reales.
 */
export function OmegaView(): React.JSX.Element {
  const project = useActiveProject()

  if (!project) {
    return (
      <EmptyState iconName="eye" title="Ningun proyecto" hint="Elige un proyecto para auditar." />
    )
  }

  return <OmegaDashboard project={project} />
}
