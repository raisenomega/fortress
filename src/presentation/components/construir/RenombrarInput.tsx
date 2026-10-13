import { useState } from 'react'

interface RenombrarInputProps {
  readonly inicial: string
  readonly onAceptar: (valor: string) => void
  readonly onCancelar: () => void
  /** Nombre accesible del campo; arranca relleno, asi que el placeholder no basta. */
  readonly etiqueta?: string
}

/** Input inline de renombrar (hilo o carpeta): Enter acepta, Escape o clic
 *  fuera cancela — el mismo molde del crear-carpeta de la cabecera. */
export function RenombrarInput(props: RenombrarInputProps): React.JSX.Element {
  const { inicial, onAceptar, onCancelar, etiqueta = 'Nuevo nombre' } = props
  const [valor, setValor] = useState(inicial)
  const aceptar = (): void => {
    if (valor.trim() !== '') onAceptar(valor)
    else onCancelar()
  }
  return (
    <input
      autoFocus
      aria-label={etiqueta}
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') aceptar()
        if (e.key === 'Escape') onCancelar()
      }}
      onBlur={onCancelar}
      className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
    />
  )
}
