import type { FindingHistoria } from '@domain/project/finding-historia'
import { usePaginado } from '../../hooks/usePaginado'
import { Paginador } from '../system/Paginador'
import { HistoriaRow } from './HistoriaRow'

interface HistoriaTableProps {
  readonly historia: readonly FindingHistoria[]
}

const HEAD = 'pb-2 text-left text-[11px] font-semibold tracking-widest uppercase'

/**
 * Lo cerrado, de diez en diez y con lo reciente arriba (molde del backlog de
 * auto-mejora). La paginacion es en cliente como alli: cincuenta y cinco filas
 * no piden SQL, y `paginar` ya acota la pagina pedida — que aqui hace falta,
 * porque verificar un mitigado hace crecer esta lista mientras se mira.
 */
export function HistoriaTable({ historia }: HistoriaTableProps): React.JSX.Element {
  const { visibles, pagina, irA } = usePaginado(historia)

  return (
    <>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className={HEAD}>Sev</th>
            <th className={HEAD}>Hallazgo</th>
            <th className={HEAD}>Ubicacion</th>
            <th className={HEAD}>Se vio</th>
            <th className={HEAD}>Se cerro</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((fila) => (
            <HistoriaRow key={fila.id} fila={fila} />
          ))}
        </tbody>
      </table>
      <Paginador pagina={pagina} onPagina={irA} />
    </>
  )
}
