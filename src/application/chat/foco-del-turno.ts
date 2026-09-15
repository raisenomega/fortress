import type { HallazgoAResolver } from '@domain/chat/hallazgo-a-resolver'
import { tipoDeLaIdentidad } from '@domain/project/finding-identity'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { vivo } from '../repair/elegir-objetivo'

const NO_EXISTE = 'Ese hallazgo no existe en este proyecto: vuelve al Escaneo y elige otro.'
const NO_VIVO =
  'Ese hallazgo ya no esta vivo —descartado, mitigado o cerrado— y no hay nada que resolver.'

/**
 * El hallazgo que el operador mando a resolver, RELEIDO de la base (ADR-088,
 * pieza 2). Del renderer solo se acepta el id, como en `elegirParaVerificar`: lo
 * demas, y si sigue vivo, lo dice la base. Buscarlo en la lista DE ESTE proyecto
 * es lo que impide resolver con un id de otro.
 *
 * Vivo es la misma condicion que usa la cola (`vivo`: ACTIVE y abierto), que es
 * la misma fila en la que aparece el boton: dos cuentas de lo mismo divergen.
 *
 * Sin foco devuelve null y el turno es el de siempre.
 */
export function leerFoco(
  context: AppContext,
  projectId: string,
  findingId: string | undefined
): Result<HallazgoAResolver | null> {
  if (findingId === undefined) return ok(null)

  const memoria = context.findings.listMemory(projectId).find((f) => f.id === findingId)
  if (memoria === undefined) return err(NO_EXISTE)
  if (!vivo(memoria)) return err(NO_VIVO)

  // Las notas viven en la otra vista de la fila; la memoria no las lleva.
  const fila = context.findings.listByProject(projectId).find((f) => f.id === findingId)
  return ok({
    id: memoria.id,
    severity: memoria.severity,
    title: memoria.title,
    file: memoria.file,
    line: memoria.line,
    tipo: tipoDeLaIdentidad(memoria.identity),
    simbolo: memoria.simbolo,
    mitigatedNote: fila?.mitigatedNote ?? null,
    verificacionNote: fila?.verificacionNote ?? null
  })
}
