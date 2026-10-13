import { mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import { agenteQueRecuerda } from '@application/agente-que-recuerda'
import { runBuildPlan } from './run-build-plan'

const TOKEN = 'sk-ant-api03-SECRETOPEGADO'
const dir = mkdtempSync(join(tmpdir(), 'plan-tachado-'))

vi.mock('./build-target', async (real) => ({
  ...(await real<object>()),
  agentFor: () => agenteQueRecuerda(`el plan usa ${TOKEN} para llamar`).agent
}))

const ctx = {
  projects: { findById: () => ({ id: 'p1', name: 'P', path: dir, trusted: false }) }
} as unknown as AppContext

/** El plan crudo del agente se escribia sin tachar en FORTRESS-PLAN-*.md del cliente. */
describe('el plan sale tachado', () => {
  it('ni el .md del repo ni el valor devuelto llevan el secreto', async () => {
    const res = await runBuildPlan(ctx, 'p1', `intencion con ${TOKEN}`)

    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value).not.toContain(TOKEN)
    const md = readdirSync(dir).filter((f) => f.startsWith('FORTRESS-PLAN'))
    expect(md.length).toBe(1)
    const escrito = readFileSync(join(dir, md[0] ?? ''), 'utf8')
    expect(escrito).toContain('el plan usa')
    expect(escrito).not.toContain(TOKEN)
  })
})
