import { NOTAS_COMO_BLOQUE } from '../system/peticion-de-notas'

const BUILD_RULES = [
  '- Implementa SOLO lo que pide el plan aprobado; nada extra.',
  '- Sigue las convenciones DEL PROYECTO (estilo, estructura, tests que ya existen).',
  '- Estandar de produccion enterprise: maneja errores, valida input, sin atajos.',
  '- Escribe o actualiza tests para lo que crees.',
  '- NUNCA toques auth, pagos, RLS ni seguridad sin dejarlo escrito antes.',
  '- Al terminar verifica con typecheck/lint/test; si algo queda en rojo, tu cambio',
  '  es incorrecto: arreglalo o dejalo revertible.'
].join('\n')

/**
 * Prompt de INVESTIGACION (solo lectura): el agente explora y RESPONDE sobre el
 * proyecto sin tocar nada. Sirve para entender antes de planear o construir.
 */
export function investigatePrompt(projectName: string, intent: string): string {
  return [
    `Proyecto "${projectName}", tu directorio de trabajo actual. Modo INVESTIGACION.`,
    '',
    'Pregunta del operador:',
    intent,
    '',
    'Investiga el codigo y responde con evidencia (archivo:linea). SOLO LECTURA:',
    'no modifiques nada. Se claro y directo; usa el grafo antes de abrir archivos.',
    '',
    NOTAS_COMO_BLOQUE
  ].join('\n')
}

/**
 * Prompt de PLAN (fase 1, solo lectura): el planner disena que construir, sin
 * tocar nada. El humano aprueba este plan ANTES de que se escriba una linea.
 */
export function buildPlanPrompt(projectName: string, intent: string): string {
  return [
    `Proyecto "${projectName}", tu directorio de trabajo actual. Modo PLAN.`,
    '',
    'Intencion del operador:',
    intent,
    '',
    'Disena un PLAN de implementacion concreto: que archivos crear/tocar, en que',
    'orden, y los criterios de aceptacion. NO implementes nada: solo el plan, breve',
    'y accionable, respetando las convenciones del proyecto.',
    '',
    NOTAS_COMO_BLOQUE
  ].join('\n')
}

/**
 * Prompt de CONSTRUCCION (fase 2): el agente CREA la feature del plan aprobado, en
 * acceptEdits (exige confianza). El checkpoint git + el verify son la red por si
 * deja el arbol roto. A diferencia de reparar, aqui se escribe codigo nuevo.
 */
export function buildFeaturePrompt(projectName: string, intent: string, plan: string): string {
  return [
    `Proyecto "${projectName}", tu directorio de trabajo actual. Modo CONSTRUCCION.`,
    '',
    'Intencion del operador:',
    intent,
    '',
    'Plan aprobado a implementar:',
    plan,
    '',
    'Tu tarea: CREA el codigo que implementa el plan. Reglas:',
    BUILD_RULES,
    '',
    NOTAS_COMO_BLOQUE
  ].join('\n')
}
