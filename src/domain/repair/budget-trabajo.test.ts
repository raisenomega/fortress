import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE, totalTokens, type TokenUsage } from '@domain/telemetry/token-usage'
import { canAffordGenerator, exceededBudget, MAX_TOKENS_PER_PROPOSAL, trabajoReal } from './budget'

const uso = (input: number, output: number, read: number, creation: number): TokenUsage => ({
  ...EMPTY_USAGE,
  inputTokens: input,
  outputTokens: output,
  cacheReadTokens: read,
  cacheCreationTokens: creation
})

/** Las cuatro corridas reales de agosto que el tope tiro, tal cual las facturo el CLI. */
const RECHAZADAS = [
  { id: 'a3c0b2', analyze: uso(22, 8951, 489_760, 46_919), generate: uso(60, 30_212, 1_649_572, 58_646) }, // prettier-ignore
  { id: '05548b', analyze: uso(22, 9448, 511_442, 44_398), generate: uso(46, 15_727, 1_380_851, 58_723) }, // prettier-ignore
  { id: 'a33457', analyze: uso(34, 13_267, 901_460, 53_494), generate: uso(78, 37_061, 2_771_843, 86_463) }, // prettier-ignore
  { id: '47355b', analyze: uso(26, 10_071, 662_102, 49_927), generate: uso(70, 53_908, 2_799_807, 99_476) } // prettier-ignore
]

describe('trabajoReal: la unidad del tope', () => {
  it('no cuenta la re-lectura del contexto', () => {
    // 1,6M de cache_read sobre 128k de trabajo: cuenta 128k, no 1,7M.
    expect(trabajoReal(uso(46, 15_727, 1_600_000, 58_723))).toBe(74_496)
  })

  it('SI cuenta la creacion de cache: es la primera vez que ese contexto se procesa', () => {
    expect(trabajoReal(uso(0, 0, 0, 50_000))).toBe(50_000)
  })

  it('mide menos que el total que se le ensena al operador', () => {
    // El pie y Rendimiento siguen contandolo todo: son preguntas distintas.
    const u = uso(46, 15_727, 1_380_851, 58_723)
    expect(totalTokens(u)).toBe(1_455_347)
    expect(trabajoReal(u)).toBeLessThan(totalTokens(u))
  })
})

describe('los cuatro rechazos de agosto', () => {
  it('reventaban el tope contando la re-lectura', () => {
    for (const r of RECHAZADAS) {
      const viejo = totalTokens(r.analyze) + totalTokens(r.generate)
      expect(viejo).toBeGreaterThan(MAX_TOKENS_PER_PROPOSAL)
    }
  })

  it('pasan midiendo trabajo, y sin rozar el tope', () => {
    for (const r of RECHAZADAS) {
      const gastado = trabajoReal(r.analyze)
      expect(canAffordGenerator(gastado)).toBe(true)
      expect(exceededBudget(gastado, trabajoReal(r.generate))).toBe(false)
      // Ninguna llega al 11% del tope: no eran hallazgos caros.
      expect(gastado + trabajoReal(r.generate)).toBeLessThan(MAX_TOKENS_PER_PROPOSAL * 0.11)
    }
  })

  it('el "por 1%" era ruido: 2.020.657 cobrados eran 128.364 de trabajo', () => {
    const r = RECHAZADAS[1]
    expect(totalTokens(r.analyze) + totalTokens(r.generate)).toBe(2_020_657)
    expect(trabajoReal(r.analyze) + trabajoReal(r.generate)).toBe(128_364)
  })
})
