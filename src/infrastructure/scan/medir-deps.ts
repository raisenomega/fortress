import type { ModuloAuditoria } from '@domain/scan/modulo-auditoria'
import { leerPlantilla } from './leer-plantilla'
import { SIN_JUEZ, type Juez } from './juez-de-aplicabilidad'

/**
 * Lo que el reconocimiento necesita del mundo. Las dos cosas que no son git ni
 * disco del proyecto: quien juzga lo que la cascada no resuelve gratis, y quien
 * sabe si el operador sembro una plantilla.
 */
export interface MedirDeps {
  readonly juzgar: Juez
  readonly haySembrada: (modulo: ModuloAuditoria) => boolean
}

/**
 * Sin agente y sin kit que mirar. `haySembrada` dice que SI a proposito: sin
 * nadie que compruebe, afirmar que faltan todas seria inventarle al informe una
 * carencia que nadie midio. El default honesto de «no se comprobo» es no
 * declarar ninguna ausente, que es lo que hace un escaneo de una pieza.
 */
export const SIN_MEDIDA: MedirDeps = { juzgar: SIN_JUEZ, haySembrada: () => true }

/** Las de verdad: el kit de `userData`, leido en el momento de medir. */
export const conKitSembrado = (juzgar: Juez): MedirDeps => ({
  juzgar,
  haySembrada: (modulo) => leerPlantilla(modulo) !== null
})
