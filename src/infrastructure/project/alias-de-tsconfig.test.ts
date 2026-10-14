import { afterAll, describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { aliasDelProyecto } from './alias-de-tsconfig'

afterAll(limpiarCarpetasDePrueba)

describe('aliasDelProyecto: lee los paths del tsconfig, tolerante', () => {
  it('parsea paths con comentarios y coma colgante', () => {
    const root = carpetaDePrueba('.fortress-alias-')
    writeFileSync(
      join(root, 'tsconfig.node.json'),
      '{\n  // los alias del proyecto\n  "compilerOptions": {\n    "paths": {\n      "@domain/*": ["src/domain/*"],\n      "@app/*": ["src/application/*"],\n    }\n  }\n}\n'
    )
    expect([...aliasDelProyecto(root)]).toEqual([
      { prefijo: '@domain/', destino: 'src/domain/' },
      { prefijo: '@app/', destino: 'src/application/' }
    ])
  })
  it('sin tsconfig → vacio (cae a solo-relativo)', () => {
    expect(aliasDelProyecto(carpetaDePrueba('.fortress-alias-'))).toEqual([])
  })
})
