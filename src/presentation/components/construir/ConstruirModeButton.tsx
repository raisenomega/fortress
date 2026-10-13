import { useRef, useState } from 'react'
import { Icon } from '../common/Icon'
import { useConstruirStore } from '../../stores/construir-store'
import { ConstruirModeMenu } from './ConstruirModeMenu'

const LABEL = { plan: 'Plan', investigacion: 'Investigacion', ejecutor: 'Ejecutor' } as const

/** Flecha (solo icono, amarillo, fondo transparente) que abre y fija el modo. */
export function ConstruirModeButton(): React.JSX.Element {
  const [menu, setMenu] = useState(false)
  const flecha = useRef<HTMLButtonElement>(null)
  const mode = useConstruirStore((s) => s.mode)
  const setMode = useConstruirStore((s) => s.setMode)
  const cerrar = (): void => {
    setMenu(false)
    flecha.current?.focus()
  }

  return (
    <div
      className="relative flex items-center gap-1"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setMenu(false)
      }}
    >
      <span className="text-[11px] text-muted-foreground">{LABEL[mode]}</span>
      <button
        ref={flecha}
        type="button"
        onClick={() => setMenu((v) => !v)}
        title="Elegir modo"
        aria-label="Elegir modo"
        aria-haspopup="menu"
        aria-expanded={menu}
        className="tap bg-transparent p-1 text-primary hover:text-primary-hover"
      >
        <Icon name="arrow-up" size={18} />
      </button>
      {menu ? (
        <ConstruirModeMenu
          current={mode}
          onClose={cerrar}
          onPick={(m) => {
            setMode(m)
            cerrar()
          }}
        />
      ) : null}
    </div>
  )
}
