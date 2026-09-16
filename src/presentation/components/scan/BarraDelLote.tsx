import { textoDeLaTanda } from '@domain/chat/lote-del-terminal'
import type { LoteDelTablero } from '../../hooks/useLoteDelTablero'
import { Icon } from '../common/Icon'

interface BarraDelLoteProps {
  /** El lote se ofrece aqui y hay algo que enseñar. */
  readonly visible: boolean
  /** El lote del tablero entero: sus estados y sus dos gestos. */
  readonly lote: LoteDelTablero
}

const BOTON = 'tap rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50'

function texto(l: LoteDelTablero): string {
  if (l.enCurso !== null) return `Lote: ${l.enCurso.hechos} de ${l.enCurso.total}`
  if (l.enAutonomo) return 'El lote resuelve en modo Supervisado'
  if (l.planeado) return 'Lee el plan en el Terminal'
  if (l.pendiente) return 'Mensaje listo en el Terminal: dale Enter'
  return textoDeLaTanda(l.elegidos)
}

/**
 * La barra del LOTE, con los dos gestos del flujo y nada mas: pedir el plan, y
 * —cuando el plan ya esta escrito y leido— ejecutarlo. Entre los dos manda el
 * operador con su Enter, en el Terminal, que es donde esta mirando.
 */
export function BarraDelLote({ visible, lote }: BarraDelLoteProps): React.JSX.Element | null {
  if (!visible) return null
  const { elegidos, planeado, enAutonomo } = lote
  const corriendo = lote.enCurso !== null

  return (
    <div className="border-border bg-secondary/60 flex flex-wrap items-center gap-3 rounded-md border px-3 py-1.5">
      <span className="text-foreground text-xs">{texto(lote)}</span>
      <button
        type="button"
        onClick={planeado ? lote.ejecutar : lote.preparar}
        disabled={corriendo || enAutonomo || (lote.pendiente && !planeado)}
        title={
          planeado
            ? 'Resuelve los hallazgos del lote, uno por turno. Detener lo corta'
            : 'Deja el mensaje escrito en el Terminal. Lo mandas tu'
        }
        className={`${BOTON} bg-primary text-background flex items-center gap-1.5 hover:brightness-110`}
      >
        <Icon name="terminal" size={12} />
        {planeado ? `Ejecutar plan (${elegidos})` : `Resolver lote en Terminal (${elegidos})`}
      </button>
      <button
        type="button"
        onClick={lote.limpiar}
        disabled={corriendo}
        className={`${BOTON} text-muted-foreground hover:text-foreground`}
      >
        Limpiar
      </button>
    </div>
  )
}
