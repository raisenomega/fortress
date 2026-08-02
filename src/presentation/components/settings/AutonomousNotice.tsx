import { X } from 'lucide-react'
import { PROTECTED_AREAS } from '@domain/settings/operation-mode'
import { useSettingsStore } from '../../stores/settings-store'
import { useUiStore } from '../../stores/ui-store'
import { Icon } from '../common/Icon'

/**
 * En autonomo el agente aplica cambios sin pedir permiso, y la regla que lo
 * acota tiene que estar a la vista la primera vez. Una vez leida se puede
 * cerrar: dejarla fija todo el rato la convierte en ruido que ya nadie mira.
 *
 * Vuelve a aparecer cada vez que se activa el modo, porque entonces vuelve a
 * ser una advertencia y no un recordatorio.
 */
export function AutonomousNotice(): React.JSX.Element | null {
  const mode = useSettingsStore((state) => state.mode)
  const hidden = useUiStore((state) => state.autonomousNoticeHidden)
  const hide = useUiStore((state) => state.hideAutonomousNotice)

  if (mode !== 'autonomo' || hidden) return null

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-medium/30 bg-medium/10 px-4 py-1.5">
      <Icon name="zap" size={13} className="shrink-0 text-medium" />
      <p className="flex-1 text-[11px] text-foreground">
        Modo autonomo: los cambios se aplican sin confirmacion. Toda peticion que mencione{' '}
        <span className="font-semibold">{PROTECTED_AREAS.join(', ')}</span> vuelve a supervisado
        automaticamente.
      </p>
      <button
        type="button"
        onClick={hide}
        aria-label="Cerrar el aviso"
        title="Cerrar. Volvera a salir la proxima vez que actives el modo autonomo"
        className="tap shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X size={13} aria-hidden />
      </button>
    </div>
  )
}
