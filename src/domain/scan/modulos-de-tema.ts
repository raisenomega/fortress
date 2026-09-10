import { NOMBRE_MODULO, type ModuloAuditoria } from './modulo-auditoria'
import type { ParadaDeTema } from './parada'

/**
 * Los modulos que miran el proyecto ENTERO (ADR-083). M2 pregunta si se puede
 * restaurar, M7 como entra un cambio, M4 de quien se depende, M11 quien sabe
 * operarlo y M12 si se ve lo que pasa. Ninguno vive en una carpeta.
 *
 * Gemelo de `MODULOS_DE_CARPETA`, y entre los dos NO cubren los doce: M1, M6 y
 * M10 no se han clasificado todavia, y M8 y M3 son de carpeta pero solo entran
 * si el operador los declara. Que la suma no de doce es correcto: clasificar
 * los que faltan es una decision pendiente, no un olvido de esta lista.
 */
export const MODULOS_DE_TEMA: readonly ModuloAuditoria[] = ['M2', 'M4', 'M7', 'M11', 'M12']

/** Como se dice el alcance de un tema, en el rotulo y en el prompt. */
export const TODO_EL_PROYECTO = 'todo el proyecto'

/**
 * Una parada por modulo de tema que aplique, en el orden de la constante para
 * que dos manifiestos del mismo proyecto sean iguales.
 *
 * UNA por modulo y no una por carpeta: es la decision que hace barata la fase.
 * Cinco temas sobre un proyecto de doce carpetas son cinco pasadas, no sesenta.
 */
export function paradasDeTema(aplicables: readonly ModuloAuditoria[]): readonly ParadaDeTema[] {
  return MODULOS_DE_TEMA.filter((modulo) => aplicables.includes(modulo)).map((modulo) => ({
    clase: 'tema',
    modulo,
    rotulo: `${modulo} ${NOMBRE_MODULO[modulo]} — ${TODO_EL_PROYECTO}`
  }))
}
