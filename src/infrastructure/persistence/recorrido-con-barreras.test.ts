import { describe, expect, it } from 'vitest'
import { recorrerParadas } from '@application/scan/recorrer-paradas'
import { SIN_SALIDAS } from '@application/scan/progreso-del-recorrido'
import type { AppContext } from '@application/context'
import { crearBench, PROJECT } from './cierre-partido-fixture'
import { CUATRO } from './recorrido-fixture'
import { scannerFalso } from './scanner-falso'

const DECLARADAS = { hooks: [{ matcher: 'Write', guion: 'g.py', interprete: 'python3', arranca: false }], config: 'ausente' as const } // prettier-ignore

describe('el recorrido lleva las barreras del proyecto a cada parada (ADR-104 §3)', () => {
  it('se leen UNA vez, de la ruta del proyecto, y el mismo bloque va en las cuatro peticiones', async () => {
    const bench = crearBench()
    const rutas: string[] = []
    const context = { ...bench.context, barrerasDeclaradas: (r: string) => (rutas.push(r), DECLARADAS) } as AppContext // prettier-ignore
    const scanner = scannerFalso()

    await recorrerParadas(context, scanner, PROJECT, CUATRO, SIN_SALIDAS, {
      cancelado: () => false
    })

    expect(rutas).toEqual([PROJECT.path])
    expect(scanner.peticiones.map((p) => p.barreras)).toEqual(
      Array.from({ length: 4 }, () => [
        'Barreras que este proyecto declara (1 hooks PreToolUse; .fortress/config ausente):',
        '- Write -> g.py (python3: NO arranca)'
      ])
    )
  })
})
