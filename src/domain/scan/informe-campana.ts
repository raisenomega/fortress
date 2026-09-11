import { MODULOS_AUDITORIA, NOMBRE_MODULO, type ModuloAuditoria } from './modulo-auditoria'
import type { ModulosDelCierre } from './modulos-del-cierre'

const nombre = (m: ModuloAuditoria): string => `**${m} ${NOMBRE_MODULO[m]}**`

/**
 * Que se decidio de cada uno de los DOCE, y por que. Entero y sin recortar: es
 * la decision 4 de ADR-083, que es `ausencia.ts` subida un nivel —no nombrar
 * algo no es afirmar que no esta—. Un modulo saltado en silencio es
 * indistinguible de uno olvidado, y esa diferencia es justo la que una
 * auditoria tiene que poder demostrar ante quien la revise.
 */
function veredicto(m: ModuloAuditoria, c: ModulosDelCierre): string {
  const descartado = c.descartados.find((d) => d.modulo === m)
  if (descartado !== undefined) return `${nombre(m)}: NO APLICA — ${descartado.razon}`

  const sinConstar = c.sinConstancia.find((d) => d.modulo === m)
  if (sinConstar !== undefined) return `${nombre(m)}: NO CONSTA — ${sinConstar.razon}`

  if (!c.aplicables.includes(m)) return `${nombre(m)}: sin veredicto — el escaneo no lo midio`

  // Aplicaba. Falta decir con cuanta profundidad se le pudo auditar.
  return c.plantillasAusentes.includes(m)
    ? `${nombre(m)}: APLICA — auditado con la checklist base; su plantilla no estaba sembrada`
    : `${nombre(m)}: APLICA — auditado con su plantilla`
}

/** Un escaneo anterior a la campana no la tuvo, y eso se dice en vez de fingirla. */
const SIN_CAMPANA_DICHO = [
  '## La campaña',
  '',
  'Este escaneo es anterior a la campaña de auditoría, o corrió sin manifiesto:',
  'no consta qué módulos le aplicaban. No es que no aplicara ninguno.'
]

export function bloqueDeCampana(campana: ModulosDelCierre): readonly string[] {
  const medidos =
    campana.aplicables.length + campana.descartados.length + campana.sinConstancia.length
  if (medidos === 0) return SIN_CAMPANA_DICHO

  return ['## La campaña', '', ...MODULOS_AUDITORIA.map((m) => `- ${veredicto(m, campana)}`)]
}
