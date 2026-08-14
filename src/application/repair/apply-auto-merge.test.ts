import { describe, expect, it } from 'vitest'
import { autoMergeProposal } from './auto-merge-proposal'
import { banco, type Opciones } from './auto-merge-fixture'

async function correr(opts: Opciones = {}): Promise<{
  r: Awaited<ReturnType<typeof autoMergeProposal>>
  b: ReturnType<typeof banco>
}> {
  const b = banco(opts)
  return { r: await autoMergeProposal(b.context, b.deps, { proposalId: 'p-1' }), b }
}

describe('applyAutoMerge: el camino de estados manda sobre la intencion', () => {
  it('desde GENERADO no hay camino honesto: no se llama siquiera a git', async () => {
    const { r, b } = await correr({ state: 'GENERADO' })
    expect(r).toMatchObject({ applied: false, reason: 'illegal-transition' })
    expect(b.aplicados).toHaveLength(0)
    expect(b.patches).toHaveLength(0)
  })

  it('integracion aplicada: pasa por APROBADO antes de MERGEADO', async () => {
    const { r, b } = await correr()
    expect(r).toMatchObject({ applied: true, mergeCommitSha: 'merge01' })
    expect(b.patches.map((p) => p.state)).toEqual(['APROBADO', 'MERGEADO'])
    expect(b.entries[0]).toMatchObject({ verdict: 'ok' })
    expect(b.entries[0].evidence).toContain('commit=merge01')
  })

  it('la rama a integrar sale del libro, no del patron de nombres', async () => {
    const { b } = await correr()
    expect(b.aplicados[0]).toMatchObject({ sourceBranch: 'repair/p-1-slug', projectPath: '/repo' })
    expect(b.aplicados[0].commitMessage).toContain('base: base123')
  })
})

describe('applyAutoMerge: un merge que falla CADUCA y lo dice', () => {
  const fallo = (outcome: Opciones['outcome']): Opciones => ({ outcome })

  it('conflicto: caduca y el asiento cita a git en vez de decir aplicada', async () => {
    const salida = 'CONFLICT (content): Merge conflict in src/a.ts'
    const { r, b } = await correr(fallo({ ok: false, kind: 'conflict', gitOutput: salida }))
    expect(r).toMatchObject({ applied: false, reason: 'merge-failed-conflict' })
    expect(b.patches.map((p) => p.state)).toEqual(['CADUCADO'])
    expect(b.entries[0]).toMatchObject({ verdict: 'veto' })
    expect(b.entries[0].summary).toContain('git — conflict')
  })

  it('arbol sucio: el motor no toca lo que el operador dejo a medias', async () => {
    const { r, b } = await correr(fallo({ ok: false, kind: 'dirty-tree', gitOutput: 'commit your changes' })) // prettier-ignore
    expect(r).toMatchObject({ applied: false, reason: 'merge-failed-dirty-tree' })
    expect(b.patches.map((p) => p.state)).toEqual(['CADUCADO'])
  })

  it('HEAD suelto: sin rama destino no hay donde integrar', async () => {
    const { r, b } = await correr(fallo({ ok: false, kind: 'target-branch-detached' }))
    expect(r).toMatchObject({ applied: false, reason: 'merge-failed-target-branch-detached' })
    expect(b.entries[0].summary).toContain('git — target-branch-detached')
  })

  it('fallo sin clasificar: se asienta entero, es el peor caso', async () => {
    const { r, b } = await correr(fallo({ ok: false, kind: 'unknown', gitOutput: 'fatal: raro' }))
    expect(r).toMatchObject({ applied: false, reason: 'merge-failed-unknown' })
    expect(b.entries[0].summary).toContain('fatal: raro')
  })
})
