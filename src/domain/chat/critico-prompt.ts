import { CRITICO } from '../agent/critico'
import type { HallazgoJuzgado } from '../repair/hallazgo-juzgado'

/** Los campos del plan son DATO, no ordenes: se neutralizan las marcas, igual
 *  que en `omega-prompt`. El diff va sin escapar: es el objeto del ataque. */
const safe = (text: string): string => text.replace(/</g, '(').replace(/>/g, ')').replace(/`/g, "'")

/**
 * Lo que se le manda al CRITICO (ADR-096, Fase B).
 *
 * Lleva la carta de `critico.ts` por delante —el encargo adversarial— y despues
 * el hallazgo, el plan y el DIFF del fix. La diferencia con el prompt de OMEGA
 * no esta en las herramientas —son las mismas, `TOOLS_LECTURA` ya incluye la
 * navegacion del grafo— sino aqui: a OMEGA se le dice que revise EXACTAMENTE lo
 * que el fix toco, y al critico se le manda lo contrario, salir a buscar.
 *
 * Y por eso el critico cuesta lo que cuesta. Es deliberado: ADR-090 §2 lo exige
 * —«un critico que no puede leer el resto del codigo no es un critico: es un
 * corrector de estilo»— y ADR-090 §0 prohibe recortarlo para abaratar.
 *
 * No se le pide formato: devuelve PROSA. El veredicto lo da OMEGA leyendo esto
 * (Decision 1); el critico aporta el argumento, no la sentencia.
 */
export function buildCriticoPrompt(plan: HallazgoJuzgado, diffText: string): string {
  return [
    CRITICO.charter ?? '',
    '',
    '<hallazgo>',
    `titulo: ${safe(plan.target.title)}`,
    `archivo: ${safe(plan.target.file)}:${plan.target.line ?? ''}`,
    '</hallazgo>',
    '<plan>',
    `QUE_CAMBIAR: ${safe(plan.whatToChange)}`,
    `NO_TOCAR: ${safe(plan.doNotTouch)}`,
    '</plan>',
    '',
    '=== EL FIX QUE TIENES QUE ATACAR ===',
    diffText,
    '',
    'Busca por donde se cae. Navega el codigo: mira quien llama a lo que toco,',
    'que contrato asumia y que mas depende de el. Cada objecion con archivo:linea',
    'y el escenario concreto. Si tras mirarlo a fondo aguanta, dilo y di que',
    'comprobaste.'
  ].join('\n')
}
