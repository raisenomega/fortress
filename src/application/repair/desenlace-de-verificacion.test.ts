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

describe('los tres desenlaces de una re-verificacion (ADR-087)', () => {
  it('CON MARCADOR: muere con juicio, y consta que lo pidio el OPERADOR', async () => {
    const { banco, dictamen } = await corrida({
      ...base,
      verdictStatus: 'OBSOLETO',
      evidencia: { marcador: 'execFile(', forma: 'ausente' },
      contenido: 'await runCommand("npm", ["run", "typecheck"])'
    })

    expect(dictamen?.desenlace).toBe('extinguido')
    expect(banco.extinguidos).toEqual([
      { ids: ['f1'], at: expect.any(String), motivo: 'juicio_obsoleto', quien: 'operador' }
    ])
    // El MOTIVO no cambia: el juicio es el mismo lo pida la cola o el operador.
    expect(banco.anotados).toHaveLength(0)
  })

  it('SIN MARCADOR: NO muere, y el operador se entera de que su fix no cerro nada', async () => {
    // Este es el desenlace que justifica el arco entero. Extinguir aqui seria el
    // incidente de la CSP otra vez: cerrar por palabra, con el problema vivo.
    const { banco, dictamen } = await corrida({
      ...base,
      verdictStatus: 'OBSOLETO',
      evidencia: { marcador: 'execFile(', forma: 'ausente' },
      contenido: 'execFile("npm", ["run", "typecheck"])'
    })

    expect(dictamen?.desenlace).toBe('sin_prueba')
    expect(banco.extinguidos).toHaveLength(0)
    expect(banco.anotados[0].id).toBe('f1')
    expect(banco.anotados[0].note).toContain('no pudo probarlo')
    // NO vuelve a la cola: el analista dijo obsoleto y no pudo probarlo, asi
    // que no afirma que el problema siga. Actuar sobre una duda seria lo mismo
    // que cerrar sobre una duda, en la otra direccion (ADR-065).
    expect(banco.devueltos).toHaveLength(0)
  })
})
