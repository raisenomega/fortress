import { describe, expect, it } from 'vitest'
import { candidates, vivo } from './elegir-objetivo'
import { hallazgo } from './plan-repair-analyst-fake'
import type { AppContext } from '../context'
import type { FindingMemory } from '@domain/project/finding-memory'

const mitigado = (f: FindingMemory): FindingMemory => ({
  ...f,
  lifecycle: 'MITIGATED',
  mitigatedAt: '2026-09-01T10:00:00Z'
})

/** Lo que el motor mira para armar su cola. Sin propuestas ni config: lo unico
 *  que decide aqui es el ciclo de vida de la fila. */
const banco = (findings: readonly FindingMemory[]): AppContext =>
  ({
    findings: { listMemory: () => findings },
    repairProposals: {
      findObsoleteFindingIds: () => [],
      findLiveFindingIds: () => [],
      listByProject: () => []
    },
    fortressConfig: () => ({})
  }) as unknown as AppContext

const enLaCola = (findings: readonly FindingMemory[]): readonly string[] =>
  candidates(banco(findings), 'p1', 'sha', '/repo/p1', 'completo').map((c) => c.id)

describe('un mitigado desmentido vuelve a estar al alcance del motor', () => {
  it('MITIGADO: el motor NO lo ve. Esa es la etiqueta escondiendolo', () => {
    // Correcto mientras la marca sea cierta: el operador dijo que hay un fix, y
    // repararlo otra vez seria inventar trabajo.
    expect(enLaCola([mitigado(hallazgo('f1', 'src/api.ts'))])).toEqual([])
  })

  it('DEVUELTO A ACTIVE: el motor SI lo toma, sin que nadie pulse nada mas', () => {
    // Es la conexion que faltaba. `devolverALaCola` deja la fila ACTIVE, y
    // ACTIVE es exactamente lo que `vivo` pide: el siguiente drenaje lo elige.
    const devuelto = hallazgo('f1', 'src/api.ts')

    expect(vivo(devuelto)).toBe(true)
    expect(enLaCola([devuelto])).toEqual(['f1'])
  })

  it('y la guarda `vivo` del motor NO se toco para conseguirlo', () => {
    // La puerta de reparacion sigue exigiendo lo mismo. Lo que cambio es el
    // ESTADO de la fila, no el criterio — aflojar `vivo` habria metido en la
    // cola tambien los mitigados que nadie ha desmentido.
    expect(vivo(mitigado(hallazgo('f2', 'src/x.ts')))).toBe(false)
    expect(vivo({ ...hallazgo('f3', 'src/x.ts'), status: 'false_positive' })).toBe(false)
  })
})
