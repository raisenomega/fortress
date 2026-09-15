import { SUGERIDO_DEL_LOTE, TOPE_DEL_LOTE } from '@domain/chat/lote-del-terminal'
import type { LoteEnCurso } from '../../stores/cola-del-lote-store'
import { Icon } from '../common/Icon'

interface BarraDelLoteProps {
  readonly elegidos: number
  readonly enCurso: LoteEnCurso | null
  readonly onResolver: () => void
  readonly onLimpiar: () => void
}

const BOTON = 'tap rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50'

/**
 * La barra del LOTE al Terminal (ADR-088). Aparte de la de «Verificar N» a
 * proposito: son dos acciones con dos costes, y un boton que cambiara de
 * significado segun la fila obligaria a leerlo antes de cada clic. No va pegada
 * arriba: esa posicion es de la de verificar, y dos barras fijas se taparian.
 */
export function BarraDelLote(props: BarraDelLoteProps): React.JSX.Element {
  const { elegidos, enCurso, onResolver, onLimpiar } = props
  const texto =
    enCurso === null
      ? `${elegidos} en el lote · sugerido ${SUGERIDO_DEL_LOTE}, maximo ${TOPE_DEL_LOTE}`
      : `Lote en curso: ${enCurso.hechos} de ${enCurso.total} · Detener lo corta`

  return (
    <div className="border-border bg-secondary/60 flex flex-wrap items-center gap-3 rounded-md border px-3 py-1.5">
      <span className="text-foreground text-xs">{texto}</span>
      <button
        type="button"
        onClick={onResolver}
        disabled={enCurso !== null}
        title="Un turno con foco por hallazgo, uno detras de otro, cada uno con su cierre"
        className={`${BOTON} bg-primary text-background flex items-center gap-1.5 hover:brightness-110`}
      >
        <Icon name="terminal" size={12} />
        Resolver lote en Terminal ({elegidos})
      </button>
      <button
        type="button"
        onClick={onLimpiar}
        disabled={enCurso !== null}
        className={`${BOTON} text-muted-foreground hover:text-foreground`}
      >
        Limpiar
      </button>
    </div>
  )
}
