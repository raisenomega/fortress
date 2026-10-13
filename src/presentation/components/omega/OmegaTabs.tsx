import type { IconName } from '@domain/shared/icon-name'
import type { OmegaMode } from '../../stores/omega-store'
import { Icon } from '../common/Icon'

const TABS: ReadonlyArray<{ mode: OmegaMode; iconName: IconName; label: string }> = [
  { mode: 'agentes', iconName: 'users', label: 'Agentes' },
  { mode: 'codigo', iconName: 'code', label: 'Codigo' },
  { mode: 'proyectos', iconName: 'folder-open', label: 'Proyectos' },
  { mode: 'config', iconName: 'settings', label: 'Configuracion' }
]

interface OmegaTabsProps {
  readonly active: OmegaMode
  readonly onSelect: (mode: OmegaMode) => void
}

/** Barra de pestañas del superdashboard (spec §header). Cambia el contexto activo. */
export function OmegaTabs({ active, onSelect }: OmegaTabsProps): React.JSX.Element {
  return (
    <nav aria-label="Contexto del superdashboard" className="flex flex-wrap gap-1">
      {TABS.map((tab) => (
        <button
          key={tab.mode}
          type="button"
          data-omega-tab={tab.mode}
          aria-pressed={active === tab.mode}
          onClick={() => onSelect(tab.mode)}
          className={`tap flex items-center gap-1.5 rounded border px-2 py-1 text-xs ${
            active === tab.mode
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name={tab.iconName} size={13} />
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
