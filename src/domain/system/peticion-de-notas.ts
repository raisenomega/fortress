/** La forma de una nota, igual para todos: `kind` de vocabulario cerrado. */
export const FORMA_DE_NOTA =
  '{"kind":"limitacion|bug|gap|falta|oportunidad","area":"zona","note":"que paso"}'

/**
 * Lo que se le pide a un agente para que observe FORTRESS mientras trabaja en
 * otro proyecto (ADR-085). El texto es el que lleva funcionando en el analista
 * desde que la ley existe, y vive AQUI para que no haya dos redacciones: cuatro
 * prompts pidiendo lo mismo con palabras distintas acabarian pidiendo cosas
 * distintas, y la comparacion entre agentes dejaria de significar nada.
 *
 * La frase que hace el trabajo es «la herramienta que te ejecuta, NO el proyecto
 * que analizas»: sin ella el agente reporta defectos del cliente, que ya tienen
 * su sitio. Separa el TEMA — el CONTENIDO lo separa el cerco, porque una nota
 * cierta sobre FORTRESS puede citar el codigo del cliente para explicarse y ocho
 * de ocho lo hicieron.
 */
const PORQUE = [
  'si FORTRESS (la herramienta que te ejecuta, NO el proyecto que analizas) te',
  'limito o te falto algo —un bug, un gap, una restriccion de entorno, permisos o',
  'plan-mode que te impidio trabajar, o la OPORTUNIDAD de una capacidad que te',
  'habria ayudado—, anotalo ahi. No es un hallazgo del proyecto; es para que',
  'FORTRESS madure. Si no hubo nada, omitelo.'
]

/** Para quien responde un OBJETO: `notes` es una clave hermana mas. */
export const NOTAS_COMO_CLAVE = [
  `Clave OPCIONAL "notes": ${PORQUE[0]}`,
  ...PORQUE.slice(1),
  '',
  `"notes" va DENTRO del objeto, como una clave mas, NUNCA en un bloque aparte:`,
  `"notes":[${FORMA_DE_NOTA}]`
].join('\n')

/** Para quien responde un ARRAY: no hay donde colgar la clave, va otro bloque. */
export const NOTAS_COMO_BLOQUE = [
  `Y OPCIONALMENTE un SEGUNDO bloque, aparte del anterior: ${PORQUE[0]}`,
  ...PORQUE.slice(1),
  '',
  `NOTAS:[${FORMA_DE_NOTA}]:END-NOTAS`
].join('\n')
