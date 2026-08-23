import { defensasQueToca } from './firma-limite'
import { firstMatch } from '../shared/path-glob'
import type { ModoDeVuelta } from './modo-vuelta'
import type { Severity } from '../shared/severity'
import type { ConfigState } from './auto-merge-config'

/**
 * Si este hallazgo puede AUTO-INTEGRARSE, sabiendolo del hallazgo y nada mas.
 * De las cinco condiciones del cerco, dos no necesitan el diff —la severidad y
 * la ruta— y son justo las que se conocen antes de gastar un token.
 *
 * La ruta se juzga por el fichero DEL HALLAZGO, no por el perimetro entero que
 * el generador tendria permitido tocar: ese perimetro incluye siempre los
 * hermanos de test, que casi nunca estan excluidos.
 *
 * ATENCION AL PROYECTO SIN CERCO, QUE DEVUELVE TRUE Y PARECE AL REVES. Si el
 * proyecto no declara auto-merge —o lo declara apagado— nada se integra solo
 * ALLI, y entonces todo su trabajo es para firma humana por definicion.
 */
export function puedeAutoIntegrarse(
  severity: Severity,
  file: string,
  config: ConfigState
): boolean {
  if (config.kind !== 'valid' || !config.policy.enabled) return true

  const { severities, blacklist } = config.policy
  return severities.includes(severity) && firstMatch(file, blacklist) === null
}

/**
 * Si el motor puede TRABAJAR este hallazgo: generar un fix, compilarlo y
 * juzgarlo, sin integrarlo. Mucho mas ancho que lo anterior, y con razon.
 *
 * El cerco existe para acotar lo que entra al repo SIN firma. Cuando la vuelta
 * para antes del merge, nada entra sin firma por construccion, asi que la
 * severidad y la lista del proyecto dejan de decir nada: un MEDIUM trabajado y
 * dejado a firma no es mas peligroso que un LOW.
 *
 * Lo unico que se conserva son las defensas del propio motor, y se conserva la
 * MISMA lista que limita a la firma. No es economia de codigo: si el motor
 * pudiera proponer un cambio sobre su propia jaula, la unica barrera seria que
 * quien firma se diera cuenta, y un limite que depende de la atencion no
 * sobrevive a un lote de quince.
 */
export function puedeTrabajarse(file: string): boolean {
  return defensasQueToca([file]).length === 0
}

/**
 * El alcance se DERIVA del modo, no se elige aparte. Un alcance configurable es
 * un alcance que alguien pondra amplio en el modo que integra solo: la vuelta
 * que puede llegar al repo sin firma es exactamente la que necesita el filtro
 * estrecho, y ese vinculo no debe poder romperse desde fuera.
 *
 * Las defensas se restan PRIMERO y en TODOS los modos. En produccion tambien
 * viajan dentro de la politica —`parseAutoMergeConfig` las antepone a la lista
 * del proyecto— pero apoyarse solo en eso deja la garantia colgando de que ese
 * parser se acuerde. Es el mismo motivo por el que la correa del generador las
 * aplica como resta final en vez de como una entrada mas: asi ninguna
 * declaracion, ni ningun olvido, las alcanza.
 */
export function dentroDelAlcance(
  modo: ModoDeVuelta,
  severity: Severity,
  file: string,
  config: ConfigState
): boolean {
  if (!puedeTrabajarse(file)) return false
  if (modo === 'completo') return puedeAutoIntegrarse(severity, file, config)
  return true
}
