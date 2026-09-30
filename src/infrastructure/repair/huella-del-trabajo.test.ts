import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { codigo } from '@domain/repair/innegociables-fixture'
import { huellaDelTrabajo } from './huella-del-trabajo'

const raiz = mkdtempSync(join(tmpdir(), 'fortress-huella-'))
afterAll(() => rmSync(raiz, { recursive: true, force: true }))

/** Un worktree como el que el motor crea: nace en su base, sin cambios. */
function repo(nombre: string): string {
  const dir = join(raiz, nombre)
  mkdirSync(dir, { recursive: true })
  const g = (...args: string[]): void => void execFileSync('git', args, { cwd: dir, stdio: 'ignore' })
  g('init', '-q', '.')
  g('config', 'user.email', 'prueba@fortress')
  g('config', 'user.name', 'prueba')
  writeFileSync(join(dir, 'a.txt'), 'uno\ndos\n')
  g('add', '-A')
  g('commit', '-qm', 'base')
  return dir
}

describe('la huella del trabajo del generador', () => {
  it('un arbol sin cambios tiene huella, y es estable', async () => {
    const dir = repo('limpio')
    const uno = await huellaDelTrabajo(dir)

    expect(uno).toMatch(/^[0-9a-f]{40}$/)
    expect(await huellaDelTrabajo(dir)).toBe(uno)
  })

  it('una edicion la mueve', async () => {
    const dir = repo('editado')
    const antes = await huellaDelTrabajo(dir)
    writeFileSync(join(dir, 'a.txt'), 'uno\nDOS\n')

    expect(await huellaDelTrabajo(dir)).not.toBe(antes)
  })

  /**
   * La leccion del Terminal, medida aqui: `git diff` NO ve los untracked, asi
   * que sin contarlos un intento que reescribe entero un fichero nuevo daria la
   * MISMA huella y el ciclo lo tomaria por una vuelta en redondo.
   */
  it('cambiar SOLO un fichero creado la mueve: los untracked cuentan', async () => {
    const dir = repo('creado')
    writeFileSync(join(dir, 'nuevo.txt'), 'primera version\n')
    const antes = await huellaDelTrabajo(dir)
    writeFileSync(join(dir, 'nuevo.txt'), 'version distinta y mas larga\ny otra linea\n')

    expect(await huellaDelTrabajo(dir)).not.toBe(antes)
  })

  it('el git va DENTRO de la caja: nunca el helper del Terminal', () => {
    // El arbol es de un cliente, y el helper del Terminal corre FUERA de bwrap.
    // Se juzga el CODIGO y no los comentarios: el docblock nombra a los dos para
    // explicar por que se eligio uno, y con el texto crudo este test se cazaba a
    // si mismo (medido: fallaba por su propia prosa).
    const fuente = readFileSync(join(process.cwd(), 'src/infrastructure/repair/huella-del-trabajo.ts'), 'utf8') // prettier-ignore

    expect(codigo(fuente)).toContain("from './repair-git'")
    expect(codigo(fuente)).not.toContain('git-snapshot')
    expect(codigo(fuente)).not.toContain('execFileSync')
  })
})
