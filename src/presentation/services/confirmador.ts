/** La CONFIRMACION de los borrados (Revision B, PASO 121): dialogo nativo
 *  por defecto, inyectable en tests. FAIL-CLOSED: sin dialogo que responda
 *  que si, no se borra nada. */
type Confirmar = (mensaje: string) => boolean

const nativo: Confirmar = (mensaje) => globalThis.confirm?.(mensaje) ?? false

let confirmar: Confirmar = nativo

export const confirmador = (mensaje: string): boolean => confirmar(mensaje)

/** SOLO tests: null devuelve el dialogo nativo. */
export const _inyectarConfirmador = (f: Confirmar | null): void =>
  void (confirmar = f ?? nativo)
