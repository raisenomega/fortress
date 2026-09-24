import { describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import type { Candidate, Selection } from '@domain/repair/select-target'
import type { AppContext } from '../context'
import { estudiar } from './estudiar-con-memoria'

// prettier-ignore
const TARGET: Candidate = { id: 'f1', severity: 'LOW', title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: null, simbolo: null }
const SEL: Selection = { target: TARGET, reason: 'r' }
const PROJECT = { id: 'p1', path: '/tmp/p', name: 'p' } as Project
const DECLARADAS = { hooks: [{ matcher: 'Bash', guion: 'v.sh', interprete: 'sh', arranca: true }], config: 'presente' as const } // prettier-ignore

/** Contexto de mentira que APUNTA de que ruta se leyeron las barreras y que candidato llego. */
function banco(): {
  readonly ctx: AppContext
  readonly rutas: string[]
  readonly llego: () => Candidate | null
} {
  const rutas: string[] = []
  let llego: Candidate | null = null
  const ctx = {
    selfObservations: { listClosed: () => [] },
    repairProposals: { listByProject: () => [] },
    findings: { listMemory: () => [] },
    barrerasDeclaradas: (ruta: string) => (rutas.push(ruta), DECLARADAS),
    analystFor: () => ({
      study: (t: Candidate) => ((llego = t), Promise.resolve({ analysis: {}, runMeta: {} }))
    })
  } as unknown as AppContext
  return { ctx, rutas, llego: () => llego }
}

describe('el analista recibe las barreras del proyecto, leidas aqui y ya formateadas (ADR-104 §3)', () => {
  it('se leen del disco del proyecto que se estudia y bajan como bloque, no como filas', async () => {
    const b = banco()
    await estudiar(b.ctx, PROJECT, SEL)
    expect(b.rutas).toEqual(['/tmp/p'])
    expect(b.llego()?.barreras).toEqual([
      'Barreras que este proyecto declara (1 hooks PreToolUse; .fortress/config presente):',
      '- Bash -> v.sh (sh: arranca)'
    ])
  })
})
