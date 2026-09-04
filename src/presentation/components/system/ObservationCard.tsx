import { useState } from 'react'
import type { SelfObservation } from '@domain/system/self-observation'
import { ExpandableText } from '../common/ExpandableText'
import { PUNTO_ESTADO, TONO_ESTADO } from './observation-tones'

interface ObservationCardProps {
  readonly observation: SelfObservation
}

/**
 * Fila del backlog de auto-mejora. Solo lectura a proposito: tuvo un boton de
 * "marcar atendido" que en semanas no se pulso ni una vez, porque cerrar
 * trescientas cuarenta a mano no es trabajo de una tarjeta. Se cierran fuera y
 * entran por el registro.
 *
 * En reposo es UNA linea, como la del expediente del motor. La nota ronda los
 * cuatrocientos caracteres y el motivo del cierre puede pasar de mil: pintados
 * siempre, diez observaciones no cabrian en la pantalla. Quien quiere leerlos
 * es quien ya abrio la fila.
 */
export function ObservationCard({ observation }: ObservationCardProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const { status, reason } = observation

  return (
    <article className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="tap flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <span className={`size-1.5 shrink-0 rounded-full ${PUNTO_ESTADO[status]}`} />
        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary">
          {observation.kind}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">{observation.area}</span>
        <span className={`ml-auto shrink-0 text-[11px] ${TONO_ESTADO[status]}`}>{status}</span>
      </button>

      {open ? (
        <div className="space-y-2 border-t border-border px-3 py-2">
          <ExpandableText text={observation.note} className="text-sm text-foreground" />
          <p className="text-[11px] text-muted-foreground">desde {observation.sourceProject}</p>
          {reason === null ? null : (
            <ExpandableText
              text={`${status}: ${reason}`}
              className={`text-[11px] ${TONO_ESTADO[status]}`}
            />
          )}
        </div>
      ) : null}
    </article>
  )
}
