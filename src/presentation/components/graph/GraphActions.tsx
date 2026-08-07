import { installGraph, verifyGraph } from '../../services/graph-service'
import { useGraphActionStore } from '../../stores/graph-action-store'
import { useActiveProject } from '../../stores/project-store'
import { Icon } from '../common/Icon'
import { GraphAbBox } from './GraphAbBox'
import { GraphActionResult } from './GraphActionResult'

const BTN =
  'tap flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:border-primary/40 disabled:opacity-50'

/** Las 3 acciones del grafo en la ficha: Instalar, Verificar y el A/B. */
export function GraphActions(): React.JSX.Element | null {
  const project = useActiveProject()
  const running = useGraphActionStore((state) => state.running)
  if (!project) return null
  const busy = running !== null

  return (
    <div className="space-y-2 border-t border-border pt-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void installGraph(project.id)}
          className={BTN}
        >
          <Icon name="git-branch" size={13} />
          {running === 'install' ? 'Instalando...' : 'Instalar grafo'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void verifyGraph(project.id)}
          className={BTN}
        >
          <Icon name="check-circle" size={13} />
          {running === 'verify' ? 'Verificando...' : 'Verificar grafo'}
        </button>
      </div>
      <GraphAbBox projectId={project.id} busy={busy} running={running === 'ab'} />
      <GraphActionResult />
    </div>
  )
}
