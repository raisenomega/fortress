import { Icon } from '../common/Icon'
import { useConstruirStore } from '../../stores/construir-store'

/** El ReporteDeTarea que llego del Terminal por el carril de vuelta (PASO 87),
 *  como BLOQUE legible: estado, que toco, verificacion, coste, modelo y
 *  hallazgos. El resumen completo queda en el Terminal; esto es el parte. */
export function ReporteEntrante(): React.JSX.Element | null {
  const reporte = useConstruirStore((s) => s.reporteEntrante)
  const cerrar = useConstruirStore((s) => s.setReporteEntrante)
  if (reporte === null) return null
  const tono = reporte.estado === 'hecho' ? 'text-success' : 'text-critical'
  return (
    <div className="mb-2 rounded-md border border-border bg-card px-3 py-2 font-mono text-[12px] text-foreground">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0">
          Reporte del Terminal: <span className={tono}>{reporte.estado}</span>
          {' · '}
          {reporte.verificacion}
          {' · '}
          {reporte.modelo ?? 'modelo no consta'}
          {' · $'}
          {reporte.usage.costUsd.toFixed(2)}
          {' · hallazgos: '}
          {reporte.hallazgos}
        </span>
        <button
          type="button"
          onClick={() => cerrar(null)}
          title="Cerrar el reporte"
          className="tap shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Icon name="x-circle" size={14} />
        </button>
      </div>
      <p className="mt-1 break-words text-muted-foreground">
        {reporte.edits.length > 0 ? `toco: ${reporte.edits.join(', ')}` : 'no toco ficheros'}
      </p>
    </div>
  )
}
