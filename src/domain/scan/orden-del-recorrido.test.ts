import { describe, expect, it } from 'vitest'
import { paradasDeTema } from './modulos-de-tema'
import { ordenDelRecorrido } from './orden-del-recorrido'
import { esDeTema, rotuloDe, type Parada, type ParadaDeCarpeta } from './parada'

const carpeta = (nombre: string): ParadaDeCarpeta => ({
  clase: 'carpeta',
  carpeta: nombre,
  ficheros: [`${nombre}/a.ts`]
})

const MEZCLA: readonly Parada[] = [
  carpeta('web'),
  carpeta('auth'),
  carpeta('utils'),
  ...paradasDeTema(['M2', 'M7'])
]

describe('las carpetas primero, los temas al final', () => {
  it('lo sensible delante, y los dos temas cerrando', () => {
    expect(ordenDelRecorrido(MEZCLA).map(rotuloDe)).toEqual([
      'auth',
      'web',
      'utils',
      'M2 DR/BCP — todo el proyecto',
      'M7 Gobernanza del SDLC — todo el proyecto'
    ])
  })

  it('NINGUN tema se cuela antes de una carpeta', () => {
    const clases = ordenDelRecorrido(MEZCLA).map((p) => (esDeTema(p) ? 'tema' : 'carpeta'))

    expect(clases.indexOf('tema')).toBe(clases.lastIndexOf('carpeta') + 1)
  })

  it('ni aunque los temas lleguen primero en el manifiesto', () => {
    const alReves = [...paradasDeTema(['M2']), carpeta('utils')]

    expect(ordenDelRecorrido(alReves).map(rotuloDe)).toEqual([
      'utils',
      'M2 DR/BCP — todo el proyecto'
    ])
  })

  it('sin temas, el orden es EXACTAMENTE el de la Fase 2', () => {
    const soloCarpetas = [carpeta('web'), carpeta('auth'), carpeta('utils')]

    expect(ordenDelRecorrido(soloCarpetas).map(rotuloDe)).toEqual(['auth', 'web', 'utils'])
  })
})
