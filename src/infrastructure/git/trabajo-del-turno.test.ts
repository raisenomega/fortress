import { afterEach, describe, expect, it } from 'vitest'
import { abrirCheckpoint } from './checkpoint-transitorio'
import { leerTrabajo } from './trabajo-del-turno'
import { crearRepo, escribir, limpiar } from './checkpoint-fixture'

const dirs: string[] = []
afterEach(() => limpiar(dirs))
const repo = (): string => {
  const dir = crearRepo()
  dirs.push(dir)
  return dir
}

/**
 * `diff()` nace SIN llamante: lo usara el turno del Terminal en la Fase A.1b.
 * Se prueba igual, y contra git de verdad, porque de el sale lo que OMEGA
 * juzgara antes de conservar nada — si miente, conserva un fix que nadie vio.
 */
describe('lo que el agente dejo escrito en el turno', () => {
  it('el diff es lo del AGENTE, no el WIP que el operador tenia a medias', () => {
    const dir = repo()
    escribir(dir, 'a.txt', 'base\nwip del humano\n') // sin guardar, antes del turno
    const cp = abrirCheckpoint(dir)
    escribir(dir, 'a.txt', 'base\nwip del humano\nlo que edito el agente\n')

    const trabajo = leerTrabajo(dir, cp?.sha ?? '')

    expect(trabajo?.diffText).toContain('lo que edito el agente')
    expect(trabajo?.diffText).not.toContain('+wip del humano')
    expect(trabajo?.tocados).toEqual(['a.txt'])
    cp?.revertir()
  })

  it('`previo` da el fichero como estaba ANTES del turno', () => {
    const dir = repo()
    const cp = abrirCheckpoint(dir)
    escribir(dir, 'a.txt', 'reescrito entero\n')

    expect(leerTrabajo(dir, cp?.sha ?? '')?.previo('a.txt')).toBe('base\n')
    cp?.revertir()
  })

  it('un fichero que el agente CREO no existia antes: cadena vacia, no un error', () => {
    const dir = repo()
    const cp = abrirCheckpoint(dir)
    escribir(dir, 'nuevo.ts', 'export const x = 1\n')

    expect(leerTrabajo(dir, cp?.sha ?? '')?.previo('nuevo.ts')).toBe('')
    cp?.revertir()
  })

  it('sin ediciones el diff va vacio y no toca nada', () => {
    const dir = repo()
    const cp = abrirCheckpoint(dir)

    const trabajo = leerTrabajo(dir, cp?.sha ?? '')

    expect(trabajo?.tocados).toEqual([])
    expect(trabajo?.diffText).toBe('')
    cp?.revertir()
  })
})
