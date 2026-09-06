import type { Degradada, Pareja } from '@domain/project/severidad-al-fundir'
import type { Db } from './database'

/** Cada superviviente VIVA junto a la severidad de una absorbida suya: el unico
 *  hilo que queda entre las dos despues de fundir. */
export const PAREJAS_DE_FUSION = `SELECT g.id, g.severity AS viva, a.severity AS absorbida
  FROM findings g JOIN findings a ON a.extinct_reason = 'fusionada-con-' || g.id
  WHERE g.project_id = ? AND g.lifecycle != 'EXTINCT'`

/** Lo UNICO que se escribe sobre la que sobrevive: ni su `first_seen` —su
 *  historia, y el motivo de que gane— ni la identidad ni el ciclo de vida. */
export const ELEVAR_SEVERIDAD = `UPDATE findings SET severity = @severity WHERE id = @id`

export type Regla = (parejas: readonly Pareja[]) => readonly Degradada[]

/** Quien quedo por debajo de su grupo. SOLO LEE: es todo lo que este runner
 *  hace, y la conexion que le llega viene abierta en `readonly`. */
export function leerVictimas(db: Db, proyecto: string, regla: Regla): readonly Degradada[] {
  return regla(db.prepare(PAREJAS_DE_FUSION).all(proyecto) as Pareja[])
}

/**
 * Los UPDATE que el operador correria A MANO, como TEXTO. Este repo no los
 * ejecuta: la escritura en la base real dejo de ser una capacidad del codigo.
 *
 * No es una limitacion tecnica, es la conclusion de un incidente: mientras
 * existio un `--aplicar`, se alcanzo dos veces en una tarde "para ver si
 * funciona", la primera escribiendo en produccion. Una barrera mas alta en esa
 * puerta seguia siendo una puerta; lo que se quita es la puerta. El gesto vuelve
 * a ser del operador, como `install.sh` y como el push al remoto.
 */
export function updatesParaElOperador(victimas: readonly Degradada[]): readonly string[] {
  if (victimas.length === 0) return []
  return [
    '-- Para aplicar (gesto humano, con app cerrada y backup):',
    ...victimas.map(
      (v) => `UPDATE findings SET severity='${v.maxima}' WHERE id='${v.id}';  -- ${v.viva} -> ${v.maxima}` // prettier-ignore
    ),
    'Verifica app cerrada por los cuatro caminos y haz backup antes. Este script NO escribe.'
  ]
}
