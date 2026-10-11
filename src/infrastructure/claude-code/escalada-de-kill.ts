import type { ChildProcess } from 'child_process'
import { senalAl, type ModoDeMuerte } from './kill-signal'

/**
 * La GRACIA del Detener: SIGTERM y, a los 3s, SIGKILL. SIGTERM es una PETICION y
 * claude puede ignorarla —paso en vivo (2026-08-09): Detener "no funcionaba"
 * porque el run seguia streameando tras recibirla—. El timer va `unref()`'d: no
 * sostiene el loop. OJO: por eso el APAGADO NO puede usar esto (ver
 * `matarYaATodos`): el unref no dispara en un loop que se muere, y el hijo con
 * pipes abiertos retiene el main (PASO 153, "la X no mataba todo").
 */
const GRACE_MS = 3000

export function terminarConGracia(child: ChildProcess, modo: ModoDeMuerte): void {
  senalAl(child, 'SIGTERM', modo)
  const escalation = setTimeout(() => senalAl(child, 'SIGKILL', modo), GRACE_MS)
  escalation.unref()
  child.once('close', () => clearTimeout(escalation))
}
