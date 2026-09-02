import type { Db } from './database'

interface Conteo {
  readonly c: number
}

const filas = (db: Db, tabla: string): number =>
  (db.prepare(`SELECT COUNT(*) c FROM ${tabla}`).get() as Conteo).c

/**
 * Sustituye una tabla por su gemela con la definicion nueva, conservando las
 * filas. SQLite no deja tocar una restriccion en caliente, asi que crear, copiar,
 * borrar y renombrar es el unico camino; esta pieza lo hace una sola vez para
 * que las migraciones que lo necesiten no repitan el procedimiento.
 *
 * El recuento se compara DENTRO de la transaccion que la llama: si no cuadra, la
 * excepcion revierte el recambio entero y la tabla vieja se queda donde estaba.
 *
 * Quien llama es responsable de apagar `foreign_keys` FUERA de la transaccion:
 * con las claves activas, el DROP de la tabla vieja arrastra por cascada las
 * filas que cuelgan de ella. Los nombres son literales del codigo, nunca input.
 */
export function recambiarTabla(db: Db, tabla: string, cols: string, indices: string): void {
  const antes = filas(db, tabla)
  db.exec(`CREATE TABLE ${tabla}_nueva (${cols})`)
  db.exec(`INSERT INTO ${tabla}_nueva SELECT * FROM ${tabla}`)

  const copiadas = filas(db, `${tabla}_nueva`)
  if (copiadas !== antes) throw new Error(`${tabla}: se copiaron ${copiadas} de ${antes} filas`)

  db.exec(`DROP TABLE ${tabla}`)
  db.exec(`ALTER TABLE ${tabla}_nueva RENAME TO ${tabla}`)
  // Los indices murieron con la tabla vieja; la nueva nace sin ninguno.
  db.exec(indices)
}
