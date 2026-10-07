import { redactSecrets } from '../chat/tool-detail'

/**
 * Tacha un transcript que lleva bloques JSON dentro, POR CAMPO y nunca el
 * documento ya montado — el molde de `record-plan-events`: «se tacha cada
 * CAMPO de texto, nunca el JSON ya montado».
 *
 * Existe por una mordida medida (PASO 69): una regla con `\S+` corrio por el
 * JSON compacto —sin espacios que la frenaran— y se comio el numero de linea,
 * el cierre de una entrada y el titulo de la siguiente, dejando ilegibles 5 de
 * los 13 crudos persistidos. Tachar cada string por separado y re-montar con
 * `JSON.stringify` hace al log inmune a CUALQUIER regla glotona, la de hoy y
 * la que alguien escriba manana: lo que una regla muerda queda escapado al
 * re-montar, y los numeros ni se miran.
 */
const FENCE = /```json\s*([\s\S]*?)```/g

const porCampo = (_k: string, v: unknown): unknown => (typeof v === 'string' ? redactSecrets(v) : v) // prettier-ignore

/** Un bloque ilegible DE ORIGEN no tumba nada: cae a texto plano tachado, y
 *  quien escribe el fichero lo NOMBRA (ver `bloques-ilegibles`). */
function bloqueTachado(crudo: string): string {
  try {
    return '```json\n' + JSON.stringify(JSON.parse(crudo), porCampo) + '\n```'
  } catch {
    return '```json\n' + redactSecrets(crudo) + '\n```'
  }
}

export function redactarTranscript(texto: string): string {
  let salida = ''
  let fin = 0
  for (const m of texto.matchAll(FENCE)) {
    salida += redactSecrets(texto.slice(fin, m.index)) + bloqueTachado(m[1])
    fin = m.index + m[0].length
  }
  return salida + redactSecrets(texto.slice(fin))
}
