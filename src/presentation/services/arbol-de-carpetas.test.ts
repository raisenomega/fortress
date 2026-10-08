import { beforeEach, describe, expect, it } from 'vitest'
import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { nuevoHiloSuelto } from './barra-del-chat'
import { crearCarpetaConHilo, hilosDeCarpeta, nuevoHiloEnCarpeta } from './carpetas-de-la-barra'
import { elPuerto } from './hilo-activo'
import { rigDelHilo } from './hilo-activo-rig'

/** Revision A (PASO 120): las carpetas del ARBOL — anidado, sin pagina. */
beforeEach(() => {
  rigDelHilo()
  useBarraStore.setState({ seleccion: null, expandidas: [] })
})

describe('las carpetas del arbol', () => {
  it('NUEVO EN CARPETA: nace DENTRO, eager, anidado en la suya y activo', async () => {
    const c = await elPuerto().crearCarpeta('trading')
    const eager = await nuevoHiloEnCarpeta(c.id)
    expect(useConstruirStore.getState().hiloActivo?.id).toBe(eager.id)
    expect(eager.carpetaId).toBe(c.id)
    expect((await hilosDeCarpeta(c.id)).map((h) => h.id)).toEqual([eager.id])
  })

  it('ACORDEON LISTA LO SUYO: cada carpeta despliega SOLO sus hilos', async () => {
    const x = await elPuerto().crearCarpeta('x')
    const y = await elPuerto().crearCarpeta('y')
    await elPuerto().createHilo({ projectId: null, titulo: 'de x', modo: 'libre', carpetaId: x.id }) // prettier-ignore
    await elPuerto().createHilo({ projectId: null, titulo: 'de y', modo: 'libre', carpetaId: y.id }) // prettier-ignore
    expect((await hilosDeCarpeta(x.id)).map((h) => h.titulo)).toEqual(['de x'])
  })

  it('CARPETA AUTO-HILO: crear pare un eager anidado, desplegado y activo; sin escribir muere y la carpeta queda', async () => {
    const c = await crearCarpetaConHilo('salud')
    expect(useConstruirStore.getState().hiloActivo?.carpetaId).toBe(c.id)
    expect(useBarraStore.getState().expandidas).toContain(c.id)
    await nuevoHiloSuelto() // salir sin escribir
    expect(await hilosDeCarpeta(c.id)).toEqual([])
    expect((await elPuerto().listarCarpetas()).map((k) => k.nombre)).toEqual(['salud'])
  })
})
