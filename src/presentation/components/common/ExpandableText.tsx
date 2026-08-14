import { useState } from 'react'

/** Lo que cabe sin sepultar la fila. Pasado de ahi, el operador decide. */
const CORTE = 160

interface ExpandableTextProps {
  readonly text: string
  readonly className?: string
}

/**
 * Texto largo que se puede LEER ENTERO y COPIAR.
 *
 * Nacio para las razones del motor: un analisis llega a los mil caracteres y
 * viajaba en el atributo `title`, que no se selecciona, no respeta saltos de
 * linea, se va al mover el raton y lo recorta el gestor de ventanas a su gusto.
 *
 * Cuando hay mas de lo que se ve se dice CUANTO falta. Un corte silencioso hace
 * creer que el texto acaba donde acaba la linea, y esa es justo la parte que el
 * operador necesitaba para entender por que su propuesta murio.
 */
export function ExpandableText({ text, className }: ExpandableTextProps): React.JSX.Element | null {
  const [abierto, setAbierto] = useState(false)
  if (text === '') return null

  const oculto = text.length - CORTE
  const visible = abierto || oculto <= 0 ? text : text.slice(0, CORTE)

  return (
    <div className={className}>
      <p className="select-text break-words whitespace-pre-wrap">{visible}</p>
      {oculto > 0 ? (
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="text-muted-foreground hover:text-foreground text-[10px] underline"
        >
          {abierto ? 'ver menos' : `+${oculto} caracteres`}
        </button>
      ) : null}
    </div>
  )
}
