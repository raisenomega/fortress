import { describe, expect, it } from 'vitest'
import { autoMergeProposal } from './auto-merge-proposal'
import { banco, type Opciones } from './auto-merge-fixture'

interface Salida {
  readonly applied: boolean
  readonly reason?: string
  /** El asiento del libro, que es donde queda el numero para quien firme. */
  readonly resumen?: string
}

async function correr(opts: Opciones = {}): Promise<Salida> {
  const b = banco(opts)
  const r = await autoMergeProposal(b.context, b.deps, { proposalId: 'p-1' })
  return { ...r, resumen: b.entries[0]?.summary }
}

/**
 * El gate corre dentro del worktree de la propuesta y da verde; el arbol
 * INTEGRADO no lo mide nadie. Aqui se comprueba que la integracion automatica
 * pregunta el tamano antes de mergear, y no despues de haber roto main.
 */
describe('el cerco mide el fichero antes de integrarlo', () => {
  it('76 lineas: no se integra sola, se manda a firma', async () => {
    const r = await correr({ lineas: { 'src/a.ts': 76 } })

    expect(r.applied).toBe(false)
    expect(r.reason).toBe('policy-blocked-max-lines')
    // El asiento dice el numero: quien firme sabe cuanto sobra sin ir a medirlo.
    expect(r.resumen).toContain('76')
  })

  it('75 lineas: el borde es legal y se integra', async () => {
    expect(await correr({ lineas: { 'src/a.ts': 75 } })).toMatchObject({ applied: true })
  })

  it('sin medida no se inventa una: se integra como antes de esta condicion', async () => {
    expect(await correr()).toMatchObject({ applied: true })
  })

  it('mide el fichero DEL FIX, no otro cualquiera del arbol', async () => {
    expect(await correr({ lineas: { 'src/otro.ts': 900 } })).toMatchObject({ applied: true })
  })
})
