import type { DatosDelInforme } from './informe-datos'

/**
 * Puerto del entregable. El dominio compone el markdown y no sabe donde acaba:
 * quien lo escribe decide el destino, como con `ScanLogWriter`.
 *
 * MEJOR ESFUERZO por contrato —no devuelve nada, ni siquiera un fallo—: cuando
 * esto corre, el escaneo YA esta guardado con sus hallazgos y su fila. Perder
 * el informe cuesta un documento que se puede volver a componer; tumbar el
 * cierre por no poder escribirlo costaria la auditoria entera.
 *
 * Es la diferencia con `exportObservations`, donde el fallo SI se cuenta:
 * alli exportar es lo unico que el operador vino a hacer, y decir que se hizo
 * sin hacerlo seria mentir sobre el acto. Aqui el acto es auditar.
 */
export interface InformeWriter {
  write(datos: DatosDelInforme): void
}
