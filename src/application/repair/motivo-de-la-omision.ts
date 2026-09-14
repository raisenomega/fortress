import type { MotivoDeOmision } from '@domain/repair/motivo-de-omision'
import type { AppContext } from '../context'
import { mitigado } from './elegir-para-verificar'

/**
 * POR QUE no se verifico uno. `elegirParaVerificar` devuelve `null` por dos
 * razones distintas y no dice cual: el hallazgo no esta mitigado, o lo esta pero
 * una propuesta viva lo tiene cogido. Para el camino de una en una daba igual
 * —el operador pulso en ESA fila y lee un aviso—, pero en un barrido el parte
 * tiene que repartir, y repartir exige saber.
 *
 * Se resuelve AQUI y no cambiando `elegirParaVerificar` a un tipo con motivo: esa
 * pieza la usan los dos caminos, y ensancharle la firma obligaria al otro a
 * cargar con un dato que no mira. Ademas esto solo corre cuando YA hubo un
 * `null`, que es el caso raro: el camino normal no paga nada.
 *
 * Ante la duda, `no-mitigado`. Es el motivo que no afirma nada sobre trabajo en
 * curso: decir «ya lo trabaja una propuesta» de un hallazgo que no encontramos
 * seria inventar un expediente.
 */
export function motivoDeLaOmision(
  context: AppContext,
  projectId: string,
  findingId: string
): MotivoDeOmision {
  const fila = context.findings.listMemory(projectId).find((f) => f.id === findingId)
  if (fila === undefined || !mitigado(fila)) return 'no-mitigado'

  const conPropuesta = context.repairProposals.findLiveFindingIds(projectId)
  return conPropuesta.includes(findingId) ? 'ya-trabajado' : 'no-mitigado'
}
