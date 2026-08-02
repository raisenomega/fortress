import { useCognition } from '../../stores/cognition-store'
import { useActiveProject } from '../../stores/project-store'
import { EmptyState } from '../common/EmptyState'
import { AttentionMap } from './AttentionMap'
import { CognitionBlock } from './CognitionBlock'
import { CognitionSummary } from './CognitionSummary'
import { PatternList } from './PatternList'
import { ReflectionList } from './ReflectionList'

export function CognitionView(): React.JSX.Element {
  const project = useActiveProject()
  const snapshot = useCognition(project?.id ?? null)

  if (!project) {
    return <EmptyState iconName="brain" title="Ningun proyecto" hint="Elige un proyecto." />
  }

  // FORTRESS lee este archivo, no lo escribe: decirlo evita que el operador
  // espere que la app lo cree sola.
  if (!snapshot.present) {
    return (
      <EmptyState
        iconName="brain"
        title="Este proyecto no tiene COGNITION-LOG.md"
        hint={`FORTRESS lo lee, no lo escribe. Lo crea Claude Code al cerrar una sesion en ${project.path}.`}
      />
    )
  }

  return (
    <div className="h-full space-y-5 overflow-y-auto px-4 py-4">
      <CognitionSummary snapshot={snapshot} />

      <CognitionBlock title="Mapa de atencion">
        <AttentionMap zones={snapshot.attention} />
      </CognitionBlock>

      <CognitionBlock title={`Patrones (${snapshot.patterns.length})`}>
        <PatternList patterns={snapshot.patterns} />
      </CognitionBlock>

      <CognitionBlock title="Ultimas reflexiones">
        <ReflectionList reflections={snapshot.reflections} />
      </CognitionBlock>
    </div>
  )
}
