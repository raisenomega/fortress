import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

/**
 * El CHAT observa por otra via desde la fase de los interactivos: de sus DENIALS
 * en `finishTurn`, que es dato duro y no pasa por el stream. Ningun bloque, y
 * `en-vivo-tachado` —innegociable— sigue intacto.
 */
const CHAT_OBSERVA_DE_DENIALS = 'src/application/chat/finish-turn.ts'

/**
 * Los CUATRO que siguen fuera, y no por olvido.
 *
 * El EJECUTOR si tiene que decir —corre en `acceptEdits`, que es la mayor
 * superficie de denegaciones— pero NO pasa por `finishTurn`, y engancharlo
 * parcheando su sitio repetiria la leccion de los seis agentes sin orquestador.
 * Necesita su punto comun: deuda `ejecutor-observa-de-denials`.
 *
 * Los otros tres corren en `plan` o `lectura`. Un agente de solo lectura casi
 * no topa permisos, asi que lo que reportaria seria relleno — mismo criterio que
 * dejo fuera al episodio y al borrador por vivir en un sandbox.
 */
const NO_OBSERVAN: readonly string[] = [
  'src/application/build/build-feature.ts',
  'src/application/chat/reply-from-configuration.ts',
  'src/infrastructure/build/run-build-plan.ts',
  'src/infrastructure/build/run-investigate.ts'
]

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

describe('el chat observa de sus DENIALS, no de un bloque', () => {
  it('asienta en `finishTurn`, que es por donde pasan todos sus turnos', () => {
    const cierre = fuente(CHAT_OBSERVA_DE_DENIALS)

    expect(cierre).toContain('observacionesDeDenials')
    expect(cierre).toContain('asentarNotas')
  })

  it('y NO pide un bloque: el operador veria teclearse el marcador', () => {
    expect(fuente(CHAT_OBSERVA_DE_DENIALS)).not.toContain('NOTAS_COMO')
    expect(fuente('src/application/chat/reply-from-chat.ts')).not.toContain('NOTAS_COMO')
  })

  it('`en-vivo-tachado` sigue intacto: la via de denials no lo roza', () => {
    // INNEGOCIABLE. No retiene el stream, no filtra por trozo, no toca onChunk.
    const enVivo = fuente('src/application/chat/en-vivo-tachado.ts')

    expect(enVivo).not.toContain('observacion')
    expect(enVivo).not.toContain('asentarNotas')
    expect(enVivo).toContain('redactSecrets(delta)')
  })
})

describe('los CUATRO que siguen fuera, cada uno con su razon', () => {
  it.each(NO_OBSERVAN)('%s no observa', (ruta) => {
    expect(fuente(ruta)).not.toContain('NOTAS_COMO')
    expect(fuente(ruta)).not.toContain('asentarNotas')
    expect(fuente(ruta)).not.toContain('observacionesDeDenials')
  })

  it('siguen siendo CUATRO: ni un agente nuevo enganchado sin decidir', () => {
    expect(NO_OBSERVAN).toHaveLength(4)
  })
})
