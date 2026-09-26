import type { DesenlaceEnLote } from './desenlace-del-lote'
import type { Negativa, PuertaDelEnvio } from './envio-negado'
import { porQueNoCerraron, type SinCierre } from './motivo-sin-cierre'

const GRUPOS: ReadonlyArray<readonly [DesenlaceEnLote, string]> = [
  ['extinguido', 'a Historia'],
  ['sigue_vivo', 'siguen activos'],
  ['sin_prueba', 'sin prueba'],
  ['pendiente', 'pendientes de verificar'],
  ['no_cerro', 'no cerraron (degradaron, revirtieron o sin cambios)']
]

/** Como se nombra cada puerta a quien lee el hilo. Tabla exhaustiva: una puerta
 *  nueva no compila hasta que alguien decida como se le llama. */
const PUERTA: Record<PuertaDelEnvio, string> = {
  barrera: 'la barrera del proyecto',
  'plan-sin-aprobar': 'el plan sin aprobar',
  carril: 'la guarda del carril'
}

/**
 * El parte del lote para el Terminal: cuantos se lanzaron y como quedo cada
 * grupo. Es el UNICO rastro del lote que se persiste en el hilo, asi que lo que
 * no diga aqui no lo dira nadie despues de cerrar la app.
 *
 * Por eso lleva la NEGATIVA. Un envio que una puerta paro no es un hallazgo que
 * «no cerro»: no hubo turno. Contarlo ahi lo metia bajo «degradaron, revirtieron
 * o sin cambios», tres causas y ninguna la real. El negado no cuenta como
 * procesado, y SI como sin lanzar: tampoco el se lanzo.
 */
export function resumenDelLote(
  desenlaces: readonly DesenlaceEnLote[],
  total: number,
  motivos: readonly SinCierre[] = [],
  /** Cuantos se quedaron escritos sin que nadie compilara el proyecto (ADR-091). */
  sinVerificar = 0,
  negativa: Negativa | null = null
): string {
  const cuenta = (d: DesenlaceEnLote): number => desenlaces.filter((x) => x === d).length
  const grupos = GRUPOS.map(([d, etiqueta]) => `${cuenta(d)} ${etiqueta}`).join(', ')
  const omitidos = cuenta('omitido')
  const lanzados = desenlaces.length - cuenta('negado')
  const sinLanzar = total - lanzados
  return [
    `Lote: ${lanzados - omitidos} de ${total} procesados — ${grupos}.`,
    porQueNoCerraron(motivos),
    sinVerificar > 0 ? textoSinVerificar(sinVerificar) : '',
    omitidos > 0 ? `${omitidos} omitidos: ya no pedian trabajo.` : '',
    negativa === null ? '' : textoDeLaNegativa(negativa),
    sinLanzar > 0 ? `Cortado: ${sinLanzar} sin lanzar.` : ''
  ]
    .filter((linea) => linea !== '')
    .join(' ')
}

const textoDeLaNegativa = (n: Negativa): string =>
  `NEGADO por ${PUERTA[n.puerta]}, antes de empezar el turno: ${n.motivo}`

/** Lo que el operador lee del lote cuando algo se conservo sin compilarse. No
 *  se esconde en una nota al pie: va en el parte, junto a las cuentas. */
function textoSinVerificar(n: number): string {
  const plural = n > 1 ? 's' : ''
  return `OJO: ${n} se quedo${plural} escrito${plural} SIN comprobar que el proyecto compila (faltaba la herramienta o el script). Revisalo${plural} tu.` // prettier-ignore
}
