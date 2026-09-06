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

describe('la ruta se recorta UNA vez y vale para las tres cosas', () => {
  it('el arbol en disco, el duplicado y la fila son la MISMA ruta', async () => {
    // Antes se validaba y se hacia `git init` sobre la CRUDA y `addProject`
    // persistia la recortada: el `.git` quedaba en `/tmp/nueva ` y la fila en
    // `/tmp/nueva`. Dos rutas para un proyecto, y la ruta ES la identidad. El
    // duplicado tampoco se veia: comparaba la cruda contra filas recortadas.
    const { context, added } = ctx()
    const iniciados: string[] = []
    const buscadas: string[] = []
    const espia = { ...context, projects: { ...context.projects, findByPath: (p: string) => (buscadas.push(p), null) } } as unknown as AppContext // prettier-ignore
    const init = (cwd: string): Promise<Result<string>> => (iniciados.push(cwd), Promise.resolve(ok('init'))) // prettier-ignore

    const r = await registerEmptyProject(espia, init, { ...input, path: '/tmp/nueva ' })

    expect(r.ok).toBe(true)
    expect(iniciados).toEqual(['/tmp/nueva'])
    expect(added[0].path).toBe('/tmp/nueva')
    // Todas las consultas —la de aqui y la de `addProject`— con la recortada.
    expect([...new Set(buscadas)]).toEqual(['/tmp/nueva'])
  })
})

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

  it('rechaza ruta relativa SIN llegar a git init (valida antes del efecto)', async () => {
    const { context } = ctx()
    let initRan = false
    const trackInit = (): Promise<Result<string>> => {
      initRan = true
      return Promise.resolve(ok('init'))
    }
    const r = await registerEmptyProject(context, trackInit, { ...input, path: '../fuera' })
    expect(r.ok).toBe(false)
    expect(initRan).toBe(false)
  })
})
