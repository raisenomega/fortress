import { identity } from '../cognition/pattern-id'
import type { DetectedFinding } from '../scan/detected-finding'

/**
 * Clave ESTABLE de un hallazgo entre escaneos: es la fila que le corresponde en
 * la base, escaneo tras escaneo.
 *
 * Usa la MISMA regla que le da su id de patron en COGNITION (`ef0479c`) —
 * severidad + archivo + titulo, sin la linea— para que la fila de la base y el
 * PTN del log no puedan divergir. Si divergieran, el registro diria una cosa y
 * la base otra sobre el mismo problema.
 *
 * NO sustituye a `fingerprintOf`, que SI lleva la linea y gobierna los
 * descartes del operador. Alli conviene fallar del lado estricto: un descarte
 * no debe heredarse a otro problema distinto de la misma zona del archivo.
 * Aqui conviene lo contrario: la linea se mueve al editar y el hallazgo sigue
 * siendo el mismo, asi que meterla partiria su historia en cada commit.
 */
export function findingIdentity(finding: DetectedFinding): string {
  return identity(finding)
}
