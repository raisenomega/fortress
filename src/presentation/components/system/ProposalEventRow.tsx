import { useState } from 'react'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import { formatMoment } from '../../format/time'
import { ExpandableText } from '../common/ExpandableText'
import { Icon } from '../common/Icon'
import { iconDe } from './proposal-event-view'
import { OmegaVerdictTable } from './OmegaVerdictTable'
import type { OmegaVerdict } from '@domain/repair/omega-verdict'

/** El verdict de OMEGA embebido en la evidencia, o null si no lo hay. */
function verdictDe(evidenceJson: string): OmegaVerdict | null {
  try {
    const parsed = JSON.parse(evidenceJson) as { verdict?: OmegaVerdict }
    return parsed.verdict?.veredicto_global !== undefined ? parsed.verdict : null
  } catch {
    return null
  }
}

/**
 * Coste del eslabon, con lo que se sepa: nada se inventa. "de trabajo" no es
 * adorno — es la unidad del tope, que no cuadra con el total del pie.
 */
function costeDe(event: ProposalEvent): string {
  const partes: string[] = []
  if (event.costTokens !== undefined) partes.push(`${event.costTokens} tok de trabajo`)
  if (event.durationMs !== undefined) partes.push(`${Math.round(event.durationMs / 1000)}s`)
  return partes.join(' · ')
}

interface ProposalEventRowProps {
  readonly event: ProposalEvent
}

/** Un eslabon del libro: fase, actor, momento, coste y razon. La evidencia
 *  JSON no se pinta por defecto (payload grande): se abre bajo demanda. */
export function ProposalEventRow({ event }: ProposalEventRowProps): React.JSX.Element {
  const [showEvidence, setShowEvidence] = useState(false)
  const coste = costeDe(event)

  return (
    <div className="border-border/60 border-l pl-2 text-[11px]">
      <div className="flex items-center gap-1.5">
        <Icon name={iconDe(event)} size={10} />
        <span className="text-foreground">{event.phase}</span>
        <span className="text-muted-foreground">{event.actor}</span>
        <span className="flex-1" />
        {coste === '' ? null : <span className="text-muted-foreground">{coste}</span>}
        <span className="text-muted-foreground">
          {formatMoment(new Date(event.ts).toISOString())}
        </span>
      </div>
      <ExpandableText text={event.reason ?? ''} className="text-muted-foreground" />
      {event.evidenceJson === undefined ? null : (
        <button
          type="button"
          onClick={() => setShowEvidence(!showEvidence)}
          className="text-muted-foreground hover:text-foreground text-[10px] underline"
        >
          {showEvidence ? 'ocultar evidencia' : 'evidencia'}
        </button>
      )}
      {showEvidence && event.evidenceJson !== undefined ? (
        verdictDe(event.evidenceJson) !== null ? (
          <OmegaVerdictTable verdict={verdictDe(event.evidenceJson) as OmegaVerdict} />
        ) : (
          <pre className="text-muted-foreground max-h-40 overflow-auto text-[10px]">
            {event.evidenceJson}
          </pre>
        )
      ) : null}
    </div>
  )
}
