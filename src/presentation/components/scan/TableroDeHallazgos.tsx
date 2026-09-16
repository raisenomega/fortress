import type { Project } from '@domain/project/project'
import { useFranjaFija } from '../../hooks/useFranjaFija'
import { useLoteDelTablero } from '../../hooks/useLoteDelTablero'
import { useTablero } from '../../hooks/useTablero'
import { useSeleccionDelTablero } from '../../hooks/useSeleccionDelTablero'
import { useRepairStore } from '../../stores/repair-store'
import { propsDeLaTabla } from './props-de-la-tabla'
import { BarraDelLote } from './BarraDelLote'
import { BarraDeSeleccion } from './BarraDeSeleccion'
import { ChipsDelTablero } from './ChipsDelTablero'
import { ConfirmVerificarTodos } from './ConfirmVerificarTodos'
import { FindingsTable } from './FindingsTable'

interface TableroDeHallazgosProps {
  readonly project: Project
}

// Cuelga de la fila fija del proyecto (`--cabecera`). Sin `py`: cuando no hay
// barras que enseñar la franja no debe ocupar ni un pixel.
const FRANJA = 'bg-background sticky top-[var(--cabecera,0px)] z-20 -mx-4 space-y-2 px-4'

/**
 * La tabla con sus dos ejes de chips y su barra de seleccion. Sale de `ScanView`
 * —que ya orquestaba avisos, cobertura y progreso— porque esto es una pieza con
 * estado propio, y alli no cabia sin pasar de las 75 lineas.
 */
export function TableroDeHallazgos({ project }: TableroDeHallazgosProps): React.JSX.Element {
  const tablero = useTablero(project.id)
  const seleccion = useSeleccionDelTablero(project.id, tablero)
  const motorOcupado = useRepairStore((state) => state.busy) // un solo carril
  const lote = useLoteDelTablero(project.id, project.name)
  const [franja, bajoLaFranja] = useFranjaFija('--franja')
  const verLote = lote.enLaTabla !== null && (lote.elegidos > 0 || lote.enCurso !== null)
  const vacia = tablero.seleccion.size === 0 && !verLote

  return (
    <div className="space-y-3" style={bajoLaFranja}>
      <ChipsDelTablero
        filtro={tablero.filtro}
        recuento={tablero.recuento}
        onSeveridad={seleccion.elegirSeveridad}
        onEstado={seleccion.elegirEstado}
      />

      {/* Las barras se quedan fijas bajo la cabecera; solo scrollean las filas. */}
      <div ref={franja} className={vacia ? FRANJA : `${FRANJA} py-2`}>
        {tablero.seleccion.size > 0 ? (
          <BarraDeSeleccion
            seleccionados={tablero.seleccion.size}
            visiblesSeleccionados={tablero.visiblesSeleccionados}
            verificando={seleccion.verificando}
            onVerificar={seleccion.preguntar}
            onLimpiar={seleccion.limpiar}
          />
        ) : null}

        <BarraDelLote visible={verLote} lote={lote} />
      </div>

      {seleccion.preguntando ? (
        <ConfirmVerificarTodos
          mitigados={tablero.seleccion.size}
          alcance="seleccionados"
          onCancel={seleccion.cerrar}
          onConfirm={seleccion.confirmar}
        />
      ) : null}

      <FindingsTable
        {...propsDeLaTabla(project, tablero, seleccion, motorOcupado, lote.enLaTabla)}
      />
    </div>
  )
}
