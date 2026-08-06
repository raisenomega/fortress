import { describe, expect, it } from 'vitest'
import type { NewProject, Project } from '@domain/project/project'
import type { AppContext } from '../context'
import { addProject } from './add-project'

function ctx(existing: boolean): AppContext {
  return {
    projects: {
      findByPath: () => (existing ? ({ id: 'x' } as Project) : null),
      add: (input: NewProject) => ({ id: 'p1', ...input }) as Project
    }
  } as unknown as AppContext
}

function input(over: Partial<NewProject> = {}): NewProject {
  return {
    name: 'Proyecto',
    path: '/tmp/proyecto',
    stack: 'node',
    gitRemote: null,
    gitBranch: null,
    hasClaude: false,
    ...over
  }
}

describe('addProject', () => {
  it('agrega un proyecto valido con ruta absoluta', () => {
    expect(addProject(ctx(false), input()).ok).toBe(true)
  })

  it('rechaza nombre vacio', () => {
    expect(addProject(ctx(false), input({ name: '  ' })).ok).toBe(false)
  })

  it('rechaza ruta vacia', () => {
    expect(addProject(ctx(false), input({ path: '' })).ok).toBe(false)
  })

  it('rechaza ruta relativa o con traversal: el renderer no es de confianza', () => {
    expect(addProject(ctx(false), input({ path: '../secretos' })).ok).toBe(false)
    expect(addProject(ctx(false), input({ path: 'relativa/x' })).ok).toBe(false)
  })

  it('rechaza una ruta ya registrada: la ruta es la identidad', () => {
    expect(addProject(ctx(true), input()).ok).toBe(false)
  })
})
