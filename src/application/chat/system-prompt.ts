import type { AgentId } from '@domain/agent/agent'
import { findAgent } from '@domain/agent/agent-catalog'
import type { Project } from '@domain/project/project'
import type { OperationMode } from '@domain/settings/operation-mode'

const MODE_RULES: Record<OperationMode, string> = {
  supervisado:
    'MODO SUPERVISADO: propon los cambios y espera aprobacion. No apliques nada ' +
    'sin confirmacion. Muestra el impacto antes de cada cambio.',
  autonomo:
    'MODO AUTONOMO: aplica los cambios y reporta resultados. Corre los tests antes ' +
    'y despues. Si algo falla, revierte. NUNCA toques auth, payments, RLS ni ' +
    'seguridad sin volver a modo supervisado.'
}

function describeAgents(enabled: readonly AgentId[]): string {
  const lines = enabled
    .map((id) => findAgent(id))
    .filter((agent) => agent !== undefined)
    .map((agent) => `- ${agent.name}: ${agent.purpose}`)

  return lines.length > 0 ? lines.join('\n') : '- (ninguno activo)'
}

/**
 * Sin escaneo previo no hay score que dar. Decir "0/100" le describiria al
 * modelo un proyecto pesimo cuando lo cierto es que nadie lo ha mirado.
 */
function describeScore(project: Project): string {
  if (project.lastScan === null) return '- Score FORTRESS: sin escanear todavia'
  return `- Score FORTRESS: ${project.fortressScore}/100 (escaneo del ${project.lastScan})`
}

function describeProject(project: Project): string {
  return [
    `- Nombre: ${project.name}`,
    `- Ruta: ${project.path}`,
    `- Stack: ${project.stack || 'sin detectar'}`,
    `- Rama: ${project.gitBranch ?? 'sin git'}`,
    describeScore(project),
    `- CLAUDE.md instalado: ${project.hasClaude ? 'si' : 'no'}`
  ].join('\n')
}

/** Contexto que recibe el modelo en cada peticion del proyecto activo. */
export function buildSystemPrompt(
  project: Project,
  enabledAgents: readonly AgentId[],
  mode: OperationMode
): string {
  return [
    'Eres el agente de seguridad, calidad y limpieza de FORTRESS Command Center.',
    'Pilares: seguridad, calidad, estabilidad y transparencia. Nada inseguro pasa.',
    'Cada hallazgo va con archivo, linea, severidad, impacto y fix propuesto.',
    'Se honesto: si algo esta bien, dilo; no inventes problemas.',
    '',
    'PROYECTO ACTIVO:',
    describeProject(project),
    '',
    'AGENTES ACTIVOS:',
    describeAgents(enabledAgents),
    '',
    MODE_RULES[mode]
  ].join('\n')
}
