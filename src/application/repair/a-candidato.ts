import { tipoDeLaIdentidad } from '@domain/project/finding-identity'
import type { FindingMemory } from '@domain/project/finding-memory'
import type { Candidate } from '@domain/repair/select-target'

/**
 * Una fila de la memoria como candidato del motor. Las dos senas con las que el
 * analista reconoce el defecto —su CLASE y el bloque donde vive— salen de dos
 * sitios distintos desde ADR-084: el tipo sigue dentro de la clave, y el simbolo
 * se lee de su columna, porque dejo de ser clave sin dejar de ser dato.
 *
 * Vive aparte porque hay DOS caminos al analisis —la eleccion normal y el
 * reintento del operador— y el mismo hallazgo no puede llegar con dos formas
 * segun por donde se entre (ADR-059). Con la conversion suelta en cada llamante,
 * el tercero que aparezca olvidara una de las dos senas y el sintoma seria mudo.
 */
export const aCandidato = ({
  id, severity, title, file, line, firstSeen, identity, simbolo
}: FindingMemory): Candidate =>
  ({ id, severity, title, file, line, firstSeen, simbolo, tipo: tipoDeLaIdentidad(identity) }) // prettier-ignore
