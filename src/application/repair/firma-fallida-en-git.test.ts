import { describe, expect, it } from 'vitest'
import { banco } from './auto-merge-fixture'
import { firmarIntegracion } from './firmar-integracion'

/**
 * Lo que el Libro cuenta cuando una firma muere aplicando el merge.
 *
 * La rama de `applyError` era INALCANZABLE por la via firmada: el motivo
 * preguntaba si la politica traia texto, y la firma siempre traia el suyo, asi
 * que salia por ahi antes de llegar al fallo de git. En el Libro entero del
 * operador no hay un solo asiento que cite a git — con dos merges firmados que
 * si fallaron. Lo que no se puede escribir no se puede auditar despues.
 */
const roto = (gitOutput: string): ReturnType<typeof banco> =>
  banco({ outcome: { ok: false, kind: 'conflict', gitOutput } })

describe('un merge firmado que falla en git queda escrito', () => {
  it('el asiento cita a git, no a la politica', async () => {
    const b = roto('CONFLICT (content): Merge conflict in src/a.ts')
    await firmarIntegracion(b.context, b.deps, { proposalId: 'p-1' })

    expect(b.entries[0].summary).toContain('git — conflict')
    expect(b.entries[0].summary).not.toContain('politica')
    expect(b.entries[0].verdict).toBe('veto')
  })

  it('y dice que la firmo un humano: denegada no borra por donde entro', async () => {
    const b = roto('fatal: raro')
    await firmarIntegracion(b.context, b.deps, { proposalId: 'p-1' })

    expect(b.entries[0].summary).toContain('firmada')
    expect(b.entries[0].summary).not.toContain('automatica')
  })
})
