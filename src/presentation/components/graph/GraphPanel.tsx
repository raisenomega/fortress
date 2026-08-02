import { INSTALL_HINT } from '@domain/graph/graph-status'
import { useGraph } from '../../stores/graph-store'
import { useActiveProject } from '../../stores/project-store'
import { Icon } from '../common/Icon'
import { Notice } from '../common/Notice'

/**
 * FORTRESS detecta el grafo pero todavia no lee su contenido. Se dice tal
 * cual: ensenar cero nodos y cero aristas sugeriria un grafo vacio, cuando lo
 * que pasa es que esta app aun no sabe leerlo.
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
        Servidor <span className="font-mono text-primary">{graph.server}</span> configurado
        <span className="text-muted-foreground">· {graph.source}</span>
      </p>
      <Notice tone="ok">
        FORTRESS lo detecta pero todavia no lee su grafo. Faltaria comprobar como guarda los datos
        contra una instalacion real; escribir el lector a ciegas seria inventarselo.
      </Notice>
    </div>
  )
}
