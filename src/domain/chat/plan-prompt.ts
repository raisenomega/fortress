import { neutralizarMarcas } from '../shared/sanear-campo-de-prompt'

/**
 * Lo que se le manda a OMEGA para juzgar un PLAN (ADR-097 §2 y §2.2-bis).
 *
 * Recibe los N HALLAZGOS del lote —una linea por hallazgo— y la prosa del
 * productor. N y no uno: lo que el productor propone en el turno de plan no es
 * como arreglar un hallazgo, es en que ORDEN y con que enfoque atacar los N. La
 * version anterior pedia un `HallazgoJuzgado`, que en este turno NO PUEDE
 * EXISTIR —lo produce `planDelTerminal`, que exige un foco, y el turno de plan
 * no tiene foco por construccion— (ENMIENDA 1, 2026-09-19).
 *
 * La honestidad del §2.3 va DENTRO del prompt, no solo en el docblock: si a
 * OMEGA se le pidiera con las palabras del fix, juzgaria como si tuviera un
 * diff delante y devolveria una certeza que no tiene. Decirle que esta leyendo
 * una promesa es lo que hace que su veredicto signifique lo que dice.
 *
 * Y se le prohibe expresamente denegar por lo que NO puede saber: un plan que
 * no se deja evaluar desde su prosa sale `NO_SE_PUEDE_SABER`, no `NO`. El
 * cedazo que deniega lo que no entiende no filtra: bloquea.
 *
 * Las lineas llegan ya aplanadas por `sanearParaPrompt` —sin saltos, que es la
 * defensa contra la linea que parece instruccion— y aqui pasan ademas por
 * `safe`: un titulo que contuviera `(/hallazgos)` no debe poder cerrar el bloque.
 * Son dos controles distintos, y el de aqui se aplica pase lo que pase arriba.
 */
export function buildPlanPrompt(hallazgos: readonly string[], propuesta: string): string {
  return [
    'Eres OMEGA. Juzgas la DIRECCION de un plan ANTES de que nadie toque codigo.',
    '',
    'LO QUE TIENES DELANTE ES UNA PROMESA, NO UN HECHO. Nadie ha editado nada',
    'todavia. No puedes comprobar que el plan se cumpla, ni que este completo:',
    'solo si la direccion que declara es sensata para estos hallazgos. Juzga eso',
    'y nada mas — cada fix se revisa despues, con su diff delante, y esa si es la',
    'revision dura.',
    '',
    'Si algo no se puede saber leyendo el plan, di NO_SE_PUEDE_SABER. NO lo',
    'deniegues por no poder comprobarlo: denegar lo que no entiendes no filtra,',
    'bloquea, y el hallazgo se queda sin arreglar por una duda tuya.',
    '',
    `<hallazgos total="${hallazgos.length}">`,
    ...hallazgos.map(neutralizarMarcas),
    '</hallazgos>',
    '',
    '=== EL PLAN QUE PROPONE EL PRODUCTOR PARA ESOS HALLAZGOS ===',
    neutralizarMarcas(propuesta),
    '',
    'Juzga la direccion sobre EL CONJUNTO: el orden que propone, el enfoque, y si',
    'abarca lo que hay delante. NO juzgues hallazgo por hallazgo.',
    '',
    'Responde SOLO con el bloque siguiente, sin texto fuera de el:',
    'PLAN:{"ataca_la_causa":"SI|NO|NO_SE_PUEDE_SABER",',
    '"declara_tocar_lo_intocable":"SI|NO","alcance":"AJUSTADO|AMPLIO",',
    '"razon":"1-3 lineas"}:END-PLAN'
  ].join('\n')
}
