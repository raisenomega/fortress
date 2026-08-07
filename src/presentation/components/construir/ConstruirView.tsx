import { useActiveProject } from '../../stores/project-store'
import { Notice } from '../common/Notice'
import { ConfigInterview } from './ConfigInterview'
import { ConstruirInput } from './ConstruirInput'
import { ConstruirMessages } from './ConstruirMessages'

/**
 * Construir: chat minimalista, centrado y angosto, con el input abajo. A la
 * izquierda se adjunta un archivo; a la derecha la flecha elige el modo (Plan /
 * Investigacion / Ejecutor). Ejecutor exige un Plan previo y construye con red
 * git+verify. Nunca sobre el propio repo de FORTRESS (bloqueado en el main).
 */
export function ConstruirView(): React.JSX.Element {
  const project = useActiveProject()

  // Un proyecto sin marco aprobado: aqui ocurre su entrevista de configuracion.
  if (project?.configState === 'PENDIENTE_CONFIGURACION') {
    return <ConfigInterview projectId={project.id} />
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-4 pt-4 pb-6">
      {!project ? (
        <Notice tone="error">Selecciona un proyecto para construir.</Notice>
      ) : !project.trusted ? (
        <Notice tone="error">Construir exige un proyecto de confianza. Activala primero.</Notice>
      ) : (
        <>
          <p className="pb-2 text-center text-[11px] text-muted-foreground">
            Construir en {project.name}
          </p>
          <ConstruirMessages />
          <ConstruirInput projectId={project.id} />
        </>
      )}
    </div>
  )
}
