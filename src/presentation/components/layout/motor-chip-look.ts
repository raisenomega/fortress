import { CircleCheck, CircleDot, OctagonAlert, type LucideIcon } from 'lucide-react'
import type { MotorStatus } from '@domain/repair/motor-status'

type Kind = MotorStatus['kind']

/** El color dice la urgencia; el texto dice el numero. Ninguno de los dos solo. */
export const TONO: Record<Kind, string> = {
  'stopped-critical': 'border-critical/50 text-critical hover:bg-critical/10',
  'awaiting-review': 'border-medium/50 text-medium hover:bg-medium/10',
  clean: 'border-border text-muted-foreground hover:text-foreground'
}

export const ICONO: Record<Kind, LucideIcon> = {
  'stopped-critical': OctagonAlert,
  'awaiting-review': CircleDot,
  clean: CircleCheck
}

/** Corto: cabe en la barra. Lo que no cabe va al titulo. */
export function etiqueta(status: MotorStatus): string {
  if (status.kind === 'stopped-critical') return 'Detenido'
  return status.kind === 'awaiting-review' ? `Pendientes: ${status.count}` : 'Motor'
}

/** Lo que el color no puede decir: por que, y cuantas. */
export function titulo(status: MotorStatus): string {
  if (status.kind === 'stopped-critical') return `Motor detenido — ${status.reason}`
  if (status.kind === 'awaiting-review') {
    return `${status.count} propuesta(s) del motor esperan que hagas algo`
  }
  return 'El motor no tiene nada pendiente en este proyecto'
}
