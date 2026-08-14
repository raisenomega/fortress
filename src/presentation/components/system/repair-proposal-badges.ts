import type { ProposalState } from '@domain/repair/proposal'
import type { IconName } from '@domain/shared/icon-name'

/** Solo los estados que el motor produce llevan glifo propio; el resto cae a circulo. */
export const STATE_ICON: Partial<Record<ProposalState, IconName>> = {
  ELEGIDO: 'circle',
  ANALIZADO: 'check-circle',
  GENERADO: 'git-branch',
  GATE: 'shield',
  OMEGA: 'eye',
  RECHAZADO: 'x-circle',
  CADUCADO: 'x-circle'
}

export const STATE_TONE: Partial<Record<ProposalState, string>> = {
  ELEGIDO: 'text-medium',
  ANALIZADO: 'text-success',
  GENERADO: 'text-primary',
  GATE: 'text-success',
  OMEGA: 'text-primary',
  RECHAZADO: 'text-critical',
  CADUCADO: 'text-muted-foreground'
}

/** "retry_of=<id8>..." al frente de la razon -> id corto de la propuesta madre. */
export function retryLineage(reason: string | undefined): string | null {
  return reason?.startsWith('retry_of=') === true ? reason.slice(9, 17) : null
}

/**
 * La razon sin el prefijo de linaje. El badge "retry de X" ya lo muestra en
 * limpio; repetirlo en el texto gastaria la primera linea en algo ya dicho, y
 * ademas en el formato de maquina.
 */
export function reasonBody(reason: string | undefined): string {
  if (reason === undefined) return ''
  if (retryLineage(reason) === null) return reason
  return reason.slice(17).replace(/^[\s;—-]+/, '')
}
