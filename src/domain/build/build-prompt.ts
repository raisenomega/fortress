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
 * Prompt de CONSTRUCCION: el agente CREA la feature del plan aprobado, en
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
    BUILD_RULES
  ].join('\n')
}
