import { INSTALL_HINT } from '@domain/graph/graph-status'
import { useGraph } from '../../stores/graph-store'
import { useActiveProject } from '../../stores/project-store'
import { Icon } from '../common/Icon'
import { Notice } from '../common/Notice'
import { GraphStatsGrid } from './GraphStatsGrid'

/**
 * Detecta el grafo y, si esta indexado, lee su indice real (nodos, aristas,
 * archivos, fecha). Si esta configurado pero sin indice, lo dice en vez de
 * ensenar ceros que pareceria un grafo vacio.
 */
export function GraphPanel(): React.JSX.Element {
  const project = useActiveProject()
  const graph = useGraph(project?.id ?? null)

  if (graph.state === 'no-instalado') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Este proyecto no tiene Knowledge Graph configurado. Con el, los agentes consultan
          dependencias en vez de leer archivos enteros.
        </p>
        <code className="block rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-[11px] text-foreground">
          {INSTALL_HINT}
        </code>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-xs text-foreground">
        <Icon name="check-circle" size={13} className="text-success" />
        Servidor <span className="font-mono text-primary">{graph.server}</span>
        <span className="text-muted-foreground">· {graph.source}</span>
      </p>
      {graph.stats ? (
        <GraphStatsGrid stats={graph.stats} />
      ) : (
        <Notice tone="ok">
          Configurado, pero aun sin indice. Los agentes lo crean con index_repository en el primer
          uso.
        </Notice>
      )}
    </div>
  )
}
