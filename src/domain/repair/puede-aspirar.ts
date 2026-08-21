import { firstMatch } from '../shared/path-glob'
import type { Severity } from '../shared/severity'
import type { ConfigState } from './auto-merge-config'

/**
 * Si este hallazgo puede ASPIRAR a integrarse solo, sabiendolo del hallazgo y
 * nada mas. De las cinco condiciones del cerco, dos no necesitan el diff —la
 * severidad y la ruta— y son justo las que se conocen antes de gastar un token.
 * El tamano y el numero de archivos siguen decidiendose despues, con el fix
 * delante; aqui no se adivinan.
 *
 * La ruta se juzga por el fichero DEL HALLAZGO, no por el perimetro entero que
 * el generador tendria permitido tocar. Es a proposito: el perimetro incluye
 * siempre los hermanos de test, que casi nunca estan excluidos, y exigir que
 * TODOS cayeran en la lista dejaria pasar cualquier hallazgo anclado en un
 * fichero innegociable. Un fix que no toca el fichero del hallazgo no lo
 * arregla, asi que el ancla basta.
 *
 * ATENCION AL PROYECTO SIN CERCO, QUE DEVUELVE TRUE Y PARECE AL REVES. Si el
 * proyecto no declara auto-merge —o lo declara apagado— nada se integra solo
 * ALLI, y entonces todo su trabajo es para firma humana por definicion. Filtrar
 * ahi no ahorraria un gasto inutil: apagaria el motor entero. El freno solo
 * recorta donde hay un cerco de verdad que el hallazgo no alcanza.
 */
export function puedeAspirar(severity: Severity, file: string, config: ConfigState): boolean {
  if (config.kind !== 'valid' || !config.policy.enabled) return true

  const { severities, blacklist } = config.policy
  return severities.includes(severity) && firstMatch(file, blacklist) === null
}
