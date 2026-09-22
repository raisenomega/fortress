import { writeFileSync } from 'fs'
import { join } from 'path'
import { fusionesDelPasoB } from '../src/domain/project/fusiones-del-paso-b.ts'
import type { Db } from '../src/infrastructure/persistence/database.ts'
import { leerVivasDeHoy, type FilaZombi } from '../src/infrastructure/persistence/filas-con-identidad-vieja.ts' // prettier-ignore
import { planDelPasoB, type FilaDelPasoB } from './fase-b-paso-b-plan.ts'

export interface Salida {
  readonly proyecto: string
  readonly base: string
  readonly coste: number
  readonly veredictos: readonly FilaDelPasoB[]
}

/**
 * El JSON y el plan impreso del paso B, con las fusiones que quedarian: lo que
 * Jojo aprueba. Las fusiones se calculan aqui y NO en el juicio: salen de los
 * veredictos mas las vivas de hoy, y tienen que rehacerse cada vez que el JSON
 * cambie de mano. Lee la base; nunca la escribe.
 */
export function emitirPlan(
  db: Db,
  proyectoId: string,
  zombis: readonly FilaZombi[],
  salida: Salida
): readonly string[] {
  const vivas = leerVivasDeHoy(db, proyectoId).map((v) => ({ id: v.id, identidad: v.identity, firstSeen: v.first_seen })) // prettier-ignore
  const fusiones = fusionesDelPasoB(vivas, salida.veredictos, new Map(zombis.map((z) => [z.id, z.first_seen]))) // prettier-ignore
  const SALIDA = join(process.cwd(), 'internal', `fase-b-paso-b-${salida.proyecto}.json`)
  const PLAN = join(process.cwd(), 'internal', `fase-b-paso-b-plan-${salida.proyecto}.txt`)
  writeFileSync(SALIDA, JSON.stringify({ ...salida, fusiones }, null, 2))
  const plan = planDelPasoB(salida.proyecto, salida.veredictos, fusiones)
  writeFileSync(PLAN, `${plan.join('\n')}\n`)
  console.log(plan.join('\n'))
  console.log(`\nJSON: ${SALIDA}\nPLAN: ${PLAN}`)
  return plan
}
