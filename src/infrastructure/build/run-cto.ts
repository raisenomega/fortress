import { app } from 'electron'
import { mkdirSync } from 'fs'
import { join } from 'path'
import type { AppContext } from '@application/context'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'
import { bloqueCtoKit } from '@domain/build/bloque-cto-kit'
import { promptCto } from '@domain/build/cto-prompt'
import { CTO_OWNER } from '@domain/build/cto-owner'
import type { TurnoLibre } from '@domain/build/libre-prompt'
import { sinBloqueDeNotas } from '@domain/system/extraer-notas'
import { err, ok, type Result } from '@domain/shared/result'
import { endRun, tryBeginRun } from '../run-control'
import { agentLibre } from './build-target'
import { leerCtoKit } from './leer-cto-kit'
import { rebanadaDelLibro } from './rebanada-del-libro'

/**
 * El Modo CTO (PASO 126), corte A: espejo de `run-libre` que REUTILIZA el
 * candado del libre — permissionMode 'libre' (solo WebSearch, Bash quitado:
 * la FRONTERA firmada del 99/100 no se toca, no nace un 6o modo), cuarto
 * VACIO propio en userData, sin confianza y agente SIN MCP. Lo unico suyo
 * es la consigna (el contrato: tres leyes + bloque PASO) y el rol opus.
 *
 * Sello B.1: con `proyectoAncla` la APP lee el libro de vida de ESE proyecto
 * y lo mete como DATO bajo la cabecera de subordinacion; sin ancla, el CTO
 * global de siempre. El agente no gana herramienta: lee contexto, no repo.
 *
 * Sello 1 del lazo (PASO 149): corre bajo el owner estable CTO_OWNER (su
 * cuarto) reservando su carril. Asi el Detener lo ALCANZA —trackChild registra
 * el hijo bajo ese owner— y una cancelacion previa se limpia al reabrir el
 * carril (sin esto el turno siguiente moriria al nacer). NO es el projectId
 * anclado —ese solo parametriza la rebanada—: parar el CTO no toca al proyecto.
 */
export async function runCto(
  context: AppContext,
  pregunta: string,
  hilo: readonly TurnoLibre[],
  proyectoAncla: string | null,
  onChunk: (delta: string) => void
): Promise<Result<string>> {
  const cuarto = join(app.getPath('userData'), CTO_OWNER)
  mkdirSync(cuarto, { recursive: true })
  if (!tryBeginRun(CTO_OWNER)) return err('Ya hay un turno del CTO en marcha.')
  try {
    const marcos = proyectoAncla === null ? [] : await rebanadaDelLibro(context, proyectoAncla)
    const reply = await agentLibre(context).run(
      {
        projectPath: cuarto,
        projectId: CTO_OWNER,
        // El kit y la rebanada entran como DATO (PASO 130): I/O aqui, composicion en dominio.
        prompt: promptCto(hilo, pregunta, bloqueCtoKit([...leerCtoKit(), ...marcos])),
        permissionMode: 'libre',
        // PASO 155 (FRONTERA): el CTO es un razonador PURO — WebSearch fuera,
        // cero herramientas. chat-libre comparte 'libre' pero NO pasa esto y
        // conserva su web. El merge vive en buildArgs (candado por-run).
        disallow: ['WebSearch'],
        agentId: null,
        model: MODELO_POR_ROL.cto,
        trusted: false
      },
      onChunk
    )
    const texto = sinBloqueDeNotas(reply.text)
    return reply.failed ? err(texto) : ok(texto)
  } finally {
    endRun(CTO_OWNER)
  }
}
