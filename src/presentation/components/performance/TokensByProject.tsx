import { EMPTY_USAGE, totalTokens, type TokenUsage } from '@domain/telemetry/token-usage'
import { useProjectStore } from '../../stores/project-store'
import { BarChart, type Bar } from '../charts/BarChart'

interface TokensByProjectProps {
  readonly byProject: Readonly<Record<string, TokenUsage>>
}

export function TokensByProject({ byProject }: TokensByProjectProps): React.JSX.Element {
  const projects = useProjectStore((state) => state.projects)

  const bars: Bar[] = projects
    .map((project) => ({
      label: project.name.slice(0, 10),
      value: totalTokens(byProject[project.id] ?? EMPTY_USAGE),
      className: 'bg-primary'
    }))
    .filter((bar) => bar.value > 0)

  return <BarChart bars={bars} empty="Ningun proyecto consumio tokens en este periodo." />
}
