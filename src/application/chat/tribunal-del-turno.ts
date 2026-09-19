import type { CheckpointDelTurno } from '@domain/chat/red-de-reversion'
import { seVerifico, type VerificacionDelArbol } from '@domain/chat/verificacion-del-arbol'
import type { HallazgoJuzgado } from '@domain/repair/hallazgo-juzgado'

/**
 * Los criticos que atacan el fix ANTES de que OMEGA lo juzgue (ADR-096, Fase B).
 * Devuelve sus objeciones; lista vacia = ninguno encontro nada que reprochar.
 */
export interface Tribunal {
  (cp: CheckpointDelTurno, plan: HallazgoJuzgado): Promise<readonly string[]>
}

/**
 * El tribunal corre con VERDE y con DESCONOCIDA; con rojo no.
 *
 * Con rojo no porque el gate YA dictamino: criticar seria repetirlo, y ademas
 * no hace falta esta funcion para evitarlo —el tribunal vive detras de la
 * guarda de `arbitrar`, que en rojo ya salio—. Se escribe igual para que la
 * regla se lea en un sitio y no se deduzca de donde esta la llamada.
 *
 * Con DESCONOCIDA si, y es la decision que hay que defender: el critico NAVEGA
 * el codigo, no lo compila. Puede ver que el fix rompe a quien lo llama en un
 * arbol que no compilo, porque lo que lee son las llamadas, no el binario. En
 * desconocida el critico es MAS valioso, no menos: es la unica voz sobre el fix
 * menos verificable.
 *
 * No correr el tribunal «porque es caro y encima no compila» seria justo el
 * freno de bolsillo que ADR-090 §0 prohibe. Y encaja con ADR-091: desconocida
 * ni tumba ni absuelve — el tribunal es la version ACTIVA de eso.
 */
export function corresponde(arbol: VerificacionDelArbol): boolean {
  return arbol !== 'rojo'
}

/**
 * Lo que el operador tiene que saber cuando el debate se formo sobre un arbol
 * que nadie pudo compilar. No invalida el veredicto —el critico leyo codigo de
 * verdad— pero lo acota: se juzgo el fix, no se comprobo que construya.
 */
export const CRITICADO_SIN_BUILD =
  '\n\nEl debate se formo SIN build: el arbol no se pudo compilar, asi que las ' +
  'objeciones salen de leer el codigo, no de verlo correr.'

/** Si hay que avisar de que el debate se formo sin build. */
export function debateSinBuild(arbol: VerificacionDelArbol, objeciones: number): boolean {
  return objeciones > 0 && !seVerifico(arbol)
}
