import { esSenal } from '@domain/scan/modulos-detectados'
import { ficherosVersionados } from './ficheros-versionados'

/**
 * Los ficheros que DELATAN un modulo de la campana (ADR-083, Fase 1): un
 * `package.json`, un `.github/workflows/ci.yml`, un `docker-compose.yml`, un
 * `.vue`. La tercera lectura del proyecto, junto al reparto de la fuente y a
 * las dependencias declaradas.
 *
 * La MISMA salida de `git ls-files` que la fuente, con otro filtro. No es un
 * comando nuevo ni una enumeracion nueva: `rootFiles` de `project-inspector`
 * mira solo la raiz y se perderia los workflows, y ES_FUENTE mira solo codigo
 * y se perderia todo lo demas. Aqui pasa lo que ninguna de las dos ve.
 *
 * Lo que cuenta como senal lo derivan las tablas de `senales-de-modulo`, no una
 * lista aparte: enumerar por un lado y decidir por otro es como divergen dos
 * listas que deberian ser una.
 */
export async function listarSenales(projectPath: string): Promise<readonly string[]> {
  return (await ficherosVersionados(projectPath)).filter(esSenal)
}
