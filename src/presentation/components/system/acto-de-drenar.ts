/** Lo que hace el boton al pulsarlo, decidido antes de tocar nada. */
export type ActoDeDrenar = 'parar' | 'nada-que-drenar' | 'preguntar'

/** Los cuatro parrafos de la confirmacion, en el orden en que se leen. */
export interface AvisosDelDrenaje {
  readonly trabajo: string
  readonly topes: string
  readonly garantia: string
  readonly orden: string
}

export interface TopesDelDrenaje {
  readonly elegibles: number
  readonly costCapUsd: string
  readonly maxVueltas: string
}

/**
 * Drenando, el boton para —y parar no depende de cuantos queden—. Parado, si no
 * hay elegibles no se arranca una corrida que no tiene a quien atender: se dice.
 * Y si los hay, se pregunta: el gasto se autoriza, no se dispara con un clic.
 */
export function actoDeDrenar(drenando: boolean, elegibles: number): ActoDeDrenar {
  if (drenando) return 'parar'
  return elegibles === 0 ? 'nada-que-drenar' : 'preguntar'
}

/**
 * Lo que el operador tiene que saber ANTES de autorizar: cuanto trabajo, cuanto
 * puede costar, que nada se integra a sus espaldas, y en que orden hacerlo.
 *
 * Vive aparte del componente para poder probarse, y el componente lo consume:
 * asi el texto que se prueba es el que se pinta, no una copia que se desincroniza.
 */
export function avisosDelDrenaje({
  elegibles,
  costCapUsd,
  maxVueltas
}: TopesDelDrenaje): AvisosDelDrenaje {
  const plural = elegibles === 1 ? '' : 's'
  return {
    trabajo:
      `El motor trabajara hasta ${elegibles} hallazgo${plural}: analiza, genera el fix en un ` +
      'worktree aislado, lo compila y deja que el revisor lo juzgue.',
    topes:
      `Para en el tope de ${costCapUsd} o ${maxVueltas} vueltas, lo que llegue antes. Cada ` +
      'hallazgo cuesta varios minutos y del orden de un millon y medio de tokens.',
    garantia: 'Nada se integra sin tu firma: el drenaje para antes del merge.',
    orden:
      'Lo ordenado es drenar, parar y firmar. Firmar a mitad mueve el HEAD, y las propuestas ' +
      'en vuelo quedan ancladas a la base anterior: si su merge choca, caducan sin reintento.'
  }
}
