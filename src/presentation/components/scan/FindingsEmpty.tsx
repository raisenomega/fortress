import type { Project } from '@domain/project/project'
import { EmptyState } from '../common/EmptyState'

interface FindingsEmptyProps {
  readonly project: Project
  /** Hay hallazgos y ninguno pasa el filtro. Es un tercer caso, y decirle
   *  «el escaneo no encontro nada» seria mentir con quinientos detras. */
  readonly filtrando: boolean
  readonly onQuitar: () => void
}

const QUITAR =
  'tap border-border text-muted-foreground hover:text-foreground mt-3 rounded-md border px-3 py-1.5 text-xs'

/**
 * La tabla vacia tiene TRES motivos y se ven igual: el texto es lo unico que los
 * distingue, asi que tiene que ser exacto.
 *
 * El tercero llego con los chips. Antes «vacia» solo podia querer decir que no
 * habia hallazgos; ahora puede querer decir que ninguno cumple el filtro, y ese
 * caso se cierra solo —quitando el filtro— sin lanzar nada.
 */
export function FindingsEmpty({
  project,
  filtrando,
  onQuitar
}: FindingsEmptyProps): React.JSX.Element {
  if (filtrando) {
    return (
      <EmptyState
        iconName="search"
        title="Ningun hallazgo con este filtro"
        hint="Los hay, pero ninguno cumple los dos chips a la vez."
      >
        <button type="button" onClick={onQuitar} className={QUITAR}>
          Quitar el filtro
        </button>
      </EmptyState>
    )
  }

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
