import { QUE, type AlcanceDeLaVerificacion } from './alcance-de-la-verificacion'
/** Lo que hace el boton al pulsarlo, decidido antes de tocar nada. */
export type ActoDeVerificar = 'parar' | 'nada-que-verificar' | 'preguntar'

/** Los cuatro parrafos de la confirmacion, en el orden en que se leen. */
export interface AvisosDeLaVerificacion {
  readonly trabajo: string
  readonly coste: string
  readonly garantia: string
  readonly parada: string
}

/**
 * Lo que cuesta UNA verificacion, MEDIDO y no estimado: las tres primeras
 * corridas reales del 2026-09-12 costaron entre 2,20 y 2,46 dolares y tardaron
 * de seis a siete minutos cada una. Se redondea a la baja en tiempo y al alza en
 * dinero: de las dos cifras, la que sorprende mal es la del dinero.
 */
export const DOLARES_POR_VERIFICACION = 2.3
export const MINUTOS_POR_VERIFICACION = 6.5

/** «2h45m», o «45m» cuando no llega a la hora. */
export function duracionEstimada(mitigados: number): string {
  const minutos = Math.round(mitigados * MINUTOS_POR_VERIFICACION)
  const horas = Math.floor(minutos / 60)
  return horas === 0 ? `${minutos}m` : `${horas}h${String(minutos % 60).padStart(2, '0')}m`
}

export const costeEstimado = (mitigados: number): string =>
  `$${(mitigados * DOLARES_POR_VERIFICACION).toFixed(0)}`

/**
 * Verificando, el boton para —y parar no depende de cuantos queden—. Parado, si
 * no hay mitigados no se arranca un barrido sin a quien atender: se dice. Y si
 * los hay, se pregunta: el gasto se autoriza, no se dispara con un clic.
 */
export function actoDeVerificar(verificando: boolean, mitigados: number): ActoDeVerificar {
  if (verificando) return 'parar'
  return mitigados === 0 ? 'nada-que-verificar' : 'preguntar'
}

/**
 * Lo que el operador tiene que saber ANTES de autorizar. El parrafo del coste es
 * el importante: este gesto NO lleva techo de gasto —sigue la doctrina del
 * escaneo, que se compromete con el trabajo y no con un presupuesto— asi que
 * esta cifra es lo unico que hay entre el clic y la factura. Por eso las DOS
 * puertas pasan por aqui: una que no preguntara seria la unica sin barrera.
 *
 * Vive aparte del componente para poder probarse, y el componente lo consume:
 * asi el texto que se prueba es el que se pinta, no una copia que se desincroniza.
 */
export function avisosDeLaVerificacion(
  mitigados: number,
  alcance: AlcanceDeLaVerificacion = 'todos'
): AvisosDeLaVerificacion {
  const plural = mitigados === 1 ? '' : 's'
  return {
    trabajo:
      `Un analista leera el fichero de cada una de ${QUE[alcance](mitigados, plural)} y ` +
      'dictaminara si el problema sigue ahi. Solo lee: no propone ni cambia nada.',
    coste:
      `Unos ${costeEstimado(mitigados)} y unas ${duracionEstimada(mitigados)}, medido sobre ` +
      'corridas reales. NO hay tope de gasto: una vez arrancado, solo lo para Detener.',
    garantia:
      'Nada muere sin prueba: el que no se pueda comprobar se queda mitigado con la razon ' +
      'escrita, y el que siga vivo vuelve a la cola del motor.',
    parada:
      'Al parar, el que este en curso termina y queda escrito; el siguiente no arranca. Al ' +
      'cerrar se declara cuantos se verificaron de cuantos.'
  }
}
