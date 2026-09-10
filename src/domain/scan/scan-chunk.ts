/** En que punto del recorrido va el escaneo. Lo compone FORTRESS, no el agente. */
export interface ParadaEnCurso {
  readonly hecha: number
  readonly total: number
  readonly carpeta: string
}

/** Fragmento de progreso de un escaneo en curso, del main al renderer. */
export interface ScanChunk {
  readonly projectId: string
  readonly delta: string
  /**
   * La parada que acaba de terminar, cuando el chunk anuncia uno. Opcional: el
   * stream de texto de siempre viaja sin el.
   *
   * Va FUERA del tachado a proposito. `sinSecretosEnVivo` gobierna el `delta`,
   * que es salida del agente leyendo el repo auditado y es lo unico que puede
   * arrastrar un secreto. Estos tres numeros los pone el recorrido a partir del
   * manifiesto: pasarlos por el redactor no protegeria nada y obligaria a tocar
   * un fichero innegociable.
   */
  readonly parada?: ParadaEnCurso
}
