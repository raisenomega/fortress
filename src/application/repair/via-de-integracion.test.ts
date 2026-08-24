import { describe, expect, it } from 'vitest'
import { banco } from './auto-merge-fixture'
import { autoMergeProposal } from './auto-merge-proposal'
import { firmarIntegracion } from './firmar-integracion'

const integrar = (b: ReturnType<typeof banco>): Promise<unknown> =>
  autoMergeProposal(b.context, b.deps, { proposalId: 'p-1' })
const firmar = (b: ReturnType<typeof banco>): Promise<unknown> =>
  firmarIntegracion(b.context, b.deps, { proposalId: 'p-1' })

/** El asunto del commit que se le pidio a git, primera linea. */
const asunto = (b: ReturnType<typeof banco>): string =>
  (b.aplicados[0]?.commitMessage ?? '').split('\n')[0]

/** La razon con la que la propuesta llego a MERGEADO en el Libro. */
const razonDelLibro = (b: ReturnType<typeof banco>): string =>
  b.patches.find((p) => p.state === 'MERGEADO')?.analysisReason ?? ''

/** El asiento de OMEGA: el TERCER sitio donde se cuenta la misma integracion. */
const asientoOmega = (b: ReturnType<typeof banco>): { verdict: string; summary: string } =>
  b.entries[0] ?? { verdict: 'sin asiento', summary: 'sin asiento' }

describe('el historial dice por que via entro cada fix', () => {
  it('firmada por el operador: el commit lo dice', async () => {
    // Los dos primeros merges firmados quedaron escritos como automaticos. En
    // un sistema cuya garantia es "nada entra sin firma", esa linea del git log
    // es la unica prueba, y contaba lo contrario de lo que paso.
    const b = banco()
    await firmar(b)

    expect(asunto(b)).toContain('integracion firmada')
    expect(asunto(b)).not.toContain('automatica')
  })

  it('firmada: el Libro cuenta lo mismo que el commit', async () => {
    const b = banco()
    await firmar(b)
    expect(razonDelLibro(b)).toContain('firmada por el operador')
  })

  it('el asunto sigue citando la propuesta y su severidad', async () => {
    const b = banco()
    await firmar(b)
    expect(asunto(b)).toContain('p-1')
    expect(asunto(b)).toContain('(LOW)')
  })

  it('no-regresion: la politica que integra sola sigue diciendo automatica', async () => {
    const b = banco()
    await integrar(b)

    expect(asunto(b)).toContain('integracion automatica')
    expect(razonDelLibro(b)).toBe('integracion automatica')
  })
})

describe('el TERCER registro del mismo hecho: el asiento de OMEGA', () => {
  it('firmada: tambien aqui, y ya no la llama automatica ni denegada', async () => {
    // Era el unico de los tres registros que seguia diciendo "automatica", y la
    // decia dentro de "denegada": el motivo leia la autorizacion como bloqueo.
    const b = banco()
    await firmar(b)

    expect(asientoOmega(b).summary).toContain('firmada')
    expect(asientoOmega(b).summary).not.toContain('automatica')
    expect(asientoOmega(b).summary).not.toContain('denegada')
  })

  it('no-regresion: la que se integra sola sigue asentandose como automatica', async () => {
    const b = banco()
    await integrar(b)
    expect(asientoOmega(b).summary).toContain('automatica aplicada')
    expect(asientoOmega(b).verdict).toBe('ok')
  })
})
