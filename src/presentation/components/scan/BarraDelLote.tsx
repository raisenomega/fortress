import { SUGERIDO_DEL_LOTE } from '@domain/chat/lote-del-terminal'
import type { LoteEnCurso } from '../../stores/cola-del-lote-store'
import { Icon } from '../common/Icon'

interface BarraDelLoteProps {
  /** El lote se ofrece aqui y hay algo que enseñar. */
  readonly visible: boolean
  readonly elegidos: number
  readonly enCurso: LoteEnCurso | null
  /** El mensaje ya esta precargado en el Terminal, esperando el Enter. */
  readonly pendiente: boolean
  /** En autonomo el lote no corre todavia: lo dice antes de pulsar, no despues. */
  readonly enAutonomo: boolean
  readonly onPreparar: () => void
  readonly onLimpiar: () => void
}

const BOTON = 'tap rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50'

function texto(p: BarraDelLoteProps): string {
  if (p.enCurso !== null) return `Lote: ${p.enCurso.hechos} de ${p.enCurso.total}`
  if (p.enAutonomo) return 'El lote resuelve en modo Supervisado'
  if (p.pendiente) return 'Mensaje listo en el Terminal: dale Enter'
  return `${p.elegidos} en el lote · sugerido ${SUGERIDO_DEL_LOTE}`
}

/**
 * La barra del LOTE. UN gesto y una linea: el resto del flujo vive donde el
 * operador ya esta mirando —el Terminal—, y ahi su Enter es la aprobacion.
 *
 * Aparte de la de «Verificar N» a proposito: son dos acciones con dos costes.
 */
export function BarraDelLote(props: BarraDelLoteProps): React.JSX.Element | null {
  const { visible, elegidos, enCurso, enAutonomo, onPreparar, onLimpiar } = props
  if (!visible) return null
  const ocupada = enCurso !== null || enAutonomo

  return (
    <div className="border-border bg-secondary/60 flex flex-wrap items-center gap-3 rounded-md border px-3 py-1.5">
      <span className="text-foreground text-xs">{texto(props)}</span>
      <button
        type="button"
        onClick={onPreparar}
        disabled={ocupada}
        title="Deja el mensaje escrito en el Terminal. Lo mandas tu"
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
