import { idDeProyectoEnArgs, observacionDeFalloDeIpc } from '@domain/system/observacion-de-ipc'
import { conRed, nombreDelError, type SumideroDeFallos } from '../system/red-del-embudo'

export type Manejador = (event: unknown, ...args: unknown[]) => unknown

/** Lo minimo de `ipcMain` que hace falta. Tipar el registrador, y no importar
 *  `ipcMain`, es lo que deja el embudo verificable sin levantar Electron. */
export interface RegistradorIpc {
  handle: (canal: string, manejador: Manejador) => void
}

/** Puesta en la funcion envuelta: envolver dos veces duplicaria la observacion
 *  de cada fallo, y el registro se llama una vez pero las pruebas no. */
const MARCA = Symbol.for('fortress.embudo-de-ipc')

type Handle = RegistradorIpc['handle'] & { [MARCA]?: true }

export function capturarFalloDeIpc(
  sumidero: SumideroDeFallos,
  canal: string,
  args: readonly unknown[],
  error: unknown
): void {
  const nota = observacionDeFalloDeIpc(canal, nombreDelError(error))
  conRed(sumidero, `el canal ${canal}`, nota, error, idDeProyectoEnArgs(args))
}

/**
 * El embudo del IPC (ADR-086, embudo 2): envuelve el REGISTRO, no cada handler.
 *
 * POR QUE EN LA RAIZ. No habia helper comun —los 110 llaman a `ipcMain.handle`
 * directo— asi que el cuello de botella hay que construirlo. Migrar los 110 a
 * un helper obligaria a editar `settings-handlers.ts`, que es INNEGOCIABLE por
 * los secretos, y a confiar en un test-guardia que avisa cuando alguien olvida
 * el helper. Envolver aqui no toca ninguno de los 36 ficheros, cubre el
 * innegociable sin abrirlo, y cubre los handlers FUTUROS sin que nadie se
 * acuerde. Es la diferencia entre «no puede olvidarse» y «el test avisa si se
 * olvida», y es la misma razon por la que el cerco vive en `add`.
 *
 * OBSERVA, NO INTERCEPTA. Relanza el objeto identico, asi que el renderer
 * recibe exactamente lo que recibia; el string opaco que el IPC devuelve hoy es
 * otro problema y arreglarlo aqui seria hacer dos cosas en un commit.
 *
 * EL `await` NO ES ADORNO. Solo 13 de los 110 callbacks se declaran `async`,
 * pero muchos sincronos DEVUELVEN una promesa (`() => handleRun(...)`). Sin el,
 * el `try` devuelve la promesa antes de que se rechace y el embudo pareceria
 * funcionar mientras se le escapan los fallos asincronos, los mas comunes.
 *
 * NO ve los 16 handlers que ya convierten su `throw` en `err()` dentro de su
 * propio `catch` (escaner, calidad, postura, chat, motor): para el devolvieron
 * un valor y todo fue bien. Su `catch` es correcto —el renderer necesita una
 * respuesta, y `scan-handlers` ademas libera el carril en su `finally`— asi que
 * no se tocan. Cubre 94 de 110, y eso se dice en voz alta.
 */
export function envolverRegistroIpc(registrador: RegistradorIpc, sumidero: SumideroDeFallos): void {
  const actual = registrador.handle as Handle
  if (actual[MARCA] === true) return

  const original = actual.bind(registrador)
  const envuelto: Handle = (canal, manejador) =>
    original(canal, async (event, ...args) => {
      try {
        return await manejador(event, ...args)
      } catch (error) {
        capturarFalloDeIpc(sumidero, canal, args, error)
        throw error
      }
    })

  envuelto[MARCA] = true
  registrador.handle = envuelto
}
