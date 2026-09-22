import { gemelaDe } from '@domain/project/gemela-de-la-zombi'
import type { Db } from './database'
import { leerVivasDeHoy, leerZombis, type FilaZombi } from './filas-con-identidad-vieja'

/**
 * El alcance del PASO B: las zombis que el paso A no toco porque no tienen una
 * fila de hoy al lado. A esas no les falta una gemela con la que fundirse: les
 * falta JUICIO —si el defecto sigue o se fue—, y eso lo decide un agente leyendo
 * el fichero de hoy, nunca un backfill. Medido en mailbd el 2026-09-22: 36.
 *
 * Mismo GLOB que el paso A (la forma de la clave vieja), menos las que tienen
 * gemela: ni una viva ADR-084, ni una zombi que le toque al paso A.
 */
export function zombisSinGemela(db: Db, proyecto: string): readonly FilaZombi[] {
  const vivas = leerVivasDeHoy(db, proyecto)
  return leerZombis(db, proyecto).filter((z) => gemelaDe(z, vivas) === null)
}
