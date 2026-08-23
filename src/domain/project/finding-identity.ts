import type { DetectedFinding } from '../scan/detected-finding'

const normalize = (text: string): string => text.trim().replace(/\s+/g, ' ').toLowerCase()

/**
 * Clave ESTABLE de un hallazgo entre escaneos: es la fila que le corresponde en
 * la base, escaneo tras escaneo.
 *
 * Fichero, TIPO y SIMBOLO. Ninguno de los tres lo redacta el modelo: el tipo se
 * elige de una lista cerrada y el simbolo es el nombre de una funcion.
 *
 * Antes eran severidad, fichero y TITULO, y las dos primeras piezas resultaron
 * tan inestables como la tercera: el mismo agujero de `graph:verify` se reporto
 * cinco veces con cinco redacciones, dos severidades (LOW y MEDIUM) y tres
 * lineas (43, 49, 59). Cada corrida abria fila nueva.
 *
 * El simbolo no es adorno: sin el, `handleVerify` y `handleAb` —dos defectos
 * distintos, mismo fichero, mismo tipo— colapsarian en uno y el tablero
 * esconderia el segundo detras del primero.
 *
 * Ya NO comparte formula con el `patternId` de COGNITION, y no es deuda:
 * responden a preguntas distintas y el log ni siquiera guarda el fichero, asi
 * que esta clave le seria inservible. Ver `pattern-id`.
 *
 * NO sustituye a `fingerprintOf`, que SI lleva la linea y gobierna los
 * descartes del operador. Alli conviene fallar del lado estricto: un descarte
 * no debe heredarse a otro problema distinto de la misma zona del archivo.
 */
export function findingIdentity(finding: DetectedFinding): string {
  return [normalize(finding.file), finding.tipo ?? 'otro', normalize(finding.simbolo ?? '')].join('|') // prettier-ignore
}
