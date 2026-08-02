import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, describe, expect, it } from 'vitest'
import { projectAgentIds } from './project-agents'

const raiz = mkdtempSync(join(tmpdir(), 'fortress-agents-'))
const conAgentes = join(raiz, 'con')
const sinAgentes = join(raiz, 'sin')

mkdirSync(join(conAgentes, '.claude', 'agents'), { recursive: true })
mkdirSync(sinAgentes, { recursive: true })
writeFileSync(join(conAgentes, '.claude', 'agents', 'security-reviewer.md'), '# el mio')
writeFileSync(join(conAgentes, '.claude', 'agents', 'README.txt'), 'no es un agente')

afterAll(() => rmSync(raiz, { recursive: true, force: true }))

describe('projectAgentIds', () => {
  it('detecta los agentes que el proyecto define', () => {
    // Se usan para NO pisarlos: si el operador escribio su security-reviewer,
    // FORTRESS no inyecta el suyo encima.
    expect(projectAgentIds(conAgentes).has('security-reviewer')).toBe(true)
  })

  it('ignora lo que no sea un .md', () => {
    expect(projectAgentIds(conAgentes).size).toBe(1)
  })

  it('un proyecto sin .claude/agents no tiene ninguno', () => {
    expect(projectAgentIds(sinAgentes).size).toBe(0)
  })

  it('una ruta que no existe no revienta', () => {
    expect(projectAgentIds('/no/existe/en/ningun/sitio').size).toBe(0)
  })
})
