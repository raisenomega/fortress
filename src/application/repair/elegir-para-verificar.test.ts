import { describe, expect, it } from 'vitest'
import { elegirParaVerificar } from './elegir-para-verificar'
import { vivo } from './elegir-objetivo'
import { hallazgo } from './plan-repair-analyst-fake'
import type { AppContext } from '../context'
import type { FindingMemory } from '@domain/project/finding-memory'

const mitigado = (id: string): FindingMemory => ({
  ...hallazgo(id, 'src/api.ts'),
  lifecycle: 'MITIGATED',
  mitigatedAt: '2026-09-01T10:00:00Z'
})

const banco = (findings: readonly FindingMemory[], liveIds: readonly string[] = []): AppContext =>
  ({
    findings: { listMemory: () => findings },
    repairProposals: { findLiveFindingIds: () => liveIds }
  }) as unknown as AppContext

describe('la puerta de VERIFICACION acepta lo contrario que la de reparacion', () => {
  it('acepta un MITIGADO: es el limbo, y es a lo unico que sirve', () => {
    const seleccion = elegirParaVerificar(banco([mitigado('f1')]), 'p1', 'f1')

    expect(seleccion?.target.id).toBe('f1')
    expect(seleccion?.reason).toContain('VERIFICACION')
  })

  it('RECHAZA un ACTIVE abierto: eso es de reparar, no de comprobar', () => {
    // Mezclar las dos intenciones haria que verificar pareciera pedir un fix.
    expect(elegirParaVerificar(banco([hallazgo('f1', 'src/api.ts')]), 'p1', 'f1')).toBeNull()
  })

  it('y rechaza lo que el motor ya esta trabajando: costaria una corrida de balde', () => {
    expect(elegirParaVerificar(banco([mitigado('f1')], ['f1']), 'p1', 'f1')).toBeNull()
  })

  it('un id que no existe no rompe nada', () => {
    expect(elegirParaVerificar(banco([mitigado('f1')]), 'p1', 'otro')).toBeNull()
  })

  it('LA GUARDA `vivo` SIGUE INTACTA: la puerta de reparacion no cambio', () => {
    // Es la mitad que este arco NO toca. Aflojarla metería los mitigados en la
    // cola automatica, y el motor repararia lo que el operador ya dio por hecho.
    expect(vivo(hallazgo('f1', 'src/api.ts'))).toBe(true)
    expect(vivo(mitigado('f1'))).toBe(false)
  })
})
