import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { readFileSync } from 'fs'
import { afterAll, describe, expect, it } from 'vitest'
import { kitDisponible, RAZON_SIN_KIT } from './contrato-del-kit'

const temporales: string[] = []
const carpeta = (): string => {
  const d = mkdtempSync(join(tmpdir(), 'fortress-kit-'))
  temporales.push(d)
  return d
}
afterAll(() => temporales.forEach((d) => rmSync(d, { recursive: true, force: true })))

describe('kitDisponible distingue las dos situaciones, y nada mas', () => {
  it('con plantillas sembradas: hay kit', () => {
    const d = carpeta()
    writeFileSync(join(d, 'PLANTILLA_MODULO_M8_X.md'), 'x')

    expect(kitDisponible(d)).toBe(true)
  })

  it('una carpeta que no existe: no hay kit (el worktree del Motor)', () => {
    expect(kitDisponible(join(carpeta(), 'no-existe'))).toBe(false)
  })

  /** Vacia NO es «hay kit con cero plantillas»: es que no hay nada que medir. */
  it('una carpeta vacia, o con otra cosa dentro: tampoco', () => {
    const d = carpeta()
    expect(kitDisponible(d)).toBe(false)
    writeFileSync(join(d, 'LEEME.md'), 'x')
    expect(kitDisponible(d)).toBe(false)
  })

  it('la razon del salto se puede LEER: no es un hueco mudo', () => {
    expect(RAZON_SIN_KIT).toContain('kit ausente')
    expect(RAZON_SIN_KIT).toContain('no hay plantillas que medir')
  })
})

/**
 * LA LINEA QUE SEPARA LA VIA 3 DE UN GATE QUE MIENTE (ADR-108 §5).
 *
 * El contrato puede hacer tres cosas ante la ausencia del kit: fallar (ruido
 * inutil en el worktree), SALTARSE DICIENDOLO (lo correcto) o **pasar en
 * silencio** (un gate que miente: un fix que rompa el extractor saldria verde,
 * y el extractor roto devuelve `null` —silencio sin bloque—).
 *
 * Se juzga el CODIGO del test, no su intencion: quien lo cambie a tragarse la
 * ausencia cae aqui. Es el mismo guardian que usa `clase-b-en-caja`.
 */
describe('el contrato NUNCA pasa en silencio por ausencia del kit', () => {
  const fuente = readFileSync('src/domain/scan/plantilla-contrato.test.ts', 'utf8')

  it('se salta con skipIf atado a kitDisponible, no a una condicion inventada', () => {
    expect(/describe\.skipIf\(!hayKit\)/.test(fuente)).toBe(true)
    expect(/const hayKit = kitDisponible\(\)/.test(fuente)).toBe(true)
  })

  it('y lo DICE: la razon se imprime cuando se salta', () => {
    expect(fuente).toContain('RAZON_SIN_KIT')
    expect(/console\.warn/.test(fuente)).toBe(true)
  })

  /** Un `return` temprano dentro de un `it` es justo como se pasa en silencio. */
  it('ningun `it` se traga la ausencia con un return o un if de escape', () => {
    const cuerpos = fuente.split(/\bit(?:\.each\([^)]*\))?\(/).slice(1)
    const sospechosos = cuerpos.filter((c) => /if \(!hayKit\)|return$|hayKit \?/m.test(c.slice(0, 400))) // prettier-ignore

    expect(sospechosos).toEqual([])
  })
})
