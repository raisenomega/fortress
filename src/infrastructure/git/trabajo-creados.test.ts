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
 * ADR-093 §4, la grieta que OMEGA encontro SOLA el 18-sep: `git diff` no ve los
 * untracked, asi que un fichero que el agente CREA era invisible para el juez.
 * Contra git de verdad, porque el defecto era de git, no de la logica.
 */
describe('lo que el agente CREA llega al juez', () => {
  it('un fichero nuevo aparece en tocados: antes ni se juzgaba', () => {
    // Con `tocados` vacio, `juez-del-turno.ts:39` devuelve SIN_JUZGAR. Un turno
    // que solo creaba ficheros pasaba entero sin que nadie lo mirara.
    const dir = repo()
    const cp = abrirCheckpoint(dir)
    escribir(dir, 'nuevo.ts', 'export const x = 1\n')

    expect(leerTrabajo(dir, cp?.sha ?? '')?.tocados).toEqual(['nuevo.ts'])
  })

  it('y su CONTENIDO entra en el diff, con forma de alta', () => {
    const dir = repo()
    const cp = abrirCheckpoint(dir)
    escribir(dir, 'nuevo.ts', 'export const x = 1\n')

    const { diffText = '' } = leerTrabajo(dir, cp?.sha ?? '') ?? {}

    expect(diffText).toContain('new file mode')
    expect(diffText).toContain('+++ b/nuevo.ts')
    expect(diffText).toContain('+export const x = 1')
  })

  it('EL CASO DEL 18-sep: edita uno y crea otro, y OMEGA ve LOS DOS', () => {
    // «El DIFF DEL FIX solo mostro vercel.json, pero el worktree traia ademas un
    // archivo NUEVO sin trackear que codifica la CSP como codigo.» — OMEGA.
    const dir = repo()
    escribir(dir, 'vercel.json', '{}\n')
    const cp = abrirCheckpoint(dir)
    escribir(dir, 'vercel.json', '{"headers":[]}\n')
    escribir(dir, 'csp.test.ts', 'it("csp", () => {})\n')

    const trabajo = leerTrabajo(dir, cp?.sha ?? '')

    expect(trabajo?.tocados).toEqual(['vercel.json', 'csp.test.ts'])
    expect(trabajo?.diffText).toContain('"headers"')
    expect(trabajo?.diffText).toContain('+it("csp"')
  })
})

describe('y lo que NO es del agente se queda fuera', () => {
  it('el untracked que el operador tenia ANTES no se cuela como del agente', () => {
    // El invariante del §4.2: el `add -A` del checkpoint barre el WIP —untracked
    // incluido— al snapshot, asi que despues lo unico sin trackear es del agente.
    const dir = repo()
    escribir(dir, 'borrador-del-humano.md', 'notas mias\n')
    const cp = abrirCheckpoint(dir)
    escribir(dir, 'del-agente.ts', 'export const y = 2\n')

    const trabajo = leerTrabajo(dir, cp?.sha ?? '')

    expect(trabajo?.tocados).toEqual(['del-agente.ts'])
    expect(trabajo?.diffText).not.toContain('notas mias')
  })
})
