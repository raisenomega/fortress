import { useActiveProject } from '../../stores/project-store'
import { ModeSelector } from '../settings/ModeSelector'

interface TopBarProps {
  readonly onOpenSettings: () => void
}

export function TopBar({ onOpenSettings }: TopBarProps): React.JSX.Element {
  const project = useActiveProject()

  return (
    <header className="glass flex h-12 shrink-0 items-center gap-4 border-b border-border px-4">
      <h1 className="shrink-0 text-sm tracking-wide text-primary">🏰 FORTRESS COMMAND CENTER</h1>

      <div className="min-w-0 flex-1">
        {project ? (
          <p className="truncate text-xs text-muted-foreground">
            <span className="text-foreground">{project.name}</span>
            {project.stack ? ` · ${project.stack}` : ''}
            {project.gitBranch ? ` · ${project.gitBranch}` : ''}
          </p>
        ) : null}
      </div>

      <ModeSelector />

      <button
        type="button"
        onClick={onOpenSettings}
        title="API key de Claude"
        className="tap shrink-0 rounded-md border border-border px-2 py-1 text-sm hover:border-primary/40"
      >
        ⚙
      </button>
    </header>
  )
}
