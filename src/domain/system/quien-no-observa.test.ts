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
 * El UNICO que sigue fuera, y no por olvido: la entrevista de configuracion es
 * un turno del chat, emite en vivo por `onChunk`, y un bloque `NOTAS:` se
 * teclearia delante del operador (`en-vivo-tachado` es innegociable).
 *
 * Los tres de CONSTRUIR (plan, investigacion, ejecutor) observan desde la
 * sub-pieza 3 del #5, por BLOQUE: ninguno emite en vivo (los tres pasan un
 * `onChunk` vacio), asi que el bloque cabe y `sinBloqueDeNotas` lo quita del
 * texto que ve el operador y del `docs/` del cliente. Lo que NO cubre el bloque
 * son los DENIALS del ejecutor —dato duro, `acceptEdits` es la mayor superficie
 * de denegaciones— y sigue siendo deuda `ejecutor-observa-de-denials`.
 */
const NO_OBSERVAN: readonly string[] = ['src/application/chat/reply-from-configuration.ts']

const CONSTRUIR_OBSERVA: readonly string[] = [
  'src/application/build/build-feature.ts',
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

describe('el que sigue fuera, con su razon', () => {
  it.each(NO_OBSERVAN)('%s no observa', (ruta) => {
    expect(fuente(ruta)).not.toContain('NOTAS_COMO')
    expect(fuente(ruta)).not.toContain('asentarNotas')
    expect(fuente(ruta)).not.toContain('observacionesDeDenials')
  })

  it('sigue siendo UNO: ni un agente nuevo enganchado ni desenganchado sin decidir', () => {
    expect(NO_OBSERVAN).toHaveLength(1)
  })
})

describe('los tres de Construir asientan por el cuello unico (sub-pieza 3 del #5)', () => {
  it.each(CONSTRUIR_OBSERVA)('%s asienta con asentarNotas y quita el bloque', (ruta) => {
    expect(fuente(ruta)).toContain('asentarNotas(')
    expect(fuente(ruta)).toContain('notasDeBloque(')
    expect(fuente(ruta)).toContain('sinBloqueDeNotas(')
  })
})
