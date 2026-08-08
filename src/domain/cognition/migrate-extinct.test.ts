import { describe, expect, it } from 'vitest'
import { migrateExtinct } from './migrate-extinct'

const entry = (id: string, title: string, sev: string, file: string, line: string): string =>
  [
    `## ${id}: ${title}`,
    '',
    'Estado: EXTINTO',
    `Severidad: ${sev}`,
    'Resuelto: 2026-08-08',
    `Evidencia: el escaneo ya no lo reporta (ubicacion original ${file}:${line})`,
    ''
  ].join('\n')

/** Los tres extintos REALES del log que acabaron compartiendo PTN-2026-900. */
const COLISION = [
  entry('PTN-2026-900', 'El handler postureRun no pasa por guardRun: escaneos de red sin limite', 'LOW', 'src/infrastructure/ipc/posture-handlers.ts', '11'), // prettier-ignore
  entry('PTN-2026-900', 'startLogin spawnea un proceso sin trackChild ni guarda de concurrencia', 'LOW', 'src/infrastructure/claude-code/claude-account.ts', '34'), // prettier-ignore
  entry('PTN-2026-900', 'El preload expone process.env completo al renderer via electronAPI', 'HIGH', 'src/preload/index.ts', '60') // prettier-ignore
].join('\n')

const ids = (text: string): string[] =>
  [...text.matchAll(/^## (PTN-\d{4}-\d+)\s*:/gm)].map((m) => m[1])

describe('migrateExtinct (migracion de los ids ya escritos)', () => {
  it('LA COLISION REAL: tres entradas con PTN-2026-900 pasan a tener id propio', () => {
    expect(new Set(ids(COLISION)).size).toBe(1) // antes: las tres el mismo
    const migrado = migrateExtinct(COLISION)
    expect(ids(migrado)).toHaveLength(3)
    expect(new Set(ids(migrado)).size).toBe(3) // despues: una cada una
  })

  it('no pierde ninguna entrada ni toca el cuerpo: solo cambia el titular', () => {
    const migrado = migrateExtinct(COLISION)
    expect(migrado.split('Estado: EXTINTO')).toHaveLength(4) // las 3 siguen ahi
    expect(migrado).toContain('ubicacion original src/preload/index.ts:60')
    expect(migrado).toContain('Resuelto: 2026-08-08')
    expect(migrado).toContain('startLogin spawnea un proceso sin trackChild ni guarda')
  })

  it('conserva el ano con el que quedo registrada: es su historia', () => {
    const viejo = entry('PTN-2024-900', 'Algo antiguo', 'LOW', 'src/a.ts', '1')
    expect(ids(migrateExtinct(viejo))[0]).toMatch(/^PTN-2024-/)
  })

  it('es idempotente: migrar dos veces da exactamente lo mismo', () => {
    const una = migrateExtinct(COLISION)
    expect(migrateExtinct(una)).toBe(una)
  })

  it('una entrada sin ubicacion o sin severidad se deja INTACTA, no se corrompe', () => {
    const cojo = ['## PTN-2026-900: Sin evidencia', '', 'Estado: EXTINTO', ''].join('\n')
    expect(migrateExtinct(cojo)).toBe(cojo)
  })

  it('el texto que no son patrones pasa sin tocarse', () => {
    expect(migrateExtinct('')).toBe('')
    expect(migrateExtinct('texto suelto\n')).toBe('texto suelto\n')
  })
})
