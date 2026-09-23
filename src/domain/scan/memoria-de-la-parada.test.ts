import { describe, expect, it } from 'vitest'
import { bloqueDeMemoria, registradasDeLaParada, type FilaRegistrada } from './memoria-de-la-parada'

// prettier-ignore
const fila = (file: string, line: number | null, tipo: string, o: Partial<FilaRegistrada> = {}): FilaRegistrada => ({ file, line, identity: `${file}|${line ?? '-'}|${tipo}`, simbolo: 'handler', lifecycle: 'ACTIVE', ...o })

const VIVAS = [
  fila('supabase/functions/send-invoice/index.ts', 268, 'rate-limit-ausente'),
  fila('supabase/functions/order-notification/index.ts', 697, 'fuga-de-informacion-en-error', { simbolo: null }), // prettier-ignore
  fila('src/lib/sanitize-html.ts', 9, 'allowlist-permisiva'),
  fila('README.md', 63, 'doc-contradice-codigo'),
  fila('supabase/functions/verify-checkout/index.ts', 45, 'secreto-sin-redactar', { lifecycle: 'EXTINCT' }) // prettier-ignore
]

describe('registradasDeLaParada: lo que FORTRESS ya tiene en las carpetas que recorre (ADR-101)', () => {
  it('lleva las vivas de su carpeta, una linea fichero:linea tipo y el simbolo si consta', () => {
    expect(registradasDeLaParada(VIVAS, ['supabase/functions'])).toEqual([
      'supabase/functions/order-notification/index.ts:697 fuga-de-informacion-en-error',
      'supabase/functions/send-invoice/index.ts:268 rate-limit-ausente handler'
    ])
  })

  it('no lleva las de otras carpetas, ni las extintas', () => {
    const lineas = registradasDeLaParada(VIVAS, ['supabase/functions'])
    expect(lineas.join('\n')).not.toContain('sanitize-html')
    expect(lineas.join('\n')).not.toContain('verify-checkout')
    expect(registradasDeLaParada(VIVAS, ['src'])).toEqual(['src/lib/sanitize-html.ts:9 allowlist-permisiva handler']) // prettier-ignore
  })

  it('la raiz son los ficheros sin carpeta; sin rutas, el proyecto entero', () => {
    expect(registradasDeLaParada(VIVAS, ['.'])).toEqual([
      'README.md:63 doc-contradice-codigo handler'
    ])
    expect(registradasDeLaParada(VIVAS)).toHaveLength(4)
    expect(registradasDeLaParada(VIVAS, [])).toHaveLength(4)
  })
})

describe('bloqueDeMemoria: la instruccion que acompana a la lista', () => {
  it('dice lo que es, pide conservar tipo y linea, y no pide callar ningun defecto', () => {
    const bloque = bloqueDeMemoria(['src/a.ts:1 rate-limit-ausente'])
    expect(bloque).toContain('ya tiene registrado')
    expect(bloque).toContain('src/a.ts:1 rate-limit-ausente')
    expect(bloque).toContain('conserva su tipo y su linea')
    expect(bloque).toContain('NO lo reescribas con un tipo vecino')
    expect(bloque).toContain('no te pide callar ningun defecto, solo no repetirlo')
  })

  it('sin filas registradas, no hay bloque', () => {
    expect(bloqueDeMemoria([])).toBe('')
  })

  it('pide UNA fila por defecto registrado, y NO prohibe dos defectos distintos en la misma linea', () => {
    const bloque = bloqueDeMemoria(['src/a.ts:1 rate-limit-ausente'])
    expect(bloque).toContain('reporta UNA vez, con su tipo')
    expect(bloque).toContain('NUNCA una segunda fila del mismo sitio')
    expect(bloque).toContain('duplicados historicos')
    expect(bloque).toContain('Dos defectos DISTINTOS en la misma linea')
    expect(bloque).toContain('cuando de verdad son otro defecto y no una faceta')
    expect(bloque).not.toContain('no te pide omitir nada')
  })
})
