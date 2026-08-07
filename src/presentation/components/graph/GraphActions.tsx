import { installTone, verifyTone } from '@domain/graph/graph-action-status'
import { installGraph, verifyGraph } from '../../services/graph-service'
import { useGraphAction } from '../../stores/graph-action-store'
import { useGraph } from '../../stores/graph-store'
import { useActiveProject } from '../../stores/project-store'
import { Icon } from '../common/Icon'
import { GraphAbBox } from './GraphAbBox'
import { GraphActionDot } from './GraphActionDot'
import { GraphActionResult } from './GraphActionResult'
import { TONE_CLASS } from './graph-tones'

const BTN =
  'tap flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:border-primary/40 disabled:opacity-50'

/** Las 3 acciones del grafo con estado por color (gris/naranja/verde/rojo), por proyecto. */
export function GraphActions(): React.JSX.Element | null {
  const project = useActiveProject()
  const state = useGraphAction(project?.id ?? null)
  const graph = useGraph(project?.id ?? null)
  if (!project) return null
  const busy = state.running !== null
  const install = installTone(graph, state.running === 'install', state.installFailed)
  const verify = verifyTone(state.verify, state.running === 'verify')

  return (
    <div className="space-y-2 border-t border-border pt-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void installGraph(project.id)}
          className={BTN}
        >
          <GraphActionDot tone={install} />
          <Icon name="git-branch" size={13} />
          {state.running === 'install' ? 'Instalando...' : 'Instalar grafo'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void verifyGraph(project.id)}
          className={BTN}
        >
          <GraphActionDot tone={verify} />
          <Icon name="check-circle" size={13} className={TONE_CLASS[verify]} />
          {state.running === 'verify' ? 'Verificando...' : 'Verificar grafo'}
        </button>
      </div>
      <GraphAbBox projectId={project.id} busy={busy} />
      <GraphActionResult projectId={project.id} />
    </div>
  )
}
