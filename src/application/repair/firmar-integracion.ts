import { defensasQueToca } from '@domain/repair/firma-limite'
import type { PolicyEvaluation } from '@domain/repair/auto-merge-policy'
import type { AppContext } from '../context'
import { applyAutoMerge } from './apply-auto-merge'
import { decisionBase, gatherCase } from './auto-merge-gather'
import type { AutoMergeDeps, AutoMergeInput, AutoMergeResult } from './auto-merge-types'

/** Lo que se asienta en lugar de la evaluacion de politica: quien autorizo. */
const FIRMA: PolicyEvaluation = {
  allowed: true,
  reason: 'firma humana',
  conditionFailed: null
}

/**
 * La puerta al repo: el operador integra una propuesta que OMEGA ya aprobo.
 *
 * La doctrina siempre dijo que la firma humana era la unica via de integracion,
 * pero en el codigo no existia: solo habia una politica que integraba sola
 * cuando el cerco lo permitia. Dieciseis propuestas aprobadas llevaban dias
 * esperando una puerta que nadie habia construido.
 *
 * NO pasa por el cerco, a proposito. Ese cerco decide "si se integra SIN firma";
 * con firma delante, sus cuatro condiciones ya no preguntan nada. Sujetarla a el
 * dejaria fuera a cualquier proyecto que no declare auto-merge, que es donde
 * TODO es firma manual por definicion.
 *
 * Lo unico que no alcanza son los archivos que gobiernan la autonomia. Ver
 * `defensasQueToca`: ahi el limite no depende de la atencion de quien firma.
 */
export async function firmarIntegracion(
  ctx: AppContext,
  deps: AutoMergeDeps,
  input: AutoMergeInput
): Promise<AutoMergeResult> {
  const reunido = await gatherCase(ctx, input.proposalId)
  if (!reunido.ok) return { applied: false, reason: reunido.reason, denial: null }

  const caso = reunido.caso
  // El estado OMEGA ya implica aprobado —un veto cierra en RECHAZADO—, pero el
  // veredicto se comprueba igual: firmar es la accion mas cara del sistema y no
  // se apoya en una implicacion, se apoya en el dato.
  if (caso.state.omega.veredicto_global !== 'APROBADO') {
    return { applied: false, reason: 'omega-no-aprobo', denial: null }
  }

  const defensas = defensasQueToca(caso.state.files)
  if (defensas.length > 0) {
    return { applied: false, reason: `toca-defensas: ${defensas.join(', ')}`, denial: null }
  }

  // El asiento lo escribe applyAutoMerge con el resultado real: anotarlo aqui
  // ademas dejaria dos decisiones en el libro para una sola integracion.
  return applyAutoMerge(ctx, deps, caso, FIRMA, decisionBase(caso))
}
