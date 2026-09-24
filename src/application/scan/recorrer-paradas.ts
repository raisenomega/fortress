import { bloqueDeBarreras } from '@domain/project/barreras-declaradas'
import type { Project } from '@domain/project/project'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { campanaDe } from '@domain/scan/campana-declarada'
import { modulosDeParada } from '@domain/scan/modulos-de-carpeta'
import { ordenDelRecorrido } from '@domain/scan/orden-del-recorrido'
import { rotuloDe } from '@domain/scan/parada'
import type { Scanner } from '@domain/scan/scanner'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { notasDelRecorrido } from './notas-del-recorrido'
import type { RecorridoDeps } from './recorrido-deps'
import { NADA_RECORRIDO, sumarParada } from './acumulador-del-recorrido'
import { asentarLaParada } from './asentar-la-parada'
import { abrirRecorrido } from './abrir-recorrido'
import { escanearParada } from './escanear-parada'
import type { SalidasDelRecorrido } from './progreso-del-recorrido'
import type { ScanSummary } from './scan-types'

/**
 * Recorre las XX paradas del manifiesto, guardando cada una al terminarla.
 *
 * `cancelado()` se consulta ENTRE paradas, NUNCA dentro: una arrancada termina
 * completa y queda guardada antes de volver a mirar. El boton solo impide la
 * SIGUIENTE — por eso la cobertura al abortar es verdad y no una fraccion.
 */
export async function recorrerParadas(
  context: AppContext,
  scanner: Scanner,
  project: Project,
  manifiesto: Manifiesto,
  salidas: SalidasDelRecorrido,
  deps: RecorridoDeps
): Promise<Result<ScanSummary>> {
  const paradas = ordenDelRecorrido(manifiesto.paradas)
  // Los de CARPETA bajan a TODAS las de carpeta; el de un tema, a la suya, al final.
  const temas = modulosDeParada(manifiesto.modulosAplicables)
  const { scanId, at, cerrar } = abrirRecorrido(context, project, salidas, {
    paradasTotal: paradas.length,
    ficherosTotal: manifiesto.ficherosTotal,
    campana: campanaDe(manifiesto)
  })

  let acumulado = NADA_RECORRIDO
  let indice = 0
  const notas = notasDelRecorrido(context, project)
  const barreras = bloqueDeBarreras(context.barrerasDeclaradas(project.path)) // por proyecto: una vez, a todas

  for (const parada of paradas) {
    if (deps.cancelado()) {
      notas.volcar()
      return ok(cerrar('abortado', acumulado))
    }

    const salida = await escanearParada(scanner, project, parada, salidas.progreso, temas, context.findings.listMemory(project.id), barreras) // prettier-ignore
    // Un fallo del escaner cierra el recorrido con lo que SI se audito, en vez de
    // dejar la fila ABIERTA para siempre. `fallo` y no `abortado`: el operador no
    // paro nada, la maquina se rompio, y juntarlos haria invisible cuantas veces
    // revienta el escaner. La factura ya quedo asentada (asentarIntentoFallido).
    if (!salida.ok) {
      notas.volcar()
      cerrar('fallo', acumulado, salida.error)
      return err(salida.error)
    }

    notas.suma(salida.value.notas)
    indice += 1
    await asentarLaParada(context, project, parada, { scanId, indice, at }, salida.value)
    acumulado = sumarParada(acumulado, parada, salida.value)
    salidas.progreso.parada({ hecha: acumulado.hechas, total: paradas.length, carpeta: rotuloDe(parada) }) // prettier-ignore
  }

  notas.volcar()
  return ok(cerrar('completo', acumulado))
}
