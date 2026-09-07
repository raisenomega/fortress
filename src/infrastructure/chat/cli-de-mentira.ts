import type { CodeAgent, CodeAgentReply, CodeAgentRequest } from '@domain/chat/code-agent'
import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { escribir } from '../git/checkpoint-fixture'
import { abrirCheckpoint, redDisponible } from '../git/checkpoint-transitorio'

/** El CLI de mentira: EDITA el arbol como lo haria el agente y contesta lo que se le diga. */
export function cliQue(
  edita: boolean,
  reply: Partial<CodeAgentReply> = {}
): CodeAgent & { readonly peticiones: CodeAgentRequest[] } {
  const peticiones: CodeAgentRequest[] = []
  return {
    peticiones,
    isAvailable: () => true,
    precheck: () => null,
    run: (request) => {
      peticiones.push(request)
      if (edita) {
        escribir(request.projectPath, 'a.txt', 'editado\n')
        escribir(request.projectPath, 'b.txt', 'nuevo\n')
      }
      // prettier-ignore
      return Promise.resolve({ text: 'hecho', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: ['a.txt', 'b.txt'], ...reply })
    }
  }
}

/** La red REAL de git con un typecheck de mentira: lo que se prueba es el envoltorio. */
export function redReal(verde = true): RedDeReversion & { abiertos: () => number } {
  let n = 0
  return {
    disponible: redDisponible,
    abrir: (cwd) => {
      n += 1
      return abrirCheckpoint(cwd)
    },
    verificar: () => Promise.resolve(verde),
    abiertos: () => n
  }
}
