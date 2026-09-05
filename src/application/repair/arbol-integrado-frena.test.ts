import { describe, expect, it } from 'vitest'
import type { MedidaDelArbol } from '@domain/repair/asiento-de-la-medida'
import { banco, type Opciones } from './auto-merge-fixture'
import { autoMergeProposal } from './auto-merge-proposal'
import { firmarIntegracion } from './firmar-integracion'

// prettier-ignore
const ROJA: MedidaDelArbol = { ok: false, comandos: ['typecheck', 'lint'], detalle: '' }

async function integrar(opts: Opciones): Promise<{
  r: Awaited<ReturnType<typeof autoMergeProposal>>
  b: ReturnType<typeof banco>
}> {
  const b = banco(opts)
  return { r: await autoMergeProposal(b.context, b.deps, { proposalId: 'p-1' }), b }
}

describe('el arbol integrado se mide ANTES de tocar el vivo', () => {
  it('el 5 de septiembre reproducido: mismo fichero en los dos lados y el resultado rojo', async () => {
    // Anclada nueve merges atras, arreglo el mismo defecto que el destino ya
    // habia arreglado al reves: lineas distintas del mismo fichero, git no vio nada.
    const { r, b } = await integrar({ destino: ['src/a.ts', 'src/otro.ts'], medida: ROJA })

    expect(r).toMatchObject({ applied: false, reason: 'arbol-integrado-rojo' })
    expect(b.aplicados).toHaveLength(0) // el arbol vivo NO se llego a tocar
    expect(b.patches.map((p) => p.state)).toEqual(['CADUCADO'])
    expect(b.medidas).toEqual(['p-1'])
  })

  it('la tanda de firmas no se rompe: el destino se movio, pero no sobre lo del fix', async () => {
    const { r, b } = await integrar({ destino: ['src/z.ts'] })

    expect(r).toMatchObject({ applied: true })
    expect(b.medidas).toEqual([])
  })

  it('el destino no se movio: no hay nada que volver a medir', async () => {
    const { r, b } = await integrar({ destino: [] })

    expect(r.applied).toBe(true)
    expect(b.medidas).toEqual([])
  })

  it('el arbol integrado pasa: se integra, y se dejo medido', async () => {
    const { r, b } = await integrar({ destino: ['src/a.ts'] })

    expect(r).toMatchObject({ applied: true, mergeCommitSha: 'merge01' })
    expect(b.medidas).toEqual(['p-1'])
  })

  it('no se pudo saber que toco el destino: se mide igual, la duda no absuelve', async () => {
    const { b } = await integrar({ destino: null })

    expect(b.medidas).toEqual(['p-1'])
  })
})

describe('lo que no se puede medir tampoco entra', () => {
  it('el destino cambio las dependencias: no se integra lo que no se puede medir', async () => {
    const { r, b } = await integrar({ destino: ['src/a.ts', 'package-lock.json'] })

    expect(r).toMatchObject({ applied: false, reason: 'arbol-integrado-sin-medir' })
    expect(b.aplicados).toHaveLength(0)
    expect(b.medidas).toEqual([])
  })

  it('la FIRMA pasa por el mismo freno: es la puerta por la que entro el fallo', async () => {
    const b = banco({ destino: ['src/a.ts'], medida: ROJA })
    const r = await firmarIntegracion(b.context, b.deps, { proposalId: 'p-1' })

    expect(r).toMatchObject({ applied: false, reason: 'arbol-integrado-rojo' })
    expect(b.aplicados).toHaveLength(0)
  })
})
