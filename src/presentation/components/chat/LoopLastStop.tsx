import { useEffect, useState } from 'react'
import type { LoopSession } from '@domain/loop/loop-session'
import { STOP_LABEL } from '@domain/loop/loop-status'
import type { Project } from '@domain/project/project'
import { formatMoment } from '../../format/time'
import { useLoopStatus } from '../../stores/loop-store'

/**
 * Por que paro el loop la ultima vez. Solo aparece cuando NO hay estado en
 * vivo: mientras corre manda LoopHud, que sabe mas. El estado en vivo se pierde
 * al cerrar la ventana y el motivo no —esta guardado—, asi que el operador que
 * vuelve por la manana encuentra aqui lo que antes solo existia en un log.
 */
export function LoopLastStop({ project }: { project: Project }): React.JSX.Element | null {
  const live = useLoopStatus(project.id)
  const [session, setSession] = useState<LoopSession | null>(null)

  useEffect(() => {
    let vigente = true
    void window.api.chat.lastLoopSession(project.id).then((leida) => {
      if (vigente) setSession(leida)
    })
    return () => {
      vigente = false
    }
  }, [project.id])

  if (live !== null || session === null || session.active) return null
  const reason = session.stoppedReason

  return (
    <span
      className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
      title={session.stoppedAt ? `Paro el ${formatMoment(session.stoppedAt)}` : undefined}
    >
      {/* Sesion anterior a que esto se guardara: no consta el motivo, y decir
          uno inventado seria peor que no decir ninguno. */}
      Loop · {reason ? STOP_LABEL[reason] : 'Inactivo'}
      {session.stoppedReasonDetail ? (
        <span className="text-muted-foreground/70"> · {session.stoppedReasonDetail}</span>
      ) : null}
    </span>
  )
}
