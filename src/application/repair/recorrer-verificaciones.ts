import { sumarDesenlace, sumarOmision } from '@domain/repair/casilla-de-verificacion'
// prettier-ignore
import { NADA_VERIFICADO, type FinDeVerificacion, type RepartoDeVerificacion, type ResultadoVerificacionMasiva } from '@domain/repair/verificacion-masiva'
import type { AppContext } from '../context'
import { intentarVerificar } from './intento-de-verificacion'
import { motivoDeLaOmision } from './motivo-de-la-omision'

export interface VerificacionMasivaDeps {
  /** El operador dijo basta. Es el UNICO freno de este bucle. */
  readonly cancelado: () => boolean
  /** Golpecito tras cada hallazgo atendido: la tabla se relee y el pie suma el
   *  gasto. Inyectado —no importado— porque avisar es I/O y esto es aplicacion. */
  readonly avisar: () => void
}

/**
 * Recorre UNA LISTA DE IDS verificandolos uno detras de otro.
 *
 * La lista llega hecha y este bucle no pregunta de donde salio: pueden ser todos
 * los mitigados del proyecto o las seis filas que el operador marco a mano. Esa
 * indiferencia es el punto — separar «que lista» de «recorrerla» es lo que dejo
 * que la seleccion manual reusara el motor entero sin tocarle una linea.
 *
 * LA LISTA ES FIJA. El drenaje re-pregunta cada vuelta porque el mundo excluye
 * solo a los que ya trabajo; aqui un `sin_prueba` sigue MITIGADO despues de
 * verificarse, asi que re-preguntar elegiria el mismo para siempre. Se recorre
 * lo que se recibio, como `recorrerParadas` recorre las paradas del manifiesto.
 *
 * DENTRO SOLO MANDA `cancelado()`. Ni tope de gasto, ni tope diario, ni maximo
 * de vueltas: el tope del dia ya se cobro en la puerta —una vez, en el handler,
 * como el escaneo— y el compromiso es con los N de la lista.
 */
export async function recorrerVerificaciones(
  context: AppContext,
  projectId: string,
  ids: readonly string[],
  deps: VerificacionMasivaDeps
): Promise<ResultadoVerificacionMasiva> {
  // El grafo de imports se cachea POR CORRIDA: se vacia aqui, una vez, para no
  // arrastrar un arbol viejo entre corridas ni reconstruirlo por hallazgo.
  context.rutaDelControl.olvidar()
  let reparto: RepartoDeVerificacion = NADA_VERIFICADO
  const fin = (f: FinDeVerificacion, detalle?: string): ResultadoVerificacionMasiva =>
    detalle === undefined
      ? { fin: f, total: ids.length, ...reparto }
      : { fin: f, total: ids.length, ...reparto, detalle }

  for (const id of ids) {
    if (deps.cancelado()) return fin('detenido')

    const intento = await intentarVerificar(context, projectId, id)
    if (!intento.ok) {
      // Antes de llamarlo averia: parar mata al hijo, y el hijo muriendo se
      // parece a una maquina rota. Una parada humana es una parada. Sin esta
      // linea, Detener se reporta como fallo — el agujero que el escaneo tiene
      // y que este bucle no hereda.
      return deps.cancelado() ? fin('detenido') : fin('averia', intento.error)
    }

    // Contar ANTES de volver a mirar el boton: lo que ya esta escrito en la base
    // tiene que estar en el parte, o la cobertura declarada mentiria por abajo.
    reparto =
      intento.desenlace === null
        ? sumarOmision(reparto, motivoDeLaOmision(context, projectId, id))
        : sumarDesenlace(reparto, intento.desenlace)
    deps.avisar()
  }
  return fin('completado')
}
