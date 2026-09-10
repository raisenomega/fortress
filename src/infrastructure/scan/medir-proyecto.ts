import { dividirEnParadas } from '@domain/scan/dividir-en-paradas'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { listarFuente } from './listar-fuente'

/**
 * El reconocimiento de ADR-082: mide el proyecto ANTES de escanear nada y
 * devuelve las XX paradas con las que el escaneo se va a comprometer.
 *
 * Junta las dos mitades y no hace nada mas: enumerar es I/O (git) y repartir es
 * logica pura, y estan separadas para que la segunda se pruebe sin repositorio.
 *
 * Todavia no lo llama nadie. Es la capacidad, como lo fueron `abrir` y `cerrar`
 * antes de que el cierre partido las usara; quien la cablea es el recorrido.
 */
export async function medirProyecto(projectPath: string): Promise<Manifiesto> {
  return dividirEnParadas(await listarFuente(projectPath))
}
