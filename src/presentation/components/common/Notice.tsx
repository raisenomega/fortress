import type { IconName } from '@domain/shared/icon-name'
import { Icon } from './Icon'

export type NoticeTone = 'error' | 'ok'

const TONE: Record<NoticeTone, { className: string; iconName: IconName }> = {
  error: { className: 'border-critical/30 bg-critical/10', iconName: 'alert-triangle' },
  ok: { className: 'border-success/30 bg-success/10', iconName: 'check-circle' }
}

interface NoticeProps {
  readonly tone: NoticeTone
  readonly children: React.ReactNode
}

/** Mensaje breve que no interrumpe: informa y deja seguir trabajando. */
export function Notice({ tone, children }: NoticeProps): React.JSX.Element {
  const { className, iconName } = TONE[tone]

  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-md border px-3 py-2 ${className}`}
    >
      <Icon name={iconName} size={13} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 text-xs break-words whitespace-pre-wrap text-foreground">
        {children}
      </div>
    </div>
  )
}
