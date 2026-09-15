/**
 * La memoria del productor del Terminal por hallazgo (ADR-088, Enmienda 2): la
 * sesion del CLI que reanuda el siguiente turno con ese foco, para que «propon»
 * y «aplicalo» sean la misma conversacion.
 *
 * Puerto propio y no parte del ciclo de vida: recordar una conversacion no
 * decide nada sobre el hallazgo, ni lo cierra ni lo reabre.
 */
export interface MemoriaDelTerminalPort {
  /** La sesion guardada para ese hallazgo, o null: «sin memoria». */
  sesionDelTerminal(findingId: string): string | null

  /** Guarda la sesion que merece recordarse. Quien llama decide cuando: solo si
   *  la red no revirtio el turno (Garantia 1). */
  recordarSesionDelTerminal(findingId: string, sesion: string): void

  /** Olvida una sesion que ya no se puede reanudar (Garantia 2). */
  olvidarSesionDelTerminal(findingId: string): void
}
