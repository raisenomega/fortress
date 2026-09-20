import { describe, expect, it } from 'vitest'
import { barrerasRotas } from './barrera-rota'
import { hooksDeclarados } from './hook-del-proyecto'
import { RAISEN_NUCLEO, soloPython3 } from './hook-fixture'

const hooks = hooksDeclarados(RAISEN_NUCLEO, 'PreToolUse')

describe('una barrera declarada que no puede arrancar', () => {
  it('el interprete AUSENTE la delata, con la alternativa que si existe', () => {
    expect(barrerasRotas(hooks, soloPython3)).toEqual([
      { matcher: 'Write|Edit|MultiEdit', guion: 'protect-invariants.py', interprete: 'python', alternativa: 'python3' } // prettier-ignore
    ])
  })

  it('si el interprete existe NO hay barrera rota', () => {
    expect(barrerasRotas(hooks, () => true)).toEqual([])
  })

  it('sin alternativa en el PATH lo dice, en vez de inventarse una', () => {
    expect(barrerasRotas(hooks, () => false)[0]?.alternativa).toBeNull()
  })

  it('un comando vacio no es una barrera rota: es una entrada sin hook', () => {
    // No se inventa un hallazgo donde el proyecto no declaro nada.
    expect(barrerasRotas([{ matcher: 'Write', comando: '   ' }], () => false)).toEqual([])
  })

  it('sin hooks no hay nada que mirar', () => {
    expect(barrerasRotas([], () => false)).toEqual([])
  })

  it('dos hooks rotos salen los dos: no se queda con el primero', () => {
    const dos = [
      { matcher: 'Write', comando: 'python a.py' },
      { matcher: 'Edit', comando: 'ruby b.rb' }
    ]

    expect(barrerasRotas(dos, () => false)).toHaveLength(2)
  })
})
