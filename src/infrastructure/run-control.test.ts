import { beforeEach, describe, expect, it } from 'vitest'
import { cancelRun, endMerge, endRun, isCancelled, isRunning, tryBeginMerge, tryBeginRun } from './run-control' // prettier-ignore

beforeEach(() => {
  endRun('p1')
  endRun('p2')
})

describe('tryBeginRun', () => {
  it('deja arrancar la primera', () => {
    expect(tryBeginRun('p1')).toBe(true)
    expect(isRunning('p1')).toBe(true)
  })

  it('rechaza la segunda en el mismo proyecto', () => {
    // La guardia vivia solo en el renderer: quien llamara al canal IPC podia
    // lanzar diez escaneos a la vez, y son diez procesos gastando cuota.
    tryBeginRun('p1')
    expect(tryBeginRun('p1')).toBe(false)
  })

  it('no bloquea otro proyecto distinto', () => {
    tryBeginRun('p1')
    expect(tryBeginRun('p2')).toBe(true)
  })

  it('al terminar se puede volver a arrancar', () => {
    tryBeginRun('p1')
    endRun('p1')
    expect(tryBeginRun('p1')).toBe(true)
  })

  it('arrancar limpia una cancelacion anterior', () => {
    tryBeginRun('p1')
    cancelRun('p1')
    endRun('p1')

    tryBeginRun('p1')
    expect(isCancelled('p1')).toBe(false)
  })
})

describe('cancelRun', () => {
  it('marca la cancelacion para que no sigan los pasos', () => {
    tryBeginRun('p1')
    cancelRun('p1')
    expect(isCancelled('p1')).toBe(true)
  })
})

describe('tryBeginMerge: el turno del merge es otro turno', () => {
  it('el motor corriendo no impide empezar un merge', () => {
    tryBeginRun('p1')
    expect(tryBeginMerge('p1')).toBe(true)
    endMerge('p1')
  })

  it('pero dos merges del mismo proyecto no caben', () => {
    expect(tryBeginMerge('p1')).toBe(true)
    expect(tryBeginMerge('p1')).toBe(false)
    endMerge('p1')
  })

  it('empezar un merge no borra la cancelacion del motor', () => {
    tryBeginRun('p1')
    cancelRun('p1')
    tryBeginMerge('p1')
    endMerge('p1')
    expect(isCancelled('p1')).toBe(true)
    expect(isRunning('p1')).toBe(true)
  })
})
