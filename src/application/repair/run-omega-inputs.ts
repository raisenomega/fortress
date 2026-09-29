import type { HallazgoJuzgado } from '@domain/repair/hallazgo-juzgado'
import type { CorpusDescriptor } from '@domain/project/corpus-descriptor'
import type { OmegaPromptInput } from '@domain/repair/omega-prompt'

/** Lecturas que la infraestructura provee para armar el juicio. */
export interface OmegaReads {
  readonly changedFiles: (worktreePath: string, baseSha: string) => Promise<readonly string[]>
  readonly diffText: (worktreePath: string) => Promise<string>
  readonly readPost: (worktreePath: string, relPath: string) => string
  readonly readPre: (worktreePath: string, baseSha: string, relPath: string) => Promise<string>
}

/**
 * OMEGA no navega: revisa EXACTAMENTE lo que el fix toco. Pre y post de cada
 * archivo del diff (un archivo nuevo no existia en base: pre = ''), mas el
 * diff textual del commit.
 */
export async function buildOmegaInput(
  reads: OmegaReads,
  worktreePath: string,
  baseSha: string,
  analysis: HallazgoJuzgado,
  corpus: CorpusDescriptor,
  /** Ausente en el Terminal: alli no hay propuesta ni libro que leer. */
  motorSupo?: readonly string[]
): Promise<{ input: OmegaPromptInput; files: readonly string[] }> {
  const files = await reads.changedFiles(worktreePath, baseSha)
  const diffText = await reads.diffText(worktreePath)
  const filesPost = files.map((path) => ({ path, content: reads.readPost(worktreePath, path) }))
  const filesPre = await Promise.all(
    files.map(async (path) => ({ path, content: await reads.readPre(worktreePath, baseSha, path) })) // prettier-ignore
  )
  const supo = motorSupo === undefined ? {} : { motorSupo }
  return { input: { analysis, corpus, diffText, filesPost, filesPre, ...supo }, files }
}
