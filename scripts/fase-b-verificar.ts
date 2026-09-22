import type { Database } from 'better-sqlite3'
import { redDeLaFusion } from '../src/infrastructure/persistence/red-de-la-fusion.ts'
import { sinSupervivientesDegradadas } from './fase-b-criterio-6.ts'

/**
 * Los criterios que se comprueban DENTRO de la transaccion, antes del commit.
 * Cualquiera que falle lanza, y `better-sqlite3` deshace la transaccion entera:
 * la base queda intacta sin que nadie tenga que restaurar el backup.
 *
 * CASCARA DELGADA, como `fase-b-criterio-6`: aqui no queda ningun criterio
 * escrito. Los cuatro primeros viven en `red-de-la-fusion.ts` y el sexto en
 * `severidad-al-fundir.ts`, los dos dentro de `src/`, que es lo unico que el
 * `include` de vitest mira. Mientras estuvieron aqui, la red del momento mas
 * irreversible del sistema era la unica pieza que ningun gate probaba.
 *
 * El backup sigue siendo obligatorio — cubre lo que una transaccion no puede
 * (un kill -9, un disco lleno) y es la unica referencia del criterio 4, que
 * compara `first_seen` fila a fila contra OTRA base y solo se puede mirar
 * despues. Por eso ese no se pudo mudar con los demas.
 */
export function verificarEnCaliente(
  db: Database,
  proyecto: string,
  exentas: readonly string[],
  fueraDeAlcance: readonly string[] = []
): void {
  const violaciones = redDeLaFusion(db, proyecto, exentas, fueraDeAlcance)
  if (violaciones.length > 0) {
    const partes = violaciones.map((v) => `  criterio ${v.criterio}: ${v.quien} — ${v.detalle}`)
    throw new Error(`la migracion no cuadra:\n${partes.join('\n')}`)
  }

  sinSupervivientesDegradadas(db, proyecto)
}
