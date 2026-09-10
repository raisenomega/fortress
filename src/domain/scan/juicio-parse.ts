import { esModuloAuditoria } from './modulo-auditoria'
// prettier-ignore
import { APLICA_VALORES, type Aplica, type VeredictoAplicabilidad } from './veredicto-de-aplicabilidad'

const BLOQUE = /APLICA:\s*(\[[\s\S]*?\])\s*:END-APLICA/

const esAplica = (valor: unknown): valor is Aplica =>
  typeof valor === 'string' && (APLICA_VALORES as readonly string[]).includes(valor)

function comoVeredicto(crudo: unknown): VeredictoAplicabilidad | null {
  if (typeof crudo !== 'object' || crudo === null) return null

  const { modulo, aplica, porque } = crudo as Record<string, unknown>
  if (!esModuloAuditoria(modulo) || !esAplica(aplica)) return null
  return { modulo, aplica, porque: typeof porque === 'string' ? porque : '' }
}

/**
 * Extrae los veredictos del bloque `APLICA:[...]:END-APLICA`.
 *
 * Molde `parseOmegaResponse`, con UNA diferencia deliberada: alli un campo con
 * valor desconocido invalida todo, porque los seis ejes son UN juicio y medio
 * juicio no es ninguno. Aqui cada entrada es un juicio independiente sobre un
 * modulo distinto, asi que se caen de una en una —como las plantillas rotas de
 * la Fase 2—: que M3 llegue ilegible no puede tumbar el veredicto de M8.
 *
 * Sin bloque, lista vacia: no hay juicio, y los modulos vuelven a «no consta»
 * por la cascada. Un fallo de formato jamas afirma ni niega nada.
 */
export function parseJuicio(salida: string): readonly VeredictoAplicabilidad[] {
  const match = BLOQUE.exec(salida)
  if (match === null) return []

  let crudos: unknown
  try {
    crudos = JSON.parse(match[1])
  } catch {
    return []
  }
  if (!Array.isArray(crudos)) return []

  return crudos.map(comoVeredicto).filter((v): v is VeredictoAplicabilidad => v !== null)
}
