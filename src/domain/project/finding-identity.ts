import type { DetectedFinding } from '../scan/detected-finding'

const normalize = (text: string): string => text.trim().replace(/\s+/g, ' ').toLowerCase()

/** Como en `fingerprintOf`: un defecto sin linea vale `-`, y eso es una senal,
 *  no un hueco. Las sondas emiten hallazgos sin linea a proposito —«los tests
 *  fallan», «archivo largo»— y esos defectos no VIVEN en ninguna linea. */
const enLinea = (line: number | null): string => (line === null ? '-' : String(line))

/**
 * Clave ESTABLE de un hallazgo entre escaneos: es la fila que le corresponde en
 * la base, escaneo tras escaneo.
 *
 * Fichero, LINEA y tipo (ADR-084). Ninguno de los tres lo redacta el modelo: la
 * ruta y el numero salen del disco, y el tipo se elige de una lista cerrada.
 *
 * El SIMBOLO estuvo aqui desde ADR-067 y salio el 2026-09-11. Medido sobre 366
 * hallazgos vivos de seis proyectos: era el unico separador en 17 sitios —40
 * filas— y no discriminaba NI UN defecto real. Las 40 eran el mismo defecto con
 * el nombre bailado, porque el simbolo es el unico campo que el modelo REDACTA:
 * `recordEvent` y `AuditService.recordEvent`, `""` y `SUPABASE_SERVICE_ROLE_KEY`.
 *
 * Se defendia diciendo que sin el, `handleVerify` y `handleAb` —dos defectos
 * distintos, mismo fichero, mismo tipo— colapsarian en uno. Era cierto mientras
 * la clave NO llevaba linea: estan en lineas distintas, y la linea los separa
 * sola. El simbolo defendia contra un adversario que la linea vence mejor.
 *
 * El tipo se queda, y por evidencia nueva: `allowed-files.ts:45` tiene DOS
 * defectos reales —un `path-traversal` y una `validacion-asimetrica`— en la
 * misma linea y con el MISMO simbolo. Solo el tipo los separa; el simbolo
 * tampoco salvaba ese caso. Colapsar de mas es peor que no colapsar.
 *
 * El simbolo NO desaparece del sistema: sigue en su columna y sigue viajando al
 * analista (`senasDelHallazgo`), que lo usa para encontrar el bloque cuando la
 * linea ya no cuadra. Deja de ser CLAVE, no deja de ser dato.
 *
 * NO sustituye a `fingerprintOf`, que lleva ademas severidad y titulo y gobierna
 * los descartes del operador. Alli conviene fallar del lado estricto: un
 * descarte no debe heredarse a otro problema distinto de la misma zona.
 */
export function findingIdentity(finding: DetectedFinding): string {
  return [normalize(finding.file), enLinea(finding.line), finding.tipo ?? 'otro'].join('|')
}

/** Las cuatro severidades. Delatan una clave del formato de ADR-067 hacia atras,
 *  que empezaba por ahi: ningun fichero se llama "CRITICAL". */
const SEVERIDADES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])

/**
 * El tipo que la clave lleva dentro. El analista recibe `fichero:linea` y sin
 * esto tendria que deducir de que CLASE de defecto le hablan.
 *
 * Devuelve `null` en las claves de otras formulas en vez de partirlas igual y
 * entregar un trozo llamandolo tipo. Dos las delatan: las de `severidad│
 * fichero│titulo` empiezan por una severidad, y las de ADR-067 —`fichero│tipo│
 * simbolo`— llevan un TIPO donde esta ahora la linea. Preferir el silencio a la
 * respuesta inventada es la misma regla de siempre.
 *
 * Ya no devuelve el simbolo: salio de la clave en ADR-084 y se lee de su
 * columna, que es donde vive.
 */
export function tipoDeLaIdentidad(identity: string): string | null {
  const partes = identity.split('|')
  if (partes.length !== 3 || SEVERIDADES.has(partes[0])) return null
  // La linea es un numero o el centinela `-`. Si no lo es, la clave es de
  // ADR-067 y su segundo trozo es un tipo, no una linea: no se responde.
  if (partes[1] !== '-' && !/^\d+$/.test(partes[1])) return null
  return partes[2] || null
}
