import { describe, expect, it } from 'vitest'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'
import { toOmegaOutcome } from './omega-outcome'

const META = (usage?: TokenUsage): AnalystRunMeta => ({ ...(usage ? { usage } : {}), durationMs: 1, startedAt: 1, endedAt: 2 }) // prettier-ignore

const sobre = (texto: string): string => JSON.stringify({ result: texto })

const VERDICT =
  'VERDICT:{"resuelve_el_hallazgo":"SI","respeta_scope":"SI","respeta_doNotTouch":"SI",' +
  '"calidad_del_diff":"BUENO","riesgo_residual":"NINGUNO","veredicto_global":"APROBADO",' +
  '"razon":"correcto"}:END-VERDICT'

describe('toOmegaOutcome — la autopsia se conserva', () => {
  it('sin bloque VERDICT: la razon clasifica y el diagnostico dice cual puerta fallo', () => {
    const out = toOmegaOutcome(sobre('el diff se ve razonable, lo apruebo'), META)
    expect(out.ok).toBe(false)
    if (out.ok) return
    expect(out.error).toBe('omega_response_invalid')
    expect(out.detail).toBe('sin bloque VERDICT en la respuesta')
  })

  it('bloque VERDICT que no es JSON: lo dice, y el crudo viaja con el', () => {
    const texto = 'VERDICT:{"resuelve_el_hallazgo": SI,}:END-VERDICT'
    const out = toOmegaOutcome(sobre(texto), META)
    expect(out.ok).toBe(false)
    if (out.ok) return
    expect(out.detail).toBe('el bloque VERDICT no es JSON valido')
    expect(out.raw).toBe(texto)
  })

  it('campo con valor desconocido: el diagnostico nombra el campo y el valor', () => {
    const texto = VERDICT.replace('"riesgo_residual":"NINGUNO"', '"riesgo_residual":"ENORME"')
    const out = toOmegaOutcome(sobre(texto), META)
    expect(out.ok).toBe(false)
    if (out.ok) return
    expect(out.detail).toBe('campo riesgo_residual ausente o con valor desconocido: ENORME')
  })

  it('el crudo va ENTERO, no una muestra: con el se puede reproducir el fallo', () => {
    const largo = `${'prosa que el juez escribio antes del bloque. '.repeat(80)}sin veredicto`
    const out = toOmegaOutcome(sobre(largo), META)
    expect(out.ok).toBe(false)
    if (out.ok) return
    expect(out.raw).toBe(largo)
    expect(out.raw?.length).toBeGreaterThan(3000)
  })

  it('no-regresion: una respuesta valida sigue dando su veredicto y su factura', () => {
    const out = toOmegaOutcome(
      JSON.stringify({ result: VERDICT, usage: { input_tokens: 90, output_tokens: 10 } }),
      META
    )
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.verdict.veredicto_global).toBe('APROBADO')
    expect(out.runMeta.usage).not.toBe(EMPTY_USAGE)
  })
})
