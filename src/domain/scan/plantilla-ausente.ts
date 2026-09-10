import { NOMBRE_MODULO, type ModuloAuditoria } from './modulo-auditoria'

/**
 * Por que un modulo que APLICA no trae su guia tematica (ADR-083, Fase 2).
 *
 * Existe porque seguir NO basta. La doctrina del ADR, tomada de
 * `import-attended`, pide las dos cosas: que el escaneo siga con la checklist
 * de siempre —eso ya se hacia— y que lo DIGA. Un escaneo sin plantillas era
 * indistinguible de uno con ellas, que es el degradar-en-silencio que
 * `buildDocsFirst` evita con su cabecera de repuesto.
 *
 * DOS causas y no una, por lo mismo que `MotivoCierre` separa `abortado` de
 * `fallo`: piden gestos distintos del operador. Una se arregla sembrando el
 * fichero; la otra, arreglando el que ya sembro. Juntarlas mandaria a media
 * gente a buscar un fichero que esta ahi.
 */
const nombrado = (modulo: ModuloAuditoria): string => `${modulo} ${NOMBRE_MODULO[modulo]}`

/** No esta en `userData/audit-kit/`. El gesto que falta es sembrarla. */
export const razonSinSembrar = (modulo: ModuloAuditoria): string =>
  `- ${nombrado(modulo)}: su plantilla no esta sembrada en audit-kit.`

/** Esta, pero no encaja con el contrato del kit. El gesto es arreglarla. */
export const razonIlegible = (modulo: ModuloAuditoria): string =>
  `- ${nombrado(modulo)}: su plantilla esta sembrada pero no encaja con el contrato del kit.`

/**
 * Se le dice tambien al AGENTE, no solo a quien lea el prompt: sin esta linea
 * auditaria estos modulos creyendo que nunca hubo mas que la checklist, y no
 * podria decir en su informe que le falto profundidad.
 */
export const SIN_GUIA = [
  'Estos modulos aplican a este proyecto y NO traen su guia tematica.',
  'Se auditan con la checklist de arriba y nada mas:'
].join('\n')
