import type { Project } from '@domain/project/project'
import { DIMENSIONS } from '@domain/score/dimension'
import { useBreakdownStore } from '../../stores/breakdown-store'
import { useProjectStore } from '../../stores/project-store'
import { useUiStore } from '../../stores/ui-store'
import { DimensionBar } from './DimensionBar'

interface ScoreBreakdownProps {
  readonly project: Project
}

/** Las 6 dimensiones en barras. Cada una navega a los hallazgos que la bajaron. */
export function ScoreBreakdown({ project }: ScoreBreakdownProps): React.JSX.Element {
  const setActiveProject = useProjectStore((state) => state.setActiveProject)
  const setView = useUiStore((state) => state.setView)
  const close = useBreakdownStore((state) => state.close)
  const dims = project.qualityDimensions

  const openFindings = (): void => {
    setActiveProject(project.id)
    setView('scan')
    close()
  }

  return (
    <div className="space-y-1.5">
      {DIMENSIONS.map((dim) => (
        <DimensionBar
          key={dim.key}
          label={dim.label}
          score={dims ? dims[dim.key] : null}
          onOpen={openFindings}
        />
      ))}
    </div>
  )
}
