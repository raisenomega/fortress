import type { AgentId } from '../agent/agent'

/**
 * Se inyecta en los prompts de agente, junto al grafo-primero. El proyecto
 * documenta su doctrina en docs/ (publica y trackeada); antes, las reglas se
 * transcribian a mano al prompt desde un archivo que ni siquiera viaja en el
 * repo. Esto NO copia doctrina: le ensena al agente QUE existe y COMO pedirlo.
 * Los .md estan indexados en el grafo, pero la busqueda por defecto los excluye:
 * sin el file_pattern explicito, el agente no los ve.
 */
const DOCS = 'docs/'

/** Chat y agentes sin rol claro: donde vive la doctrina y como consultarla. */
export const DOCS_FIRST_GENERAL =
  `DOCS FIRST: El proyecto tiene documentacion publica en ${DOCS}. Consulta ` +
  'docs/PRINCIPLES.md (19 principios firmados del proyecto) cuando una decision ' +
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
  'docs/PRINCIPLES.md. Los 57 ADRs en docs/DECISIONS/ registran decisiones ' +
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
 * La referencia documental segun el rol del agente. El eje NO es el mismo que
 * el del grafo: alli se clasifica por COMO se consulta el codigo; aqui, por QUE
 * documentacion necesita la decision. Por eso code-reviewer y tdd-guide, que el
 * grafo trata como estructurales, se quedan en la general: su trabajo es tactico
 * (un bug, un test) y los ADRs solo les anadirian ruido.
 */
export function docsFirstFor(agentId: AgentId): string {
  if (SECURITY.has(agentId)) return DOCS_FIRST_SECURITY
  if (STRUCTURAL.has(agentId)) return DOCS_FIRST_STRUCTURAL
  return DOCS_FIRST_GENERAL
}
