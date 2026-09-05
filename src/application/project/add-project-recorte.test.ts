import { describe, expect, it } from 'vitest'
import type { NewProject, Project } from '@domain/project/project'
import type { AppContext } from '../context'
import { addProject } from './add-project'

/** Apunta lo que la base RECIBIO, que es lo que importa aqui. */
function banco(existing = false): { ctx: AppContext; recibido: () => NewProject | null } {
  let recibido: NewProject | null = null
  const ctx = {
    projects: {
      findByPath: (p: string) => (existing && p === '/home/jojo/proj' ? ({ id: 'x' } as Project) : null), // prettier-ignore
      add: (input: NewProject) => ((recibido = input), { id: 'p1', ...input }) as Project
    }
  } as unknown as AppContext
  return { ctx, recibido: () => recibido }
}

const nuevo = (over: Partial<NewProject>): NewProject =>
  ({ name: 'P', path: '/home/jojo/proj', stack: 'node', gitRemote: null, ...over }) as NewProject

describe('lo validado y lo guardado son la misma cadena', () => {
  it('la ruta se guarda RECORTADA, no como llego', () => {
    // Se validaba con trim y se persistia sin el: el control miraba una cadena
    // y la base guardaba otra.
    const b = banco()

    expect(addProject(b.ctx, nuevo({ path: '  /home/jojo/proj  ' }))).toMatchObject({ ok: true })
    expect(b.recibido()?.path).toBe('/home/jojo/proj')
  })

  it('el duplicado se detecta pese al espacio: la ruta es la identidad', () => {
    expect(addProject(banco(true).ctx, nuevo({ path: '/home/jojo/proj ' }))).toMatchObject({ ok: false }) // prettier-ignore
  })

  it('el nombre tambien se recorta', () => {
    const b = banco()
    addProject(b.ctx, nuevo({ name: '  P  ' }))

    expect(b.recibido()?.name).toBe('P')
  })
})
