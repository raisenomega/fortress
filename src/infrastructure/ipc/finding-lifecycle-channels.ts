/**
 * Los canales del CICLO DE VIDA de un hallazgo, aparte de los del escaneo.
 *
 * Salen de `channels` por la misma linea por la que ya estaban partidos el SQL
 * (`finding-lifecycle-sql`) y las escrituras (`finding-lifecycle-writes`):
 * descubrir un hallazgo es una cosa y decidir sobre el es otra. Aqui estan las
 * seis decisiones — descartar, reabrir, mitigar, deshacer, verificar, y leer lo
 * ya cerrado.
 */
export const FINDING_LIFECYCLE_CHANNELS = {
  scanDismiss: 'scan:dismiss',
  scanReopen: 'scan:reopen',
  scanMitigate: 'scan:mitigate',
  scanUnmitigate: 'scan:unmitigate',
  /** Propio y no `repair:propose`: verificar no propone nada (ADR-087). */
  findingVerify: 'finding:verify',
  /** Lo CERRADO, que el tablero filtra a proposito: su pantalla es la
   *  historia, y alli cada fila dice de que murio (ADR-087). */
  scanHistoria: 'scan:historia'
} as const
