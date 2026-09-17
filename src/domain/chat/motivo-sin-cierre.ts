import type { CierreDelCiclo } from './cierre-del-ciclo'

/**
 * Que guarda corto el cierre del ciclo (ADR-088, pieza 3). Es un ENUM cerrado y
 * nunca texto libre: se persiste en el parte del lote, asi que no puede llevar
 * rutas de ficheros, comandos ni nada del proyecto del cliente.
 */
export type MotivoSinCierre =
  | 'sin-foco'
  | 'no-conservado'
  | 'sin-ediciones'
  /** ADR-090: OMEGA veto y el reintento dejo de avanzar. NO es un error mudo ni
   *  un «no se intento»: se intento, se juzgo y no salio. La razon del ultimo
   *  veto NO viaja en el enum —seria texto del proyecto auditado—: va a la nota
   *  de la fila y al parte del turno, que es donde el operador la lee. */
  | 'no-convergio'

/**
 * Las DOS cuentas de «hubo ediciones», que deberian coincidir:
 *   `porNombre`  lo que ve la telemetria: cuantas herramientas de edicion corrio
 *   `porRuta`    lo que ve el cierre: cuantas rutas se capturaron
 * Solo numeros. Que divergieran —2 frente a 0— es lo que costo dos diagnosticos
 * a mano: sin esto, un cierre que no ocurre es indistinguible de uno que falla.
 */
export interface ConteoDeEdits {
  readonly porNombre: number
  readonly porRuta: number
}

export interface SinCierre {
  readonly motivo: MotivoSinCierre
  readonly edits: ConteoDeEdits
}

/** El cierre, o la guarda que lo corto. Nunca los dos, nunca ninguno. */
export interface ResultadoDelCierre {
  readonly cierre: CierreDelCiclo | null
  readonly sinCierre: SinCierre | null
}

export const cerro = (cierre: CierreDelCiclo): ResultadoDelCierre => ({ cierre, sinCierre: null })

// prettier-ignore
export const noCerro = (motivo: MotivoSinCierre, edits: ConteoDeEdits): ResultadoDelCierre =>
  ({ cierre: null, sinCierre: { motivo, edits } })

/** Como se lee en el parte del lote: el enum y, si discrepan, las dos cuentas.
 *  Cuando coinciden se dice una sola vez; la divergencia es la que hay que ver. */
export function textoSinCierre(sin: SinCierre): string {
  const { porNombre, porRuta } = sin.edits
  const cuentas = porNombre === porRuta ? `${porRuta} edits` : `edits ${porNombre} vs ${porRuta}`
  return `${sin.motivo} (${cuentas})`
}

/** Por que no cerraron, dicho UNA vez por motivo con cuantos cayeron en el. Es
 *  lo que convierte «no cerro» en algo accionable sin rastrear la base a mano. */
export function porQueNoCerraron(motivos: readonly SinCierre[]): string {
  if (motivos.length === 0) return ''
  const veces = new Map<string, number>()
  for (const sin of motivos) {
    const texto = textoSinCierre(sin)
    veces.set(texto, (veces.get(texto) ?? 0) + 1)
  }
  const lista = [...veces].map(([texto, n]) => (n > 1 ? `${texto} ×${n}` : texto)).join(', ')
  return `Sin cerrar por: ${lista}.`
}
