import { beforeEach, describe, expect, it, vi } from 'vitest'

const arrancados: number[] = []
const parados: number[] = []
let siguiente = 1

vi.mock('electron', () => ({
  powerSaveBlocker: {
    start: (tipo: string): number => {
      arrancados.push(siguiente)
      void tipo
      return siguiente++
    },
    stop: (id: number): void => void parados.push(id),
    isStarted: (id: number): boolean => arrancados.includes(id) && !parados.includes(id)
  }
}))

const { keepAwakeOrigins, releaseKeepAwake, requestKeepAwake } = await import('./keep-awake')

const vivos = (): number => arrancados.filter((id) => !parados.includes(id)).length

describe('keep-awake: el candado se cuenta por quien lo pide', () => {
  beforeEach(() => {
    releaseKeepAwake('operator')
    releaseKeepAwake('loop')
    arrancados.length = 0
    parados.length = 0
  })

  it('una peticion levanta los DOS candados: pantalla y suspension', () => {
    requestKeepAwake('operator')
    expect(vivos()).toBe(2)
  })

  it('pedirlo dos veces desde el mismo sitio no duplica nada', () => {
    requestKeepAwake('loop')
    const tras = vivos()
    requestKeepAwake('loop')
    expect(vivos()).toBe(tras)
    expect(keepAwakeOrigins()).toEqual(['loop'])
  })

  it('el loop terminando NO suelta lo que pidio el operador', () => {
    requestKeepAwake('operator')
    requestKeepAwake('loop')
    releaseKeepAwake('loop')
    expect(vivos()).toBe(2)
    expect(keepAwakeOrigins()).toEqual(['operator'])
  })

  it('solo cuando nadie lo pide se suelta', () => {
    requestKeepAwake('operator')
    requestKeepAwake('loop')
    releaseKeepAwake('loop')
    releaseKeepAwake('operator')
    expect(vivos()).toBe(0)
    expect(keepAwakeOrigins()).toEqual([])
  })

  it('soltar algo que nadie pidio no rompe nada', () => {
    releaseKeepAwake('loop')
    expect(vivos()).toBe(0)
  })
})
