import { useColaDelLoteStore } from '../../stores/cola-del-lote-store'

interface IndicadorDelLoteProps {
  readonly projectId: string
}

/**
 * El lote en curso, visible DONDE se mira mientras corre: el Terminal. La barra
 * del Escaneo ya lo dice, pero al arrancar la vista salta aqui y aquella se
 * queda detras; sin esto el operador ve turnos encadenarse sin saber cuantos
 * quedan ni que hay un lote detras. Mismo dato, un solo store.
 */
export function IndicadorDelLote({ projectId }: IndicadorDelLoteProps): React.JSX.Element | null {
  const enCurso = useColaDelLoteStore((s) =>
    s.enCurso?.projectId === projectId ? s.enCurso : null
  )
  if (enCurso === null) return null

  return (
    <div className="border-border bg-secondary/60 text-muted-foreground shrink-0 border-t px-4 py-1.5 text-[11px]">
      Lote: {enCurso.hechos} de {enCurso.total} en curso · Detener lo corta
    </div>
  )
}
