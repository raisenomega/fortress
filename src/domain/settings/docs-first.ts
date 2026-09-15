import type { AgentId } from '../agent/agent'
import type { CorpusCategory } from '../project/corpus-descriptor'

/**
 * Quienes deciden DONDE va un cambio, no solo si esta bien: sin las decisiones
 * ya firmadas pueden borrar o "simplificar" algo que es deliberado. El productor
 * del Terminal (ADR-088) es el que escribe el arreglo: lo mismo le aplica.
 */
// prettier-ignore
const STRUCTURAL: ReadonlySet<AgentId> = new Set(['planner', 'refactor-cleaner', 'code-simplifier', 'productor'])

/**
 * Quienes emiten juicio sobre lo que se protege o sobre lo que se publica.
 *
 * `scope-classifier` decide QUE se audita —si el proyecto toca dinero o datos
 * personales—, y el documento que mejor contesta eso es el modelo de amenazas
 * del propio proyecto. Sin el juzgaria el alcance a ciegas.
 */
const SECURITY: ReadonlySet<AgentId> = new Set([
  'security-reviewer',
  'opensource-sanitizer',
  'sentinel-omega',
  'scope-classifier'
])

/**
 * Que documentacion necesita la decision de este agente. El eje NO es el mismo
 * que el del grafo: alli se clasifica por COMO se consulta el codigo. Por eso
 * code-reviewer y tdd-guide, que el grafo trata como estructurales, se quedan
 * en la general: su trabajo es tactico y los ADRs solo les anadirian ruido.
 *
 * Es el mismo eje con el que se categoriza el corpus de un proyecto, asi que
 * comparten tipo: lo que el agente necesita y lo que el proyecto documenta se
 * cruzan sin traductor por medio.
 */
export function categoryForAgent(agentId: AgentId): CorpusCategory {
  if (SECURITY.has(agentId)) return 'security'
  if (STRUCTURAL.has(agentId)) return 'structural'
  return 'general'
}
