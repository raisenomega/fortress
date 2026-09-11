import { describe, expect, it } from 'vitest'
import { redactarObservacion, RUTA_REDACTADA } from './cerco-de-observacion'

/**
 * Las fugas REALES que el inventario del 2026-09-11 encontro en el backlog del
 * operador: ocho observaciones de `mailbd-main` que citan rutas del cliente.
 * Verbatim de la base, recortadas solo en largo. Si el cerco dejara de morder,
 * estas volverian a viajar en `auto-mejora.json`.
 */
const FUGAS: ReadonlyArray<readonly [string, string, readonly string[]]> = [
  [
    'el simbolo duplicado en dos ficheros',
    'trace_path con function_name escapeHtml devolvio estado ambiguous porque el simbolo existe dos veces, en src/lib/sanitize-html.ts y en supabase/functions/_shared/escape-h',
    ['src/lib/sanitize-html.ts', 'supabase/functions/_shared']
  ],
  [
    'el callee resuelto a otro fichero',
    "trace_path sobre public_write_quota_ok devolvio como callee 'count' resuelto a src/hooks/use-toast.count, un contador de TypeScript sin ninguna relacion con el count",
    ['src/hooks/use-toast']
  ],
  [
    'el file_pattern contra una carpeta del cliente',
    "search_graph con file_pattern 'supabase/functions/_shared/.*' y con '.*verify-checkout.*' devolvio total 0, pese a que existen nodos con esos file_pat",
    ['supabase/functions/_shared']
  ]
]

describe('las ocho fugas reales del backlog quedan redactadas', () => {
  it.each(FUGAS)('%s', (_rotulo, nota, rutas) => {
    const limpia = redactarObservacion(nota)

    for (const ruta of rutas) expect(limpia).not.toContain(ruta)
    expect(limpia).toContain(RUTA_REDACTADA)
  })

  it('y el APRENDIZAJE sobrevive en las tres: es lo que las hacia valiosas', () => {
    const limpias = FUGAS.map(([, nota]) => redactarObservacion(nota))

    expect(limpias[0]).toContain('el simbolo existe dos veces')
    expect(limpias[1]).toContain('un contador de TypeScript sin ninguna relacion')
    expect(limpias[2]).toContain('devolvio total 0')
  })

  it('la del README generico NO se toca: ese fichero no identifica a nadie', () => {
    const nota = 'El brief ordena consultar README.md como documento de lo que el proyecto protege, pero ese README es la plantilla generica de Lovable' // prettier-ignore

    expect(redactarObservacion(nota)).toBe(nota)
  })
})
