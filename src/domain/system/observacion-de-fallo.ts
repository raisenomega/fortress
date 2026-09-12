import type { AreaDeObservacion } from './area-de-observacion'
import type { SelfNoteDraft } from './self-observation'

/** El `sourceProject` de un fallo de la app. No es un proyecto de cliente: la
 *  app no revienta auditando algo, revienta en la instalacion. Distinto a
 *  proposito de `fortress-command-center`, que ya existe en el backlog y
 *  significa otra cosa —lo que un agente noto AUDITANDO el repo propio—. */
export const ESTA_INSTALACION = 'FORTRESS (esta instalacion)'

/** Que corria cuando rompio. Cerrado: es una constante de FORTRESS, nunca un
 *  dato de entrada, y de ahi le viene a la nota la mitad de su seguridad. */
export const OPERACIONES_DE_FALLO = [
  'el ensamblado de la app',
  'una excepcion sin capturar',
  'una promesa rechazada sin manejar'
] as const

export type OperacionDeFallo = (typeof OPERACIONES_DE_FALLO)[number]

/**
 * Un nombre de clase de error, o nada.
 *
 * ESTA es la pieza que hace la nota segura POR CONSTRUCCION, y no por auditar
 * los sitios que lanzan. `error.name` es un campo escribible: nada impide que
 * alguien lo pise con una ruta o con un mensaje interpolado. El filtro no confia
 * en que no pase — exige la FORMA de un identificador, y una ruta o una frase
 * (con barras, con espacios) no puede tenerla: `SqliteError` pasa,
 * `/media/cliente/x.ts:40` no.
 *
 * Fuera de forma cae al centinela, que se ve y se cuenta: molde de `aArea`.
 */
const NOMBRE_DE_CLASE = /^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/

export function tipoDeFallo(nombre: unknown): string {
  return typeof nombre === 'string' && NOMBRE_DE_CLASE.test(nombre) ? nombre : 'desconocido'
}

/**
 * Que area le toca a un fallo, por el tipo del error. Molde de `POR_HERRAMIENTA`
 * en `observacion-de-denial`: un mapa determinista, sin juicio, porque el tipo
 * ya viene saneado y cerrado. `Sqlite*` —lo que better-sqlite3 levanta— manda
 * sobre el punto donde se atrapo: es una rotura de persistencia venga del
 * arranque o de un canal. Si el tipo no dice nada decide `porDefecto`, que es
 * el embudo que lo capturo.
 */
const POR_TIPO: ReadonlyArray<readonly [RegExp, AreaDeObservacion]> = [
  [/^Sqlite/, 'fallo-de-persistencia']
]

export function areaDeFallo(tipo: string, porDefecto: AreaDeObservacion): AreaDeObservacion {
  return POR_TIPO.find(([re]) => re.test(tipo))?.[1] ?? porDefecto
}

/**
 * Lo que FORTRESS aprende cuando se ROMPE (ADR-086). Tres datos y ninguno mas:
 * que operacion corria, de que tipo fue el error, y nada del `message`.
 *
 * El `message` NO entra. Diecisiete de los que este codigo construye se
 * interpolan y ocho concatenan hoy una ruta o una identidad del cliente — y que
 * hoy sean ocho no es garantia: quien escriba el proximo `throw` decide. El
 * texto crudo va al log LOCAL, que no viaja (las dos lecturas de
 * `lectura-del-denial`).
 *
 * `kind: 'bug'` y no un valor nuevo: el vocabulario ya tiene la palabra y
 * dieciseis del corpus la usan para justo esto. Un sinonimo partiria la dedup
 * en dos — la leccion de las veintiseis formas de escribir «permisos».
 */
export function observacionDeFallo(operacion: OperacionDeFallo, nombre: unknown): SelfNoteDraft {
  const tipo = tipoDeFallo(nombre)
  return {
    kind: 'bug',
    area: areaDeFallo(tipo, 'fallo-de-arranque'),
    note: `FORTRESS rompio durante ${operacion}: ${tipo}`
  }
}
