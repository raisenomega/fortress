import type { AgentId } from './agent'

/** Palabras que activan cada agente, segun la tabla de CLAUDE.md. */
const TRIGGERS: ReadonlyArray<readonly [AgentId, readonly string[]]> = [
  ['security-reviewer', ['seguridad', 'security', 'vulnerab', 'secret', 'auth', 'inyec']],
  ['refactor-cleaner', ['limpia', 'limpieza', 'muerto', 'duplicad', 'refactor']],
  ['code-reviewer', ['bug', 'error', 'falla', 'revisa el codigo', 'revisa codigo']],
  ['tdd-guide', ['test', 'prueba', 'cobertura']],
  ['planner', ['planifica', 'plan ', 'feature', 'diseña', 'arquitectura']],
  ['build-error-resolver', ['build', 'compila', 'no compila']],
  ['code-simplifier', ['simplifica', 'complejidad']],
  ['opensource-sanitizer', ['publicar', 'open source', 'opensource']],
  ['cognition', ['aprendimos', 'cognition', 'patron', 'reflexion']]
]

const FALLBACK_AGENT: AgentId = 'code-reviewer'

/**
 * Decide que agente atiende una peticion. Solo considera agentes habilitados;
 * si ninguno coincide, cae al primero habilitado (o al fallback).
 */
export function routeToAgent(request: string, enabled: readonly AgentId[]): AgentId {
  const lowered = request.toLowerCase()

  for (const [agentId, keywords] of TRIGGERS) {
    if (!enabled.includes(agentId)) continue
    if (keywords.some((keyword) => lowered.includes(keyword))) return agentId
  }

  return enabled[0] ?? FALLBACK_AGENT
}
