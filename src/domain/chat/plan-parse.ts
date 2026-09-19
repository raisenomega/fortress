import { computarVeredictoDelPlan, type EjesDelPlan, type JuicioDelPlan } from './juicio-del-plan'

const BLOCK = /PLAN:\s*(\{[\s\S]*?\})\s*:END-PLAN/

const EJES: Readonly<Record<keyof EjesDelPlan, readonly string[]>> = {
  ataca_la_causa: ['SI', 'NO', 'NO_SE_PUEDE_SABER'],
  declara_tocar_lo_intocable: ['SI', 'NO'],
  alcance: ['AJUSTADO', 'AMPLIO']
}

/**
 * Lee el bloque `PLAN:{...}:END-PLAN` (ADR-097 §2). Mismo rigor que el del fix:
 * un campo ausente o con valor desconocido invalida TODO — no se inventan ejes,
 * porque un eje inventado sale luego como un veredicto que nadie dio.
 *
 * El VEREDICTO no se lee del modelo: se COMPUTA de los ejes (D19). Por eso el
 * bloque ni siquiera lo pide — lo que no se pregunta no se puede falsear.
 */
export function parsePlanResponse(raw: string): { juicio: JuicioDelPlan } | { error: string } {
  const match = BLOCK.exec(raw)
  if (match === null) return { error: 'sin bloque PLAN en la respuesta' }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(match[1]) as Record<string, unknown>
  } catch {
    return { error: 'el bloque PLAN no es JSON valido' }
  }

  for (const [campo, valores] of Object.entries(EJES)) {
    const valor = parsed[campo]
    if (typeof valor !== 'string' || !valores.includes(valor)) {
      return { error: `campo ${campo} ausente o con valor desconocido: ${String(valor)}` }
    }
  }
  if (typeof parsed.razon !== 'string' || parsed.razon.trim() === '') {
    return { error: 'el plan viene sin razon' }
  }

  const ejes = parsed as unknown as EjesDelPlan
  return { juicio: { ...ejes, razon: parsed.razon, veredicto: computarVeredictoDelPlan(ejes) } }
}
