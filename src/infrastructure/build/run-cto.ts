import { app } from 'electron'
import { mkdirSync } from 'fs'
import { join } from 'path'
import type { AppContext } from '@application/context'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'
import { bloqueCtoKit } from '@domain/build/bloque-cto-kit'
import { promptCto } from '@domain/build/cto-prompt'
import type { TurnoLibre } from '@domain/build/libre-prompt'
import { sinBloqueDeNotas } from '@domain/system/extraer-notas'
import { err, ok, type Result } from '@domain/shared/result'
import { agentLibre } from './build-target'
import { leerCtoKit } from './leer-cto-kit'

/**
 * El Modo CTO (PASO 126), corte A: espejo de `run-libre` que REUTILIZA el
 * candado del libre — permissionMode 'libre' (solo WebSearch, Bash quitado:
 * la FRONTERA firmada del 99/100 no se toca, no nace un 6o modo), cuarto
 * VACIO propio en userData, sin confianza y agente SIN MCP. Lo unico suyo
 * es la consigna (el contrato: tres leyes + bloque PASO) y el rol opus.
 */
export async function runCto(
  context: AppContext,
  pregunta: string,
  hilo: readonly TurnoLibre[],
  onChunk: (delta: string) => void
): Promise<Result<string>> {
  const cuarto = join(app.getPath('userData'), 'chat-cto')
  mkdirSync(cuarto, { recursive: true })
  const reply = await agentLibre(context).run(
    {
      projectPath: cuarto,
      // El kit entra como DATO (PASO 130): el I/O aqui, la composicion en dominio.
      prompt: promptCto(hilo, pregunta, bloqueCtoKit(leerCtoKit())),
      permissionMode: 'libre',
      agentId: null,
      model: MODELO_POR_ROL.cto,
      trusted: false
    },
    onChunk
  )
  const texto = sinBloqueDeNotas(reply.text)
  return reply.failed ? err(texto) : ok(texto)
}
