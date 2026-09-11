import { AREAS_DE_OBSERVACION } from './area-de-observacion'

/** La forma de una nota: los DOS campos de vocabulario cerrado y la prosa. */
export const FORMA_DE_NOTA =
  '{"kind":"limitacion|bug|gap|falta|oportunidad","area":"de la lista","note":"que paso"}'

/**
 * El `area` se ELIGE de la lista, no se redacta — misma regla que el `tipo` de
 * un hallazgo, y por el mismo motivo: el campo era texto libre y tenia 190
 * formas para doce conceptos, asi que dos agentes que se topaban con el MISMO
 * limite escribian dos cosas y nadie podia sumarlas. Enumerarlas en el prompt es
 * lo que convierte el backlog en algo contable.
 */
const LISTA_DE_AREAS = [
  'El "area" se ELIGE de esta lista, no se inventa. Si ninguna encaja, "otro":',
  AREAS_DE_OBSERVACION.join(', ')
]

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
  ...LISTA_DE_AREAS,
  '',
  `"notes" va DENTRO del objeto, como una clave mas, NUNCA en un bloque aparte:`,
  `"notes":[${FORMA_DE_NOTA}]`
].join('\n')

/** Para quien responde un ARRAY: no hay donde colgar la clave, va otro bloque. */
export const NOTAS_COMO_BLOQUE = [
  `Y OPCIONALMENTE un SEGUNDO bloque, aparte del anterior: ${PORQUE[0]}`,
  ...PORQUE.slice(1),
  '',
  ...LISTA_DE_AREAS,
  '',
  `NOTAS:[${FORMA_DE_NOTA}]:END-NOTAS`
].join('\n')
