import type { RefObject } from 'react'
import type { Project } from '@domain/project/project'
import { useLoteDelTablero } from '../../hooks/useLoteDelTablero'
import { useTablero } from '../../hooks/useTablero'
import { useSeleccionDelTablero } from '../../hooks/useSeleccionDelTablero'
import { useRepairStore } from '../../stores/repair-store'
import { propsDeLaTabla } from './props-de-la-tabla'
import { AvisosDelEscaneo } from './AvisosDelEscaneo'
import { CabeceraFija } from './CabeceraFija'
import { FindingsTable } from './FindingsTable'

interface TableroDeHallazgosProps {
  readonly project: Project
  /** Marca el bloque fijo para medir su alto real (ver `useFranjaFija`). */
  readonly cabecera: RefObject<HTMLDivElement | null>
}

/**
 * El Escaneo de un proyecto: el bloque FIJO arriba y, debajo, lo unico que se
 * mueve —avisos y filas—. El estado del tablero se levanta aqui, y no en
 * `ScanView`, porque el bloque fijo necesita los chips y las barras, y esos
 * cuelgan de el; separarlos obligaria a suscribirse dos veces al mismo store.
 */
export function TableroDeHallazgos(props: TableroDeHallazgosProps): React.JSX.Element {
  const { project, cabecera } = props
  const tablero = useTablero(project.id)
  const seleccion = useSeleccionDelTablero(project.id, tablero)
  const motorOcupado = useRepairStore((state) => state.busy) // un solo carril
  const lote = useLoteDelTablero(project.id, project.name)

  return (
    <>
      <CabeceraFija
        cabecera={cabecera}
        project={project}
        tablero={tablero}
        seleccion={seleccion}
        lote={lote}
      />

      <div className="space-y-3 px-4 py-3">
        <AvisosDelEscaneo project={project} />

        <FindingsTable
          {...propsDeLaTabla(project, tablero, seleccion, motorOcupado, lote.enLaTabla)}
        />
      </div>
    </>
  )
}
