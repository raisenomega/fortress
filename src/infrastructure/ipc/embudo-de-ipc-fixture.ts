import { envolverRegistroIpc, type Manejador, type RegistradorIpc } from './embudo-de-ipc'
import type { SumideroDeFallos } from '../system/red-del-embudo'
import type { SelfNoteDraft } from '@domain/system/self-observation'

export interface BancoDeIpc {
  readonly registrador: RegistradorIpc
  readonly invocar: (canal: string, ...args: unknown[]) => Promise<unknown>
  readonly sumidero: SumideroDeFallos
  readonly notas: Array<{ nota: SelfNoteDraft; projectId: string | undefined }>
  readonly log: Array<{ que: string; error: unknown }>
}

/** Un `ipcMain` de mentira: guarda lo registrado y deja invocarlo como lo haria
 *  el renderer, para ver QUE recibe cuando el handler revienta. */
export function bancoDeIpc(): BancoDeIpc {
  const registrados = new Map<string, Manejador>()
  const notas: BancoDeIpc['notas'] = []
  const log: BancoDeIpc['log'] = []
  return {
    notas,
    log,
    registrador: { handle: (canal, manejador) => void registrados.set(canal, manejador) },
    invocar: async (canal, ...args) => registrados.get(canal)?.({ canal }, ...args),
    sumidero: {
      asentar: (nota, projectId) => void notas.push({ nota, projectId }),
      registrar: (que, error) => void log.push({ que, error })
    }
  }
}

/** Un proyecto real de la base del operador: la forma de UUID que `newId` da. */
export const PROYECTO = '366bb6d4-1943-4e2e-8547-a6056611e341'
export const RUTA_DEL_CLIENTE = '/media/disco/ACME/src/api/billing.ts'

/** Un canal envuelto cuyo handler revienta con la ruta del cliente dentro del
 *  `message`: es lo que tiene que quedarse en el log y no en la observacion. */
export function revientaEn(b: BancoDeIpc, canal: string): void {
  envolverRegistroIpc(b.registrador, b.sumidero)
  b.registrador.handle(canal, () => {
    throw new Error(`no pude leer ${RUTA_DEL_CLIENTE}`)
  })
}
