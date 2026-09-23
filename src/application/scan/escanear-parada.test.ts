import { describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import type { FilaRegistrada } from '@domain/scan/memoria-de-la-parada'
import type { Parada } from '@domain/scan/parada'
import type { ScanRequest, Scanner } from '@domain/scan/scanner'
import { ok } from '@domain/shared/result'
import { escanearParada } from './escanear-parada'
import type { ProgresoDelRecorrido } from './progreso-del-recorrido'

const PROJECT = { id: 'p1', name: 'P', path: '/p' } as unknown as Project
const PROGRESO = { texto: () => undefined } as unknown as ProgresoDelRecorrido
// prettier-ignore
const fila = (file: string, line: number, tipo: string): FilaRegistrada => ({ file, line, identity: `${file}|${line}|${tipo}`, simbolo: null, lifecycle: 'ACTIVE' })
const VIVAS = [fila('src/api/pay.ts', 42, 'confianza-en-datos-del-cliente'), fila('lib/x.ts', 3, 'cors-permisivo')] // prettier-ignore

/** Un escaner que solo guarda la peticion: lo que se prueba es que se arma. */
function escanerQueGuarda(): { scanner: Scanner; pedidas: ScanRequest[] } {
  const pedidas: ScanRequest[] = []
  const scanner: Scanner = {
    isAvailable: () => true,
    precheck: () => Promise.resolve(ok(undefined)),
    scan: (request) => { pedidas.push(request); return Promise.resolve(ok({ findings: [], durationMs: 0, usage: { inputTokens: 0, outputTokens: 0 }, tools: [], edits: [], texto: '', notas: [] })) } // prettier-ignore
  } as unknown as Scanner
  return { scanner, pedidas }
}

describe('escanearParada: la parada lleva las registradas de SU alcance (ADR-101)', () => {
  it('una parada de carpeta lleva solo las vivas de esa carpeta', async () => {
    const { scanner, pedidas } = escanerQueGuarda()
    const parada = {
      clase: 'carpeta',
      carpeta: 'src',
      ficheros: ['src/api/pay.ts']
    } as unknown as Parada
    await escanearParada(scanner, PROJECT, parada, PROGRESO, [], VIVAS)
    expect(pedidas[0]?.registradas).toEqual(['src/api/pay.ts:42 confianza-en-datos-del-cliente'])
  })

  it('una parada de tema mira el proyecto entero y lleva todas las vivas', async () => {
    const { scanner, pedidas } = escanerQueGuarda()
    const parada = { clase: 'tema', modulo: 'M9', rotulo: 'M9' } as unknown as Parada
    await escanearParada(scanner, PROJECT, parada, PROGRESO, [], VIVAS)
    expect(pedidas[0]?.registradas).toHaveLength(2)
  })
})
