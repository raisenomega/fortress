import type { CorpusDescriptor } from './corpus-descriptor'

/**
 * Que documenta un proyecto. Mirarlo es tocar disco, asi que el caso de uso
 * pide por este puerto en vez de averiguarlo el mismo.
 */
export interface CorpusReader {
  of(projectPath: string): CorpusDescriptor
}
