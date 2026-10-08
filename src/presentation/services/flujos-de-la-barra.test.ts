import { beforeEach, describe, expect, it } from 'vitest'
import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { elegirHilo, nuevoHiloSuelto } from './barra-del-chat'
import { abrirCarpeta, crearCarpetaYEntrar, hilosDeCarpeta, nuevoHiloEnCarpeta } from './carpetas-de-la-barra' // prettier-ignore
import { elPuerto, escribirUser } from './hilo-activo'
import { rigDelHilo } from './hilo-activo-rig'
import { parDeLaVista, rehidratar } from './rehidratar-el-hilo'

/** PASO 118 (Fase 3): la carpeta ACTIVA decide donde nace el proximo hilo. */
const LIBRE = parDeLaVista(null, 'libre')
beforeEach(() => {
  rigDelHilo()
  useBarraStore.setState({ seleccion: null, carpetaActiva: null, vistaDeCarpeta: null })
})

describe('donde nace el proximo hilo', () => {
  it('NUEVO SUELTO: el perezoso nace con carpeta_id NULL', async () => {
    nuevoHiloSuelto()
    await escribirUser(LIBRE, 'hola')
    expect(useConstruirStore.getState().hiloActivo?.carpetaId).toBeNull()
  })

  it('NUEVO DENTRO: la carpeta activa VIAJA a createChat', async () => {
    const c = await elPuerto().crearCarpeta('trading')
    nuevoHiloEnCarpeta(c.id)
    await escribirUser(LIBRE, 'btc largo plazo')
    expect(useConstruirStore.getState().hiloActivo?.carpetaId).toBe(c.id)
    expect((await hilosDeCarpeta(c.id)).map((h) => h.titulo)).toEqual(['btc largo plazo'])
  })

  it('SE LIMPIA: tras crear dentro, Nuevo chat de arriba nace SUELTO', async () => {
    const c = await elPuerto().crearCarpeta('trading')
    nuevoHiloEnCarpeta(c.id)
    await escribirUser(LIBRE, 'dentro')
    nuevoHiloSuelto()
    await escribirUser(LIBRE, 'fuera')
    expect(useConstruirStore.getState().hiloActivo?.carpetaId).toBeNull()
  })
})

describe('carpetas y busqueda', () => {
  it('CREAR CARPETA: aparece en la lista y navega a su pagina (activa + vista)', async () => {
    const c = await crearCarpetaYEntrar('salud')
    expect(useBarraStore.getState().vistaDeCarpeta).toBe(c.id)
    expect(useBarraStore.getState().carpetaActiva).toBe(c.id)
  })

  it('PAGINA LISTA LO SUYO: solo los hilos de SU carpeta', async () => {
    const x = await elPuerto().crearCarpeta('x')
    const y = await elPuerto().crearCarpeta('y')
    await elPuerto().createHilo({ projectId: null, titulo: 'de x', modo: 'libre', carpetaId: x.id }) // prettier-ignore
    await elPuerto().createHilo({ projectId: null, titulo: 'de y', modo: 'libre', carpetaId: y.id }) // prettier-ignore
    expect((await hilosDeCarpeta(x.id)).map((h) => h.titulo)).toEqual(['de x'])
  })

  it('la REGLA DEL MANDO sigue intacta tras los flujos', async () => {
    const a = await elPuerto().createHilo({ projectId: null, titulo: 'A', modo: 'libre' })
    await abrirCarpeta((await elPuerto().crearCarpeta('z')).id)
    await elegirHilo(a)
    await rehidratar(LIBRE)
    expect(useConstruirStore.getState().hiloActivo?.id).toBe(a.id)
    expect(useBarraStore.getState().vistaDeCarpeta).toBeNull() // elegir vuelve al chat
  })
})
