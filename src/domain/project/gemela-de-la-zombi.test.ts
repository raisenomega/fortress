import { describe, expect, it } from 'vitest'
import { gemelaDe, type Candidata } from './gemela-de-la-zombi'

const c = (id: string, line: number, file = 'a/index.ts'): Candidata => ({
  id,
  file,
  line,
  tipo: 'relay-abierto',
  identity: `${file}|${line}|relay-abierto`
})

/** Medido en mailbd: 62 de 98 zombis tienen una fila ADR-084 viva en el mismo
 *  fichero a 3 lineas o menos; 52 en la misma linea exacta. */
describe('gemelaDe: la fila de hoy que dice el mismo sitio', () => {
  it('prefiere la linea exacta a la cercana', () => {
    expect(
      gemelaDe({ file: 'a/index.ts', line: 364 }, [c('lejos', 362), c('exacta', 364)])?.id
    ).toBe('exacta')
  })

  it('a 3 lineas si; a 4 no', () => {
    expect(gemelaDe({ file: 'a/index.ts', line: 10 }, [c('tres', 13)])?.id).toBe('tres')
    expect(gemelaDe({ file: 'a/index.ts', line: 10 }, [c('cuatro', 14)])).toBeNull()
  })

  it('otro fichero no es gemela aunque la linea coincida', () => {
    expect(gemelaDe({ file: 'a/index.ts', line: 10 }, [c('x', 10, 'b/index.ts')])).toBeNull()
  })

  it('a igual distancia, el id menor: dos corridas deciden lo mismo', () => {
    expect(gemelaDe({ file: 'a/index.ts', line: 10 }, [c('b', 11), c('a', 9)])?.id).toBe('a')
  })

  it('sin linea no hay gemela: el sitio no se puede comparar', () => {
    expect(gemelaDe({ file: 'a/index.ts', line: null }, [c('x', 10)])).toBeNull()
  })
})
