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
    expect(bloque).toContain('no te pide callar ningun defecto, solo no repetir un sitio exacto')
  })

  it('sin filas registradas, no hay bloque', () => {
    expect(bloqueDeMemoria([])).toBe('')
  })

  it('colapsa el duplicado SOLO en el mismo sitio exacto, y respeta dos defectos distintos en la misma linea', () => {
    const bloque = bloqueDeMemoria(['src/a.ts:1 rate-limit-ausente'])
    expect(bloque).toContain('MISMO sitio exacto (mismo')
    expect(bloque).toContain('un defecto registrado se reporta UNA vez, con su tipo')
    expect(bloque).toContain('duplicados historicos')
    expect(bloque).toContain('Dos defectos DISTINTOS en la misma linea si se reportan')
    expect(bloque).not.toContain('no te pide omitir nada')
  })

  it('NO suprime sitios de lineas distintas: pide reportar CADA sitio registrado, juntarlos es de FORTRESS', () => {
    const bloque = bloqueDeMemoria([
      'src/a.ts:258 rate-limit-ausente',
      'src/a.ts:268 rate-limit-ausente'
    ])
    expect(bloque).toContain(
      'En lineas DISTINTAS, reporta CADA sitio registrado aunque parezcan el mismo defecto'
    )
    expect(bloque).toContain('es decision de FORTRESS, no tuya')
    expect(bloque).toContain('Reporta lo que ves; no decidas que dos lineas son')
  })
})
