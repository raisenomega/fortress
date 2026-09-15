import { describe, expect, it } from 'vitest'
import { bench, hallazgo, type Bench, type Opciones } from './plan-repair-fixture'
import { verificarMitigado } from './verificar-mitigado'
import type { FindingMemory } from '@domain/project/finding-memory'

const MITIGADO: FindingMemory = {
  ...hallazgo('f1', 'src/api.ts'),
  lifecycle: 'MITIGATED',
  mitigatedAt: '2026-09-15T10:00:00Z'
}

const base: Opciones = { findings: [MITIGADO], sha: 'abc123' }

const OBSOLETO: Partial<Opciones> = {
  verdictStatus: 'OBSOLETO',
  evidencia: { marcador: 'execFile(', forma: 'ausente' }
}

async function desdeElTerminal(opts: Partial<Opciones>): Promise<Bench> {
  const banco = bench({ ...base, ...opts })
  await verificarMitigado(banco.context, 'p1', 'f1', 'terminal')
  return banco
}

describe('la verificacion que dispara el Terminal consta a su nombre (ADR-088)', () => {
  it('CON PRUEBA: el EXTINCT lleva extinguido_por=terminal, con el mismo motivo', async () => {
    const banco = await desdeElTerminal({ ...OBSOLETO, contenido: 'await runCommand("npm")' })

    expect(banco.extinguidos).toEqual([
      { ids: ['f1'], at: expect.any(String), motivo: 'juicio_obsoleto', quien: 'terminal' }
    ])
  })

  it('SIN PRUEBA: sigue mitigado, y el aviso no se lo atribuye al operador', async () => {
    const banco = await desdeElTerminal({ ...OBSOLETO, contenido: 'execFile("npm")' })

    expect(banco.extinguidos).toHaveLength(0)
    expect(banco.anotados).toHaveLength(1)
    expect(banco.anotados[0].note).toContain('Terminal')
    expect(banco.anotados[0].note).not.toContain('operador')
  })

  it('SIGUE VIVO: vuelve a la cola, y tampoco nombra al operador', async () => {
    const banco = await desdeElTerminal({ verdictStatus: 'REAL' })

    expect(banco.devueltos).toHaveLength(1)
    expect(banco.devueltos[0].note).not.toContain('operador')
  })

  it('los llamantes viejos, sin quien, siguen firmando como operador', async () => {
    const banco = bench({ ...base, verdictStatus: 'REAL' })
    await verificarMitigado(banco.context, 'p1', 'f1')

    expect(banco.devueltos[0].note).toMatch(/^verificado a peticion del operador: /)
  })
})
