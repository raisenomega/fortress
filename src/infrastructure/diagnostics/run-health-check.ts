import type { AppContext } from '@application/context'
import { overallLevel, type HealthReport } from '@domain/health/health-check'
import { nowIso } from '@domain/shared/id'
import { checkApiKey } from './check-api-key'
import { checkCommands } from './check-commands'
import { checkDatabase } from './check-database'
import { checkProjects } from './check-projects'

/**
 * Diagnostico completo del sistema. Se ejecuta al arrancar la app y bajo
 * demanda. Ningun check puede tumbar al resto: cada uno atrapa lo suyo.
 */
export async function runHealthCheck(context: AppContext): Promise<HealthReport> {
  const database = checkDatabase()

  // Si la base no responde, listar proyectos tampoco funcionaria.
  const projects = database.level === 'error' ? [] : context.projects.list()

  const checks = [database, await checkApiKey(context), checkProjects(projects), ...checkCommands()]

  return { level: overallLevel(checks), checks, checkedAt: nowIso() }
}
