import { beforeEach, describe, expect, it } from 'vitest'
import { recorrerParadas } from '@application/scan/recorrer-paradas'
import { SIN_PROGRESO } from '@application/scan/progreso-del-recorrido'
import { crearBench, PROJECT, PROYECTO, type Bench } from './cierre-partido-fixture'
import { CUATRO, scannerFalso, type ScannerFalso } from './recorrido-fixture'

let bench: Bench
let scanner: ScannerFalso

const SIEMPRE_SIGUE = { cancelado: () => false }

beforeEach(() => {
  bench = crearBench()
  scanner = scannerFalso()
})

const recorrer = (): ReturnType<typeof recorrerParadas> =>
  recorrerParadas(bench.context, scanner, PROJECT, CUATRO, SIN_PROGRESO, SIEMPRE_SIGUE)

const fila = (): ReturnType<Bench['context']['scans']['listByProject']>[number] =>
  bench.context.scans.listByProject(PROYECTO, 10)[0]

describe('las XX paradas se completan todas', () => {
  it('una llamada al escaner por carpeta, con sus rutas', async () => {
    await recorrer()

    expect(scanner.pedidas).toHaveLength(4)
    expect([...scanner.pedidas].sort()).toEqual(['auth', 'payment', 'utils', 'web'])
  })

  it('los hallazgos de las cuatro se acumulan', async () => {
    await recorrer()

    const titulos = bench.context.findings.listMemory(PROYECTO).map((f) => f.title).sort() // prettier-ignore
    expect(titulos).toEqual(['Algo en auth', 'Algo en payment', 'Algo en utils', 'Algo en web'])
  })

  it('cierra completo, con la cobertura al 100 %', async () => {
    const salida = await recorrer()

    expect(salida.ok).toBe(true)
    expect(fila().estado).toBe('CERRADO')
    expect(fila().motivoCierre).toBe('completo')
    expect(fila().paradasHechas).toBe(4)
    expect(fila().ficherosCubiertos).toBe(CUATRO.ficherosTotal)
    expect(fila().ficherosTotal).toBe(6)
  })

  it('una fila de escaneo, no cuatro: las paradas no fabrican historial', async () => {
    await recorrer()

    expect(bench.cuantas('scans')).toBe(1)
  })
})

describe('la prioridad manda las zonas sensibles delante', () => {
  it('auth y payment se auditan ANTES que web y utils', async () => {
    await recorrer()

    // El manifiesto llega en orden alfabetico (web, auth, utils, payment tal y
    // como esta escrito el fixture); el recorrido lo reordena.
    expect(scanner.pedidas.slice(0, 2)).toEqual(['auth', 'payment'])
    expect(scanner.pedidas.slice(2)).toEqual(['web', 'utils'])
  })

  it('cambia que se audita ANTES, nunca cuantas', async () => {
    await recorrer()

    expect(scanner.pedidas).toHaveLength(CUATRO.paradas.length)
  })
})
