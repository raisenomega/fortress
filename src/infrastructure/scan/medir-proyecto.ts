import { dividirEnParadas } from '@domain/scan/dividir-en-paradas'
import type { DeclaracionDeModulos } from '@domain/scan/declaracion-de-modulos'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { modulosAplicables, pendientesDeJuicio } from '@domain/scan/modulos-aplicables'
import { paradasDeTema } from '@domain/scan/modulos-de-tema'
import { SIN_MEDIDA, type MedirDeps } from './medir-deps'
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
 * El juicio es el ULTIMO peldano y el unico que gasta un proceso (Fase 4). Se
 * pregunta primero que queda sin resolver GRATIS —declaracion, nucleo, senal—
 * y solo se lanza si queda algo: un proyecto con `stripe` en su package.json
 * resuelve M8 sin spawn, y uno con M8 y M3 declarados no lanza ninguno.
 *
 * Las paradas salen de DOS sitios y por eso se juntan aqui (ADR-083, Fase 3):
 * las de carpeta del reparto de ficheros, las de tema de los modulos que
 * aplican. El orden que se guarda es el de la MEDIDA —carpetas alfabeticas,
 * temas detras—; cual se audita antes lo decide el recorrido, como siempre.
 */
export async function medirProyecto(
  projectPath: string,
  declaracion: DeclaracionDeModulos,
  deps: MedirDeps = SIN_MEDIDA
): Promise<Manifiesto> {
  const reparto = dividirEnParadas(await listarFuente(projectPath))
  const evidencia = {
    ficheros: await listarSenales(projectPath),
    dependencias: readDependencies(projectPath)
  }
  const pendientes = pendientesDeJuicio(evidencia, declaracion)
  const carpetas = reparto.paradas.map((parada) => parada.carpeta)
  const juicios =
    pendientes.length === 0 ? [] : await deps.juzgar(projectPath, pendientes, carpetas)
  const veredicto = modulosAplicables(evidencia, declaracion, juicios)

  return {
    ...reparto,
    paradas: [...reparto.paradas, ...paradasDeTema(veredicto.aplicables)],
    modulosAplicables: veredicto.aplicables,
    modulosDescartados: veredicto.descartados,
    modulosSinConstancia: veredicto.sinConstancia,
    plantillasAusentes: veredicto.aplicables.filter((m) => !deps.haySembrada(m))
  }
}
