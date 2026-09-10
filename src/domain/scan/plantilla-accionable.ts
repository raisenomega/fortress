/**
 * Que parte de una plantilla del kit viaja al prompt (ADR-083, Fase 2).
 *
 * De las seis secciones, la 3 —«PROMPT DE AUDITORIA (pegar · solo-lectura)»—
 * y ninguna otra: esta escrita para pegarse en un prompt y su «solo-lectura»
 * casa con el modo plan del escaner. La 1 es exposicion de motivos, la 4 pide
 * un entorno vivo, la 5 remedia y la 6 es criterio del informe. Al agente le
 * hace falta la checklist de la plantilla, no su prosa.
 *
 * Contrato FRAGIL a proposito: depende de encabezados literales del kit. Es el
 * precio de resumir en runtime en vez de pedirle al operador que resuma a mano,
 * y por eso lleva un test que recorre las doce plantillas del repo. Si una deja
 * de encajar, esto devuelve null —sin bloque— y el test cae en voz alta.
 */
const SECCION_3 = '## 3 · PROMPT DE AUDITORÍA'
const INICIO = '═══ INICIO ═══'
const FIN = '═══ FIN ═══'

/**
 * El entregable pide ESCRIBIR un fichero y trae su propio contrato de salida
 * (`S0→S4`, firma). Las dos cosas contradicen el prompt en el que va a entrar:
 * `SCAN_RULES` dice «no modifiques ni crees ningun archivo» y `REPORT_CONTRACT`
 * ya fija la forma del hallazgo. Componer un prompt que se desdice a si mismo
 * es peor que no llevar plantilla, asi que se poda desde aqui hasta el final.
 */
const ENTREGABLE = '**Entregable:**'

/**
 * El cuerpo accionable de una plantilla: los pasos A-I, sin nada mas.
 *
 * El primer parrafo tambien se cae. Dice «Solo-lectura repo; escritura solo en
 * {{OUTPUT_DIR}}... Carga informes previos»: repite reglas que el prompt ya
 * lleva y apunta a un flujo que aqui no existe. Quien anuncia el bloque es
 * FORTRESS con su propio encabezado, no la plantilla.
 *
 * null cuando la plantilla no encaja con el contrato. Nunca cadena vacia: un
 * bloque vacio seria indistinguible de uno que se compuso bien y no dijo nada.
 */
export function cuerpoAccionable(plantilla: string): string | null {
  const seccion = plantilla.split(SECCION_3)[1]
  if (seccion === undefined) return null

  const abierto = seccion.split(INICIO)[1]
  if (abierto === undefined) return null

  const dentro = abierto.split(FIN)[0].split(ENTREGABLE)[0]
  const parrafos = dentro.trim().split('\n\n')
  if (parrafos.length < 2) return null

  return parrafos.slice(1).join('\n\n').trim()
}
