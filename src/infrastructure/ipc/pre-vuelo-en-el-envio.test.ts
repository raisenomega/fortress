import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const FUENTE = readFileSync('src/infrastructure/ipc/chat-send-handler.ts', 'utf8')
const donde = (aguja: string): number => FUENTE.indexOf(aguja)

/**
 * El pre-vuelo no vale de nada si no esta ENGANCHADO donde pasa todo. Este test
 * mira la fuente porque `chat:send` se registra contra `ipcMain` y montarlo
 * pediria Electron; lo que se fija aqui es el ORDEN, que es donde estan las dos
 * trampas que ya mordieron antes en este mismo fichero.
 */
describe('el pre-vuelo es la PRIMERA de las tres puertas de chat:send', () => {
  it('esta llamado, y su rechazo corta el envio', () => {
    expect(FUENTE).toMatch(/const rota = guardBarrera\(context, input\)/)
    expect(FUENTE).toMatch(/if \(rota !== null\) return err\(rota\)/)
  })

  it('ANTES que la aprobacion del plan: un lote sin visto bueno tambien se mira', () => {
    // Detras de `guardPlanAprobado`, el lote no aprobado saldria sin haber
    // mirado nunca la barrera, y la observacion no se escribiria jamas.
    expect(donde('guardBarrera(context, input)')).toBeLessThan(donde('guardPlanAprobado('))
  })

  it('ANTES que guardRun, que RESERVA el carril', () => {
    // Negar despues de reservar deja el carril tomado para siempre.
    expect(donde('guardBarrera(context, input)')).toBeLessThan(donde('guardRun('))
  })

  it('y ANTES de gastar la aprobacion: un turno negado no quema el permiso', () => {
    expect(donde('guardBarrera(context, input)')).toBeLessThan(donde('gastarAprobacion('))
  })
})
