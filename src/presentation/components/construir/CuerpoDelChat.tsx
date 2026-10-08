import type { ProyectoEnVista } from '@domain/project/proyecto-en-vista'
import { Notice } from '../common/Notice'
import { ConstruirInput } from './ConstruirInput'
import { ConstruirMessages } from './ConstruirMessages'
import { ConvertirAPlan } from './ConvertirAPlan'

interface CuerpoDelChatProps {
  readonly project: ProyectoEnVista | null
  readonly libre: boolean
}

/** El cuerpo de la pagina de Chat: el aviso de bloqueo o la conversacion.
 *  Partido de ConstruirView por el techo de lineas (PASO 116). El carve-out
 *  de proyecto+confianza vale SOLO para los modos con repo, como siempre. */
export function CuerpoDelChat({ project, libre }: CuerpoDelChatProps): React.JSX.Element {
  const bloqueado = !libre && (!project || !project.trusted)
  if (bloqueado) {
    return (
      <Notice tone="error">
        {!project
          ? 'Selecciona un proyecto (o elige el modo Chat libre con la flecha).'
          : 'Trabajar aqui exige un proyecto de confianza. Activala primero.'}
      </Notice>
    )
  }
  return (
    <>
      <ConstruirMessages />
      <ConvertirAPlan />
      <ConstruirInput projectId={project?.id ?? ''} />
    </>
  )
}
