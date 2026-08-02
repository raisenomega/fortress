import { describe, expect, it, vi } from 'vitest'
import { EMPTY_DRAFT } from '@domain/newproject/new-project-draft'
import { ok } from '@domain/shared/result'
import { createFolder, planFolder, type FolderTools } from './prepare-folder'

const draft = { ...EMPTY_DRAFT, name: 'Mi App', parentDir: '/home/jojo/Escritorio' }

const tools = (existing: string | null = null): FolderTools => ({
  describeExisting: () => existing,
  create: vi.fn(() => ok('/home/jojo/Escritorio/mi-app'))
})

describe('planFolder', () => {
  it('ensena la ruta final antes de crear nada', () => {
    const plan = planFolder(tools(), draft)
    expect(plan.ok && plan.value.target).toBe('/home/jojo/Escritorio/mi-app')
  })

  it('avisa de lo que ya hay dentro, con datos concretos', () => {
    const plan = planFolder(tools('3 elementos, entre ellos src, package.json'), draft)
    expect(plan.ok && plan.value.existing).toContain('package.json')
  })

  it('sin destino elegido no hay plan', () => {
    expect(planFolder(tools(), { ...draft, parentDir: '' }).ok).toBe(false)
  })
})

describe('createFolder', () => {
  it('crea en la ruta que se enseno, no en otra', () => {
    const herramientas = tools()
    createFolder(herramientas, draft, false)

    expect(herramientas.create).toHaveBeenCalledWith(
      '/home/jojo/Escritorio',
      '/home/jojo/Escritorio/mi-app',
      false
    )
  })

  it('no llega a tocar disco si el nombre no vale', () => {
    const herramientas = tools()
    const salida = createFolder(herramientas, { ...draft, name: '###' }, false)

    expect(salida.ok).toBe(false)
    expect(herramientas.create).not.toHaveBeenCalled()
  })

  it('traslada la decision de reutilizar, no la toma por su cuenta', () => {
    const herramientas = tools('2 elementos')
    createFolder(herramientas, draft, true)

    expect(herramientas.create).toHaveBeenCalledWith(expect.anything(), expect.anything(), true)
  })
})
