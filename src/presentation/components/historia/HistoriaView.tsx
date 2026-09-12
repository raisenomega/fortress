import { useEffect } from 'react'
import { useActiveProject } from '../../stores/project-store'
import { useHistoria, cargarHistoria } from '../../services/historia-service'
import { EmptyState } from '../common/EmptyState'
import { HistoriaTable } from './HistoriaTable'
import { recuentoDeHistoria } from './recuento-de-historia'
import { CLASE_EN_PANTALLA } from './clase-de-cierre'

/**
 * La HISTORIA del proyecto: lo que ya no pide accion (ADR-087).
 *
 * El tablero filtra los extintos a proposito —«sin ese filtro la lista crece
 * para siempre desde que la base dejo de borrar»— y sin esta pantalla el
 * operador no tenia donde volver a verlos. Nada muere sin juicio, y lo juzgado
 * queda consultable.
 *
 * La cabecera da TRES numeros y no uno. Contar cincuenta y cinco «resueltos»
 * seria mentir sobre cuarenta y siete de ellos.
 */
export function HistoriaView(): React.JSX.Element {
  const project = useActiveProject()
  const historia = useHistoria(project?.id ?? null)

  useEffect(() => {
    if (project) void cargarHistoria(project.id)
  }, [project?.id])

  if (!project) {
    return (
      <EmptyState
        iconName="shield"
        title="Ningun proyecto seleccionado"
        hint="Elige un proyecto para ver que se ha cerrado en el."
      />
    )
  }

  return (
    <div className="flex h-full flex-col space-y-3 overflow-y-auto px-4 py-3">
      <h1 className="font-display text-lg text-foreground">Historia de {project.name}</h1>
      <p className="flex flex-wrap gap-x-3 text-xs">
        {recuentoDeHistoria(historia).map(({ clase, n, texto }) => (
          <span key={clase} className={CLASE_EN_PANTALLA[clase].clase.split(' ').pop()}>
            {n} {texto}
          </span>
        ))}
      </p>
      {historia.length === 0 ? (
        <p className="text-xs text-muted-foreground">Todavia no se ha cerrado ningun hallazgo.</p>
      ) : (
        <HistoriaTable historia={historia} />
      )}
    </div>
  )
}
