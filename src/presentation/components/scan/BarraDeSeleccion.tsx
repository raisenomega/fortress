import { Icon } from '../common/Icon'
import { fraseDeSeleccion } from './frase-de-seleccion'

interface BarraDeSeleccionProps {
  readonly seleccionados: number
  readonly visiblesSeleccionados: number
  readonly verificando: boolean
  readonly onVerificar: () => void
  readonly onLimpiar: () => void
}

const BOTON = 'tap rounded-md px-2.5 py-1 text-[11px] font-semibold'

/**
 * La barra de la seleccion. Aparece solo cuando hay algo elegido y va PEGADA
 * arriba: la tabla pasa de las quinientas filas, y una accion que vive en la
 * cabecera queda fuera de pantalla justo cuando se acaba de seleccionar.
 *
 * Es la segunda puerta a verificar, y a proposito no es la misma que la de la
 * cabecera: aquella verifica TODOS los mitigados y esta los que elegiste. Un
 * unico boton que cambiara de significado obligaria a leerlo antes de cada clic
 * para saber cuanto va a gastar.
 */
export function BarraDeSeleccion(props: BarraDeSeleccionProps): React.JSX.Element {
  const { seleccionados, visiblesSeleccionados, verificando, onVerificar, onLimpiar } = props

  return (
    <div className="border-border bg-secondary/60 sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-md border px-3 py-1.5 backdrop-blur">
      <span className="text-foreground text-xs">
        {fraseDeSeleccion(seleccionados, visiblesSeleccionados)}
      </span>
      <button
        type="button"
        onClick={onVerificar}
        disabled={verificando}
        title="Un analista comprueba, uno a uno, si el problema sigue en el codigo"
        className={`${BOTON} bg-primary text-background flex items-center gap-1.5 hover:brightness-110 disabled:opacity-50`}
      >
        <Icon name="check-check" size={12} />
        Verificar {seleccionados}
      </button>
      <button
        type="button"
        onClick={onLimpiar}
        className={`${BOTON} text-muted-foreground hover:text-foreground`}
      >
        Limpiar
      </button>
    </div>
  )
}
