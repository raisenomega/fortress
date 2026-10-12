import { BarChart3 } from 'lucide-react'
import { useActiveProject } from '../../stores/project-store'
import { useUiStore } from '../../stores/ui-store'
import { APP_NAME } from '../common/Logo'
import { ModeSelector } from '../settings/ModeSelector'
import { KeepAwakeToggle } from './KeepAwakeToggle'
import { AvisoChip } from './AvisoChip'
import { FirmaChip } from './FirmaChip'
import { MotorChip } from './MotorChip'
import { OmegaChip } from './OmegaChip'
import { RefreshButton } from './RefreshButton'

export function TopBar(): React.JSX.Element {
  const project = useActiveProject()
  const setView = useUiStore((state) => state.setView)
  const view = useUiStore((state) => state.view)

  return (
    <header className="glass flex h-12 shrink-0 items-center gap-4 border-b border-border px-4">
      <h1 className="shrink-0 text-sm tracking-wide text-primary">{APP_NAME}</h1>

      <div className="min-w-0 flex-1">
        {project ? (
          <p className="truncate text-xs text-muted-foreground">
            <span className="text-foreground">{project.name}</span>
            {project.stack ? ` · ${project.stack}` : ''}
            {project.gitBranch ? ` · ${project.gitBranch}` : ''}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setView('rendimiento')}
        aria-pressed={view === 'rendimiento'}
        data-nav="Rendimiento"
        title="Tokens, coste, tendencia del score y agentes mas activos"
        className={`tap flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${
          view === 'rendimiento'
            ? 'border-primary/50 bg-accent/30 text-foreground'
            : 'border-border text-muted-foreground hover:text-foreground'
        }`}
      >
        <BarChart3 size={13} aria-hidden />
        Rendimiento
      </button>

      <MotorChip />
      <AvisoChip />
      <FirmaChip />

      <OmegaChip />

      <ModeSelector />

      <KeepAwakeToggle />

      <RefreshButton />
    </header>
  )
}
