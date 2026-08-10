import type { OmegaVerdict } from './omega-verdict'

const BLOCK = /VERDICT:\s*(\{[\s\S]*?\})\s*:END-VERDICT/

const AXES: Readonly<Record<keyof Omit<OmegaVerdict, 'razon'>, readonly string[]>> = {
  resuelve_el_hallazgo: ['SI', 'NO', 'PARCIAL'],
  respeta_scope: ['SI', 'NO'],
  respeta_doNotTouch: ['SI', 'NO'],
  calidad_del_diff: ['BUENO', 'ACEPTABLE', 'RUIDOSO'],
  riesgo_residual: ['NINGUNO', 'MENOR', 'MAYOR'],
  veredicto_global: ['APROBADO', 'VETADO']
}

/**
 * Extrae y valida el bloque VERDICT:{...}:END-VERDICT del agente. Un campo
 * ausente o con valor desconocido invalida TODO: no se inventan ejes. Un
 * veredicto_global inconsistente con los ejes NO invalida el parse — el
 * mismatch lo detecta el motor arriba, recomputando.
 */
export function parseOmegaResponse(
  rawStdout: string
): { verdict: OmegaVerdict } | { error: string } {
  // prettier-ignore
  const match = BLOCK.exec(rawStdout)
  if (match === null) return { error: 'sin bloque VERDICT en la respuesta' }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(match[1]) as Record<string, unknown>
  } catch {
    return { error: 'el bloque VERDICT no es JSON valido' }
  }

  for (const [campo, valores] of Object.entries(AXES)) {
    const valor = parsed[campo]
    if (typeof valor !== 'string' || !valores.includes(valor)) {
      return { error: `campo ${campo} ausente o con valor desconocido: ${String(valor)}` }
    }
  }
  if (typeof parsed.razon !== 'string' || parsed.razon.trim() === '') {
    return { error: 'campo razon ausente o vacio' }
  }
  return { verdict: parsed as unknown as OmegaVerdict }
}
