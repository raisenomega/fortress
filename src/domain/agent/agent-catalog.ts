import type { Agent, AgentId } from './agent'

/** Catalogo fijo de agentes. Los 6 primeros son los de la spec y vienen activos. */
export const AGENT_CATALOG: readonly Agent[] = [
  {
    id: 'security-reviewer',
    icon: '🛡️',
    name: 'Security Reviewer',
    purpose: 'Secrets, inyecciones, auth, headers y rate limiting',
    enabledByDefault: true
  },
  {
    id: 'code-reviewer',
    icon: '🔍',
    name: 'Code Reviewer',
    purpose: 'Bugs, errores no manejados y edge cases',
    enabledByDefault: true
  },
  {
    id: 'refactor-cleaner',
    icon: '🧹',
    name: 'Refactor Cleaner',
    purpose: 'Codigo muerto, imports sin usar y duplicacion',
    enabledByDefault: true
  },
  {
    id: 'tdd-guide',
    icon: '🧪',
    name: 'TDD Guide',
    purpose: 'Tests que reproducen el bug antes del fix',
    enabledByDefault: true
  },
  {
    id: 'planner',
    icon: '🏗️',
    name: 'Planner',
    purpose: 'Planifica features y evalua impacto antes de tocar',
    enabledByDefault: true
  },
  {
    id: 'cognition',
    icon: '🧠',
    name: 'Cognition',
    purpose: 'Patrones aprendidos y reflexiones por sesion',
    enabledByDefault: true
  },
  {
    id: 'build-error-resolver',
    icon: '🔧',
    name: 'Build Error Resolver',
    purpose: 'Diagnostica y arregla fallos de build',
    enabledByDefault: false
  },
  {
    id: 'code-simplifier',
    icon: '✨',
    name: 'Code Simplifier',
    purpose: 'Reduce complejidad sin cambiar comportamiento',
    enabledByDefault: false
  },
  {
    id: 'opensource-sanitizer',
    icon: '📦',
    name: 'Opensource Sanitizer',
    purpose: 'Prepara el repo para publicarse sin filtrar nada',
    enabledByDefault: false
  }
]

export function findAgent(id: AgentId): Agent | undefined {
  return AGENT_CATALOG.find((agent) => agent.id === id)
}
