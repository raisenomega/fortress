import { describe, expect, it } from 'vitest'
import { computeAllowedFiles } from './allowed-files'

/** La prosa que el analista escribe y de la que se pescan los extras. */
const PROSA =
  'El defecto entra por index.ts, pero la configuracion vive en .mcp.json y el ' +
  'manifiesto en package.json; tambien se usa util.ts para el arranque.'

const correa = (primaryFile: string, hint = PROSA): readonly string[] =>
  computeAllowedFiles({ primaryFile, hint })

describe('con el ancla en la RAIZ, la prosa no ensancha la correa', () => {
  it('.mcp.json NO entra: es el fichero con los tokens de terceros', () => {
    // Antes entraba. `dir` quedaba vacio y "mismo directorio que el ancla"
    // pasaba a ser "cualquier fichero de la raiz", que es donde esta la config.
    expect(correa('index.ts')).not.toContain('.mcp.json')
  })

  it('los manifiestos tampoco', () => {
    expect(correa('index.ts')).not.toContain('package.json')
  })

  it('el ancla y sus hermanos SI entran: un fix en la raiz se sigue haciendo', () => {
    expect(correa('index.ts')).toEqual(['index.ts', 'index.test.ts', 'index.spec.ts'])
  })

  it('ni siquiera un extra inocente de la raiz: se restaura la condicion, no sus excepciones', () => {
    // `util.ts` no tiene nada de malo, y aun asi se queda fuera. Admitirlo
    // exigiria decidir cual de la raiz es peligroso y cual no — una lista que se
    // queda corta el dia que alguien anade un fichero que nadie recordo.
    expect(correa('index.ts')).not.toContain('util.ts')
  })
})

describe('y en un subdirectorio todo sigue igual', () => {
  it('el hermano del mismo dir entra, como siempre', () => {
    const files = correa('src/a.ts', 'el arreglo toca src/a.ts y tambien src/b.ts')

    expect(files).toContain('src/b.ts')
    expect(files).toContain('src/a.test.ts')
  })

  it('la configuracion de la raiz nunca entro desde un subdirectorio', () => {
    // No-regresion: aqui el prefijo del directorio ya la filtraba.
    expect(correa('src/a.ts')).not.toContain('.mcp.json')
  })

  it('un dir profundo tampoco arrastra al de arriba', () => {
    const files = correa('src/domain/repair/a.ts', 'ver src/domain/repair/b.ts y src/otro.ts')

    expect(files).toContain('src/domain/repair/b.ts')
    expect(files).not.toContain('src/otro.ts')
  })
})
