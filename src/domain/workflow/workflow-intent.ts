/**
 * Verbos de ORDEN. Solo con uno de estos (o un veredicto de produccion) el chat
 * dispara un workflow completo. Sin orden CONVERSA: una pregunta que solo
 * MENCIONA "test" o "seguridad" ya no lanza un escaneo. Asi el chat es general
 * sin perder ninguna funcion: la orden sigue corriendo el workflow.
 */
const ACTION_VERBS: readonly string[] = [
  'revisa',
  'escanea',
  'audita',
  'corre',
  'ejecuta',
  'busca',
  'limpia',
  'arregla',
  'analiza',
  'despliega',
  'publica',
  'prepara',
  'comprueba',
  'valida',
  'chequea'
]

/** True si el mensaje es una ORDEN (imperativo o veredicto de produccion). */
export function isCommand(lowered: string): boolean {
  return (
    lowered.includes('listo para produc') || ACTION_VERBS.some((verb) => lowered.includes(verb))
  )
}
