import type { Project } from '@domain/project/project'
import { scanStatus } from '@domain/project/scan-status'
import { useOmegaStore } from '../../stores/omega-store'
import { useProjectStore } from '../../stores/project-store'

const DOT: Record<string, string> = {
  'sin-escanear': 'bg-muted-foreground',
  solido: 'bg-success',
  aceptable: 'bg-medium',
  riesgo: 'bg-critical'
}

interface OmegaProjectsViewProps {
  readonly projects: readonly Project[]
}

/** Scope de PROYECTOS: chips; click en uno lo activa y abre su vista de CODIGO. */
export function OmegaProjectsView({ projects }: OmegaProjectsViewProps): React.JSX.Element {
  const setActive = useProjectStore((s) => s.setActiveProject)
  const setMode = useOmegaStore((s) => s.setMode)
  const open = (id: string): void => {
    setActive(id)
    setMode('codigo')
  }

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin proyectos registrados.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {projects.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => open(p.id)}
          className="tap flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-foreground hover:border-primary/50"
        >
          <span className={`h-2 w-2 rounded-full ${DOT[scanStatus(p)]}`} />
          {p.name} · {p.fortressScore}%
        </button>
      ))}
    </div>
  )
}
