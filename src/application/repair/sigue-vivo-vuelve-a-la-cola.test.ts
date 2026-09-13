import { describe, expect, it } from 'vitest'
import { bench, hallazgo, type Bench, type Opciones } from './plan-repair-fixture'
import { verificarMitigado } from './verificar-mitigado'
import type { DictamenDeVerificacion } from '@domain/repair/dictamen-de-verificacion'
import type { FindingMemory } from '@domain/project/finding-memory'

const MITIGADO: FindingMemory = {
  ...hallazgo('f1', 'src/api.ts'),
  lifecycle: 'MITIGATED',
  mitigatedAt: '2026-09-01T10:00:00Z'
}

const base: Opciones = { findings: [MITIGADO], sha: 'abc123' }

async function corrida(
  opts: Opciones
): Promise<{ banco: Bench; dictamen: DictamenDeVerificacion | null }> {
  const banco = bench(opts)
  return { banco, dictamen: await verificarMitigado(banco.context, 'p1', 'f1') }
}

describe('la certeza ACTUA y la duda CONSERVA (ADR-087)', () => {
  it('EL PROBLEMA SIGUE REAL: NO muere, y VUELVE A LA COLA del motor', async () => {
    // `sigue_vivo` es una CERTEZA: el analista leyo el fichero y el problema
    // esta ahi, asi que la marca del operador era falsa. Dejarla puesta mantenia
    // el hallazgo contando para el score y bloqueando el push mientras el motor
    // no podia tocarlo —`vivo` exige ACTIVE—: castigado y escondido a la vez.
    const { banco, dictamen } = await corrida({ ...base, verdictStatus: 'REAL' })

    expect(dictamen?.desenlace).toBe('sigue_vivo')
    expect(banco.extinguidos).toHaveLength(0)
    expect(banco.devueltos).toEqual([{ id: 'f1', note: expect.stringContaining('SIGUE en el codigo') }]) // prettier-ignore
    // Y NO por la via del `sin_prueba`: son dos escrituras distintas.
    expect(banco.anotados).toHaveLength(0)
  })

  it('LA ASIMETRIA en una frase: la certeza ACTUA, la duda CONSERVA', async () => {
    // Los dos desenlaces que dejan vivo el hallazgo, juntos, porque la
    // diferencia entre ellos ES la decision de este arco.
    const duda = await corrida({
      ...base,
      verdictStatus: 'OBSOLETO',
      evidencia: { marcador: 'execFile(', forma: 'ausente' },
      contenido: 'execFile("npm")'
    })
    const certeza = await corrida({ ...base, verdictStatus: 'REAL' })

    expect([duda.banco.devueltos.length, duda.banco.anotados.length]).toEqual([0, 1])
    expect([certeza.banco.devueltos.length, certeza.banco.anotados.length]).toEqual([1, 0])
  })
})
