import type { Degradada, Pareja } from '@domain/project/severidad-al-fundir'
import type { Db } from './database'
import type { Veredicto } from './reparar-gravedad-guardas'

/** Cada superviviente VIVA junto a la severidad de una absorbida suya: el unico
 *  hilo que queda entre las dos despues de fundir. */
export const PAREJAS_DE_FUSION = `SELECT g.id, g.severity AS viva, a.severity AS absorbida
  FROM findings g JOIN findings a ON a.extinct_reason = 'fusionada-con-' || g.id
  WHERE g.project_id = ? AND g.lifecycle != 'EXTINCT'`

/** Lo UNICO que se escribe sobre la que sobrevive: ni su `first_seen` —su
 *  historia, y el motivo de que gane— ni la identidad ni el ciclo de vida. */
export const ELEVAR_SEVERIDAD = `UPDATE findings SET severity = @severity WHERE id = @id`

export type Regla = (parejas: readonly Pareja[]) => readonly Degradada[]

/**
 * El permiso para ESCRIBIR, inyectado. Ausente, no se escribe.
 *
 * Viene de fuera y no se importa aqui para que este modulo no tenga imports en
 * tiempo de ejecucion: asi lo consume igual un script suelto, que no resuelve
 * alias ni rutas sin extension (deuda `contrato-scan-no-importable-desde-script`).
 */
export type Permiso = (victimas: readonly Degradada[], findingsVivos: number) => Veredicto

/** Quien quedo por debajo de su grupo. SOLO LEE: es lo que mira el modo plan. */
export function leerVictimas(db: Db, proyecto: string, regla: Regla): readonly Degradada[] {
  return regla(db.prepare(PAREJAS_DE_FUSION).all(proyecto) as Pareja[])
}

/**
 * Repara los grupos que se fundieron ANTES de que la regla existiera. No recibe
 * una lista de victimas: las ENCUENTRA con la misma autoridad que usa la fusion,
 * asi que si hubiera mas de las que alguien cree, salen igual.
 *
 * Verifica DENTRO de la transaccion: vuelve a preguntar quien queda degradado
 * despues de escribir —releyendo la base, sin fiarse de lo que acaba de hacer— y
 * si queda alguno lanza y `better-sqlite3` deshace todo.
 *
 * El permiso se pide con las victimas ya sabidas y PEGADO a la transaccion: el
 * backup tiene que contener justo las filas que se van a tocar, y la app tiene
 * que estar cerrada AHORA, no cuando arranco el proceso.
 */
export function repararGravedad(
  db: Db,
  proyecto: string,
  regla: Regla,
  permiso?: Permiso
): readonly Degradada[] {
  const victimas = leerVictimas(db, proyecto, regla)

  if (permiso !== undefined) {
    const vivos = (db.prepare('SELECT COUNT(*) n FROM findings').get() as { n: number }).n
    const veredicto = permiso(victimas, vivos)
    if (!veredicto.ok) throw new Error(veredicto.porque)
  }

  const elevar = db.prepare(ELEVAR_SEVERIDAD)
  db.transaction(() => {
    for (const v of victimas) elevar.run({ id: v.id, severity: v.maxima })

    const quedan = leerVictimas(db, proyecto, regla)
    if (quedan.length > 0) {
      throw new Error(`quedan ${quedan.length} degradadas tras reparar: ${quedan[0].id}`)
    }
  })()

  return victimas
}
