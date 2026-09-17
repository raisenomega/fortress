/**
 * Lo que el Terminal necesita de la red de reversion del ADR-079, sin saber que
 * detras hay git. Un checkpoint abierto sobre el arbol vivo tiene dos unicas
 * salidas, y las dos dicen si el commit del checkpoint quedo RETIRADO del
 * historial: `false` es un checkpoint huerfano en la rama del operador.
 */
export interface CheckpointDelTurno {
  /** Exito: el arbol se queda con las ediciones del agente. */
  conservar(): boolean
  /** Fallo: las ediciones se descartan y el arbol vuelve a como estaba. */
  revertir(): boolean
}

export interface RedDeReversion {
  /** Si `abrir` tendria red: raiz de repo git con historia. Sin efectos, para
   *  decidir el modo ANTES de abrir nada; es la senal que degrada a supervisado. */
  readonly disponible: (cwd: string) => boolean
  /** null = no hay red posible: sin git, sin raiz de repo, o sin commits. */
  readonly abrir: (cwd: string) => CheckpointDelTurno | null
  /** El typecheck del proyecto tras el turno: true si el arbol compila. */
  readonly verificar: (cwd: string) => Promise<boolean>
}

/** Sin red: lo que hay cuando nadie la inyecta. `disponible` en false degrada. */
export const SIN_RED: RedDeReversion = {
  disponible: () => false,
  abrir: () => null,
  verificar: () => Promise.resolve(true)
}

/** Lo que lee el operador cuando el turno se deshizo. Es texto nuestro, no del agente. */
export const REVERTIDO_POR_RED =
  '\n\n---\nTurno REVERTIDO (ADR-079): el agente fallo, se detuvo, o el arbol no ' +
  'compilaba despues. El proyecto ha vuelto byte a byte a como estaba antes de ' +
  'este mensaje; tu trabajo sin guardar sigue ahi.'

/**
 * Se iba a editar y la red NO se pudo montar: el turno no corre.
 *
 * Cubre lo que `disponible` no puede prever —el indice bloqueado por otro git,
 * permisos de escritura, disco lleno—, no solo la identidad. Antes de esto el
 * turno se producia igual con el checkpoint en null: el agente editaba el arbol
 * vivo sin nada que deshacerlo, y en silencio. Es lo que ADR-079 prohibe.
 */
export const SIN_RED_NO_SE_EDITA =
  'No he corrido este turno. Iba a editar y la red de reversion no se pudo montar: ' +
  'el checkpoint de git no llego a crearse, asi que no habria forma de deshacer lo ' +
  'que dejara. Comprueba que el proyecto sea un repo git con identidad configurada ' +
  '(user.email / user.name) y que no haya otro git trabajando sobre el.'

/** El caso que no deberia pasar, dicho en vez de callado. */
export const CHECKPOINT_HUERFANO =
  '\n\n---\nAVISO: no se pudo retirar el commit "checkpoint transitorio" de tu rama. ' +
  'Esta en el historial: `git reset --soft HEAD^` lo quita sin tocar el arbol.'
