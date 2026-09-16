import { SUGERIDO_DEL_LOTE, TOPE_DEL_LOTE } from '@domain/chat/lote-del-terminal'
import type { LoteEnCurso } from '../../stores/cola-del-lote-store'
import { Icon } from '../common/Icon'

interface BarraDelLoteProps {
  /** El lote se ofrece aqui y hay algo que enseñar. Decidirlo dentro deja el
   *  tablero legible: alli eran diez lineas de condicion antes del componente. */
  readonly visible: boolean
  readonly elegidos: number
  readonly enCurso: LoteEnCurso | null
  /** Hay un plan precargado esperando aprobacion. */
  readonly pendiente: boolean
  readonly onPreparar: () => void
  readonly onAprobar: () => void
  readonly onLimpiar: () => void
}

const BOTON = 'tap rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50'

function texto(props: BarraDelLoteProps): string {
  if (props.enCurso !== null) {
    return `Lote en curso: ${props.enCurso.hechos} de ${props.enCurso.total} · Detener lo corta`
  }
  if (props.pendiente) return 'Plan precargado en el Terminal: mandalo, leelo y aprueba'
  return `${props.elegidos} en el lote · sugerido ${SUGERIDO_DEL_LOTE}, maximo ${TOPE_DEL_LOTE}`
}

/**
 * La barra del LOTE al Terminal (ADR-088). Aparte de la de «Verificar N» a
 * proposito: son dos acciones con dos costes. Tiene dos gestos, no uno —pedir el
 * plan y aprobarlo— porque el plan es lo que el operador autoriza: tras aprobar,
 * la cola edita sin volver a preguntar.
 */
export function BarraDelLote(props: BarraDelLoteProps): React.JSX.Element | null {
  const { visible, elegidos, enCurso, pendiente, onPreparar, onAprobar, onLimpiar } = props
  if (!visible) return null
  const corriendo = enCurso !== null

  return (
    <div className="border-border bg-secondary/60 flex flex-wrap items-center gap-3 rounded-md border px-3 py-1.5">
      <span className="text-foreground text-xs">{texto(props)}</span>
      <button
        type="button"
        onClick={pendiente ? onAprobar : onPreparar}
        disabled={corriendo}
        title={
          pendiente
            ? 'Aprobar el plan autoriza el lote entero: la cola edita los ficheros, un turno por hallazgo, sin mas aprobaciones. Detener la corta'
            : 'Precarga en el Terminal el mensaje de plan. No envia nada todavia'
        }
        className={`${BOTON} bg-primary text-background flex items-center gap-1.5 hover:brightness-110`}
      >
        <Icon name="terminal" size={12} />
        {pendiente
          ? `Aprobar plan y resolver ${elegidos} — editara sin volver a preguntar`
          : `Resolver lote en Terminal (${elegidos})`}
      </button>
      <button
        type="button"
        onClick={onLimpiar}
        disabled={corriendo}
        className={`${BOTON} text-muted-foreground hover:text-foreground`}
      >
        Limpiar
      </button>
    </div>
  )
}
