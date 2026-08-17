import { CheckCircle } from 'lucide-react'
import { useEffect } from 'react'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { api } from '../../adapters/fortress-api'
import { useUiStore } from '../../stores/ui-store'

/**
 * Mantiene la maquina despierta mientras los agentes trabajan. Verde = activo,
 * gris = apagado. Va junto a la flecha de reinicio en el header.
 *
 * Lo que el operador eligio se guarda en el main y se relee al montar: el boton
 * pinta lo que de verdad esta pedido, no lo que este arranque supone.
 */
export function KeepAwakeToggle(): React.JSX.Element {
  const on = useUiStore((state) => state.keepAwake)
  const setKeepAwake = useUiStore((state) => state.setKeepAwake)

  useEffect(() => {
    void api()
      .settings.get(SETTINGS_KEYS.keepAwake)
      .then((guardado) => setKeepAwake(guardado === 'true'))
  }, [setKeepAwake])

  const toggle = (): void => {
    const next = !on
    setKeepAwake(next)
    void api().maintenance.keepAwake(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={
        on
          ? 'Pantalla siempre encendida (los agentes trabajan sin que se apague). Click para soltar.'
          : 'Pantalla puede apagarse. Click para mantenerla encendida mientras los agentes trabajan.'
      }
      className={`tap shrink-0 rounded-md border p-1.5 ${
        on
          ? 'border-success/50 text-success'
          : 'border-border text-muted-foreground hover:text-foreground'
      }`}
    >
      <CheckCircle size={15} aria-hidden />
    </button>
  )
}
