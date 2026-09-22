import { describe, expect, it } from 'vitest'
import { promptDeVerificacionPorLote, type ItemAVerificar } from './prompt-de-verificacion-por-lote'
import { DEFECTOS } from './tipo-de-defecto'

const item: ItemAVerificar = { id: 'z1', file: 'supabase/config.toml', line: 10, title: 'order-notification es anonimo', severity: 'MEDIUM' } // prettier-ignore

/**
 * El juicio por lote del paso B pide lo mismo que el analista pide de uno en
 * uno (ADR-087): REAL u OBSOLETO, y si OBSOLETO, la evidencia con marcador
 * literal y forma, que FORTRESS comprueba por su cuenta. Y ademas el tipo, con
 * la regla de eleccion entera (ADR-081), para que las REAL dejen de ser `otro`.
 */
describe('el prompt de verificacion por lote', () => {
  const texto = promptDeVerificacionPorLote([item])

  it('pide REAL u OBSOLETO y, si OBSOLETO, la evidencia con marcador literal y forma', () => {
    expect(texto).toContain('"status"')
    expect(texto).toContain('"evidencia"')
    expect(texto).toContain('"marcador"')
    expect(texto).toContain('"ausente"')
    expect(texto).toContain('"presente"')
  })

  it('manda las definiciones y los desempates, y la regla del simbolo', () => {
    expect(texto).toContain(`path-traversal: ${DEFECTOS['path-traversal']}`)
    expect(texto).toContain('desempata asi')
    expect(texto).toContain('- simbolo:')
  })

  it('le manda leer el fichero y la linea de cada hallazgo, y no cambiar titulo ni severidad', () => {
    expect(texto).toContain('supabase/config.toml')
    expect(texto).toContain('Lee el fichero')
    expect(texto).toContain('NO cambies el titulo ni la severidad')
  })
})
