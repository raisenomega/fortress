/**
 * Los tipos de lo que los modulos de auditoria YA encuentran (ADR-100).
 *
 * FORTRESS audita mas alla de la seguridad desde ADR-083: M9 (accesibilidad),
 * M3 (privacidad), M8 (integridad de negocio), M2 (continuidad) y M4 (terceros)
 * entran en el prompt de la parada y encuentran lo que se les pide. Pero el
 * contrato del hallazgo se quedo en seguridad, y lo encontrado caia a `otro`:
 * 108 filas vivas, el 20 %, con el termometro de ADR-081 marcando desde el 15 %.
 *
 * Tercer corpus, mismo metodo que ADR-067 y ADR-081: cada tipo existe porque al
 * menos una fila real lo pedia, y el numero de filas —de las 96 que el escaner
 * dejo en `otro` el 2026-09-22— esta al lado. Los seis cierran el 84 %.
 *
 * NO es un linter de calidad: «calidad de codigo» eran dos titulos, y un tipo
 * que ninguna fila reclamo es la lista generica que ADR-067 rechazo. Tampoco
 * entran SDLC y entorno (siete filas, siete defectos distintos) ni los cuatro
 * de seguridad sin tipo: esos son candidatos a la lista de seguridad, aparte.
 */
export const DEFECTOS_DE_AUDITORIA = {
  /** 37 filas. */
  accesibilidad: 'una persona con discapacidad no puede completar la misma tarea: sin nombre accesible, sin foco, sin contraste, sin teclado (WCAG 2.2 AA).', // prettier-ignore
  /** 17 filas. */
  privacidad: 'un dato personal de un titular se recoge, guarda, comparte o retiene sin base, sin consentimiento, sin borrado o sin exportacion.', // prettier-ignore
  /** 9 filas. */
  'integridad-de-negocio': 'el sistema se contradice a si mismo: un pago, un estado o un saldo queda inconsistente por un camino que no revierte o no valida lo suyo.', // prettier-ignore
  /** 7 filas. */
  'continuidad-y-backups': 'lo que sostiene la recuperacion no existe o no se ha probado: sin backup, sin restauracion probada, sin RTO ni RPO.', // prettier-ignore
  /** 7 filas. */
  'dependencia-vulnerable': 'una dependencia, runtime o artefacto con vulnerabilidad conocida, sin soporte, sin version fijada o sin firma.', // prettier-ignore
  /** 4 filas. */
  'criptografia-debil': 'cifrado o hash que no protege: sin autenticacion, sal fija, algoritmo roto, o dato sensible en claro donde deberia ir cifrado.' // prettier-ignore
} as const

/**
 * Si un tipo es de auditoria (ADR-103 §2): para estos seis la tabla de
 * severidad de ADR-080 NO se aplica, porque sus ejes son de seguridad y no
 * describen un contraste, un label o un dato personal sin consentimiento. Se
 * pregunta por clave propia, no con `in`: `toString` no es una familia.
 */
export function esTipoDeAuditoria(tipo: string): boolean {
  return Object.hasOwn(DEFECTOS_DE_AUDITORIA, tipo)
}
