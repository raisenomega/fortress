import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { createMemoryDb } from '../persistence/memory-db'
import { createSqliteSelfObservationRepository } from '../persistence/sqlite-self-observation-repository'
import { runBuildPlan } from './run-build-plan'
import { runInvestigate } from './run-investigate'

const NOTA = '{"kind":"gap","area":"otro","note":"me falto el grafo en el plan"}'
const BLOQUE = `NOTAS:[${NOTA}]:END-NOTAS`
const agente = vi.hoisted(() => ({ texto: '', failed: false }))

// Solo el agente: el resolutor del proyecto es el real.
vi.mock('./build-target', async (real) => ({
  ...(await real<object>()),
  agentFor: () => ({
    isAvailable: () => true,
    precheck: () => null,
    run: () => Promise.resolve({ text: agente.texto, failed: agente.failed, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] }) // prettier-ignore
  })
}))

function contexto(): { ctx: AppContext; path: string } {
  const path = mkdtempSync(join(tmpdir(), 'construir-'))
  const project = { id: 'p1', name: 'Cliente ACME', path, trusted: false }
  const ctx = {
    projects: { findById: () => project },
    selfObservations: createSqliteSelfObservationRepository(createMemoryDb())
  } as unknown as AppContext
  return { ctx, path }
}

describe('el Plan de Construir observa (sub-pieza 3 del #5)', () => {
  it('asienta la nota por el cuello unico, y el plan que vuelve y se guarda NO lleva el bloque', async () => {
    const { ctx, path } = contexto()
    agente.texto = `El plan:\n1. a\n\n${BLOQUE}`
    agente.failed = false
    const r = await runBuildPlan(ctx, 'p1', 'una feature')

    expect(ctx.selfObservations.listOpen()).toMatchObject([{ kind: 'gap', area: 'otro', sourceProject: 'Cliente ACME' }]) // prettier-ignore
    expect(r.ok && r.value).not.toContain('NOTAS:')
    const docs = existsSync(join(path, 'docs'))
      ? readdirSync(join(path, 'docs'), { recursive: true })
      : []
    const md = docs.map(String).find((f) => f.endsWith('.md'))
    expect(md === undefined ? '' : readFileSync(join(path, 'docs', md), 'utf8')).not.toContain(
      'NOTAS:'
    )
  })
})

describe('la Investigacion observa', () => {
  it('asienta la nota y la respuesta vuelve limpia', async () => {
    const { ctx } = contexto()
    agente.texto = `La respuesta.\n\n${BLOQUE}`
    agente.failed = false
    const r = await runInvestigate(ctx, 'p1', 'que hace X')

    expect(ctx.selfObservations.listOpen()).toHaveLength(1)
    expect(r).toEqual({ ok: true, value: 'La respuesta.' })
  })

  it('y si el agente FALLA, la nota se guarda igual: pase lo que pase con el resultado', async () => {
    const { ctx } = contexto()
    agente.texto = `No pude.\n\n${BLOQUE}`
    agente.failed = true
    const r = await runInvestigate(ctx, 'p1', 'que hace X')

    expect(ctx.selfObservations.listOpen()).toHaveLength(1)
    expect(r).toEqual({ ok: false, error: 'No pude.' })
  })
})
