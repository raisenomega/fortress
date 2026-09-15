import { TODAS } from '@domain/project/filtro-del-tablero'
import type { Project } from '@domain/project/project'
import type { LoteEnLaTabla } from '../../hooks/useLoteDelTablero'
import type { SeleccionDelTablero } from '../../hooks/useSeleccionDelTablero'
import type { Tablero } from '../../hooks/useTablero'
// prettier-ignore
import { dismissFinding, mitigateFinding, reopenFinding, unmitigateFinding } from '../../services/dismiss-service'
import { proposeRepair } from '../../services/repair-service'
import { resolverEnTerminal } from '../../services/resolver-en-terminal'
import { verificarHallazgo } from '../../services/verificar-service'

/**
 * Lo que la tabla necesita, armado fuera del componente: son once props y el
 * cuerpo del tablero se leia peor que este mapa. Aqui ademas se decide una cosa
 * que no es de pintado — que «vacia» significa «filtrada» y no «no hay nada»—,
 * y esa decision tiene un test propio.
 */
export function propsDeLaTabla(
  project: Project,
  tablero: Tablero,
  seleccion: SeleccionDelTablero,
  ocupado: boolean,
  /** El lote al Terminal, o null donde no se ofrece (ver `useLoteDelTablero`). */
  lote: LoteEnLaTabla | null = null
): React.ComponentProps<typeof import('./FindingsTable').FindingsTable> {
  return {
    project,
    lote,
    findings: tablero.visibles,
    seleccion: tablero.seleccion,
    onSeleccionar: seleccion.alternar,
    visibles: seleccion.visibles,
    onTodasLasVisibles: seleccion.alternarVisibles,
    filtrando: hayFiltro(tablero),
    onQuitarFiltro: () => {
      seleccion.elegirSeveridad(TODAS)
      seleccion.elegirEstado(TODAS)
    },
    onDismiss: (id) => void dismissFinding(project.id, id),
    onReopen: (id) => void reopenFinding(project.id, id),
    onMitigate: (id, nota) => void mitigateFinding(project.id, id, nota),
    onUnmitigate: (id) => void unmitigateFinding(project.id, id),
    onRepair: (id) => void proposeRepair(project.id, id),
    onResolver: (id) => {
      const fila = tablero.visibles.find((f) => f.id === id)
      if (fila !== undefined) resolverEnTerminal(project.id, fila)
    },
    onVerificar: (id) => void verificarHallazgo(project.id, id),
    ocupado
  }
}

/** Con cualquiera de los dos ejes puesto, una tabla vacia esta FILTRADA. */
export function hayFiltro(tablero: Tablero): boolean {
  return tablero.filtro.severidad !== TODAS || tablero.filtro.estado !== TODAS
}
