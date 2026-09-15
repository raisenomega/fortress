import { mkdirSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { MODELO_DEL_PRODUCTOR } from '@domain/agent/escalera-de-modelos'
import { agentsForProject } from './agents-for-project'

/** Crea un repo con agentes propios en .claude/agents. */
function repoWithAgents(...ids: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'fortress-agents-'))
  const agentsDir = join(dir, '.claude', 'agents')
  mkdirSync(agentsDir, { recursive: true })
  for (const id of ids) writeFileSync(join(agentsDir, `${id}.md`), `# ${id} del repo`)
  return dir
}

describe('agentsForProject', () => {
  it('cede al repo un agente de personalizacion que el mismo define', () => {
    const payload = agentsForProject(repoWithAgents('refactor-cleaner'))
    expect(payload['refactor-cleaner']).toBeUndefined()
  })

  it('NUNCA cede el security-reviewer: el repo no puede suplantar al auditor', () => {
    const payload = agentsForProject(repoWithAgents('security-reviewer', 'refactor-cleaner'))
    expect(payload['security-reviewer']).toBeDefined() // gana el de FORTRESS
    expect(payload['refactor-cleaner']).toBeUndefined() // ese si se cede
  })

  it('tampoco cede a sentinel-omega, el meta-auditor', () => {
    expect(agentsForProject(repoWithAgents('sentinel-omega'))['sentinel-omega']).toBeDefined()
  })

  it('ni al productor: un productor.md del repo no le cambia el modelo ni el prompt', () => {
    // Sin esto, el codigo auditado decidiria con que nivel se arregla a si mismo.
    const payload = agentsForProject(repoWithAgents('productor'))
    expect(payload.productor?.model).toBe(MODELO_DEL_PRODUCTOR)
    expect(payload.productor?.prompt).toContain('PRODUCTOR del Terminal')
  })
})
