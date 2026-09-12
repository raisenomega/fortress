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
describe('el embudo de IPC cubre 94 de 110, y se dice en voz alta', () => {
  it('hay 110 handlers, y 16 viven en ficheros que manejan su propio error', () => {
    const todos = registros()
    const total = todos.reduce((n, r) => n + r.handlers, 0)
    const tapados = todos.filter((r) => r.manejaSuError).reduce((n, r) => n + r.handlers, 0)

    expect(total).toBe(110)
    expect(tapados).toBe(16)
    expect(total - tapados).toBe(94)
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
