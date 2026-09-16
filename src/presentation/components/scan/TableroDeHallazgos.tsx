import type { Project } from '@domain/project/project'
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

  return (
    <>
      <ChipsDelTablero
        filtro={tablero.filtro}
        recuento={tablero.recuento}
        onSeveridad={seleccion.elegirSeveridad}
        onEstado={seleccion.elegirEstado}
      />

      {tablero.seleccion.size > 0 ? (
        <BarraDeSeleccion
          seleccionados={tablero.seleccion.size}
          visiblesSeleccionados={tablero.visiblesSeleccionados}
          verificando={seleccion.verificando}
          onVerificar={seleccion.preguntar}
          onLimpiar={seleccion.limpiar}
        />
      ) : null}

      <BarraDelLote
        visible={lote.enLaTabla !== null && (lote.elegidos > 0 || lote.enCurso !== null)}
        elegidos={lote.elegidos}
        enCurso={lote.enCurso}
        pendiente={lote.pendiente}
        onPreparar={lote.preparar}
        onAprobar={lote.aprobar}
        onLimpiar={lote.limpiar}
      />

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
    </>
  )
}
