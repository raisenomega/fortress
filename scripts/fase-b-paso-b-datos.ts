import { readFileSync } from 'fs'
import { join } from 'path'
import type { Fusion } from '../src/domain/project/fusion-de-duplicados.ts'
import { createFsProbe } from '../src/infrastructure/omega/fs-probe.ts'
import type { Db } from '../src/infrastructure/persistence/database.ts'
import { zombisSinGemela } from '../src/infrastructure/persistence/zombis-sin-gemela.ts'
import { cuadrarConHoy } from './fase-b-paso-b-cuadre.ts'
import type { FilaDelPasoB } from './fase-b-paso-b-plan.ts'

export interface PlanAprobado {
  readonly veredictos: readonly FilaDelPasoB[]
  readonly fusiones: readonly Fusion[]
}
interface Datos extends PlanAprobado {
  readonly proyecto: string
}

/**
 * El JSON revisado, cuadrado con la base y con los ficheros de hoy: o todo
 * cuadra o lanza, y no se escribe nada. Un JSON sin `fusiones` es anterior al
 * plan que las imprime: se reemite con `fase-b:replan` antes de aplicar.
 */
export function planAprobado(
  proyecto: string,
  db: Db,
  p: { id: string; path: string }
): PlanAprobado {
  // prettier-ignore
  const datos = JSON.parse(readFileSync(join(process.cwd(), 'internal', `fase-b-paso-b-${proyecto}.json`), 'utf8')) as Datos // prettier-ignore
  if (datos.proyecto !== proyecto)
    throw new Error(`el JSON es de ${datos.proyecto}, no de ${proyecto}`)
  if (!Array.isArray(datos.fusiones))
    throw new Error('fail-closed: el JSON no trae fusiones; reemite el plan con fase-b:replan')
  const zombis = zombisSinGemela(db, p.id)
  const ids = new Set(zombis.map((z) => z.id))
  const faltan = datos.veredictos.filter((v) => !ids.has(v.id))
  if (faltan.length > 0 || zombis.length !== datos.veredictos.length) throw new Error(`fail-closed: la base no cuadra con el JSON (${zombis.length} zombis, ${datos.veredictos.length} veredictos, ${faltan.length} ausentes)`) // prettier-ignore
  const sinDecidir = datos.veredictos.filter((v) => v.desenlace === 'sin_decidir')
  if (sinDecidir.length > 0)
    throw new Error(
      `fail-closed: ${sinDecidir.length} sin decidir; vuelve a juzgar antes de aplicar`
    )
  cuadrarConHoy(zombis, datos.veredictos, (f) => createFsProbe().contenido(p.path, f))
  return { veredictos: datos.veredictos, fusiones: datos.fusiones }
}
