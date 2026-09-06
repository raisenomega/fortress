import Database from 'better-sqlite3'
import type { Degradada } from '@domain/project/severidad-al-fundir'

export interface Veredicto {
  readonly ok: boolean
  /** Cual de las condiciones fallo. Un "no" sin motivo obliga a adivinar. */
  readonly porque: string
}

const NO = (porque: string): Veredicto => ({ ok: false, porque })

/**
 * Un backup de verdad, no un fichero que exista.
 *
 * `existsSync` lo satisface un `touch`, y eso no es una guarda: es un placebo —
 * lo comprobo un incidente real, no una hipotesis. Se exige lo mismo que se
 * comprobaria a mano antes de fiarse de una copia: que abra como SQLite, que
 * diga `ok`, que tenga los datos y que tenga LAS FILAS que se van a tocar.
 *
 * El conteo debe COINCIDIR: un backup de otro momento restauraria un estado que
 * no es el de antes de esta escritura, que es justo de lo que protege.
 */
export function backupValido(
  ruta: string,
  findingsVivos: number,
  ids: readonly string[]
): Veredicto {
  // El constructor NO falla con un fichero que no es SQLite: el error sale en la
  // PRIMERA lectura ("file is not a database"). Por eso el try envuelve todo, y
  // no solo la apertura — lo destapo el test del fichero de basura.
  let db: Database.Database | null = null
  try {
    db = new Database(ruta, { readonly: true, fileMustExist: true })
    const integridad = (db.pragma('integrity_check', { simple: true }) as string) ?? ''
    if (integridad !== 'ok') return NO(`el backup no pasa integrity_check: ${integridad}`)

    const tabla = db.prepare(`SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='findings'`).get() as { n: number } // prettier-ignore
    if (tabla.n === 0) return NO('el backup no tiene tabla findings')

    const cuantos = (db.prepare('SELECT COUNT(*) n FROM findings').get() as { n: number }).n
    if (cuantos !== findingsVivos) {
      return NO(`el backup tiene ${cuantos} findings y la base viva ${findingsVivos}: es de otro momento`) // prettier-ignore
    }

    const hay = db.prepare('SELECT COUNT(*) n FROM findings WHERE id = ?')
    const falta = ids.find((id) => (hay.get(id) as { n: number }).n === 0)
    if (falta !== undefined) return NO(`el backup no contiene la fila que se va a tocar: ${falta}`)

    return { ok: true, porque: 'backup legible, integro y con las filas que se tocan' }
  } catch {
    return NO(`el backup "${ruta}" no abre como base SQLite legible`)
  } finally {
    db?.close()
  }
}

/** Las dos condiciones, en el orden que importa: primero lo caro de comprobar
 *  (el backup), y la app CERRADA lo ULTIMO, pegada a la escritura. */
export function puedeAplicar(
  victimas: readonly Degradada[],
  findingsVivos: number,
  backup: string,
  appCerrada: () => boolean
): Veredicto {
  const copia = backupValido(backup, findingsVivos, victimas.map((v) => v.id)) // prettier-ignore
  if (!copia.ok) return copia
  if (!appCerrada()) return NO('la app esta ABIERTA: cierrala antes de aplicar')
  return { ok: true, porque: copia.porque }
}
