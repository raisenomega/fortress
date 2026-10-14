import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { resolverImport } from './resolver-de-import'
import type { Alias } from './alias-de-tsconfig'

let root: string
const AL: readonly Alias[] = [{ prefijo: '@a/', destino: 'src/a/' }]

beforeAll(() => {
  root = carpetaDePrueba('.fortress-resolver-')
  mkdirSync(join(root, 'src', 'a', 'idx'), { recursive: true })
  mkdirSync(join(root, 'src', 'b'), { recursive: true })
  writeFileSync(join(root, 'src', 'a', 'x.ts'), '')
  writeFileSync(join(root, 'src', 'a', 'idx', 'index.ts'), '')
  writeFileSync(join(root, 'src', 'b', 'y.tsx'), '')
})
afterAll(limpiarCarpetasDePrueba)

describe('resolverImport: alias + relativo + index, conservador', () => {
  const R = (from: string, spec: string): string | null => resolverImport(root, AL, from, spec)
  it('alias → fichero .ts', () => expect(R('src/z.ts', '@a/x')).toBe('src/a/x.ts'))
  it('relativo a /index.ts', () => expect(R('src/a/x.ts', './idx')).toBe('src/a/idx/index.ts'))
  it('relativo .tsx entre carpetas', () => expect(R('src/a/x.ts', '../b/y')).toBe('src/b/y.tsx'))
  it('paquete externo → null', () => expect(R('src/a/x.ts', 'electron')).toBeNull())
  it('alias no declarado → null', () => expect(R('src/a/x.ts', '@z/x')).toBeNull())
  it('fichero inexistente → null', () => expect(R('src/a/x.ts', './nope')).toBeNull())
  it('traversal fuera de la raiz → null', () =>
    expect(R('src/a/x.ts', '../../../etc/passwd')).toBeNull())
})
