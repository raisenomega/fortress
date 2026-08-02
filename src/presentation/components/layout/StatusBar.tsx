import { LEVEL_COLOR, LEVEL_ICON, LEVEL_LABEL } from '@domain/health/health-check'
import { useHealthStore } from '../../stores/health-store'
import { useProjectStore } from '../../stores/project-store'
import { useSettingsStore } from '../../stores/settings-store'
import { Icon } from '../common/Icon'

export function StatusBar(): React.JSX.Element {
  const projectCount = useProjectStore((state) => state.projects.length)
  const mode = useSettingsStore((state) => state.mode)
  const report = useHealthStore((state) => state.report)
  const running = useHealthStore((state) => state.running)
  const setPanelOpen = useHealthStore((state) => state.setPanelOpen)

  const level = report?.level ?? 'warning'
  const label = running ? 'Comprobando...' : report ? LEVEL_LABEL[level] : 'Sin diagnosticar'

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-sidebar px-4 text-[11px] text-muted-foreground">
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        title="Ver el diagnostico del sistema"
        className="tap flex items-center gap-1.5 rounded px-1 hover:text-foreground"
      >
        <Icon
          name={report ? LEVEL_ICON[level] : 'circle'}
          size={12}
          className={report ? LEVEL_COLOR[level] : undefined}
        />
        <span>{label}</span>
      </button>

      <span>{projectCount} proyectos</span>
      <span className="ml-auto capitalize">Modo {mode}</span>
    </footer>
  )
}
