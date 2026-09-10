import { esFuente } from '@domain/scan/fuente'
import { ficherosVersionados } from './ficheros-versionados'

/**
 * Los ficheros de FUENTE del proyecto, en rutas relativas a su raiz. Es lo que
 * cuenta las paradas y el `ficherosTotal` del manifiesto.
 *
 * Es el mismo filtro compartido que ya usa `maintainability-probe` para contar
 * ficheros largos. `ES_FUENTE` NO se ensancha para detectar modulos: cambiarlo
 * moveria el numero con el que el escaneo se compromete, y un `.vue` que
 * delata accesibilidad no es codigo que el escaner sepa leer linea por linea.
 * Esa lectura es otra, y es `listarSenales`.
 */
export async function listarFuente(projectPath: string): Promise<readonly string[]> {
  return (await ficherosVersionados(projectPath)).filter(esFuente)
}
