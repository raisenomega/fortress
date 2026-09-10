/**
 * Puerto para dejar en disco la salida CRUDA de un escaneo.
 *
 * Existe porque hasta ahora no habia ninguna: el analisis del agente viajaba al
 * renderer para pintarse y moria con la ventana. De un escaneo que reventaba no
 * quedaba el informe, ni el gasto, ni una linea — el silencio que costo una
 * tarde de arqueologia sobre Health Flow.
 *
 * La aplicacion entrega el texto; la infraestructura lo tacha y lo deja donde
 * toque. Mismo molde que `CognitionWriter`, con UNA diferencia deliberada: el
 * COGNITION-LOG es memoria DEL PROYECTO y vive en su repo; esto es prosa de un
 * agente sobre codigo ajeno, es de FORTRESS, y ensuciar el repo del cliente con
 * ello —o colarlo en un commit suyo— no seria un descuido menor.
 */
export interface ScanLogWriter {
  /**
   * `scanId` ata el fichero a su fila de `scans` sin inventar un indice.
   * Mejor esfuerzo: si el disco falla, el escaneo ya esta guardado y perder su
   * transcripcion no lo invalida.
   */
  write(scanId: string, texto: string): void
}

/** Para quien no escribe nada (tests, caminos sin disco). */
export const SIN_LOG: ScanLogWriter = { write: () => undefined }
