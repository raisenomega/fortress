import type { AgentId } from '../agent/agent'
import type { CorpusCategory } from '../project/corpus-descriptor'

/**
 * Se inyecta en los prompts de agente, junto al grafo-primero: no copia
 * doctrina, le ensena al agente QUE existe y COMO pedirla. El texto de abajo
 * nombra el corpus de FORTRESS y por tanto solo sirve sobre FORTRESS; se
 * compone desde el corpus real del proyecto en `docs-first-compose.ts`.
 */
const DOCS = 'docs/'

/** Chat y agentes sin rol claro: donde vive la doctrina y como consultarla. */
export const DOCS_FIRST_GENERAL =
  `DOCS FIRST: El proyecto tiene documentacion publica en ${DOCS}. Consulta ` +
  'docs/PRINCIPLES.md (los principios firmados del proyecto) cuando una decision ' +
  'toque disciplina o convencion. Los flujos operativos end-to-end estan en ' +
  'docs/FLOWS/ (9 flujos: escaneo, chat, motor, capacidades, genesis y otros). ' +
  'Los archivos .md en docs/ estan indexados en el grafo; pidelos con ' +
  "file_pattern '*.md' cuando el dominio del hallazgo lo requiera."

/** Seguridad: el modelo de amenazas y la superficie externa ya estan escritos. */
export const DOCS_FIRST_SECURITY =
  'DOCS FIRST (seguridad): Antes de emitir un veredicto de seguridad, consulta ' +
  'docs/SECURITY-MODEL.md (superficies y guards documentados) y ' +
  'docs/FLOWS/POSTURE.md (contactos con red externa). El principio #6 (datos vs ' +
  'metadatos) y el principio #19 (COGNITION-LOG no es fuente de doc publica) aplican.'

/** Estructural: las decisiones de arquitectura ya firmadas viven en los ADRs. */
export const DOCS_FIRST_STRUCTURAL =
  'DOCS FIRST (estructural): Antes de una decision estructural (arquitectura, ' +
  'capa, dependencia), consulta docs/ARCHITECTURE.md (DDD + capas) y ' +
  'docs/PRINCIPLES.md. Los ADRs en docs/DECISIONS/ registran decisiones ' +
  'previas firmadas; consulta el indice antes de proponer cambios estructurales.'

/**
 * Quienes deciden DONDE va un cambio, no solo si esta bien: sin los ADRs
 * pueden borrar o "simplificar" algo que es deliberado y esta firmado.
 */
const STRUCTURAL: ReadonlySet<AgentId> = new Set([
  'planner',
  'refactor-cleaner',
  'code-simplifier'
])

/** Quienes emiten juicio sobre lo que se protege o sobre lo que se publica. */
const SECURITY: ReadonlySet<AgentId> = new Set([
  'security-reviewer',
  'opensource-sanitizer',
  'sentinel-omega'
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

/** Provisional: el texto fijo, hasta que los prompts pasen el corpus del proyecto. */
export function docsFirstFor(agentId: AgentId): string {
  const category = categoryForAgent(agentId)
  if (category === 'security') return DOCS_FIRST_SECURITY
  if (category === 'structural') return DOCS_FIRST_STRUCTURAL
  return DOCS_FIRST_GENERAL
}
