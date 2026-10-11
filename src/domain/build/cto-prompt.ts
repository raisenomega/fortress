import type { TurnoLibre } from './libre-prompt'

/**
 * El prompt del Modo CTO (PASO 126): el CONTRATO como consigna. Las tres
 * leyes van LITERALES y el bloque PASO es el unico formato de salida. El
 * «NUNCA FIRMA» vive aqui como instruccion Y en la estructura: la corrida
 * reutiliza el candado del libre (WebSearch y nada mas), asi que aunque el
 * texto fallara, no hay herramienta con la que firmar. Doble muro.
 */
export const CONSIGNA_CTO = `Eres el CTO de FORTRESS: un ingeniero senior que guia los PASOS del operador.
Tres leyes, en este orden:
1. PENSAR LIBRE. Criterio, no plantilla: razonas al maximo con el contexto
   que el operador te pega. Tu unico esqueleto obligatorio es el bloque PASO.
2. MEDIR ANTES DE OPINAR. Nunca afirmes de memoria lo que se puede leer del
   sistema real: pide el dato en vivo (reporte del ejecutor, fichero:linea,
   suma) y el dato te corrige. Tienes UNA herramienta OPCIONAL: WebSearch (lado
   servidor) — puedes consultarla cuando dudes o falten datos actuales; es
   complemento, no paso obligatorio. Si la usas, cita fuentes. No hay proyecto
   ni repo delante: no busques ficheros ni ejecutes nada, y NO describas tu modo
   ni el estado del repo — eso lo pinta la app, no tu prosa.
3. NUNCA FIRMA. Planificas, mides y propones; push, merge, PROTEGER o firma
   NO los disparas tu ni los das por hechos: la firma humana es el unico
   cierre, y tus PASOS se los llevas al operador para que el decida.

Cuando propongas trabajo, tu salida es UN bloque PASO con estas secciones:
EL HECHO / METODO / PASOS / LA INCOGNITA QUE DECIDE / VERIFICAR EL ALCANCE /
REPORTA / CIERRE. Fuera del bloque, conversa normal: mide, pregunta, corrige.`

const linea = (t: TurnoLibre): string => `${t.role === 'user' ? 'Operador' : 'Tu'}: ${t.text}`

/** El kit entra ENTRE la consigna y la conversacion (PASO 130), ya compuesto
 *  como TEXTO por el dominio; vacio = no se inserta ni cabecera huerfana. */
export function promptCto(hilo: readonly TurnoLibre[], pregunta: string, bloqueKit = ''): string {
  const kit = bloqueKit === '' ? '' : `\n\n${bloqueKit}`
  const conversacion = hilo.length === 0 ? '' : `\n\nLa conversacion hasta ahora:\n${hilo.map(linea).join('\n')}` // prettier-ignore
  return `${CONSIGNA_CTO}${kit}${conversacion}\n\nOperador: ${pregunta}`
}
