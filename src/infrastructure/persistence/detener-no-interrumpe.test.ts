import { beforeEach, describe, expect, it } from 'vitest'
import { recorrerParadas } from '@application/scan/recorrer-paradas'
import { SIN_SALIDAS } from '@application/scan/progreso-del-recorrido'
import { crearBench, PROJECT, PROYECTO, type Bench } from './cierre-partido-fixture'
import { CUATRO } from './recorrido-fixture'
import { scannerFalso } from './scanner-falso'

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

describe('Detener NO interrumpe la parada en curso', () => {
  it('la parada 2 termina COMPLETA aunque la cancelacion llegue mientras corre', async () => {
    const pedidas = await detenerDurante('payment')

    // Se pidieron las dos: la segunda arranco y llego hasta el final.
    expect(pedidas).toEqual(PRIMERAS)
  })

  it('sus hallazgos SE GUARDAN: terminar significa quedar asentada', async () => {
    await detenerDurante('payment')

    const titulos = bench.context.findings.listMemory(PROYECTO).map((f) => f.title).sort() // prettier-ignore
    expect(titulos).toEqual(['Algo en auth', 'Algo en payment'])
  })

  it('la parada 3 NO arranca: el freno esta en la frontera, no dentro', async () => {
    const pedidas = await detenerDurante('payment')

    expect(pedidas).not.toContain('web')
    expect(pedidas).not.toContain('utils')
  })

  it('cierra ABORTADO con paradas_hechas = 2', async () => {
    await detenerDurante('payment')

    expect(fila().estado).toBe('ABORTADO')
    expect(fila().motivoCierre).toBe('abortado')
    expect(fila().paradasHechas).toBe(2)
  })
})
