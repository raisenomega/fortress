import { sumarDesenlace } from '@domain/repair/casilla-de-verificacion'
// prettier-ignore
import { NADA_VERIFICADO, type FinDeVerificacion, type RepartoDeVerificacion, type ResultadoVerificacionMasiva } from '@domain/repair/verificacion-masiva'
import type { AppContext } from '../context'
import { mitigado } from './elegir-para-verificar'
import { intentarVerificar } from './intento-de-verificacion'

export interface VerificacionMasivaDeps {
  /** El operador dijo basta. Es el UNICO freno de este bucle. */
  readonly cancelado: () => boolean
  /** Golpecito tras cada mitigado atendido: la tabla se relee y el pie suma el
   *  gasto. Inyectado —no importado— porque avisar es I/O y esto es aplicacion. */
  readonly avisar: () => void
}

/**
 * Verifica TODOS los mitigados de un proyecto, uno detras de otro (ADR-087).
 *
 * LA LISTA ES FIJA, y esa es la diferencia de fondo con el drenaje. Aquel
 * re-pregunta cada vuelta porque el mundo excluye solo a los que ya trabajo: una
 * propuesta viva saca a su hallazgo de la seleccion y el pozo se vacia sin que
 * nadie lo administre. Aqui no: un `sin_prueba` sigue MITIGADO despues de
 * verificarse, asi que re-preguntar elegiria el mismo para siempre. Se toma la
 * lista UNA vez, como `recorrerParadas` toma las paradas del manifiesto.
 *
 * DENTRO DEL BUCLE SOLO MANDA `cancelado()`. Ni tope de gasto, ni tope diario,
 * ni maximo de vueltas: el tope del dia ya se cobro en la puerta —una vez, en el
 * handler, como el escaneo— y el compromiso es con los N mitigados. Es la
 * doctrina del escaneo (ADR-082, Enmienda 2) y no la del drenaje, que lleva
 * frenos duros porque puede correr sin nadie delante.
 */
export async function verificarTodos(
  context: AppContext,
  projectId: string,
  deps: VerificacionMasivaDeps
): Promise<ResultadoVerificacionMasiva> {
  const mitigados = context.findings.listMemory(projectId).filter(mitigado)
  let reparto: RepartoDeVerificacion = NADA_VERIFICADO
  const fin = (f: FinDeVerificacion, detalle?: string): ResultadoVerificacionMasiva =>
    detalle === undefined
      ? { fin: f, total: mitigados.length, ...reparto }
      : { fin: f, total: mitigados.length, ...reparto, detalle }

  for (const fila of mitigados) {
    if (deps.cancelado()) return fin('detenido')

    const intento = await intentarVerificar(context, projectId, fila.id)
    if (!intento.ok) {
      // Antes de llamarlo averia: parar mata al hijo, y el hijo muriendo se
      // parece a una maquina rota. Una parada humana es una parada. Sin esta
      // linea, Detener se reporta como fallo — el agujero que el escaneo tiene
      // y que este bucle no hereda.
      return deps.cancelado() ? fin('detenido') : fin('averia', intento.error)
    }

    // Contar ANTES de volver a mirar el boton: lo que ya esta escrito en la base
    // tiene que estar en el parte, o la cobertura declarada mentiria por abajo.
    reparto = sumarDesenlace(reparto, intento.desenlace)
    deps.avisar()
  }
  return fin('completado')
}
