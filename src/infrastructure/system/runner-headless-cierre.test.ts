import { describe, expect, it, vi } from 'vitest'

// Mismo doble que al-salir.test.ts: la traza mira un `-wal` cuyo dir no existe y
// se traga el error (no rompe el apagado); cerramos la base de verdad (mock).
vi.mock('../persistence/database', () => ({ closeDatabase: vi.fn(), databasePath: () => '/no/such/dir/fortress.db' })) // prettier-ignore

const { closeDatabase } = await import('../persistence/database')
const { cerrarHeadless, engancharSenales } = await import('./runner-headless')

describe('el cierre headless: la base cierra limpia por el apagado endurecido', () => {
  it('cerrarHeadless cierra la base via alSalir (closeDatabase), no reimplementa el cierre', () => {
    cerrarHeadless()
    expect(closeDatabase).toHaveBeenCalled()
  })

  it('engancha el cierre a SIGINT y SIGTERM, NUNCA a window-all-closed', () => {
    const once = vi.spyOn(process, 'once')
    const cerrar = vi.fn()
    engancharSenales(cerrar)
    const senales = once.mock.calls.map((c) => c[0])
    expect(senales).toEqual(expect.arrayContaining(['SIGINT', 'SIGTERM']))
    // y el handler enchufado ES el cierre (sin ventana, window-all-closed no dispara)
    const handler = once.mock.calls.find((c) => c[0] === 'SIGINT')?.[1] as () => void
    handler()
    expect(cerrar).toHaveBeenCalled()
    once.mockRestore()
  })
})
