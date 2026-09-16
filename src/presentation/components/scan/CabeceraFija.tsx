import type { RefObject } from 'react'
import type { Project } from '@domain/project/project'
import type { LoteDelTablero } from '../../hooks/useLoteDelTablero'
import type { SeleccionDelTablero } from '../../hooks/useSeleccionDelTablero'
import type { Tablero } from '../../hooks/useTablero'
import { useScanStore } from '../../stores/scan-store'
import { BarrasDelTablero } from './BarrasDelTablero'
import { ChipsDelTablero } from './ChipsDelTablero'
import { ScanHeader } from './ScanHeader'
import { ScanProgress } from './ScanProgress'

interface CabeceraFijaProps {
  readonly cabecera: RefObject<HTMLDivElement | null>
  readonly project: Project
  readonly tablero: Tablero
  readonly seleccion: SeleccionDelTablero
  readonly lote: LoteDelTablero
}

const FIJA = 'bg-background border-border sticky top-0 z-30 space-y-2 border-b px-4 py-3'

/**
 * EL bloque fijo del Escaneo. UNO solo y contiguo —score, nombre, botones,
 * filtros y barras— que publica su alto real en `--cabecera`: de esa unica
 * variable cuelga la fila de columnas. Con un sticky por piso harian falta
 * cuatro variables encadenadas y cuatro sitios donde equivocarse en silencio.
 *
 * Los avisos NO entran aqui (ver `AvisosDelEscaneo`) porque crecen, y un bloque
 * fijo que cambia de alto mientras trabajas es peor que el problema que
 * resuelve. La excepcion es el progreso: solo existe mientras se escanea, que es
 * justo cuando hay que tenerlo delante.
 */
export function CabeceraFija(props: CabeceraFijaProps): React.JSX.Element {
  const { cabecera, project, tablero, seleccion, lote } = props
  const running = useScanStore((state) => state.runningProjectId) === project.id
  const progress = useScanStore((state) => state.progress)

  return (
    <div ref={cabecera} className={FIJA}>
      <ScanHeader project={project} />

      <ChipsDelTablero
        filtro={tablero.filtro}
        recuento={tablero.recuento}
        onSeveridad={seleccion.elegirSeveridad}
        onEstado={seleccion.elegirEstado}
      />

      <BarrasDelTablero tablero={tablero} seleccion={seleccion} lote={lote} />

      {running ? <ScanProgress text={progress} /> : null}
    </div>
  )
}
