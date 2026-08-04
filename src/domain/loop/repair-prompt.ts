import { GRAPH_FIRST_STRUCTURAL } from '../settings/graph-first'

const FIX_RULES = [
  '- Arregla SOLO los hallazgos listados; no cambies nada mas.',
  '- El fix mas pequeno que resuelva el problema. Nada de refactors grandes.',
  '- NUNCA toques auth, pagos, RLS ni seguridad sin dejarlo escrito antes.',
  '- Respeta el estilo del repo: limite de lineas por archivo, sin any, cero emojis.',
  '- Si un fix rompe un test o el typecheck, ese fix es incorrecto: revierte.'
].join('\n')

/**
 * Prompt de la fase de REPARACION del loop: el agente EDITA para arreglar los
 * hallazgos conocidos y se autoverifica. Corre en acceptEdits (proyecto de
 * confianza). El checkpoint git y el verify del loop son la red por si rompe.
 */
export function buildRepairPrompt(projectName: string, known: readonly string[]): string {
  const lista = known.length > 0 ? known.map((line) => `- ${line}`).join('\n') : '- (sin hallazgos abiertos)'
  return [
    `Proyecto "${projectName}", el directorio de trabajo actual. Modo REPARACION AUTONOMA.`,
    '',
    GRAPH_FIRST_STRUCTURAL,
    '',
    'Hallazgos a arreglar (de escaneos anteriores):',
    lista,
    '',
    'Tu tarea: ARREGLA esos hallazgos EDITANDO el codigo. Reglas:',
    FIX_RULES,
    '',
    'Al terminar verifica con npm run typecheck, npm run lint y npm run test:unit.',
    'Si algo queda en rojo, revierte tu cambio: nunca dejes el arbol roto.'
  ].join('\n')
}
