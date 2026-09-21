import type { IconName } from '@domain/shared/icon-name'
import { Icon } from './Icon'

/**
 * Tres y no dos. Con solo error/ok, todo lo que no era un exito tenia que
 * pintarse como un fallo, y hay mensajes que no son ninguna de las dos cosas:
 * "no queda nada que reparar" no es un problema, pero verde con un checkmark
 * afirmaria que todo salio bien. El neutro existe para no tener que mentir en
 * una direccion o en la otra.
 */
export type NoticeTone = 'error' | 'ok' | 'aviso'

const TONE: Record<NoticeTone, { className: string; iconName: IconName }> = {
  error: { className: 'border-critical/30 bg-critical/10', iconName: 'alert-triangle' },
  ok: { className: 'border-success/30 bg-success/10', iconName: 'check-circle' },
  aviso: { className: 'border-border bg-card', iconName: 'circle' }
}

interface NoticeProps {
  readonly tone: NoticeTone
  readonly children: React.ReactNode
  /** Sin `role="status"` propio: para cuando ya vive DENTRO de una region viva
   *  (el Toaster). Una region viva dentro de otra se anuncia dos veces. */
  readonly callado?: boolean
}

/** Mensaje breve que no interrumpe: informa y deja seguir trabajando. */
export function Notice({ tone, children, callado }: NoticeProps): React.JSX.Element {
  const { className, iconName } = TONE[tone]

  return (
    <div
      role={callado ? undefined : 'status'}
      className={`flex items-start gap-2 rounded-md border px-3 py-2 ${className}`}
    >
      <Icon name={iconName} size={13} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 text-xs break-words whitespace-pre-wrap text-foreground">
        {children}
      </div>
    </div>
  )
}
