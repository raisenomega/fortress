import type { ActionTone } from '@domain/graph/graph-action-status'
import { TONE_CLASS } from './graph-tones'

/** Punto de estado coloreado que precede a cada boton del grafo. */
export function GraphActionDot({ tone }: { tone: ActionTone }): React.JSX.Element {
  return (
    <span className={`text-[9px] leading-none ${TONE_CLASS[tone]}`} aria-hidden>
      ●
    </span>
  )
}
