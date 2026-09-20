/**
 * Que se pinta al pie del plan del lote. Cinco estados y ninguno solapa.
 *
 * Vive en el dominio y no dentro del componente para que la regla que importa
 * —EN AUTONOMO NUNCA SALE EL BOTON— se pueda probar sin montar React. Un `if`
 * escondido en el JSX se prueba pintando; una funcion se prueba preguntando.
 */
export type PieDelLote = 'ejecutando' | 'lote-en-curso' | 'boton' | 'sin-aprobar' | 'nada'

export interface EstadoDelPie {
  /** La cola ya arranco: el plan dejo de estar en el punto de parada. */
  readonly enCurso: boolean
  /** Hay un lote de ESTE proyecto que ya tiene plan escrito y espera. */
  readonly planeado: boolean
  /** El proyecto corre solo. Sale del ajuste, NO del mensaje ni de este pie. */
  readonly autonomo: boolean
}

/**
 * El pie del plan (ADR-088 arco 1, ADR-097 §3).
 *
 * `boton` SOLO en supervisado, y es el punto entero de esta funcion. En autonomo
 * el aprobador es OMEGA: si aprobo, la ejecucion arranco sola y aqui se ve
 * `ejecutando`; si el lote sigue esperando con plan escrito es que NO aprobo, y
 * entonces lo que toca es decirlo (`sin-aprobar`) en vez de ofrecer un clic que
 * la puerta del main va a rechazar.
 *
 * Esto NO es la guarda. Ocultar el boton no impide ejecutar —eso lo impide
 * `guardPlanAprobado`, abajo, donde no se puede esquivar—. Aqui solo se decide
 * que se OFRECE, y ofrecer lo imposible es la trampa que este estado quita.
 *
 * Por OBJETO y no por tres booleanos sueltos: tres posicionales del mismo tipo
 * se intercambian sin que el compilador diga nada.
 */
export function pieDelLote(e: EstadoDelPie): PieDelLote {
  if (e.enCurso) return e.autonomo ? 'lote-en-curso' : 'ejecutando'
  if (!e.planeado) return 'nada'
  return e.autonomo ? 'sin-aprobar' : 'boton'
}

/**
 * «Lote 2 de 3»: el que corre AHORA, no los terminados. `hechos` cuenta los
 * cerrados, asi que el vivo es el siguiente; al acabar el ultimo se queda en el
 * total en vez de anunciar un cuarto que no existe.
 *
 * Es el ANCLA del pie en autonomo: mientras el lote corra esto siempre tiene
 * algo que decir. La fase se le pega como sufijo y desaparece en el hueco entre
 * turnos —el medidor se apaga en el `finally` de CADA envio—, y sin este ancla
 * el pie se quedaria en blanco justo entre hallazgo y hallazgo.
 */
export function etiquetaDelLote(hechos: number, total: number): string {
  return `Lote ${Math.min(hechos + 1, total)} de ${total}`
}
