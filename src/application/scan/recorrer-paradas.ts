import type { Project } from '@domain/project/project'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { modulosDeParada } from '@domain/scan/modulos-de-carpeta'
import { ordenarPorSensibilidad } from '@domain/scan/prioridad-de-paradas'
import type { Scanner } from '@domain/scan/scanner'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import type { RecorridoDeps } from './recorrido-deps'
import { NADA_RECORRIDO, sumarParada } from './acumulador-del-recorrido'
import { asentarHallazgos } from './asentar-hallazgos'
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
  const paradas = ordenarPorSensibilidad(manifiesto.paradas)
  // De los doce, solo los de CARPETA bajan a la parada. Los de tema miran el
  // proyecto entero y no tienen carpeta donde correr: son otra fase.
  const temas = modulosDeParada(manifiesto.modulosAplicables)
  const { scanId, at, cerrar } = abrirRecorrido(context, project, salidas, {
    paradasTotal: paradas.length,
    ficherosTotal: manifiesto.ficherosTotal
  })

  let acumulado = NADA_RECORRIDO

  for (const parada of paradas) {
    if (deps.cancelado()) return ok(cerrar('abortado', acumulado))

    const salida = await escanearParada(scanner, project, parada, salidas.progreso, temas)
    // Un fallo del escaner cierra el recorrido ABORTADO con lo que SI se
    // audito, en vez de dejar la fila ABIERTA para siempre. El rastro fino del
    // fallo —su factura, su motivo propio— es la pieza que le falta al arco.
    // `fallo` y no `abortado`: el operador no paro nada, la maquina se rompio, y
    // juntarlos haria invisible cuantas veces revienta el escaner. La factura
    // del intento ya quedo asentada aparte (asentarIntentoFallido).
    if (!salida.ok) {
      cerrar('fallo', acumulado, salida.error)
      return err(salida.error)
    }

    acumulado = sumarParada(acumulado, parada, salida.value)
    await asentarHallazgos(context, project, scanId, salida.value.findings, at)
    salidas.progreso.parada({
      hecha: acumulado.hechas,
      total: paradas.length,
      carpeta: parada.carpeta
    })
  }

  return ok(cerrar('completo', acumulado))
}
