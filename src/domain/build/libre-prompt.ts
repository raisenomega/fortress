/**
 * El prompt del modo LIBRE (PASO 91): conversacion sin repo, como el chat del
 * navegador. El CLI corre en un cuarto VACIO, en 'lectura' y sin MCP — y el
 * prompt ademas lo DICE, para que el agente converse en vez de buscar ficheros
 * que no existen. El hilo viaja entero porque cada corrida de claude -p es una
 * sesion nueva (mismo motivo que la entrevista de configuracion).
 */
export interface TurnoLibre {
  readonly role: 'user' | 'assistant'
  readonly text: string
}

const CONSIGNA = `Eres el chat libre de FORTRESS: una conversacion abierta sobre cualquier tema.
No hay proyecto ni repo delante: no busques ficheros, no uses herramientas de
disco ni ejecutes nada — responde conversando, con el mismo rigor de siempre.`

const linea = (t: TurnoLibre): string => `${t.role === 'user' ? 'Operador' : 'Tu'}: ${t.text}`

export function promptLibre(hilo: readonly TurnoLibre[], pregunta: string): string {
  const conversacion = hilo.length === 0 ? '' : `\n\nLa conversacion hasta ahora:\n${hilo.map(linea).join('\n')}` // prettier-ignore
  return `${CONSIGNA}${conversacion}\n\nOperador: ${pregunta}`
}
