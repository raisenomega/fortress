import { useActiveProject } from '../../stores/project-store'
import { Notice } from '../common/Notice'
import { ConstruirFlow } from './ConstruirFlow'

/**
 * Construir: el operador describe una feature, el planner la disena, el humano
 * aprueba el plan y recien entonces se escribe codigo — con checkpoint git y
 * verify; si algo queda en rojo, se revierte. Solo sobre proyecto de confianza.
 */
export function ConstruirView(): React.JSX.Element {
  const project = useActiveProject()

  return (
    <div className="h-full space-y-5 overflow-y-auto px-4 py-4">
      <header>
        <h2 className="text-base text-foreground">Construir</h2>
        <p className="text-xs text-muted-foreground">
          Describe una funcionalidad. El plan lo apruebas tu; nada se escribe sin checkpoint git y
          verificacion. Si queda en rojo, se revierte solo.
        </p>
      </header>
      {!project ? (
        <Notice tone="error">Selecciona un proyecto para construir.</Notice>
      ) : !project.trusted ? (
        <Notice tone="error">
          Construir exige un proyecto de confianza. Activa la confianza primero.
        </Notice>
      ) : (
        <ConstruirFlow projectId={project.id} />
      )}
    </div>
  )
}
