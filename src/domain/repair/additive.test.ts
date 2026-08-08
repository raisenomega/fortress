import { describe, expect, it } from 'vitest'
import { isAdditive } from './additive'

/**
 * Titulos REALES de los hallazgos abiertos del self-audit (tabla findings,
 * 2026-08-08). Copiados tal cual: si el escaner cambia como los redacta, estos
 * tests son los que avisan.
 */
const SSRF = 'SSRF: el filtro de host privado no valida la IP resuelta por DNS'
const LOOP = 'El loop autonomo no verifica trusted en el main y revocar la confianza no lo detiene'
const REDACT = 'Los comandos bloqueados se persisten en la base sin pasar por redactSecrets'
const GRAPH_AB = 'graph:ab lanza dos ejecuciones del CLI sin guardRun y salta el tope diario'

describe('isAdditive', () => {
  it('la regresion que motivo el fix: SSRF y loop-engine son ADITIVOS, no reescrituras', () => {
    // Ambos AGREGAN un control que falta. La heuristica vieja solo miraba
    // "no (usa|llama|trackea|registra|guarda)" y los daba por reescrituras.
    expect(isAdditive(SSRF)).toBe(true)
    expect(isAdditive(LOOP)).toBe(true)
  })

  it('reconoce el control no ejercido: valida / verifica / resuelve / pasa por', () => {
    expect(isAdditive('el handler no valida el origen')).toBe(true)
    expect(isAdditive('el main no verifica la firma antes de ejecutar')).toBe(true)
    expect(isAdditive('la guarda es lexica y no resuelve symlinks')).toBe(true)
    expect(isAdditive('postureRun no pasa por guardRun')).toBe(true)
  })

  it('reconoce la pasiva refleja ("no se valida") igual que la activa', () => {
    expect(isAdditive('no se valida la IP resuelta')).toBe(true)
    expect(isAdditive('no se verifica el tope diario')).toBe(true)
  })

  it('reconoce la ausencia nombrada: sin / falta / carece / omite / no hay', () => {
    expect(isAdditive(REDACT)).toBe(true)
    expect(isAdditive(GRAPH_AB)).toBe(true)
    expect(isAdditive('falta un control de concurrencia en el spawn')).toBe(true)
    expect(isAdditive('faltan los headers de seguridad en la respuesta')).toBe(true)
    expect(isAdditive('el endpoint carece de rate limiting')).toBe(true)
    expect(isAdditive('omite la sanitizacion del input')).toBe(true)
    expect(isAdditive('no hay validacion de longitud')).toBe(true)
    expect(isAdditive('no existe control de acceso en la ruta')).toBe(true)
  })

  it('NO marca aditivo lo que exige reescribir logica (sin marca de ausencia)', () => {
    expect(
      isAdditive('La API key del entorno se hereda a los scripts del repositorio auditado')
    ).toBe(false)
    expect(isAdditive('El score se calcula dos veces con formulas distintas')).toBe(false)
    expect(isAdditive('La query concatena strings en vez de parametrizar')).toBe(false)
    expect(isAdditive('Race condition entre el cierre del stream y el guardado')).toBe(false)
  })

  it('exige palabra completa: "sinergia" o "nihil" no son marcas de ausencia', () => {
    expect(isAdditive('sinergia entre el cache y el indice')).toBe(false)
    expect(isAdditive('el valor nihil rompe el parser')).toBe(false)
  })
})
