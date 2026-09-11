import { planDeFusion } from '@domain/project/fusion-de-duplicados'
import type { Db } from './database'
import { createFindingFusion } from './finding-fusion'
import { aFilaConSeveridad, leerVivas } from './filas-a-reidentificar'

const REESCRIBIR = `UPDATE findings SET identity = @identity
  WHERE id = @id AND lifecycle != 'EXTINCT'`

export interface Reidentificacion {
  readonly reescritas: number
  readonly absorbidas: number
}

/**
 * El backfill de ADR-084, que corre al ABRIR la base y antes de que ningun
 * escaneo pueda empezar.
 *
 * Hace falta porque cambiar la formula NO arregla lo ya escrito, y un
 * re-escaneo tampoco: `sync` busca la clave NUEVA contra la columna que guarda
 * las VIEJAS, no empata ninguna e INSERTA al lado — y la vieja sigue viva,
 * porque nada muere sin juicio (ADR-065) y `TOUCH_FINDING` ni siquiera toca
 * `identity` cuando si cruza. Sin esto, el primer escaneo tras el cambio
 * DUPLICA el corpus en vez de limpiarlo.
 *
 * Dos pasos, como ADR-071: primero cada fila viva recibe su clave nueva, y solo
 * despues se funde lo que colapso. Entre medias —y solo entre medias— la base
 * tiene dos filas con la misma clave; por eso las dos van en la MISMA
 * transaccion que abre `fusionar`, y el plan se calcula con las claves ya
 * escritas.
 *
 * Idempotente: la segunda vez reescribe las mismas claves con el mismo valor y
 * el plan sale vacio, porque las absorbidas ya no estan vivas.
 */
export function reidentificarHallazgos(db: Db): Reidentificacion {
  const filas = leerVivas(db).map(aFilaConSeveridad)
  if (filas.length === 0) return { reescritas: 0, absorbidas: 0 }

  const reescribir = db.prepare(REESCRIBIR)
  db.transaction(() => {
    for (const f of filas) reescribir.run({ id: f.id, identity: f.identidad })
  })()

  // Se le pasan SOLO las que el plan agrupa: `fusionar` recorre el plan, y
  // darle las 366 cuando sobran 20 no cambia el resultado pero si lo que se
  // lee al depurarlo.
  const enPlan = new Set(planDeFusion(filas).flatMap((f) => [f.ganadora, ...f.absorbidas]))
  const absorbidas = createFindingFusion(db).fusionar(filas.filter((f) => enPlan.has(f.id)))

  return { reescritas: filas.length, absorbidas }
}
