import { describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import type { Parada } from '@domain/scan/parada'
import type { ScanRequest, Scanner } from '@domain/scan/scanner'
import { ok } from '@domain/shared/result'
import { escanearParada } from './escanear-parada'
import type { ProgresoDelRecorrido } from './progreso-del-recorrido'

const PROJECT = { id: 'p1', name: 'P', path: '/p' } as unknown as Project
const PROGRESO = { texto: () => undefined } as unknown as ProgresoDelRecorrido
const BARRERAS = ['Barreras que este proyecto declara (1 hooks PreToolUse; .fortress/config ausente):', '- Bash -> x.sh (sh: arranca)'] // prettier-ignore

describe('escanearParada: la parada lleva las barreras declaradas del proyecto (ADR-104 §3)', () => {
  it('las mismas lineas en la peticion, en cualquier clase de parada', async () => {
    const pedidas: ScanRequest[] = []
    const scanner = { scan: (r: ScanRequest) => (pedidas.push(r), Promise.resolve(ok({ findings: [], durationMs: 0, usage: {}, tools: [], edits: [], texto: '', notas: [] }))) } as unknown as Scanner // prettier-ignore
    await escanearParada(scanner, PROJECT, { clase: 'carpeta', carpeta: 'src', ficheros: [] } as unknown as Parada, PROGRESO, [], [], BARRERAS) // prettier-ignore
    await escanearParada(scanner, PROJECT, { clase: 'tema', modulo: 'M1' } as unknown as Parada, PROGRESO, [], [], BARRERAS) // prettier-ignore
    expect(pedidas.map((p) => p.barreras)).toEqual([BARRERAS, BARRERAS])
  })

  it('sin barreras, la peticion no las lleva', async () => {
    const pedidas: ScanRequest[] = []
    const scanner = { scan: (r: ScanRequest) => (pedidas.push(r), Promise.resolve(ok({ findings: [], durationMs: 0, usage: {}, tools: [], edits: [], texto: '', notas: [] }))) } as unknown as Scanner // prettier-ignore
    await escanearParada(scanner, PROJECT, { clase: 'carpeta', carpeta: 'src', ficheros: [] } as unknown as Parada, PROGRESO) // prettier-ignore
    expect(pedidas[0]?.barreras).toEqual([])
  })
})
