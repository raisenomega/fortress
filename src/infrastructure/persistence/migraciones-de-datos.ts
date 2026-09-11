import type { Db } from './database'
import { barrerConRed } from './barrido-con-red'
import { reidentificarConRed } from './reidentificar-con-red'

/**
 * Las migraciones que NO tocan el esquema sino los DATOS, juntas y al final.
 *
 * Van las ultimas porque necesitan las columnas ya puestas, y van DENTRO de
 * `runMigrations` porque ahi es donde corren antes de que la app pueda trabajar:
 * la de identidades antes de que se pueda escanear, y la del cerco antes de que
 * se pueda exportar. Esa es toda su razon de estar aqui — si corrieran despues,
 * existiria un instante con la base a medio arreglar y la puerta abierta.
 *
 * Las dos son mejor esfuerzo con constancia: un fallo no impide abrir la app,
 * pero queda dicho. Cada una trae su propia red.
 */
export function migrarDatos(db: Db): void {
  // ADR-084: la clave nueva de los hallazgos, y la fusion de lo que colapsa.
  reidentificarConRed(db)
  // ADR-085: las citas del cliente fuera del backlog de auto-mejora.
  barrerConRed(db)
}
