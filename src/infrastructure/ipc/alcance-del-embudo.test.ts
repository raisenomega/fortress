import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { err } from '@domain/shared/result'
import { envolverRegistroIpc } from './embudo-de-ipc'
import { bancoDeIpc } from './embudo-de-ipc-fixture'

const DIR = join('src', 'infrastructure', 'ipc')

/** Los registros de produccion, con cuantos canales pone cada uno y si el
 *  fichero convierte su `throw` en `err()` por su cuenta. */
function registros(): Array<{ handlers: number; manejaSuError: boolean }> {
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.ts') && !f.includes('.test.') && !f.includes('fixture'))
    .map((f) => readFileSync(join(DIR, f), 'utf8'))
    .map((src) => ({
      handlers: src.match(/ipcMain\.handle\(/g)?.length ?? 0,
      manejaSuError: /\}\s*catch/.test(src)
    }))
    .filter((r) => r.handlers > 0)
}

/**
 * El alcance REAL del embudo 2, fijado por lectura del fuente. No es un numero
 * de adorno: vender «los 110 observan» cuando son 94 es lo mismo que el juez que
 * decia haber auditado sin correr, y este proyecto ya pago ese error una vez.
 */
describe('el embudo de IPC cubre 112 de 129, y se dice en voz alta', () => {
  it('hay 129 handlers, y 17 viven en ficheros que manejan su propio error', () => {
    // Empezo en 110 y 16. Los dos de ADR-087 —`finding:verify` y
    // `scan:historia`— cayeron del lado tapado y dejaron la cobertura quieta en
    // 94; los dos del barrido de mitigados caen del lado OBSERVADO —su handler
    // no tiene catch propio, solo un `finally` que suelta el carril— y por eso
    // esta vez el numero que se dice en voz alta sube: 96. La segunda puerta del
    // barrido —las que el operador marca— cae del mismo lado y lo deja en 97.
    // Y `push` sube a 98: su unico catch era de una gemela de `isRepoRoot`, ya ida.
    //
    // El recuento es POR FICHERO, no por handler: si el fichero tiene UN catch,
    // sus handlers cuentan como tapados. Es conservador a proposito —`scan:
    // historia` no tiene catch propio, lo tiene `handleRun` en el mismo
    // fichero— asi que 94 es el SUELO de la cobertura, no su techo. Afinar por
    // handler exigiria parsear cuerpos, y un numero prudente que obliga a mirar
    // vale mas que uno exacto que se cree a si mismo.
    const todos = registros()
    const total = todos.reduce((n, r) => n + r.handlers, 0)
    const tapados = todos.filter((r) => r.manejaSuError).reduce((n, r) => n + r.handlers, 0)
    // +4 B1, +3 barra 116, +2 flujos 118, +4 gestion 121: observados, sin catch.
    expect(total).toBe(129)
    expect(tapados).toBe(17)
    expect(total - tapados).toBe(112)
  })

  it('y un handler que convierte su throw en err() NO genera observacion', () => {
    // Es el molde de los 16: escaner, calidad, postura, chat y motor. Para el
    // envoltorio devolvieron un valor y todo fue bien, y no puede ser de otra
    // forma — un `return` no pasa por un `catch`. Su catch es CORRECTO: el
    // renderer necesita una respuesta, y `scan-handlers` ademas libera el carril
    // en su `finally`. Observarlos es un gesto aparte, dentro de su catch.
    const b = bancoDeIpc()
    envolverRegistroIpc(b.registrador, b.sumidero)
    b.registrador.handle('scan:run', () => {
      try {
        throw new TypeError('el escaner revento')
      } catch (error) {
        return err(error instanceof Error ? error.message : 'Fallo inesperado al escanear')
      }
    })

    return expect(b.invocar('scan:run'))
      .resolves.toMatchObject({ ok: false })
      .then(() => {
        expect(b.notas).toHaveLength(0)
      })
  })
})
