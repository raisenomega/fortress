interface CajitaDeSeleccionProps {
  readonly marcada: boolean
  /** Ni marcada ni vacia: algunas de las que representa lo estan y otras no. La
   *  cabecera la usa; una fila nunca — una fila solo esta o no esta. */
  readonly aMedias?: boolean
  readonly titulo: string
  readonly onToggle: () => void
}

/**
 * La cajita de una fila. Solo se pinta donde la accion APLICA —hoy, en los
 * mitigados— y esa ausencia es informacion: en un chip sin filas verificables no
 * aparece ninguna, y el operador lo ve sin gastar un clic.
 *
 * Es la regla que este tablero ya se puso para el boton de confirmar: «ofrecer
 * un clic que el proceso principal va a rechazar es peor que no ofrecerlo».
 *
 * No es el mecanismo principal de navegacion: el chip acota primero y esto
 * afina dentro. Por eso vive en una columna estrecha y callada, y no manda.
 */
export function CajitaDeSeleccion({
  marcada,
  aMedias = false,
  titulo,
  onToggle
}: CajitaDeSeleccionProps): React.JSX.Element {
  return (
    <input
      type="checkbox"
      checked={marcada}
      // `indeterminate` no es un atributo del HTML: solo existe en la propiedad
      // del nodo, asi que React no lo pinta y hay que ponerlo por ref.
      ref={(nodo) => {
        if (nodo) nodo.indeterminate = aMedias && !marcada
      }}
      onChange={onToggle}
      aria-label={titulo}
      title={titulo}
      className="tap accent-primary cursor-pointer"
    />
  )
}
