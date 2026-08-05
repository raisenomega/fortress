import type { AgentId } from '../agent/agent'
import { findWorkflow } from './workflow-catalog'
import { isCommand } from './workflow-intent'
import { CLOSING_STEP, type Workflow, type WorkflowId } from './workflow'

type NamedWorkflow = Exclude<WorkflowId, 'libre'>

/** Frases que identifican un workflow completo, no un agente suelto. */
const WORKFLOW_TRIGGERS: ReadonlyArray<readonly [NamedWorkflow, readonly string[]]> = [
  ['produccion', ['produccion', 'producción', 'desplegar', 'deploy', 'listo para']],
  ['seguridad', ['seguridad', 'security', 'vulnerab', 'secret', 'inyec']],
  ['limpieza', ['limpia', 'limpieza', 'codigo muerto', 'código muerto', 'refactor']],
  ['tests', ['test', 'prueba', 'cobertura']],
  ['bugs', ['bug', 'error', 'falla', 'revisa el codigo', 'revisa el código']]
]

/** Para un mensaje libre: que agente pide cada tema mencionado. */
const FREE_TRIGGERS: ReadonlyArray<readonly [AgentId, readonly string[]]> = [
  ['security-reviewer', ['seguridad', 'security', 'auth', 'secret', 'inyec']],
  ['refactor-cleaner', ['limpia', 'muerto', 'duplicad', 'refactor']],
  ['build-error-resolver', ['build', 'compila', 'no compila']],
  ['code-reviewer', ['bug', 'error', 'falla', 'calidad']],
  ['tdd-guide', ['test', 'prueba', 'cobertura']],
  ['planner', ['planifica', 'plan ', 'feature', 'diseña', 'arquitectura']],
  ['e2e-runner', ['e2e', 'flujo completo', 'end to end']],
  ['code-simplifier', ['simplifica', 'complejidad']],
  ['opensource-sanitizer', ['publicar', 'open source']]
]

const FREE_TASK = 'Atiende esta peticion del operador dentro de tu especialidad.'

/**
 * Un mensaje libre arma su propio workflow con los agentes que el texto pide.
 * Si no pide ninguno en concreto, revisa la calidad: es la respuesta util mas
 * conservadora, y nunca se queda sin hacer nada.
 */
function freeWorkflow(prompt: string): Workflow {
  const lowered = prompt.toLowerCase()
  const matched = FREE_TRIGGERS.filter(([, words]) =>
    words.some((word) => lowered.includes(word))
  ).map(([agentId]) => agentId)

  const chosen = matched.length > 0 ? matched : (['code-reviewer'] as const)

  return {
    id: 'libre',
    label: 'Peticion libre',
    steps: [...chosen.map((agentId) => ({ agentId, task: FREE_TASK })), CLOSING_STEP]
  }
}

/**
 * Decide que atiende un mensaje. Un workflow completo SOLO si es una orden; si
 * no, conversa (freeWorkflow -> prosa). Mencionar un tema no basta para escanear.
 */
export function routeWorkflow(prompt: string): Workflow {
  const lowered = prompt.toLowerCase()

  if (isCommand(lowered)) {
    for (const [id, phrases] of WORKFLOW_TRIGGERS) {
      if (phrases.some((phrase) => lowered.includes(phrase))) return findWorkflow(id)
    }
  }

  return freeWorkflow(prompt)
}
