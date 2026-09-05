import { describe, expect, it } from 'vitest'
import { globDeAlcanceValido } from './glob-de-alcance'
import { parseScopeGroups } from './scope-groups'
import { allowsFor } from './scope-check'
import { permitido } from './scope-check'

const config = (allow: readonly string[], when = 'src/a.ts'): unknown => ({
  scope: { groups: [{ name: 'g', when, allow }] }
})

describe('un glob del repo auditado no puede decir "todo"', () => {
  it.each(['**', '**/*', '**/**'])('%s se rechaza: abriria el proyecto entero', (patron) => {
    expect(globDeAlcanceValido(patron)).toBe(false)
  })

  it.each(['src/**', '**/*.ts', 'docs/*.md', '*', 'a/b/c.ts'])('%s pasa', (patron) => {
    expect(globDeAlcanceValido(patron)).toBe(true)
  })

  it.each(['/**', '/etc/**', '../**', 'a/../b'])('%s se rechaza aunque hoy no abra nada', (p) => {
    // `fuera()` y la resta INNEGOCIABLE ya los tapan —medido: abren cero—, pero
    // aceptarlos calla un error: quien escribio `/**` creyo abrir algo.
    expect(globDeAlcanceValido(p)).toBe(false)
  })
})

describe('la correa no se puede apagar desde el .fortress/config', () => {
  it('un allow universal ya no ensancha nada: el grupo entero cae', () => {
    const grupos = parseScopeGroups(config(['**']))

    expect(grupos).toEqual([])
    expect(permitido('package.json', [], allowsFor('src/a.ts', grupos))).toBe(false)
  })

  it('un `when` universal tampoco: activaria el grupo para TODO hallazgo', () => {
    expect(parseScopeGroups(config(['src/**'], '**'))).toEqual([])
  })

  it('un grupo legitimo sigue funcionando igual que ayer', () => {
    const grupos = parseScopeGroups(config(['src/**']))

    expect(grupos).toHaveLength(1)
    expect(permitido('src/domain/x.ts', [], allowsFor('src/a.ts', grupos))).toBe(true)
  })

  it('un solo glob malo invalida la lista: media declaracion es peor que ninguna', () => {
    // La doctrina que ya seguia parseScopeGroups, no una nueva.
    expect(parseScopeGroups(config(['src/**', '**']))).toEqual([])
  })
})
