import { beforeEach, describe, expect, it } from 'vitest'
import { useBarraStore } from '../stores/barra-store'
import { nuevoHiloSuelto } from './barra-del-chat'
import { elPuerto, escribirUser } from './hilo-activo'
import { rigDelHilo } from './hilo-activo-rig'
import { parDeLaVista } from './rehidratar-el-hilo'

/** Revision B (PASO 121): el nombre real nace del PRIMER mensaje. */
const LIBRE = parDeLaVista(null, 'libre')
const tituloDeUnico = async (): Promise<string> => {
  const hilos = await elPuerto().listarSueltos()
  expect(hilos).toHaveLength(1)
  return hilos[0]!.titulo
}
beforeEach(() => {
  rigDelHilo()
  useBarraStore.setState({ seleccion: null, expandidas: [] })
})

describe('el auto-titulo del eager', () => {
  it('AUTO-TITULO: el primer mensaje pone el nombre (primeras ~40 letras)', async () => {
    await nuevoHiloSuelto()
    await escribirUser(LIBRE, '  quiero una cache con bloom filter para el escaner de secretos  ')
    expect(await tituloDeUnico()).toBe('quiero una cache con bloom filter para e')
  })

  it('RENAME MANDA: un titulo puesto a mano JAMAS lo pisa el primer mensaje', async () => {
    const eager = await nuevoHiloSuelto()
    await elPuerto().renombrarHilo(eager.id, 'mi plan de trading')
    const renombrado = { ...eager, titulo: 'mi plan de trading' }
    const { useConstruirStore } = await import('../stores/construir-store')
    useConstruirStore.getState().setHiloActivo(renombrado)
    await escribirUser(LIBRE, 'btc a largo plazo')
    expect(await tituloDeUnico()).toBe('mi plan de trading')
  })

  it('NO RE-TITULA: ni el centinela literal deja la puerta abierta dos veces', async () => {
    await nuevoHiloSuelto()
    await escribirUser(LIBRE, 'Nuevo chat') // primer mensaje = centinela exacto
    expect(await tituloDeUnico()).toBe('Nuevo chat')
    await escribirUser(LIBRE, 'esto no debe convertirse en el titulo')
    expect(await tituloDeUnico()).toBe('Nuevo chat')
  })
})
