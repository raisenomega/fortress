import { app } from 'electron'
import { mkdirSync } from 'fs'
import { join } from 'path'
import type { AppContext } from '@application/context'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'
import { promptLibre, type TurnoLibre } from '@domain/build/libre-prompt'
import { sinBloqueDeNotas } from '@domain/system/extraer-notas'
import { err, ok, type Result } from '@domain/shared/result'
import { agentLibre } from './build-target'

/**
 * El modo LIBRE (PASO 91): conversacion sin repo, POWERS-OFF. El CLI corre en
 * un cuarto VACIO de userData (la caja no ve nada mas), en 'lectura' (que
 * QUITA Bash — la unica forma real, medida el 20-sep), sin confianza (ningun
 * MCP de proyecto), con el agente SIN MCP global, y SIN projectId a proposito:
 * la corrida no es de ningun proyecto (el precedente documentado del episodio
 * de aprendizaje) y por eso no se asienta fila — coste conocido y anotado.
 */
export async function runLibre(
  context: AppContext,
  pregunta: string,
  hilo: readonly TurnoLibre[],
  onChunk: (delta: string) => void
): Promise<Result<string>> {
  const cuarto = join(app.getPath('userData'), 'chat-libre')
  mkdirSync(cuarto, { recursive: true })
  const reply = await agentLibre(context).run(
    {
      projectPath: cuarto,
      prompt: promptLibre(hilo, pregunta),
      permissionMode: 'lectura',
      agentId: null,
      model: MODELO_POR_ROL.libre,
      trusted: false
    },
    onChunk
  )
  const texto = sinBloqueDeNotas(reply.text)
  return reply.failed ? err(texto) : ok(texto)
}
