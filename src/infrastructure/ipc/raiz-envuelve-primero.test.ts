import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

/**
 * El ORDEN del registro, fijado por lectura del fuente — molde `quien-observa`:
 * envolver antes o despues de los 29 compila igual, y solo una funciona.
 *
 * Envolver despues dejaria fuera a los 110 que ya se registraron, que es TODOS.
 * El envoltorio no reescribe lo registrado: cambia `ipcMain.handle` para que lo
 * que venga DESPUES pase por el.
 */
const fuente = readFileSync(join(process.cwd(), 'src/infrastructure/ipc/register-handlers.ts'), 'utf8') // prettier-ignore

describe('la raiz envuelve ANTES de registrar', () => {
  it('la envoltura va delante del primer registro', () => {
    expect(fuente.indexOf('envolverRegistroIpc(')).toBeLessThan(fuente.indexOf('registerProjectHandlers()')) // prettier-ignore
  })

  it('y se instala UNA vez, en la raiz, no en cada registrador', () => {
    expect(fuente.match(/envolverRegistroIpc\(/g)).toHaveLength(1)
  })

  it('sin tocar ninguno de los 36 ficheros: settings sigue llamando a ipcMain', () => {
    // `settings-handlers.ts` es INNEGOCIABLE por los secretos. La forma (b) lo
    // cubre precisamente porque envuelve el `ipcMain.handle` que el ya usa.
    const settings = readFileSync(join(process.cwd(), 'src/infrastructure/ipc/settings-handlers.ts'), 'utf8') // prettier-ignore
    expect(settings).toContain('ipcMain.handle(')
    expect(settings).not.toContain('embudo')
  })
})
