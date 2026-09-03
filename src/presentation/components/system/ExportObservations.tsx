import { useState } from 'react'
import { exportObservations } from '../../services/self-improvement-service'

/**
 * Saca el backlog a un fichero para poder TRABAJARLO fuera de la app. La vista
 * sirve para mirar; atender trescientas cuarenta observaciones a mano por aqui
 * es lo que lleva doce dias sin ocurrir.
 */
export function ExportObservations(): React.JSX.Element {
  const [aviso, setAviso] = useState<string | null>(null)

  const exportar = (): void => {
    setAviso('Exportando…')
    void exportObservations().then((r) =>
      setAviso(r.ok ? `Escrito en ${r.value}` : `No se pudo exportar: ${r.error}`)
    )
  }

  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <h3 className="text-sm text-foreground">Exportar observaciones</h3>
      <p className="text-[11px] text-muted-foreground">
        Las deja en un JSON ordenado por lo que mas se repite. El fichero explica dentro por que su
        orden es una aproximacion y no un mapa de temas.
      </p>
      <button
        type="button"
        onClick={exportar}
        className="mt-2 rounded border border-border px-2 py-1 text-xs text-foreground hover:border-primary hover:text-primary"
      >
        Exportar a JSON
      </button>
      {aviso === null ? null : (
        <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">{aviso}</p>
      )}
    </section>
  )
}
