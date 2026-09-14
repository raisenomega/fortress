interface ChipDeFiltroProps {
  readonly activo: boolean
  readonly cuenta: number
  readonly titulo: string
  readonly onClick: () => void
  readonly children: React.ReactNode
}

const BASE =
  'tap flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors'
const ACTIVO = 'border-primary bg-primary/15 text-foreground'
const INACTIVO = 'border-border text-muted-foreground hover:border-primary/50'

/**
 * Un chip del tablero: etiqueta, su cuenta, y si esta puesto. Es un `button` y
 * no el `Chip` de `common`, que es un `span` decorativo con otros tres tonos —
 * envolverlo habria metido un clic dentro de algo que no lo espera.
 *
 * La cuenta se pinta SIEMPRE, tambien en cero, y es deliberado: «HIGH 0» dice
 * que ahi no hay nada, y esconder el chip obligaria a recordar cuales existen.
 * Un chip vacio se deshabilita —pulsarlo dejaria la tabla en blanco sin que el
 * numero hubiera avisado de nada.
 */
export function ChipDeFiltro(props: ChipDeFiltroProps): React.JSX.Element {
  const { activo, cuenta, titulo, onClick, children } = props

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cuenta === 0 && !activo}
      title={titulo}
      aria-pressed={activo}
      className={`${BASE} ${activo ? ACTIVO : INACTIVO} disabled:opacity-40`}
    >
      {children}
      <span className="font-mono">{cuenta}</span>
    </button>
  )
}
