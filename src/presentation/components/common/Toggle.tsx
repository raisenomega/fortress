interface ToggleProps {
  readonly checked: boolean
  readonly onChange: () => void
  /** Etiqueta accesible: el control es solo un switch visual. */
  readonly label: string
}

/**
 * Geometria de la pista, en pixeles. Sale justa por diseno:
 * margen + circulo + recorrido + margen = 2 + 16 + 16 + 2 = 36 = w-9.
 * Si se cambia uno hay que recalcular los demas.
 */
export function Toggle({ checked, onChange, label }: ToggleProps): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`tap relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      {/*
        `left-0.5` es imprescindible: sin el, el circulo cae en su posicion
        estatica (que aqui daba 20px) y se salia de la pista al encenderse.
        Con left fijo, el recorrido es solo el translate.

        Knob siempre claro: la pista es la que indica el estado. Un knob oscuro
        sobre dorado se confunde con el fondo negro de la app.
      */}
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-foreground shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
