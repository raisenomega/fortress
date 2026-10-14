import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { alcanza, olvidarImports } from './grafo-de-imports'

let root: string

beforeAll(() => {
  root = carpetaDePrueba('.fortress-grafo-')
  mkdirSync(join(root, 'src'))
  const f = (n: string, b: string): void => writeFileSync(join(root, 'src', n), b)
  // cadena: a → b → c → d → e  (e esta a 4 saltos de a)
  f('a.ts', "import './b'\nimport 'node:fs'\n") // el paquete externo se ignora
  f('b.ts', "import './c'\n")
  f('c.ts', "import './d'\n")
  f('d.ts', "import './e'\n")
  f('e.ts', 'export const e = 1\n')
  f('ciclo1.ts', "import './ciclo2'\n")
  f('ciclo2.ts', "import './ciclo1'\n")
})
afterAll(() => {
  limpiarCarpetasDePrueba()
  olvidarImports()
})

describe('alcanza: BFS de imports con cap de saltos', () => {
  it('alcanza dentro del cap (2 y 3 saltos)', () => {
    expect(alcanza(root, 'src/a.ts', 'src/c.ts')).toBe(true) // 2
    expect(alcanza(root, 'src/a.ts', 'src/d.ts')).toBe(true) // 3 = cap
  })
  it('NO alcanza mas alla del cap (4 saltos)', () => {
    expect(alcanza(root, 'src/a.ts', 'src/e.ts')).toBe(false) // 4 > 3
  })
  it('dirigido: b no alcanza a (solo se siguen imports)', () => {
    expect(alcanza(root, 'src/b.ts', 'src/a.ts')).toBe(false)
  })
  it('un ciclo no cuelga', () => {
    expect(alcanza(root, 'src/ciclo1.ts', 'src/ciclo2.ts')).toBe(true)
    expect(alcanza(root, 'src/ciclo1.ts', 'src/ausente.ts')).toBe(false)
  })
})
