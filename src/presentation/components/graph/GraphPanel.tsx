import { useGraph } from '../../stores/graph-store'
import { useActiveProject } from '../../stores/project-store'
import { Icon } from '../common/Icon'
import { Notice } from '../common/Notice'
import { GraphActions } from './GraphActions'
import { GraphStatsGrid } from './GraphStatsGrid'

/**
 * Detecta el grafo y, si esta indexado, lee su indice real (nodos, aristas,
 * archivos, fecha). Si esta configurado pero sin indice, lo dice en vez de
 * ensenar ceros que pareceria un grafo vacio.
 */
export function GraphPanel(): React.JSX.Element {
  const project = useActiveProject()
  const graph = useGraph(project?.id ?? null)

  const body =
    graph.state === 'no-instalado' ? (
      <p className="text-xs text-muted-foreground">
        Sin Knowledge Graph, los agentes leen archivos enteros. Instalalo para que consulten
        dependencias con el grafo (mas barato para mapear).
      </p>
    ) : (
      <>
        <p className="flex items-center gap-2 text-xs text-foreground">
          <Icon name="check-circle" size={13} className="text-success" />
          Servidor <span className="font-mono text-primary">{graph.server}</span>
          <span className="text-muted-foreground">· {graph.source}</span>
        </p>
        {graph.stats ? (
          <GraphStatsGrid stats={graph.stats} />
        ) : (
          <Notice tone="ok">Configurado, pero aun sin indice. Pulsa Instalar grafo.</Notice>
        )}
      </>
    )

  return (
    <div className="space-y-2">
      {body}
      <GraphActions />
    </div>
  )
}
