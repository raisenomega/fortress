import { useProjectStore } from '../../stores/project-store'
import { useSettingsStore } from '../../stores/settings-store'

export function StatusBar(): React.JSX.Element {
  const projectCount = useProjectStore((state) => state.projects.length)
  const hasApiKey = useSettingsStore((state) => state.hasApiKey)
  const mode = useSettingsStore((state) => state.mode)

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-sidebar px-4 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${hasApiKey ? 'bg-success' : 'bg-critical'}`}
          aria-hidden
        />
        Claude API {hasApiKey ? 'conectada' : 'sin configurar'}
      </span>
      <span>{projectCount} proyectos</span>
      <span className="ml-auto capitalize">Modo {mode}</span>
    </footer>
  )
}
