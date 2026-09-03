import { useState } from 'react'
import type { ResumenImport } from '@application/system/importar-atendidos'
import { importAttended } from '../../services/self-improvement-service'

/** El recuento, en una linea. Solo se nombra lo que ocurrio. */
function cuenta(r: ResumenImport): string {
  const partes = [
    r.atendidas > 0 ? `${r.atendidas} atendida${r.atendidas > 1 ? 's' : ''}` : '',
    r.descartadas > 0 ? `${r.descartadas} descartada${r.descartadas > 1 ? 's' : ''}` : '',
    r.sobrescritas > 0 ? `${r.sobrescritas} pisando un cierre anterior` : ''
  ].filter((p) => p !== '')
  return partes.length === 0 ? 'No habia nada que aplicar.' : `${partes.join(', ')}.`
}

/**
 * Trae de vuelta lo que se atendio fuera de la app. Los rechazos se listan UNO A
 * UNO con su motivo: un "3 rechazadas" a secas no le dice al operador que
 * arreglar en el fichero, y ese es justo el trabajo que este boton existe para
 * ahorrarle.
 */
export function ImportAttended(): React.JSX.Element {
  const [resumen, setResumen] = useState<ResumenImport | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const importar = (): void => {
    setAviso('Importando…')
    setResumen(null)
    void importAttended().then((r) => {
      setAviso(r.ok ? cuenta(r.value) : r.error)
      setResumen(r.ok ? r.value : null)
    })
  }

  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <h3 className="text-sm text-foreground">Importar registro</h3>
      <p className="text-[11px] text-muted-foreground">
        Lee el atendidos.json y asienta lo que se cerro fuera. No toca el fichero: es tambien el
        respaldo del backlog.
      </p>
      <button
        type="button"
        onClick={importar}
        className="mt-2 rounded border border-border px-2 py-1 text-xs text-foreground hover:border-primary hover:text-primary"
      >
        Importar atendidos
      </button>
      {aviso === null ? null : <p className="mt-2 text-[11px] text-muted-foreground">{aviso}</p>}
      {resumen === null || resumen.rechazadas.length === 0 ? null : (
        <ul className="mt-1.5 space-y-0.5">
          {resumen.rechazadas.map((r, i) => (
            <li key={`${r.id ?? 'sin-id'}-${i}`} className="font-mono text-[11px] text-critical">
              {r.id ?? '(sin id)'}: {r.motivo}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
