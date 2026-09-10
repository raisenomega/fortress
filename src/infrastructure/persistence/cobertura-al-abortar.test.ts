import { beforeEach, describe, expect, it } from 'vitest'
import { recorrerParadas } from '@application/scan/recorrer-paradas'
import { SIN_SALIDAS } from '@application/scan/progreso-del-recorrido'
import { crearBench, PROJECT, PROYECTO, type Bench } from './cierre-partido-fixture'
import { CUATRO, ficherosDe, scannerFalso } from './recorrido-fixture'

let bench: Bench
/** Las dos primeras del recorrido, que es el orden de prioridad. */
const PRIMERAS = ['auth', 'payment']

beforeEach(() => {
  bench = crearBench()
})

/** El operador aprieta Detener MIENTRAS corre la segunda parada. */
async function detenerDurante(carpeta: string): Promise<readonly string[]> {
  let detenido = false
  const scanner = scannerFalso((enCurso) => {
    if (enCurso === carpeta) detenido = true
  })

  await recorrerParadas(bench.context, scanner, PROJECT, CUATRO, SIN_SALIDAS, {
    cancelado: () => detenido
  })
  return scanner.pedidas
}

const fila = (): ReturnType<Bench['context']['scans']['listByProject']>[number] =>
  bench.context.scans.listByProject(PROYECTO, 10)[0]

describe('la cobertura al abortar es la real, y jamas miente hacia arriba', () => {
  it('cuenta los ficheros de las paradas hechas, no el total', async () => {
    await detenerDurante('payment')

    // auth (1) + payment (2) = 3 de 6. Decir 6 seria afirmar que se miro lo
    // que nadie miro, que es justo lo que la cobertura declarada viene a evitar.
    expect(fila().ficherosCubiertos).toBe(ficherosDe(CUATRO, PRIMERAS))
    expect(fila().ficherosCubiertos).toBe(3)
    expect(fila().ficherosTotal).toBe(6)
    expect(fila().ficherosCubiertos).toBeLessThan(CUATRO.ficherosTotal)
  })

  it('detener durante la PRIMERA deja una parada hecha, no cero', async () => {
    await detenerDurante('auth')

    expect(fila().paradasHechas).toBe(1)
    expect(fila().ficherosCubiertos).toBe(1)
  })
})
