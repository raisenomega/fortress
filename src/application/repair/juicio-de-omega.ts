import type { CorpusDescriptor } from '@domain/project/corpus-descriptor'
import type { HallazgoJuzgado } from '@domain/repair/hallazgo-juzgado'
import { buildOmegaPrompt } from '@domain/repair/omega-prompt'
import { computeGlobalVerdict, type GlobalVerdict } from '@domain/repair/omega-verdict'
import { evidenciaOmega } from './omega-autopsia'
import type { OmegaAgentResult } from './run-omega'
import { buildOmegaInput, type OmegaReads } from './run-omega-inputs'

/** El arbol a juzgar y el plan que decia ejecutar. `arbol` es el worktree de la
 *  propuesta en el Motor y el proyecto vivo en el Terminal; a OMEGA le da igual. */
export interface EntradaDelJuicio {
  readonly arbol: string
  readonly baseSha: string
  readonly analysis: HallazgoJuzgado
  readonly corpus: CorpusDescriptor
}

export interface DepsDelJuicio extends OmegaReads {
  readonly omega: { run(arbol: string, prompt: string): Promise<OmegaAgentResult> }
}

interface JuicioBase {
  /** Los ficheros del diff, en el orden en que se leyeron. */
  readonly files: readonly string[]
  /** La autopsia, ya redactada: lo que se asienta pase lo que pase. */
  readonly evidencia: object
}

type OmegaFallo = Extract<OmegaAgentResult, { ok: false }>
type OmegaExito = Extract<OmegaAgentResult, { ok: true }>

/** La corrida cruda viaja ESTRECHADA por el mismo discriminante, para que quien
 *  descarte el fallo se quede con el exito ya tipado y no tenga que afirmarlo. */

/**
 * `computed` discrimina: `null` es que el agente NO llego a dar veredicto
 * —fallo, timeout, texto ilegible—, y entonces tampoco hay `declarado`. Union y
 * no dos campos opcionales, para que quien juzgue no tenga que asegurar que no
 * es nulo: el compilador ya se lo dice.
 */
export type Juicio =
  | (JuicioBase & { readonly crudo: OmegaFallo; computed: null; declarado: null })
  | (JuicioBase & { readonly crudo: OmegaExito; computed: GlobalVerdict; declarado: GlobalVerdict })

/**
 * El juicio de OMEGA, sin nada del Motor detras (ADR-090, Fase A).
 *
 * Antes vivia dentro de `judgeProposal`, entrelazado con los asientos de la
 * propuesta: para juzgar habia que tener una `RepairProposal` en GATE, su
 * `eventLog`, su worktree y su presupuesto. El Terminal no tiene ninguna de las
 * cuatro y necesita exactamente lo mismo: mirar un diff y decir si resuelve.
 *
 * NO ESCRIBE NADA. Ni eventos, ni estado, ni notas, ni la factura. Devuelve el
 * juicio y quien llama decide donde lo asienta: el Motor en su libro mayor, el
 * Terminal en el hilo y en Historia. Esa es toda la diferencia entre los dos.
 *
 * D19 se queda aqui, y no en el envoltorio, porque no es fontaneria: el
 * veredicto que manda lo computa el codigo a partir de los ejes, y eso vale
 * igual para los dos mundos. `declarado` viaja aparte para que quien llame pueda
 * anotar el desacuerdo si lo hay.
 */
export async function juzgar(e: EntradaDelJuicio, deps: DepsDelJuicio): Promise<Juicio> {
  const { input, files } = await buildOmegaInput(deps, e.arbol, e.baseSha, e.analysis, e.corpus)
  const crudo = await deps.omega.run(e.arbol, buildOmegaPrompt(input))
  const evidencia = evidenciaOmega(crudo, files)
  if (!crudo.ok) return { crudo, files, evidencia, computed: null, declarado: null }
  return {
    crudo,
    files,
    evidencia,
    computed: computeGlobalVerdict(crudo.verdict),
    declarado: crudo.verdict.veredicto_global
  }
}
