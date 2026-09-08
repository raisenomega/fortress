import { describe, expect, it } from 'vitest'
import { BLOQUE_DE_TIPOS } from './bloque-de-tipos'
import { DESEMPATES } from './desempate-de-tipos'
import { REPORT_CONTRACT } from './report-contract'
import { DEFECTOS, TIPOS_DE_DEFECTO } from './tipo-de-defecto'

describe('las definiciones VIAJAN al prompt, no solo los slugs (ADR-081)', () => {
  it('cada tipo llega con su definicion al contrato, no desnudo', () => {
    for (const tipo of TIPOS_DE_DEFECTO) {
      expect(REPORT_CONTRACT).toContain(`${tipo}: ${DEFECTOS[tipo]}`)
    }
  })

  it('el bloque se EMITE del vocabulario: un tipo nuevo no se puede olvidar', () => {
    // Si el contrato copiara el texto, anadir un tipo sin tocar el prompt lo
    // dejaria inelegible y su defecto caeria a `otro`.
    expect(BLOQUE_DE_TIPOS.split('\n').filter((l) => l.includes(': ')).length).toBeGreaterThanOrEqual(TIPOS_DE_DEFECTO.length) // prettier-ignore
  })

  it('el desempate viaja entero', () => {
    for (const regla of DESEMPATES) expect(REPORT_CONTRACT).toContain(regla)
  })

  it('el rate limit ausente tiene UN destino, no cuatro plausibles', () => {
    const regla = DESEMPATES.find((r) => r.includes('rate-limit-ausente'))

    expect(regla).toContain('No hay tope -> rate-limit-ausente')
    expect(regla).toContain('no se consulta -> tope-no-consultado')
    expect(regla).toContain('falla del lado de permitir -> control-evadible')
  })
})

describe('el ejemplo del contrato es de codigo ajeno', () => {
  it('no ensena un defecto de FORTRESS emparejado con un tipo de otra cosa', () => {
    expect(REPORT_CONTRACT).toContain('"tipo":"confianza-en-datos-del-cliente"')
    expect(REPORT_CONTRACT).not.toContain('"tipo":"secret-in-env"')
    expect(REPORT_CONTRACT).not.toContain('buildEnv')
  })

  it('el ejemplo es coherente: sus ejes dan la banda que declara', () => {
    // anonimo·dinero·explotable-hoy es CRITICAL en la tabla de ADR-080. Un
    // ejemplo donde no cuadraran ensenaria a descalibrarse.
    expect(REPORT_CONTRACT).toContain('"severity":"CRITICAL"')
    expect(REPORT_CONTRACT).toContain('"alcance":"anonimo","efecto":"dinero","estado":"explotable-hoy"') // prettier-ignore
  })
})
