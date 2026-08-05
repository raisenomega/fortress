import { useState } from 'react'
import { Icon } from '../common/Icon'
import { useConstruirStore } from '../../stores/construir-store'
import { ConstruirModeMenu } from './ConstruirModeMenu'

const LABEL = { plan: 'Plan', investigacion: 'Investigacion', ejecutor: 'Ejecutor' } as const

/** Flecha (solo icono, amarillo, fondo transparente) que abre y fija el modo. */
export function ConstruirModeButton(): React.JSX.Element {
  const [menu, setMenu] = useState(false)
  const mode = useConstruirStore((s) => s.mode)
  const setMode = useConstruirStore((s) => s.setMode)

  return (
    <div className="relative flex items-center gap-1">
      <span className="text-[11px] text-muted-foreground">{LABEL[mode]}</span>
      <button
        type="button"
        onClick={() => setMenu((v) => !v)}
        title="Elegir modo"
        className="tap bg-transparent p-1 text-primary hover:text-primary-hover"
      >
        <Icon name="arrow-up" size={18} />
      </button>
      {menu ? (
        <ConstruirModeMenu
          current={mode}
          onPick={(m) => {
            setMode(m)
            setMenu(false)
          }}
        />
      ) : null}
    </div>
  )
}
