import { beforeEach, describe, expect, it } from 'vitest'
import { useConstruirStore } from '../stores/construir-store'
import { elPuerto } from './hilo-activo'
import { rigDelHilo } from './hilo-activo-rig'
import { limpiarAlSalir } from './limpiar-vacios'
import { pintarHilo } from './rehidratar-el-hilo'

/** Revision A (PASO 120): el nucleo de la limpieza — que muere y que JAMAS. */
const MSG = { role: 'user', content: 'x', agentId: null, mode: 'supervisado', engine: 'claude-code' } as const // prettier-ignore
const libreVacio = async (): Promise<string> => {
  const h = await elPuerto().createHilo({ projectId: null, titulo: 'Nuevo chat', modo: 'libre' })
  pintarHilo(h, [])
  return h.id
}
const sueltos = async (): Promise<string[]> =>
  (await elPuerto().listarSueltos()).map((h) => h.id)

beforeEach(() => void rigDelHilo())

describe('la limpieza al salir', () => {
  it('LIMPIA AL SALIR: el libre vacio y sin draft DESAPARECE', async () => {
    const id = await libreVacio()
    await limpiarAlSalir()
    expect(await sueltos()).not.toContain(id)
  })

  it('NO LIMPIA EL QUE TIENE MENSAJES: la memoria manda, aun con la escritura en vuelo', async () => {
    const id = await libreVacio()
    useConstruirStore.getState().push({ role: 'user', text: 'aun sin llegar al cajon' })
    await limpiarAlSalir()
    expect(await sueltos()).toContain(id)
  })

  it('EL CAJON TIENE LA ULTIMA PALABRA: memoria en blanco no basta para borrar', async () => {
    const id = await libreVacio()
    await elPuerto().addToHilo(id, MSG)
    useConstruirStore.setState({ messages: [] }) // la memoria se quedo corta
    await limpiarAlSalir()
    expect(await sueltos()).toContain(id)
  })

  it('NO PISA DRAFT: con el turno en vuelo no se limpia; al morir, persiste', async () => {
    const id = await libreVacio()
    useConstruirStore.setState({ draft: 'llegando...' })
    await limpiarAlSalir()
    expect(await sueltos()).toContain(id)
    useConstruirStore.getState().finishDraft('la respuesta')
    await elPuerto().addToHilo(id, MSG)
    await limpiarAlSalir()
    expect(await sueltos()).toContain(id)
  })

  it('AISLAMIENTO: un hilo de repo vacio como activo jamas se toca', async () => {
    const h = await elPuerto().createHilo({ projectId: 'p1', titulo: 'del repo', modo: 'plan' })
    pintarHilo(h, [])
    await limpiarAlSalir()
    expect((await elPuerto().listHilos('p1')).map((x) => x.id)).toContain(h.id)
  })
})
