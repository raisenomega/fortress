import { describe, expect, it } from 'vitest'
import { aTipoDeDefecto, TIPOS_DE_DEFECTO } from './tipo-de-defecto'
import { REPORT_CONTRACT } from './report-contract'
import { parseScanOutput } from './parse-scan-output'

describe('el vocabulario es CERRADO', () => {
  it('un tipo de la lista se acepta tal cual', () => {
    expect(aTipoDeDefecto('missing-run-guard')).toBe('missing-run-guard')
  })

  it('uno inventado cae a otro, no se cuela ni tumba el escaneo', () => {
    expect(aTipoDeDefecto('inyeccion-de-lo-que-sea')).toBe('otro')
  })

  it('ausente o basura tambien cae a otro', () => {
    for (const basura of [undefined, null, 42, {}, '']) {
      expect(aTipoDeDefecto(basura)).toBe('otro')
    }
  })

  it('otro forma parte del vocabulario: es un destino, no un fallo', () => {
    expect(TIPOS_DE_DEFECTO).toContain('otro')
  })

  it('los dos vectores de SSRF son tipos distintos, no uno', () => {
    // Fundirlos escondia una forma de evasion detras de la otra: comparten
    // fichero y simbolo, asi que solo el tipo los separa.
    expect(aTipoDeDefecto('ssrf-ipv6-mapped')).not.toBe(aTipoDeDefecto('ssrf-ipv4-formatos'))
  })

  it('los dos canales de fuga de secreto tambien', () => {
    expect(aTipoDeDefecto('secret-in-env')).not.toBe(aTipoDeDefecto('secret-in-argv'))
  })
})

describe('el contrato del escaner enumera el vocabulario', () => {
  it('lista TODOS los tipos: uno que falte no se podria elegir', () => {
    for (const tipo of TIPOS_DE_DEFECTO) expect(REPORT_CONTRACT).toContain(tipo)
  })

  it('pide los dos campos nuevos y dice que no se inventen', () => {
    expect(REPORT_CONTRACT).toContain('no inventes')
    expect(REPORT_CONTRACT).toContain('simbolo')
  })
})

describe('el parser respeta el vocabulario', () => {
  const report = (json: string): string => `texto previo\n\`\`\`json\n${json}\n\`\`\``

  it('un tipo fuera del vocabulario no tumba el escaneo: cae a otro', () => {
    const crudo = '{"findings":[{"severity":"LOW","title":"x","tipo":"lo-que-sea","simbolo":42}]}'
    const result = parseScanOutput(report(crudo))

    expect(result.ok && result.value[0].tipo).toBe('otro')
    expect(result.ok && result.value[0].simbolo).toBe('')
  })
})
