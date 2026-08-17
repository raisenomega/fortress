import { DRAFTED_DOCS } from '../chat/config-docs'

/** Que clase de decision sostiene un documento del corpus. */
export type CorpusCategory = 'security' | 'structural' | 'general'

export interface CorpusDoc {
  /** Ruta relativa a la raiz del proyecto. */
  readonly path: string
  readonly category: CorpusCategory
}

/**
 * Lo que un proyecto documenta, mirado y no supuesto: los documentos canonicos
 * que EXISTEN con la categoria que les toca, y las carpetas de documentacion
 * que se citan sin enumerar dentro. Un descriptor vacio significa que el
 * proyecto no documenta su doctrina, y quien componga el prompt no debe
 * afirmar lo contrario.
 */
export interface CorpusDescriptor {
  readonly docs: readonly CorpusDoc[]
  readonly directories: readonly string[]
}

export const EMPTY_CORPUS: CorpusDescriptor = { docs: [], directories: [] }

/**
 * La categoria sale del nombre EXACTO, nunca de un parecido: un
 * `SECURITY-FIXES.md` es un registro de parches, no un modelo de amenazas, y
 * mandar a un revisor a leerlo como doctrina seria la misma afirmacion falsa
 * que este mecanismo existe para quitar. Lo que no esta aqui no se categoriza.
 */
const CATEGORY: Readonly<Record<string, CorpusCategory>> = {
  'SECURITY-BASELINE.md': 'security',
  'ARCHITECTURE.md': 'structural',
  'DDD-RULES.md': 'structural',
  'CONSTITUTION.md': 'general',
  'CLAUDE.md': 'general',
  'AGENTS.md': 'general',
  'PROJECT-STATE.md': 'general',
  'README.md': 'general'
}

/**
 * Los nombres que se buscan en la raiz: los que la entrevista de configuracion
 * redacta —importados de alli, no copiados, para que anadir uno lo haga
 * descubrible sin tocar esto— mas el README que casi todo repo trae.
 */
export const CANONICAL_DOCS: readonly string[] = [...DRAFTED_DOCS, 'README.md']

/** Carpetas de documentacion reconocidas por nombre exacto. */
export const CORPUS_DIRS: readonly string[] = ['docs', 'docs-nucleo', 'doc', 'documentation']

/** La categoria de un nombre canonico, o null si no lo es. */
export function categoryOf(name: string): CorpusCategory | null {
  return CATEGORY[name] ?? null
}
