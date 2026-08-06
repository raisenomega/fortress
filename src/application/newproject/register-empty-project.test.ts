import { describe, expect, it } from 'vitest'
import type { NewProject, Project } from '@domain/project/project'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { registerEmptyProject } from './register-empty-project'

function ctx(): { context: AppContext; added: NewProject[] } {
  const added: NewProject[] = []
  const context = {
    projects: {
      findByPath: () => null,
      add: (p: NewProject): Project => {
        added.push(p)
        return { id: 'p1', ...p } as Project
      }
    }
  } as unknown as AppContext
  return { context, added }
}

const okInit = (): Promise<Result<string>> => Promise.resolve(ok('init'))
const input = { name: 'Nueva', path: '/tmp/nueva', stack: '' }

describe('registerEmptyProject', () => {
  it('registra el proyecto en PENDIENTE_CONFIGURACION tras git init', async () => {
    const { context, added } = ctx()
    const r = await registerEmptyProject(context, okInit, input)
    expect(r.ok).toBe(true)
    expect(added[0].configState).toBe('PENDIENTE_CONFIGURACION')
  })

  it('si git init falla, no registra nada', async () => {
    const { context, added } = ctx()
    const r = await registerEmptyProject(context, () => Promise.resolve(err('sin git')), input)
    expect(r.ok).toBe(false)
    expect(added).toHaveLength(0)
  })

  it('reusa la validacion de addProject: rechaza ruta relativa', async () => {
    const { context } = ctx()
    const r = await registerEmptyProject(context, okInit, { ...input, path: '../fuera' })
    expect(r.ok).toBe(false)
  })
})
