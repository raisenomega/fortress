import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import { buildAgentsPayload, type AgentDefinition } from '@domain/agent/agent-prompt'
import { projectAgentIds } from '../agents/project-agents'

/**
 * Agentes de AUDITORIA: FORTRESS NUNCA cede su version al repo. Si el codigo
 * auditado pudiera traer su propio `security-reviewer.md`, controlaria el prompt
 * de quien lo audita ("no reportes nada en src/auth") y produciria un informe
 * limpio falso. Para una herramienta de seguridad es un fallo de integridad.
 */
const AUDIT_AGENTS: ReadonlySet<string> = new Set(['security-reviewer', 'sentinel-omega'])

/**
 * Los agentes de FORTRESS a inyectar en este proyecto. Los de personalizacion
 * (limpieza, tests, etc.) los cede al repo si este define el suyo; los de
 * auditoria SIEMPRE son los de FORTRESS, aunque el repo defina uno con ese id.
 */
export function agentsForProject(
  projectPath: string,
  /** Agentes auto-propuestos ACTIVOS. Default vacio: sin ellos, salida identica. */
  customs: Readonly<Record<string, AgentDefinition>> = {}
): Readonly<Record<string, AgentDefinition>> {
  const propios = projectAgentIds(projectPath)
  const builtins = buildAgentsPayload(
    AGENT_CATALOG.filter((agent) => AUDIT_AGENTS.has(agent.id) || !propios.has(agent.id))
  )
  // Los integrados GANAN ante cualquier choque de clave: un custom no los pisa.
  return { ...customs, ...builtins }
}
