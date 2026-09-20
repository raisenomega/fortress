import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { RAISEN_NUCLEO } from '@domain/project/hook-fixture'
import { barrerasDelProyecto } from './barreras-del-proyecto'
import { pathSinPython, proyectoCon, restaurarPath } from './path-de-prueba'

beforeAll(pathSinPython)
afterAll(restaurarPath)

describe('el pre-vuelo sobre un proyecto de verdad', () => {
  it('destapa la barrera muerta de `raisen-nucleo`', () => {
    expect(barrerasDelProyecto(proyectoCon(RAISEN_NUCLEO))).toEqual([
      { matcher: 'Write|Edit|MultiEdit', guion: 'protect-invariants.py', interprete: 'python', alternativa: 'python3' } // prettier-ignore
    ])
  })

  it('con el interprete arreglado, la barrera esta sana', () => {
    const sano = JSON.parse(JSON.stringify(RAISEN_NUCLEO).replace(/"python /g, '"python3 '))

    expect(barrerasDelProyecto(proyectoCon(sano))).toEqual([])
  })

  it('SOLO mira PreToolUse: es el unico evento que puede decir que NO', () => {
    // El PostToolUse del fichero real tambien invoca `python` y tambien esta
    // roto. Pierde un aviso; no deja pasar una escritura. No es esta barrera.
    const soloPost = { hooks: { PostToolUse: RAISEN_NUCLEO.hooks.PostToolUse } }

    expect(barrerasDelProyecto(proyectoCon(soloPost))).toEqual([])
  })
})

describe('y la duda NO es un hallazgo', () => {
  it('un proyecto sin `.claude/settings.json` no tiene barreras rotas', () => {
    expect(barrerasDelProyecto(proyectoCon(null))).toEqual([])
  })

  it('un settings ilegible tampoco: no haber podido mirar no es estar roto', () => {
    // Y no es teorico: en autonomo, «esta roto» bloquea el lote. Afirmarlo
    // porque el fichero no se dejo leer seria parar el trabajo por una duda.
    const raiz = proyectoCon({})
    writeFileSync(join(raiz, '.claude', 'settings.json'), '{ esto no es json')

    expect(barrerasDelProyecto(raiz)).toEqual([])
  })

  it('una carpeta que no existe tampoco revienta', () => {
    expect(barrerasDelProyecto('/no/existe/en/ningun/sitio')).toEqual([])
  })
})
