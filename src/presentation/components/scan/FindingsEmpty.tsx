import type { Project } from '@domain/project/project'
import { EmptyState } from '../common/EmptyState'

/** Un proyecto sin escanear y uno limpio se ven igual en la tabla vacia; el
 *  texto es lo unico que los distingue, asi que tiene que ser exacto. */
export function FindingsEmpty({ project }: { readonly project: Project }): React.JSX.Element {
  // Un proyecto sin escanear y uno limpio se ven igual en la tabla vacia; el
  // texto es lo unico que los distingue, asi que tiene que ser exacto.
  return project.lastScan === null ? (
    <EmptyState
      iconName="shield"
      title="Sin escanear"
      hint="Lanza un escaneo para saber que hay dentro de este proyecto."
    />
  ) : (
    <EmptyState
      iconName="check-circle"
      title="Sin hallazgos"
      hint="El ultimo escaneo de seguridad no encontro nada que reportar."
    />
  )
}
