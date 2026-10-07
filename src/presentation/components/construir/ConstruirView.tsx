import { useActiveProject } from '../../stores/project-store'
import { useConstruirStore } from '../../stores/construir-store'
import { Notice } from '../common/Notice'
import { ConfigInterview } from './ConfigInterview'
import { ConstruirInput } from './ConstruirInput'
import { ConstruirMessages } from './ConstruirMessages'
import { ConvertirAPlan } from './ConvertirAPlan'

/**
 * Construir: chat abierto A LO ANCHO como el Terminal (PASO 84), con el input
 * abajo. La flecha elige el modo (Plan / Investigacion / Ejecutor / Libre).
 * El CARVE-OUT de proyecto+confianza vale SOLO para 'libre' (PASO 91): un chat
 * powers-off sin repo no tiene nada que proteger. Los otros tres modos siguen
 * exigiendo proyecto de confianza EXACTAMENTE como siempre.
 */
export function ConstruirView(): React.JSX.Element {
  const project = useActiveProject()
  const libre = useConstruirStore((s) => s.mode) === 'libre'

  // Un proyecto sin marco aprobado: aqui ocurre su entrevista de configuracion.
  if (project?.configState === 'PENDIENTE_CONFIGURACION') {
    return <ConfigInterview projectId={project.id} />
  }

  const bloqueado = !libre && (!project || !project.trusted)
  return (
    <div className="flex h-full w-full flex-col px-4 pt-4 pb-6">
      {bloqueado ? (
        <Notice tone="error">
          {!project
            ? 'Selecciona un proyecto (o elige el modo Chat libre con la flecha).'
            : 'Trabajar aqui exige un proyecto de confianza. Activala primero.'}
        </Notice>
      ) : (
        <>
          <p className="pb-2 text-center text-[11px] text-muted-foreground">
            {libre ? 'Chat libre — sin repo, no toca nada' : `Chat de ${project?.name ?? ''}`}
          </p>
          <ConstruirMessages />
          <ConvertirAPlan />
          <ConstruirInput projectId={project?.id ?? ''} />
        </>
      )}
    </div>
  )
}
