import { GRAPH_FIRST_STRUCTURAL } from '../settings/graph-first'

const FIX_RULES = [
  '- Arregla SOLO los hallazgos listados; no cambies nada mas.',
  '- El fix mas pequeno que resuelva el problema. Nada de refactors grandes.',
  '- NUNCA toques auth, pagos, RLS ni seguridad sin dejarlo escrito antes.',
  '- Respeta el estilo del repo: limite de lineas por archivo, sin any, cero emojis.',
  '- Si un fix rompe un test o el typecheck, ese fix es incorrecto: revierte.'
].join('\n')

/** En el debate, un intento >0 sabe que el anterior empeoro el proyecto. */
function retryNote(attempt: number): readonly string[] {
  if (attempt <= 0) return []
  return [
    '',
    `AVISO: el intento anterior BAJO el score y se revirtio. Este es el intento ${attempt + 1}.`,
    'Prueba un angulo DISTINTO y mas conservador; no repitas el cambio anterior.'
  ]
}

/**
 * Prompt de la fase de REPARACION del loop: el agente EDITA para arreglar los
 * hallazgos conocidos y se autoverifica. Corre en acceptEdits (proyecto de
 * confianza). El checkpoint git y el verify del loop son la red por si rompe.
 * `attempt` > 0 es una ronda del debate: el arreglo anterior empeoro el score.
 */
export function buildRepairPrompt(
  projectName: string,
  known: readonly string[],
  attempt = 0
): string {
  const lista = known.length > 0 ? known.map((line) => `- ${line}`).join('\n') : '- (sin hallazgos abiertos)'
  return [
    `Proyecto "${projectName}", el directorio de trabajo actual. Modo REPARACION AUTONOMA.`,
    '',
    GRAPH_FIRST_STRUCTURAL,
    '',
    'Hallazgos a arreglar (de escaneos anteriores):',
    lista,
    ...retryNote(attempt),
    '',
    'Tu tarea: ARREGLA esos hallazgos EDITANDO el codigo. Reglas:',
    FIX_RULES,
    '',
    'Al terminar verifica con npm run typecheck, npm run lint y npm run test:unit.',
    'Si algo queda en rojo, revierte tu cambio: nunca dejes el arbol roto.',
    '',
    'Si FORTRESS (la herramienta que te ejecuta, NO este proyecto) te limito o te falto',
    'algo —un bug, un gap, una restriccion de entorno/permisos o de plan-mode que te',
    'impidio trabajar, o la OPORTUNIDAD de una funcion, herramienta o agente nuevo que',
    'te habria ayudado— anotalo aparte al FINAL en un bloque, y nada mas despues. No es',
    'un hallazgo del proyecto; es para que FORTRESS madure. Omitelo si no hubo nada:',
    'FORTRESS-NOTES: [{"kind":"limitacion|bug|gap|falta|oportunidad","area":"zona","note":"que paso o que crear"}]'
  ].join('\n')
}
