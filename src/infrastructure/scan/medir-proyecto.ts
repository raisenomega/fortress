import { dividirEnParadas } from '@domain/scan/dividir-en-paradas'
import type { DeclaracionDeModulos } from '@domain/scan/declaracion-de-modulos'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { modulosAplicables } from '@domain/scan/modulos-aplicables'
import { paradasDeTema } from '@domain/scan/modulos-de-tema'
import { readDependencies } from '../system/read-dependencies'
import { listarFuente } from './listar-fuente'
import { listarSenales } from './listar-senales'

/**
 * El reconocimiento de ADR-082, ampliado por ADR-083: mide el proyecto ANTES
 * de escanear nada y devuelve las XX paradas con las que el escaneo se va a
 * comprometer, y los modulos de la campana que le aplican.
 *
 * Junta las piezas y no hace nada mas. Enumerar es I/O (git, disco) y decidir
 * es logica pura, y estan separadas para que la segunda se pruebe sin
 * repositorio. La declaracion del operador entra por parametro y no se lee
 * aqui: quien la tiene es el proyecto, y este modulo solo conoce una ruta.
 *
 * Las paradas salen de DOS sitios y por eso se juntan aqui (ADR-083, Fase 3):
 * las de carpeta del reparto de ficheros, las de tema de los modulos que
 * aplican. El orden que se guarda es el de la MEDIDA —carpetas alfabeticas,
 * temas detras—; cual se audita antes lo decide el recorrido, como siempre.
 */
export async function medirProyecto(
  projectPath: string,
  declaracion: DeclaracionDeModulos
): Promise<Manifiesto> {
  const reparto = dividirEnParadas(await listarFuente(projectPath))
  const evidencia = {
    ficheros: await listarSenales(projectPath),
    dependencias: readDependencies(projectPath)
  }
  const veredicto = modulosAplicables(evidencia, declaracion)

  return {
    ...reparto,
    paradas: [...reparto.paradas, ...paradasDeTema(veredicto.aplicables)],
    modulosAplicables: veredicto.aplicables,
    modulosDescartados: veredicto.descartados,
    modulosSinConstancia: veredicto.sinConstancia
  }
}
