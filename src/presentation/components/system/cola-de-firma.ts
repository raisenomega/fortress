import type { Finding } from '@domain/project/project'
import type { Proposal, ProposalState } from '@domain/repair/proposal'

/** Una propuesta esperando firma, con el hallazgo que la origino si sigue vivo. */
export interface EnCola {
  readonly proposal: Proposal
  readonly finding: Finding | undefined
}

/** Los dos estados que esperan al operador, cada uno con su acto pendiente. */
const ESPERAN: ReadonlySet<ProposalState> = new Set(['GATE', 'OMEGA'])

/** Donde vive el fix, para agrupar: el fichero del hallazgo, o su id si no hay. */
const donde = (item: EnCola): string => item.finding?.file ?? item.proposal.findingId

/** Donde vive el fix, en una linea: lo que el operador necesita para decidir. */
export function sitio(item: EnCola): string {
  const f = item.finding
  if (!f) return `hallazgo ${item.proposal.findingId.slice(0, 6)}`
  return `${f.severity} ${f.file}${f.line === null ? '' : `:${f.line}`}`
}

/**
 * Las propuestas que esperan firma: gate verde y nadie las ha juzgado todavia.
 *
 * Dos estados, y esperan cosas distintas. `GATE` es gate verde con OMEGA sin
 * correr: firmarla autoriza el juicio. `OMEGA` es aprobada por el revisor —un
 * veto cierra en RECHAZADO, asi que llegar a ese estado ya significa que paso—:
 * firmarla la integra. `GENERADO` aun no ha compilado y los terminales no
 * esperan nada. Filtrar por estado y no por "lo que queda pendiente" evita que
 * la cola se llene de propuestas que no se firman.
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
    .filter((proposal) => ESPERAN.has(proposal.state))
    .map((proposal) => ({ proposal, finding: porId.get(proposal.findingId) }))
    .sort((a, b) => donde(a).localeCompare(donde(b)) || a.proposal.updatedAt - b.proposal.updatedAt)
}
