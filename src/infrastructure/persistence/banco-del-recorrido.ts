import { recorrerParadas } from '@application/scan/recorrer-paradas'
import { SIN_SALIDAS } from '@application/scan/progreso-del-recorrido'
import type { Manifiesto } from '@domain/scan/manifiesto'
import type { ParadaRun } from '@domain/telemetry/parada-run'
import { crearBench, PROJECT, PROYECTO, type Bench } from './cierre-partido-fixture'
import { scannerFalso, type FacturaDeParada, type ScannerFalso } from './scanner-falso'

/** La fila del escaneo, releida de la base: lo que de verdad quedo escrito. */
export type FilaDeScan = ReturnType<Bench['context']['scans']['listByProject']>[number]

/**
 * Un recorrido corrido de verdad contra SQLite, con su escaner falso. `parar`
 * se consulta al EMPEZAR cada parada: la que dispara termina igual —el boton
 * solo impide la siguiente— y es asi como se prueba Detener sin carreras.
 */
export interface Corrida {
  readonly scanner: ScannerFalso
  readonly fila: () => FilaDeScan
  /** La serie por parada del escaneo que acaba de correr. */
  readonly serie: () => readonly ParadaRun[]
}

export async function correrRecorrido(
  bench: Bench,
  manifiesto: Manifiesto,
  parar: (rotulo: string) => boolean = () => false,
  /** Una factura propia por parada, para poder leer la SERIE y no una suma. */
  factura?: FacturaDeParada
): Promise<Corrida> {
  let detenido = false
  const scanner = scannerFalso((rotulo) => {
    if (parar(rotulo)) detenido = true
  }, factura)

  await recorrerParadas(bench.context, scanner, PROJECT, manifiesto, SIN_SALIDAS, {
    cancelado: () => detenido
  })
  const fila = (): FilaDeScan => bench.context.scans.listByProject(PROYECTO, 10)[0]
  return { scanner, fila, serie: () => bench.context.paradaRuns.listByScan(fila().id) }
}

export { crearBench }
