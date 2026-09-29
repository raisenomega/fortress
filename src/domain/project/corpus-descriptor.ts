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
 *
 * Estan los nombres que redacta la entrevista de configuracion y tambien los
 * que usa un corpus ya escrito a mano —el modelo de amenazas, los principios,
 * la constitucion en castellano—, porque un proyecto documentado antes de
 * conocer FORTRESS no tiene por que llamar a sus cosas como ella.
 */
const CATEGORY: Readonly<Record<string, CorpusCategory>> = {
  'SECURITY-BASELINE.md': 'security',
  'SECURITY-MODEL.md': 'security',
  // El nombre de GitHub, y el mas comun de los tres. Faltaba, y su ausencia hizo
  // justo el dano que este mecanismo evita: en un proyecto con un charter
  // firmado en la raiz, el prompt afirmo que no habia doctrina escrita y los
  // hallazgos de contradiccion doc-codigo estuvieron a punto de perderse. No
  // choca con la regla de arriba: `SECURITY.md` es la POLITICA, no el registro
  // de parches que si sigue fuera (`SECURITY-FIXES.md`).
  'SECURITY.md': 'security',
  'ARCHITECTURE.md': 'structural',
  'DDD-RULES.md': 'structural',
  'PRINCIPLES.md': 'structural',
  'CONSTITUTION.md': 'general',
  'CONSTITUCION.md': 'general',
  'CLAUDE.md': 'general',
  'AGENTS.md': 'general',
  'PROJECT-STATE.md': 'general',
  'README.md': 'general'
}

/** Carpetas cuyo nombre ya dice que clase de doctrina guardan. */
const CATEGORY_DIRS: Readonly<Record<string, CorpusCategory>> = {
  DECISIONS: 'structural'
}

/** Los nombres que se buscan: los del mapa, que es donde vive la convencion. */
export const CANONICAL_DOCS: readonly string[] = Object.keys(CATEGORY)

/** Carpetas de documentacion reconocidas por nombre exacto. */
export const CORPUS_DIRS: readonly string[] = ['docs', 'docs-nucleo', 'doc', 'documentation']

/** La categoria de un nombre canonico, o null si no lo es. Se busca entre las
 *  claves PROPIAS: un objeto literal hereda de `Object.prototype`, y sin el guard
 *  una carpeta `toString` del repo auditado se citaba como doctrina firmada. */
export const categoryOf = (name: string): CorpusCategory | null =>
  Object.hasOwn(CATEGORY, name) ? (CATEGORY[name] ?? null) : null

/** La categoria de una carpeta canonica: la otra tabla tenia el mismo agujero. */
export const categoryOfDirectory = (name: string): CorpusCategory | null =>
  Object.hasOwn(CATEGORY_DIRS, name) ? (CATEGORY_DIRS[name] ?? null) : null
