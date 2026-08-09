import { useEffect, useState } from 'react'
import type { ReindexSnapshot } from '@domain/graph/graph-state'
import type { IconName } from '@domain/shared/icon-name'
import { api } from '../../adapters/fortress-api'
import { Icon } from '../common/Icon'

interface Vista {
  readonly label: string
  readonly icon: IconName
  readonly tone: string
  readonly spin?: boolean
}

function vistaDe(snap: ReindexSnapshot): Vista {
  if (snap.status === 'RUNNING')
    return { label: 'grafo alineandose', icon: 'refresh-cw', tone: 'text-medium', spin: true }
  if (snap.status === 'ERROR')
    return { label: 'grafo: error de indice', icon: 'x-circle', tone: 'text-critical' }
  if (snap.indexedSha === null)
    return { label: 'grafo sin indexar', icon: 'circle', tone: 'text-muted-foreground' }
  if (snap.indexedSha === snap.currentSha)
    return { label: 'grafo alineado', icon: 'check-circle', tone: 'text-success/70' }
  return { label: 'grafo desactualizado', icon: 'alert-triangle', tone: 'text-medium' }
}

/** Chip del indice del grafo. Click: reindexar a mano (inerte mientras corre). */
export function GraphChip({ projectId }: { readonly projectId: string }): React.JSX.Element | null {
  const [snap, setSnap] = useState<ReindexSnapshot | null>(null)

  useEffect(() => {
    let alive = true
    const load = (): void => {
      void api()
        .graph.state(projectId)
        .then((estado) => alive && setSnap(estado))
    }
    load()
    const off = api().graph.onReindexChanged((id) => id === projectId && load())
    return () => {
      alive = false
      off()
    }
  }, [projectId])

  // Sin repo git no hay nada que alinear: el chip no aparece.
  if (snap === null || snap.currentSha === null) return null
  const vista = vistaDe(snap)

  return (
    <button
      type="button"
      disabled={snap.status === 'RUNNING'}
      // El refresco llega solo: el main empuja graph:reindex:changed al marcar RUNNING.
      onClick={() => void api().graph.reindex(projectId)}
      title={snap.error ?? 'Click para reindexar el grafo ahora'}
      className={`flex shrink-0 items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] tracking-wide uppercase ${vista.tone}`}
    >
      <span className={vista.spin ? 'animate-spin' : ''}>
        <Icon name={vista.icon} size={11} />
      </span>
      {vista.label}
    </button>
  )
}
