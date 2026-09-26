import { sanearParaPrompt } from '../shared/sanear-para-prompt'
import type { BarreraRota } from './barrera-rota'

/** Lo que cabe de un dato del cliente en una frase que se va a PERSISTIR. */
const MAX = 60

/** Y cuantas barreras se NOMBRAN: el resto se cuenta. Cuantas declara el cliente
 *  no lo acota nadie aguas arriba, y acotar cada dato sin acotar cuantos hay es
 *  medio tope: 5000 hooks rotos escribian 5000 frases en `chat_messages`. */
const NOMBRADAS = 3

const limpio = (texto: string): string => sanearParaPrompt(texto, MAX)

function una(b: BarreraRota): string {
  const guion = b.guion === '' ? '' : ` ${limpio(b.guion)}`
  const pista = b.alternativa === null ? '' : `; existe «${limpio(b.alternativa)}»`
  return `PreToolUse (${limpio(b.matcher)}) llama a «${limpio(b.interprete)}»${guion}, que no existe${pista}`
}

/**
 * QUE barrera esta rota, en una frase: el dato duro que al aviso le faltaba.
 *
 * `BARRERA_ROTA` decia «su interprete no existe» sin nombrarlo, y mandaba a
 * arreglarlo en `.claude/settings.json` sin decir que linea: el operador tenia
 * que ir a buscar lo que FORTRESS ya sabia. Y como el motivo del bloqueo ahora
 * se persiste en el hilo, lo que quede escrito tiene que bastar por si solo.
 *
 * SANEADO, y no por estetica. El `matcher` sale CRUDO del `.claude/settings.json`
 * de un repo AUDITADO —el parser solo comprueba que sea un string— y este texto
 * acaba en `chat_messages`. Un salto de linea ahi empieza linea nueva en un hilo
 * que otro turno puede leer.
 */
export function cualesBarreras(rotas: readonly BarreraRota[]): string {
  const resto = rotas.length - NOMBRADAS
  const cola = resto > 0 ? `; y ${resto} mas` : ''
  return `Rota: ${rotas.slice(0, NOMBRADAS).map(una).join('; ')}${cola}.`
}
