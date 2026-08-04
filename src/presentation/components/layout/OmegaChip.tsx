import { Eye } from 'lucide-react'
import { useUiStore } from '../../stores/ui-store'

/** Chip dorado de acceso al superdashboard de OMEGA, junto a Rendimiento. */
export function OmegaChip(): React.JSX.Element {
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)

  return (
    <button
      type="button"
      onClick={() => setView('omega')}
      aria-pressed={view === 'omega'}
      data-nav="Omega"
      title="SENTINEL OMEGA — el superdashboard del meta-auditor"
      className={`tap flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        view === 'omega'
          ? 'border-primary bg-primary/20 text-primary'
          : 'border-primary/50 text-primary hover:bg-primary/10'
      }`}
    >
      <Eye size={13} aria-hidden />
      OMEGA
    </button>
  )
}
