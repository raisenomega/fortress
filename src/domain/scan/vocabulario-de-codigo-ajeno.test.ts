import { describe, expect, it } from 'vitest'
import { DEFECTOS_DE_CODIGO_AJENO } from './defectos-de-codigo-ajeno'
import { parseScanOutput } from './parse-scan-output'
import { aTipoDeDefecto, DEFECTOS, TIPOS_DE_DEFECTO } from './tipo-de-defecto'

const NUEVOS = Object.keys(DEFECTOS_DE_CODIGO_AJENO)

/** El titulo REAL de `send-invoice/index.ts:268`, el defecto que llego a tener
 *  cuatro tipos y diez filas. Tal y como lo escribio el escaner el 07-sep. */
const RATE_LIMIT_268 =
  '{"findings":[{"severity":"LOW","title":"send-invoice es la unica edge function sin rate limiting",' +
  '"file":"supabase/functions/send-invoice/index.ts","line":268,"tipo":"rate-limit-ausente","simbolo":"handler"}]}'

const report = (json: string): string => `analisis\n\`\`\`json\n${json}\n\`\`\``

describe('los once tipos de codigo ajeno estan en el vocabulario (ADR-081)', () => {
  it('son once, y ninguno se coló dos veces', () => {
    expect(NUEVOS).toHaveLength(11)
    expect(new Set(TIPOS_DE_DEFECTO).size).toBe(TIPOS_DE_DEFECTO.length)
  })

  it('aTipoDeDefecto los acepta: ninguno cae a otro', () => {
    for (const tipo of NUEVOS) expect(aTipoDeDefecto(tipo)).toBe(tipo)
  })

  it('cada tipo del vocabulario trae definicion, no solo nombre', () => {
    for (const tipo of TIPOS_DE_DEFECTO) expect(DEFECTOS[tipo].length).toBeGreaterThan(20)
  })

  it('deserializacion-insegura NO esta: ninguna fila del corpus la pidio', () => {
    // La checklist la nombra, pero anadir un tipo que ningun defecto reclamo es
    // volver a la lista generica que ADR-067 rechazo.
    expect(aTipoDeDefecto('deserializacion-insegura')).toBe('otro')
  })

  it('otro cierra la lista: es el ultimo recurso, no el primero', () => {
    expect(TIPOS_DE_DEFECTO.at(-1)).toBe('otro')
  })
})

describe('LA MUTACION: sin rate-limit-ausente, el defecto de :268 no tiene destino', () => {
  it('con el tipo en el vocabulario, el parser lo conserva', () => {
    const r = parseScanOutput(report(RATE_LIMIT_268))

    // Quita 'rate-limit-ausente' de DEFECTOS_DE_CODIGO_AJENO y esto da 'otro':
    // es el estado del 07-sep, cuando el mismo defecto abrio fila cuatro veces
    // porque no habia tipo correcto que elegir.
    expect(r.ok && r.value[0].tipo).toBe('rate-limit-ausente')
  })

  it('y sin el, la identidad del defecto seria la de cualquier inclasificable', () => {
    const sinTipo = RATE_LIMIT_268.replace('"rate-limit-ausente"', '"lo-que-sea"')
    const r = parseScanOutput(report(sinTipo))

    expect(r.ok && r.value[0].tipo).toBe('otro')
  })
})
