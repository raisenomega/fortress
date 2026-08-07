import { useState } from 'react'
import { abTone } from '@domain/graph/graph-action-status'
import { runAbGraph } from '../../services/graph-service'
import { useGraphAction } from '../../stores/graph-action-store'
import { GraphAbResult } from './GraphAbResult'
import { GraphActionDot } from './GraphActionDot'

interface GraphAbBoxProps {
  readonly projectId: string
  readonly busy: boolean
}

const INPUT =
  'flex-1 rounded-md border border-border bg-input px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground'
const BTN =
  'tap flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50'

/** Pregunta estructural + "Comparar A/B": misma pregunta en lectura vs normal. */
export function GraphAbBox({ projectId, busy }: GraphAbBoxProps): React.JSX.Element {
  const [question, setQuestion] = useState('')
  const state = useGraphAction(projectId)
  const running = state.running === 'ab'

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Pregunta estructural (ej: quien llama a X)"
          className={INPUT}
        />
        <button
          type="button"
          disabled={busy || question.trim().length === 0}
          onClick={() => void runAbGraph(projectId, question.trim())}
          className={BTN}
        >
          <GraphActionDot tone={abTone(state.ab, running, state.abFailed)} />
          {running ? 'Midiendo...' : 'Comparar A/B'}
        </button>
      </div>
      {state.ab ? <GraphAbResult ab={state.ab} /> : null}
    </div>
  )
}
