/**
 * La prueba que un OBSOLETO tiene que traer para que un hallazgo muera.
 *
 * Extinguir es tan irreversible como integrar, y hasta aqui solo una de las dos
 * tenia red: un fix pasa gate, revisor y firma; un cierre bastaba con la palabra
 * de un agente en el mismo turno. Un juicio equivocado cerro un hallazgo que
 * seguia vivo y otros dos casi.
 *
 * Pedir que CITE EL COMMIT que lo arreglo no vale: los dos casos dudosos citaron
 * uno real y exacto —titulo, fichero y numero de lineas— que solo habia anadido
 * un comentario mientras el agujero seguia en su sitio. Una cita puede ser
 * verdadera y no probar nada; y de donde saca el sha no le consta a nadie. Lo
 * que SI se comprueba es una cadena literal
 * contra el fichero de hoy: ahi no hay prosa que interpretar, o esta o no esta.
 */

/**
 * Las dos formas de probar que un defecto se fue, y son opuestas a proposito.
 *
 * `ausente` es la huella del defecto: el `execFile` crudo que se sustituyo, el
 * `unsafe-inline` que se retiro. Si sigue apareciendo, el defecto sigue.
 * `presente` es el control que lo tapa: `redactSecrets(stderr)`, la clausula que
 * la documentacion no tenia. Si no aparece, nadie lo arreglo.
 *
 * Hacen falta las dos porque no todo arreglo borra algo ni todo arreglo anade
 * algo, y obligar a una sola forma dejaria fuera la mitad de los cierres buenos.
 */
export type FormaDeEvidencia = 'ausente' | 'presente'

export interface Evidencia {
  /** Cadena LITERAL que se busca en el fichero del hallazgo. Sin regex: lo que
   *  se compara tiene que poder leerlo un humano en el Libro y repetirlo a mano. */
  readonly marcador: string
  readonly forma: FormaDeEvidencia
  /** Adorno del Libro: NO gobierna. Existe para que quien audite tenga por donde
   *  empezar, no para autorizar nada. La llave es el marcador. */
  readonly commit?: string
}

/** Si la prueba se sostiene, y por que. El motivo viaja al motivo de la
 *  extincion o a la nota del mitigado: las dos salidas necesitan decirlo. */
export interface Prueba {
  readonly probado: boolean
  readonly motivo: string
}

const no = (motivo: string): Prueba => ({ probado: false, motivo })

/**
 * Contrasta la evidencia contra el contenido del fichero HOY. Puro: recibe el
 * texto ya leido y decide, para que la regla se pruebe sin tocar disco.
 *
 * `contenido === null` NO es "el defecto ya no esta". El puerto devuelve null
 * por tres motivos que no distingue —no existe, la ruta se sale del proyecto, no
 * es un fichero regular— y la ruta la escribe un agente. Tratarlo como ausencia
 * convertiria una ruta torcida en permiso para borrar un hallazgo de seguridad.
 * Es la misma eleccion conservadora que `changedSince`: sin evidencia no se
 * cierra nada.
 *
 * LIMITE CONOCIDO: el marcador lo elige el agente, asi que un `presente` con una
 * cadena trivial se cumple solo. No se pone un umbral de longitud porque seria
 * un numero inventado; lo cierra exigir que el marcador estuviera en el fichero
 * cuando el hallazgo nacio, que necesita git y es su propia pieza.
 */
export function estaProbado(evidencia: Evidencia | undefined, contenido: string | null): Prueba {
  if (evidencia === undefined) return no('el analisis no trajo evidencia comprobable')
  const marcador = evidencia.marcador.trim()
  if (marcador === '') return no('la evidencia no dice que marcador comprobar')
  if (contenido === null) return no(`el fichero no se pudo leer para comprobar "${marcador}"`)

  const aparece = contenido.includes(marcador)
  const quiere = evidencia.forma === 'presente'
  if (aparece === quiere) return { probado: true, motivo: `"${marcador}" ${evidencia.forma}` }
  return no(`"${marcador}" deberia estar ${evidencia.forma} y no lo esta`)
}
