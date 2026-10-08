import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { elegirHilo } from './barra-del-chat'
import { _inyectarConfirmador } from './confirmador'
import { eliminarHilo, moverHilo, renombrarHilo } from './gestionar-hilos'
import { elPuerto } from './hilo-activo'
import { rigDelHilo } from './hilo-activo-rig'

/** Revision B (PASO 121): el ⋯ de un hilo — renombrar, mover, eliminar. */
const MSG = { role: 'user', content: 'x', agentId: null, mode: 'supervisado', engine: 'claude-code' } as const // prettier-ignore
const unHilo = async (): Promise<{ id: string }> => {
  const h = await elPuerto().createHilo({ projectId: null, titulo: 'mi hilo', modo: 'libre' })
  await elPuerto().addToHilo(h.id, MSG)
  return h
}
beforeEach(() => {
  rigDelHilo()
  useBarraStore.setState({ seleccion: null, expandidas: [], refresco: 0 })
})
afterEach(() => _inyectarConfirmador(null))

describe('la gestion del hilo', () => {
  it('RENOMBRAR HILO: cambia el titulo y persiste; el refresco late', async () => {
    const h = await unHilo()
    await renombrarHilo(h.id, '  btc a largo plazo  ')
    expect((await elPuerto().listarSueltos())[0]!.titulo).toBe('btc a largo plazo')
    expect(useBarraStore.getState().refresco).toBe(1)
  })

  it('MOVER A CARPETA: anidado alli y FUERA de donde estaba', async () => {
    const c = await elPuerto().crearCarpeta('trading')
    const h = await unHilo()
    await moverHilo(h.id, c.id)
    expect((await elPuerto().hilosPorCarpeta(c.id)).map((x) => x.id)).toEqual([h.id])
    expect((await elPuerto().listarSueltos()).map((x) => x.id)).not.toContain(h.id)
  })

  it('QUITAR DE CARPETA: vuelve a Sin carpeta', async () => {
    const c = await elPuerto().crearCarpeta('trading')
    const h = await unHilo()
    await moverHilo(h.id, c.id)
    await moverHilo(h.id, null)
    expect(await elPuerto().hilosPorCarpeta(c.id)).toEqual([])
    expect((await elPuerto().listarSueltos()).map((x) => x.id)).toContain(h.id)
  })

  it('ELIMINAR confirmado: borra hilo y mensajes; era el activo -> pantalla limpia', async () => {
    _inyectarConfirmador(() => true)
    const h = await unHilo()
    await elegirHilo((await elPuerto().listarSueltos())[0]!)
    expect(await eliminarHilo(h.id, 'mi hilo')).toBe(true)
    expect(await elPuerto().listarSueltos()).toEqual([])
    expect(await elPuerto().listByHilo(h.id)).toEqual([])
    expect(useConstruirStore.getState().hiloActivo).toBeNull()
    expect(useConstruirStore.getState().messages).toEqual([])
  })

  it('CANCELAR no borra nada', async () => {
    _inyectarConfirmador(() => false)
    const h = await unHilo()
    expect(await eliminarHilo(h.id, 'mi hilo')).toBe(false)
    expect((await elPuerto().listarSueltos()).map((x) => x.id)).toContain(h.id)
  })
})
