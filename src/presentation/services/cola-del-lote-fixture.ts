import type { SendMessageInput } from '@application/chat/send-message-types'
import type { Finding } from '@domain/project/finding'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { PuertosDeLaCola } from './cola-del-lote'

// prettier-ignore
export const fila = (id: string, over: Partial<Finding> = {}): Finding => ({ id, severity: 'HIGH', file: 'a.ts', line: 1, title: `t-${id}`, lifecycle: 'ACTIVE', status: 'open', verificacionNote: null, ...over }) as Finding

export interface Opciones {
  readonly tabla?: readonly Finding[]
  /** Como deja cada turno su hallazgo en la base. Por defecto, igual: no cerro. */
  readonly tras?: (id: string) => Finding | undefined
  /** Tras cuantos turnos terminados pulsa el operador Detener. */
  readonly detenerTras?: number
  /** El modo del OPERADOR en la consulta n-esima. Por defecto supervisado, que
   *  es donde hoy corre el lote: el humano aprueba el plan y la cola edita. */
  readonly modo?: (consulta: number) => OperationMode
  readonly ocupada?: boolean
}

export interface Banco {
  readonly p: PuertosDeLaCola
  readonly log: string[]
  readonly enviados: SendMessageInput[]
  readonly resumenes: string[]
}

/** Una cola con el mundo de mentira: el log dice en que orden paso todo. */
export function banco(o: Opciones = {}): Banco {
  const log: string[] = []
  const enviados: SendMessageInput[] = []
  const resumenes: string[] = []
  const inicial = o.tabla ?? [fila('f1'), fila('f2'), fila('f3')]
  const tabla = new Map<string, Finding | undefined>(inicial.map((f) => [f.id, f]))
  let consultas = 0
  let terminados = 0
  let cortado = false
  const p: PuertosDeLaCola = {
    modo: () => (o.modo ?? (() => 'supervisado'))(consultas++),
    excluidos: () => [],
    hallazgo: (id) => tabla.get(id),
    abrirTerminal: () => undefined,
    enviar: async (input) => {
      const id = input.findingId ?? ''
      log.push(`enviar:${id}`)
      enviados.push(input)
      await Promise.resolve() // el turno no termina en el acto: hay que esperarlo
      tabla.set(id, o.tras ? o.tras(id) : tabla.get(id))
      log.push(`fin:${id}`)
      terminados += 1
      if (terminados === o.detenerTras) cortado = true
    },
    recargar: async () => void log.push('recargar'),
    contar: async (resumen) => void resumenes.push(resumen),
    // prettier-ignore
    cola: { ocupada: () => o.ocupada === true, arrancar: () => void log.push('arrancar'), avanzar: () => undefined, cortado: () => cortado, terminar: () => void log.push('terminar') }
  }
  return { p, log, enviados, resumenes }
}
