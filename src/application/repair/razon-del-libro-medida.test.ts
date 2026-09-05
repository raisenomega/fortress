import { describe, expect, it } from 'vitest'
import type { MedidaDelArbol } from '@domain/repair/asiento-de-la-medida'
import { banco, type Opciones } from './auto-merge-fixture'
import { autoMergeProposal } from './auto-merge-proposal'

/** La razon con la que la propuesta llego a su estado final en el Libro. */
async function razon(opts: Opciones): Promise<string> {
  const b = banco(opts)
  await autoMergeProposal(b.context, b.deps, { proposalId: 'p-1' })
  return b.patches[b.patches.length - 1]?.analysisReason ?? ''
}

describe('el Libro dice QUE se midio, no "re-validado" a secas', () => {
  it('medido: la razon del MERGEADO nombra los comandos del arbol integrado', async () => {
    const texto = await razon({ destino: ['src/a.ts'] })

    expect(texto).toContain('integracion automatica')
    expect(texto).toContain('arbol integrado medido')
    expect(texto).toContain('typecheck + lint + test:unit')
    expect(texto).toContain('src/a.ts')
  })

  it('lo que se salto tambien se dice: no medir es informacion sobre que se miro', async () => {
    const texto = await razon({ destino: ['src/z.ts'] })

    expect(texto).toContain('integracion automatica')
    expect(texto).toContain('sin medir')
  })

  it('rojo: la razon del CADUCADO dice donde fallo y que llevaba verde', async () => {
    const medida: MedidaDelArbol = { ok: false, comandos: ['typecheck', 'lint'], detalle: '' }
    const texto = await razon({ destino: ['src/a.ts'], medida })

    expect(texto).toContain('arbol-integrado-rojo')
    expect(texto).toContain('rojo en lint')
    expect(texto).toContain('verdes typecheck')
  })

  it('un asiento parcial no se cuenta como completo', async () => {
    const medida: MedidaDelArbol = { ok: true, comandos: ['typecheck'], detalle: '' }
    const texto = await razon({ destino: ['src/a.ts'], medida })

    expect(texto).toContain('arbol integrado medido (typecheck)')
    expect(texto).not.toContain('test:unit')
  })
})
