import type { Finding } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'

/** Una propuesta esperando firma, con el hallazgo que la origino si sigue vivo. */
export interface EnCola {
  readonly proposal: Proposal
  readonly finding: Finding | undefined
}

/** Donde vive el fix, para agrupar: el fichero del hallazgo, o su id si no hay. */
const donde = (item: EnCola): string => item.finding?.file ?? item.proposal.findingId

/**
 * Las propuestas que esperan firma: gate verde y nadie las ha juzgado todavia.
 *
 * `GATE` es el unico estado que significa eso. `GENERADO` aun no ha compilado,
 * `OMEGA` ya paso por el revisor y espera otra cosa —la politica o el merge—, y
 * los terminales no esperan nada. Filtrar por estado y no por "lo que queda
 * pendiente" evita que la cola se llene de propuestas que no se firman.
 *
 * El orden agrupa por FICHERO antes que por fecha: firmar dos fixes del mismo
 * sitio seguidos deja al operador con un solo contexto en la cabeza, y leer dos
 * diffs del mismo archivo cuesta menos que leer dos de sitios distintos.
 */
export function colaDeFirma(
  proposals: readonly Proposal[],
  findings: readonly Finding[]
): readonly EnCola[] {
  const porId = new Map(findings.map((finding) => [finding.id, finding]))
  return proposals
    .filter((proposal) => proposal.state === 'GATE')
    .map((proposal) => ({ proposal, finding: porId.get(proposal.findingId) }))
    .sort((a, b) => donde(a).localeCompare(donde(b)) || a.proposal.updatedAt - b.proposal.updatedAt)
}
