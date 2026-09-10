import { recorrerParadas } from '@application/scan/recorrer-paradas'
import { SIN_SALIDAS } from '@application/scan/progreso-del-recorrido'
import type { Manifiesto } from '@domain/scan/manifiesto'
import { crearBench, PROJECT, PROYECTO, type Bench } from './cierre-partido-fixture'
import { scannerFalso, type ScannerFalso } from './scanner-falso'

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
}

export async function correrRecorrido(
  bench: Bench,
  manifiesto: Manifiesto,
  parar: (rotulo: string) => boolean = () => false
): Promise<Corrida> {
  let detenido = false
  const scanner = scannerFalso((rotulo) => {
    if (parar(rotulo)) detenido = true
  })

  await recorrerParadas(bench.context, scanner, PROJECT, manifiesto, SIN_SALIDAS, {
    cancelado: () => detenido
  })
  return { scanner, fila: () => bench.context.scans.listByProject(PROYECTO, 10)[0] }
}

export { crearBench }
