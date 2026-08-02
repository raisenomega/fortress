import { PROTECTED_AREAS } from '@domain/settings/operation-mode'
import { useSettingsStore } from '../../stores/settings-store'

/**
 * En autonomo el agente aplica cambios sin pedir permiso. La regla que lo
 * acota debe estar a la vista, no escondida en un tooltip.
 */
export function AutonomousNotice(): React.JSX.Element | null {
  const mode = useSettingsStore((state) => state.mode)
  if (mode !== 'autonomo') return null

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-medium/30 bg-medium/10 px-4 py-1.5">
      <span aria-hidden>⚡</span>
      <p className="text-[11px] text-foreground">
        Modo autonomo: los cambios se aplican sin confirmacion. Toda peticion que mencione{' '}
        <span className="font-semibold">{PROTECTED_AREAS.join(', ')}</span> vuelve a supervisado
        automaticamente.
      </p>
    </div>
  )
}
