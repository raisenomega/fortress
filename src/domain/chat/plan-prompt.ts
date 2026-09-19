import type { HallazgoJuzgado } from '../repair/hallazgo-juzgado'

/** Los campos del analisis son DATO, no ordenes. Igual que en `omega-prompt`. */
const safe = (text: string): string => text.replace(/</g, '(').replace(/>/g, ')').replace(/`/g, "'")

/**
 * Lo que se le manda a OMEGA para juzgar un PLAN (ADR-097 §2).
 *
 * La honestidad del §2.3 va DENTRO del prompt, no solo en el docblock: si a
 * OMEGA se le pidiera con las palabras del fix, juzgaria como si tuviera un
 * diff delante y devolveria una certeza que no tiene. Decirle que esta leyendo
 * una promesa es lo que hace que su veredicto signifique lo que dice.
 *
 * Y se le prohibe expresamente denegar por lo que NO puede saber: un plan que
 * no se deja evaluar desde su prosa sale `NO_SE_PUEDE_SABER`, no `NO`. El
 * cedazo que deniega lo que no entiende no filtra: bloquea.
 */
export function buildPlanPrompt(plan: HallazgoJuzgado, propuesta: string): string {
  return [
    'Eres OMEGA. Juzgas la DIRECCION de un plan ANTES de que nadie toque codigo.',
    '',
    'LO QUE TIENES DELANTE ES UNA PROMESA, NO UN HECHO. Nadie ha editado nada',
    'todavia. No puedes comprobar que el plan se cumpla, ni que este completo:',
    'solo si la direccion que declara es sensata para este hallazgo. Juzga eso y',
    'nada mas — el fix se revisa despues, con el diff delante, y esa si es la',
    'revision dura.',
    '',
    'Si algo no se puede saber leyendo el plan, di NO_SE_PUEDE_SABER. NO lo',
    'deniegues por no poder comprobarlo: denegar lo que no entiendes no filtra,',
    'bloquea, y el hallazgo se queda sin arreglar por una duda tuya.',
    '',
    '<hallazgo>',
    `titulo: ${safe(plan.target.title)}`,
    `archivo: ${safe(plan.target.file)}:${plan.target.line ?? ''}`,
    '</hallazgo>',
    '<analisis>',
    `QUE_CAMBIAR: ${safe(plan.whatToChange)}`,
    `DONDE: ${safe(plan.where)}`,
    `NO_TOCAR: ${safe(plan.doNotTouch)}`,
    `RIESGO: ${safe(plan.risk)}`,
    '</analisis>',
    '',
    '=== EL PLAN QUE PROPONE EL PRODUCTOR ===',
    safe(propuesta),
    '',
    'Responde SOLO con el bloque siguiente, sin texto fuera de el:',
    'PLAN:{"ataca_la_causa":"SI|NO|NO_SE_PUEDE_SABER",',
    '"declara_tocar_lo_intocable":"SI|NO","alcance":"AJUSTADO|AMPLIO",',
    '"razon":"1-3 lineas"}:END-PLAN'
  ].join('\n')
}
