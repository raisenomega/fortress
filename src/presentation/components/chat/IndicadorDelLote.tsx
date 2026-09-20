import { etiquetaDelLote } from '@domain/chat/pie-del-lote'
import { useColaDelLoteStore } from '../../stores/cola-del-lote-store'
import { useSettingsStore } from '../../stores/settings-store'

interface IndicadorDelLoteProps {
  readonly projectId: string
}

/**
 * El lote en curso, visible DONDE se mira mientras corre: el Terminal. La barra
 * del Escaneo ya lo dice, pero al arrancar la vista salta aqui y aquella se
 * queda detras; sin esto el operador ve turnos encadenarse sin saber cuantos
 * quedan ni que hay un lote detras. Mismo dato, un solo store.
 *
 * SOLO EN SUPERVISADO. En autonomo el pie del hilo ya dice lo mismo y ademas la
 * fase (`LoteEnCurso`), asi que esta franja sobraba — y mientras conto `hechos`
 * en crudo, ademas se contradecia con el: «Lote 0 de 3» abajo contra «Lote 1 de
 * 3» arriba, el mismo lote. En supervisado se queda porque alli el pie es la
 * pildora, que no lleva numeros, y esta es la unica cuenta que hay.
 *
 * El contador sale de `etiquetaDelLote`, el MISMO del hilo y del Escaneo: tres
 * barras del mismo lote tienen que contar igual o una de ellas miente.
 */
export function IndicadorDelLote({ projectId }: IndicadorDelLoteProps): React.JSX.Element | null {
  const enCurso = useColaDelLoteStore((s) =>
    s.enCurso?.projectId === projectId ? s.enCurso : null
  )
  const autonomo = useSettingsStore((s) => s.mode === 'autonomo')
  if (enCurso === null || autonomo) return null

  return (
    <div className="border-border bg-secondary/60 text-muted-foreground shrink-0 border-t px-4 py-1.5 text-[11px]">
      {etiquetaDelLote(enCurso.hechos, enCurso.total)} en curso · Detener lo corta
    </div>
  )
}
