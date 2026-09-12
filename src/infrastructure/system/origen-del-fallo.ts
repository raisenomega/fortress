import { ESTA_INSTALACION } from '@domain/system/observacion-de-fallo'
import type { NewSelfObservation, SelfNoteDraft } from '@domain/system/self-observation'
import type { Project } from '@domain/project/project'

/**
 * De quien es un fallo: del proyecto sobre el que reventó, o de la instalacion.
 *
 * Un fallo del arranque no tiene proyecto de cliente —la app no revienta
 * auditando nada—. Uno de IPC lo tiene si el canal recibio un `projectId`: 35 de
 * 110. Con el, `vistaEn` cuenta lo correcto (un `scan:run` roto en tres clientes
 * son tres); sin el, la instalacion, como el arranque.
 *
 * El `projectPath` viaja cuando el proyecto se resuelve, y no es un adorno: es
 * lo que enciende la CUARTA regla del cerco, la que tacha la raiz absoluta del
 * cliente. Las otras tres corren igual; esa necesita saber sobre que carpeta se
 * trabajaba. Se separa del sumidero para poder probarlo sin Electron.
 */
export function conOrigen(
  buscar: (id: string) => Project | null,
  nota: SelfNoteDraft,
  projectId?: string
): NewSelfObservation {
  const project = projectId === undefined ? null : buscar(projectId)
  if (project === null) return { ...nota, sourceProject: ESTA_INSTALACION }
  return { ...nota, sourceProject: project.name, projectPath: project.path }
}
