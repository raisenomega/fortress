import { beforeEach, describe, expect, it } from 'vitest'
import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { elegirHilo, nuevoHiloSuelto } from './barra-del-chat'
import { elPuerto, escribirUser } from './hilo-activo'
import { rigDelHilo } from './hilo-activo-rig'
import { parDeLaVista } from './rehidratar-el-hilo'

/** Revision A (PASO 120): EAGER — el hilo nace de verdad; el vacio muere. */
const LIBRE = parDeLaVista(null, 'libre')
const MSG = { role: 'user', content: 'x', agentId: null, mode: 'supervisado', engine: 'claude-code' } as const // prettier-ignore
beforeEach(() => {
  rigDelHilo()
  useBarraStore.setState({ seleccion: null, expandidas: [] })
})

describe('eager y su limpieza, por los gestos', () => {
  it('EAGER: Nuevo chat crea un hilo REAL al instante — fila, activo, seleccion', async () => {
    await nuevoHiloSuelto()
    const activo = useConstruirStore.getState().hiloActivo
    expect(activo).not.toBeNull()
    expect((await elPuerto().listarSueltos()).map((h) => h.id)).toEqual([activo!.id])
    expect(useBarraStore.getState().seleccion).toBe(activo!.id)
    expect(useConstruirStore.getState().messages).toEqual([])
  })

  it('MATERIALIZA: escribir en el eager lo hace permanente — ya no se limpia', async () => {
    const eager = await nuevoHiloSuelto()
    useConstruirStore.getState().push({ role: 'user', text: 'hola' })
    await escribirUser(LIBRE, 'hola')
    await nuevoHiloSuelto() // salir: el que tiene mensajes queda
    expect((await elPuerto().listarSueltos()).map((h) => h.id)).toContain(eager.id)
  })

  it('NUEVO SUELTO: el de arriba nace con carpeta NULL; el perezoso-red tambien', async () => {
    const eager = await nuevoHiloSuelto()
    expect(eager.carpetaId).toBeNull()
    useConstruirStore.setState({ hiloActivo: null }) // la red del arranque
    await escribirUser(LIBRE, 'primera vez')
    expect(useConstruirStore.getState().hiloActivo?.carpetaId).toBeNull()
  })

  it('LIMPIA AL SALIR: cambiar a otro hilo mata al vacio; el otro queda', async () => {
    const otro = await elPuerto().createHilo({ projectId: null, titulo: 'con vida', modo: 'libre' }) // prettier-ignore
    await elPuerto().addToHilo(otro.id, MSG)
    const vacio = await nuevoHiloSuelto()
    await elegirHilo(otro)
    const ids = (await elPuerto().listarSueltos()).map((h) => h.id)
    expect(ids).toContain(otro.id)
    expect(ids).not.toContain(vacio.id)
    expect(useConstruirStore.getState().hiloActivo?.id).toBe(otro.id)
  })
})
